/**
 * Export folder timestamps.
 *
 * Exports go into `LabelAll_export/<format>/<stamp>/`, where the stamp makes
 * each run land in its own folder so a second export never overwrites the
 * first. The stamp is decided when the export dialog opens and reused for the
 * actual write, so the path the dialog previews is the path written.
 *
 * Format is `YYYYMMDD-HHmmssSSS` (local time): sortable, and free of the
 * characters Windows forbids in a file name.
 */

function pad(value: number, width = 2): string {
  return String(value).padStart(width, '0')
}

/** A filesystem-safe, sortable timestamp for an export folder. */
export function createExportStamp(date: Date = new Date()): string {
  return [
    `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}`,
    '-',
    `${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`,
    pad(date.getMilliseconds(), 3),
  ].join('')
}
