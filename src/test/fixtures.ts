/// <reference types="node" />
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative, resolve, sep } from 'node:path'

import type { DetectedFile } from '../core/formats/detect'

// Vitest runs with the repository root as its working directory.
const FIXTURES = resolve(process.cwd(), 'test/fixtures')

/** Absolute path of a fixture directory. */
export function fixtureDir(name: string): string {
  return join(FIXTURES, name)
}

/**
 * Walk a fixture directory into the same shape the platform layer produces from
 * `scan_dataset`: relative POSIX paths, a directory flag and a byte size. The
 * result is sorted by path so assertions never depend on the host filesystem's
 * `readdir` order.
 */
export function scanFixture(name: string): DetectedFile[] {
  const root = fixtureDir(name)
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

/** A `readText` callback whose paths are relative to a fixture directory. */
export function fixtureReader(name: string): (relPath: string) => Promise<string> {
  const root = fixtureDir(name)
  return (relPath) => Promise.resolve(readFileSync(join(root, relPath), 'utf8'))
}
