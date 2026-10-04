/**
 * Bounded concurrency helpers.
 *
 * Reading a multi-file dataset is latency-bound: each `readText`/`imageSize`
 * call is a round-trip to the host, so awaiting them one at a time makes a
 * large VOC/YOLO/labelme import take tens of seconds. Running a bounded number
 * in flight turns that into a few waves without flooding the host.
 */

/** How many files a reader may have in flight at once. */
export const FILE_READ_CONCURRENCY = 32

/**
 * Map over `items` with at most `limit` promises in flight, returning results in
 * input order. The mapper is responsible for handling its own per-item errors —
 * a rejection aborts the whole batch.
 */
export async function mapLimit<T, R>(
  items: readonly T[],
  limit: number,
  mapper: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results = new Array<R>(items.length)
  let next = 0
  const workers = Array.from({ length: Math.max(1, Math.min(limit, items.length)) }, async () => {
    for (;;) {
      const index = next
      next += 1
      if (index >= items.length) {
        return
      }
      results[index] = await mapper(items[index], index)
    }
  })
  await Promise.all(workers)
  return results
}
