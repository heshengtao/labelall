/**
 * Train/val/test partitioning for export.
 *
 * Exporting a dataset with a ratio-based split is a pure, in-memory operation:
 * the images are shuffled deterministically from a seed and dealt into three
 * buckets, and each bucket becomes a smaller `DatasetModel` handed to the
 * existing writers. Nothing here touches the filesystem.
 */

import { subsetByImages } from './filter'
import type { DatasetModel } from './model'

/** The three conventional machine-learning splits. */
export type NamedSplit = 'train' | 'val' | 'test'

/**
 * Relative weights for each split. They do not have to add up to 1 — they are
 * normalised against their sum — and any of them may be `0`, which makes that
 * split empty so a dataset can be exported with no validation or test set.
 */
export interface SplitRatios {
  train: number
  val: number
  test: number
}

/** 70 / 20 / 10 — a common default that still exercises all three splits. */
export const DEFAULT_SPLIT_RATIOS: SplitRatios = { train: 0.7, val: 0.2, test: 0.1 }

/** One non-empty split together with the dataset restricted to it. */
export interface SplitPartition {
  split: NamedSplit
  dataset: DatasetModel
}

/**
 * Deterministic pseudo-random generator (mulberry32) so the same seed always
 * produces the same partition — reproducible exports without a dependency.
 */
export function createRng(seed: number): () => number {
  let state = (seed | 0) >>> 0
  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Clamp each weight to a non-negative finite number. */
export function normalizeRatios(ratios: SplitRatios): SplitRatios {
  const clean = (value: number): number => (Number.isFinite(value) && value > 0 ? value : 0)
  return { train: clean(ratios.train), val: clean(ratios.val), test: clean(ratios.test) }
}

/** Whether a ratio set can produce at least one non-empty split. */
export function hasAnyRatio(ratios: SplitRatios): boolean {
  const { train, val, test } = normalizeRatios(ratios)
  return train + val + test > 0
}

/** The three conventional machine-learning splits, in output order. */
const SPLIT_ORDER: NamedSplit[] = ['train', 'val', 'test']

/**
 * Fisher-Yates shuffle over a copy, driven by the supplied generator.
 */
function shuffled<T>(items: readonly T[], rng: () => number): T[] {
  const copy = [...items]
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1))
    const tmp = copy[i]
    copy[i] = copy[j]
    copy[j] = tmp
  }
  return copy
}

/**
 * Turn the ratio weights into whole image counts for `count` images.
 *
 * Uses largest-remainder so the counts add up exactly, then hands one image to
 * any positive-weight split that ended up empty (taking it from the largest
 * one). That guarantee is what stops a small dataset — three images against a
 * 70/15/15 split, say — from collapsing into a single `train` folder.
 */
function allocateCounts(weights: SplitRatios, count: number): Record<NamedSplit, number> {
  const counts: Record<NamedSplit, number> = { train: 0, val: 0, test: 0 }
  if (count <= 0) {
    return counts
  }

  const total = weights.train + weights.val + weights.test
  const positive = SPLIT_ORDER.filter((split) => weights[split] > 0)
  const quotas = SPLIT_ORDER.map((split) => (weights[split] / total) * count)
  SPLIT_ORDER.forEach((split, index) => {
    counts[split] = Math.floor(quotas[index])
  })

  let assigned = SPLIT_ORDER.reduce((sum, split) => sum + counts[split], 0)
  const byRemainder = positive
    .map((split) => ({
      split,
      remainder:
        quotas[SPLIT_ORDER.indexOf(split)] - Math.floor(quotas[SPLIT_ORDER.indexOf(split)]),
    }))
    .sort((a, b) => b.remainder - a.remainder)
  for (let i = 0; assigned < count && byRemainder.length > 0; i += 1) {
    counts[byRemainder[i % byRemainder.length].split] += 1
    assigned += 1
  }

  if (count >= positive.length) {
    for (const split of positive) {
      if (counts[split] > 0) {
        continue
      }
      const donor = SPLIT_ORDER.find((candidate) => counts[candidate] > 1)
      if (donor) {
        counts[donor] -= 1
        counts[split] += 1
      }
    }
  }

  return counts
}

/**
 * Deal the dataset's images into train/val/test by ratio.
 *
 * Every image is placed in exactly one split, driven by a seeded shuffle so a
 * fixed seed reproduces the partition. Split weights of `0` yield no images for
 * that split, and empty splits are omitted from the result — which is what lets
 * an export run with no validation or test set. A positive-weight split is left
 * empty only when there are fewer images than non-empty splits.
 *
 * Throws when every weight is `0`, since there would be nowhere to put the data.
 */
export function partitionDataset(
  dataset: DatasetModel,
  ratios: SplitRatios,
  seed = 0,
): SplitPartition[] {
  const weights = normalizeRatios(ratios)
  if (weights.train + weights.val + weights.test <= 0) {
    throw new Error('split ratios must include at least one value greater than 0')
  }

  const counts = allocateCounts(weights, dataset.images.length)
  const shuffledImages = shuffled(dataset.images, createRng(seed))

  let cursor = 0
  const partitions: SplitPartition[] = []
  for (const split of SPLIT_ORDER) {
    const size = counts[split]
    if (size <= 0) {
      continue
    }
    const ids = new Set(shuffledImages.slice(cursor, cursor + size).map((image) => image.id))
    cursor += size
    partitions.push({ split, dataset: subsetByImages(dataset, ids) })
  }
  return partitions
}
