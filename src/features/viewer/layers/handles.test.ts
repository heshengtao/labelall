import { describe, expect, it } from 'vitest'

import { handlePosition } from './handles'

const box = { x: 10, y: 20, width: 30, height: 40 }

describe('handlePosition', () => {
  it('places corners on the box corners', () => {
    expect(handlePosition(box, 'nw')).toEqual({ x: 10, y: 20 })
    expect(handlePosition(box, 'se')).toEqual({ x: 40, y: 60 })
  })

  it('places edge handles at the midpoints', () => {
    expect(handlePosition(box, 'n')).toEqual({ x: 25, y: 20 })
    expect(handlePosition(box, 'e')).toEqual({ x: 40, y: 40 })
    expect(handlePosition(box, 'w')).toEqual({ x: 10, y: 40 })
  })
})
