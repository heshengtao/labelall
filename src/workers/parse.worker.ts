/**
 * Parsing worker.
 *
 * Runs the pure-TS core (format detection and readers) off the main thread so a
 * 100 MB COCO JSON cannot freeze the UI. The worker has no filesystem access of
 * its own — when a reader needs a file or an image size it asks the main thread
 * over a tiny request/response protocol, and the main thread answers through the
 * active `DatasetSource`.
 */

import type { DetectionCandidate, DetectedFile } from '@/core/formats/detect'
import { detectFormat } from '@/core/formats/detect'
import type { ParseRequest } from '@/core/formats/dispatch'
import { parseDataset } from '@/core/formats/dispatch'

type ImageSize = { width: number; height: number } | null

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
  | { type: 'size-result'; callId: number; size: ImageSize }
  | { type: 'read-error'; callId: number; message: string }
  | { type: 'size-error'; callId: number; message: string }

// `DedicatedWorkerGlobalScope` lives in the webworker lib, which cannot be mixed
// with the DOM lib this project already uses, so declare the two members we need.
interface WorkerScope {
  onmessage: ((event: MessageEvent<Incoming>) => void) | null
  postMessage(message: unknown): void
}

const scope = globalThis as unknown as WorkerScope

const pending = new Map<
  number,
  { resolve: (value: unknown) => void; reject: (error: Error) => void }
>()
let nextCallId = 1
let activeId = 0

function request<T>(message: Record<string, unknown>): Promise<T> {
  const callId = nextCallId++
  return new Promise<T>((resolve, reject) => {
    pending.set(callId, { resolve: resolve as (value: unknown) => void, reject })
    scope.postMessage({ ...message, id: activeId, callId })
  })
}

function readText(relPath: string): Promise<string> {
  return request<string>({ type: 'read', path: relPath })
}

function imageSize(relPath: string): Promise<ImageSize> {
  return request<ImageSize>({ type: 'size', path: relPath })
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

function settle(
  callId: number,
  action: (waiter: { resolve: (v: unknown) => void; reject: (e: Error) => void }) => void,
): void {
  const waiter = pending.get(callId)
  pending.delete(callId)
  if (waiter) {
    action(waiter)
  }
}

scope.onmessage = (event): void => {
  const message = event.data
  switch (message.type) {
    case 'read-result':
      settle(message.callId, (waiter) => waiter.resolve(message.contents))
      return
    case 'size-result':
      settle(message.callId, (waiter) => waiter.resolve(message.size))
      return
    case 'read-error':
    case 'size-error':
      settle(message.callId, (waiter) => waiter.reject(new Error(message.message)))
      return
    case 'detect':
      activeId = message.id
      void runDetect(message)
      return
    case 'parse':
      activeId = message.id
      void runParse(message)
      return
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
    const result = await parseDataset(message.request, { root: message.root, readText, imageSize })
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
