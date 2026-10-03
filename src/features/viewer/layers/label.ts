/**
 * Label chip sizing.
 *
 * Konva can measure text, but that needs a node and a redraw; a label chip only
 * needs to be roughly the right size, so a per-character advance estimate keeps
 * the layers pure and cheap.
 */

/** Advance width of a character in em. CJK and fullwidth forms are full-width. */
function advance(codePoint: number): number {
  if (
    (codePoint >= 0x1100 && codePoint <= 0x115f) || // Hangul Jamo
    (codePoint >= 0x2e80 && codePoint <= 0xa4cf) || // CJK radicals … Yi
    (codePoint >= 0xac00 && codePoint <= 0xd7a3) || // Hangul syllables
    (codePoint >= 0xf900 && codePoint <= 0xfaff) || // CJK compatibility ideographs
    (codePoint >= 0xfe30 && codePoint <= 0xfe4f) || // CJK compatibility forms
    (codePoint >= 0xff00 && codePoint <= 0xff60) || // Fullwidth forms
    (codePoint >= 0xffe0 && codePoint <= 0xffe6)
  ) {
    return 1
  }
  return 0.6
}

export function estimateTextWidth(text: string, fontSize: number): number {
  let width = 0
  for (const character of text) {
    width += advance(character.codePointAt(0) ?? 0)
  }
  return width * fontSize
}
