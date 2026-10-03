/// <reference types="node" />
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative, resolve, sep } from 'node:path'

import type { DetectedFile } from '../core/formats/detect'

// Vitest runs with the repository root as its working directory.
const FIXTURES = resolve(process.cwd(), 'test/fixtures')
const EXAMPLES = resolve(process.cwd(), 'examples')

/** Absolute path of a fixture directory. */
export function fixtureDir(name: string): string {
  return join(FIXTURES, name)
}

/** Absolute path of a bundled example dataset. */
export function exampleDir(name: string): string {
  return join(EXAMPLES, name)
}

/**
 * Walk a directory into the same shape the platform layer produces from
 * `scan_dataset`: relative POSIX paths, a directory flag and a byte size. The
 * result is sorted by path so assertions never depend on the host filesystem's
 * `readdir` order.
 */
export function scanDirectory(root: string): DetectedFile[] {
  const entries: DetectedFile[] = []
  const walk = (dir: string): void => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const absolute = join(dir, entry.name)
      const path = relative(root, absolute).split(sep).join('/')
      if (entry.isDirectory()) {
        entries.push({ path, isDir: true, size: 0 })
        walk(absolute)
      } else {
        entries.push({ path, isDir: false, size: statSync(absolute).size })
      }
    }
  }
  walk(root)
  return entries.sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0))
}

/** A `readText` callback whose paths are relative to an absolute root. */
export function directoryReader(root: string): (relPath: string) => Promise<string> {
  return (relPath) => Promise.resolve(readFileSync(join(root, relPath), 'utf8'))
}

export function scanFixture(name: string): DetectedFile[] {
  return scanDirectory(fixtureDir(name))
}

/** A `readText` callback whose paths are relative to a fixture directory. */
export function fixtureReader(name: string): (relPath: string) => Promise<string> {
  return directoryReader(fixtureDir(name))
}
