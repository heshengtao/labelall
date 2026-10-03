/**
 * Parsing worker.
 *
 * Runs the pure-TS core (format detection and readers) off the main thread so a
 * 100 MB COCO JSON cannot freeze the UI. The worker has no filesystem access of
 * its own — when a reader needs a file it asks the main thread over a tiny
 * request/response protocol, and the main thread answers through the active
 * `DatasetSource`.
 */

import type { DetectionCandidate, DetectedFile } from '@/core/formats/detect'
import { detectFormat } from '@/core/formats/detect'
import type { ParseRequest } from '@/core/formats/dispatch'
import { parseDataset } from '@/core/formats/dispatch'

interface DetectMessage {
  type: 'detect'
  id: number
  files: DetectedFile[]
}
interface ParseMessage {
  type: 'parse'
  id: number
  root: string
  request: ParseRequest
}
type Incoming =
  | DetectMessage
  | ParseMessage
  | { type: 'read-result'; callId: number; contents: string }
  | { type: 'read-error'; callId: number; message: string }

// `DedicatedWorkerGlobalScope` lives in the webworker lib, which cannot be mixed
// with the DOM lib this project already uses, so declare the two members we need.
interface WorkerScope {
  onmessage: ((event: MessageEvent<Incoming>) => void) | null
  postMessage(message: unknown): void
}

const scope = globalThis as unknown as WorkerScope

const pendingReads = new Map<
  number,
  { resolve: (value: string) => void; reject: (error: Error) => void }
>()
let nextCallId = 1
let activeId = 0

function readText(relPath: string): Promise<string> {
  const callId = nextCallId++
  return new Promise((resolve, reject) => {
    pendingReads.set(callId, { resolve, reject })
    scope.postMessage({ type: 'read', id: activeId, callId, path: relPath })
  })
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

scope.onmessage = (event): void => {
  const message = event.data
  switch (message.type) {
    case 'read-result': {
      const waiter = pendingReads.get(message.callId)
      pendingReads.delete(message.callId)
      waiter?.resolve(message.contents)
      return
    }
    case 'read-error': {
      const waiter = pendingReads.get(message.callId)
      pendingReads.delete(message.callId)
      waiter?.reject(new Error(message.message))
      return
    }
    case 'detect': {
      activeId = message.id
      void runDetect(message)
      return
    }
    case 'parse': {
      activeId = message.id
      void runParse(message)
      return
    }
  }
}

async function runDetect(message: DetectMessage): Promise<void> {
  try {
    scope.postMessage({ type: 'progress', id: message.id, value: 0 })
    const candidates: DetectionCandidate[] = await detectFormat({
      files: message.files,
      readText,
    })
    scope.postMessage({ type: 'progress', id: message.id, value: 1 })
    scope.postMessage({ type: 'detect-result', id: message.id, candidates })
  } catch (error) {
    scope.postMessage({ type: 'error', id: message.id, message: errorMessage(error) })
  }
}

async function runParse(message: ParseMessage): Promise<void> {
  try {
    scope.postMessage({ type: 'progress', id: message.id, value: 0 })
    const result = await parseDataset(message.request, { root: message.root, readText })
    scope.postMessage({ type: 'progress', id: message.id, value: 1 })
    scope.postMessage({
      type: 'parse-result',
      id: message.id,
      dataset: result.dataset,
      warnings: result.warnings,
    })
  } catch (error) {
    scope.postMessage({ type: 'error', id: message.id, message: errorMessage(error) })
  }
}
