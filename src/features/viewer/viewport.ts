/**
 * Viewer viewport maths.
 *
 * The viewport maps image pixel coordinates (the model's convention) onto the
 * stage: `screen = image * scale + offset`. Keeping it as pure functions makes
 * the zoom-anchoring and fit behaviour testable without a canvas.
 */

export interface Viewport {
  scale: number
  x: number
  y: number
}

export const MIN_SCALE = 0.02
export const MAX_SCALE = 40

export function clampScale(scale: number): number {
  return Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale))
}

/** Scale and centre so the whole image fits inside the stage. */
export function fitViewport(
  imageWidth: number,
  imageHeight: number,
  stageWidth: number,
  stageHeight: number,
  padding = 24,
): Viewport {
  if (imageWidth <= 0 || imageHeight <= 0 || stageWidth <= 0 || stageHeight <= 0) {
    return { scale: 1, x: 0, y: 0 }
  }
  const usableWidth = Math.max(1, stageWidth - padding * 2)
  const usableHeight = Math.max(1, stageHeight - padding * 2)
  const scale = clampScale(Math.min(usableWidth / imageWidth, usableHeight / imageHeight))
  return {
    scale,
    x: (stageWidth - imageWidth * scale) / 2,
    y: (stageHeight - imageHeight * scale) / 2,
  }
}

/**
 * Zoom by `factor` while keeping the image point under `pointer` fixed — the
 * behaviour people expect from a map or an image viewer.
 */
export function zoomAt(
  view: Viewport,
  pointer: { x: number; y: number },
  factor: number,
): Viewport {
  const scale = clampScale(view.scale * factor)
  if (scale === view.scale) {
    return view
  }
  const ratio = scale / view.scale
  return {
    scale,
    x: pointer.x - (pointer.x - view.x) * ratio,
    y: pointer.y - (pointer.y - view.y) * ratio,
  }
}

/** The image-space point currently under a stage-space point. */
export function toImagePoint(
  view: Viewport,
  point: { x: number; y: number },
): { x: number; y: number } {
  return { x: (point.x - view.x) / view.scale, y: (point.y - view.y) / view.scale }
}
