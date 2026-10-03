/**
 * Main-thread side of the parsing worker.
 *
 * Wraps the worker in a promise-based API and answers the worker's file reads
 * through the active `DatasetSource`, so the worker never touches Tauri or the
 * File System Access API itself.
 */

import type { DetectionCandidate, DetectedFile } from '@/core/formats/detect'
import type { ParseRequest } from '@/core/formats/dispatch'
import type { DatasetModel } from '@/core/model'
import type { DatasetHandle, DatasetSource } from '@/platform/types'

export interface ParseResult {
  dataset: DatasetModel
  warnings: string[]
}

export interface ParseService {
  detect(
    handle: DatasetHandle,
    files: DetectedFile[],
    onProgress?: (value: number) => void,
  ): Promise<DetectionCandidate[]>
  parse(
    handle: DatasetHandle,
    request: ParseRequest,
    onProgress?: (value: number) => void,
  ): Promise<ParseResult>
}

type FromWorker =
  | { type: 'read'; id: number; callId: number; path: string }
  | { type: 'progress'; id: number; value: number }
  | { type: 'detect-result'; id: number; candidates: DetectionCandidate[] }
  | { type: 'parse-result'; id: number; dataset: DatasetModel; warnings: string[] }
  | { type: 'error'; id: number; message: string }

interface Pending {
  resolve: (value: unknown) => void
  reject: (error: Error) => void
  onProgress?: (value: number) => void
}

export function createWorkerParseService(source: DatasetSource): ParseService {
  // Vite bundles this module-worker form automatically.
  const worker = new Worker(new URL('./parse.worker.ts', import.meta.url), { type: 'module' })
  const pending = new Map<number, Pending>()
  const handles = new Map<number, DatasetHandle>()
  let nextId = 1

  worker.onmessage = (event: MessageEvent<FromWorker>): void => {
    const message = event.data

    if (message.type === 'read') {
      const handle = handles.get(message.id)
      if (!handle) {
        worker.postMessage({
          type: 'read-error',
          callId: message.callId,
          message: 'the request is no longer active',
        })
        return
      }
      source.readText(handle, message.path).then(
        (contents) => worker.postMessage({ type: 'read-result', callId: message.callId, contents }),
        (error: unknown) =>
          worker.postMessage({
            type: 'read-error',
            callId: message.callId,
            message: error instanceof Error ? error.message : String(error),
          }),
      )
      return
    }

    const entry = pending.get(message.id)
    if (!entry) {
      return
    }
    if (message.type === 'progress') {
      entry.onProgress?.(message.value)
      return
    }
    pending.delete(message.id)
    handles.delete(message.id)

    if (message.type === 'error') {
      entry.reject(new Error(message.message))
    } else if (message.type === 'detect-result') {
      entry.resolve(message.candidates)
    } else {
      entry.resolve({ dataset: message.dataset, warnings: message.warnings })
    }
  }

  function request(
    handle: DatasetHandle,
    payload: Record<string, unknown>,
    onProgress?: (value: number) => void,
  ): Promise<unknown> {
    const id = nextId++
    handles.set(id, handle)
    return new Promise<unknown>((resolve, reject) => {
      pending.set(id, { resolve, reject, onProgress })
      worker.postMessage({ ...payload, id, root: handle.root })
    })
  }

  return {
    detect(handle, files, onProgress) {
      return request(handle, { type: 'detect', files }, onProgress) as Promise<DetectionCandidate[]>
    },
    parse(handle, parseRequest, onProgress) {
      return request(
        handle,
        { type: 'parse', request: parseRequest },
        onProgress,
      ) as Promise<ParseResult>
    },
  }
}
