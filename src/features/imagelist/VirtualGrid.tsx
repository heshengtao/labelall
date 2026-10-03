import { type ReactNode, useEffect, useRef, useState } from 'react'

import { Box } from '@mui/material'

import { computeColumnCount, computeGridWindow } from './grid'

export interface VirtualGridProps<T> {
  items: T[]
  minColumnWidth: number
  rowHeight: number
  gap: number
  overscanRows?: number
  renderItem: (item: T) => ReactNode
  getKey: (item: T) => string | number
}

/**
 * A small windowed grid: only the rows intersecting the viewport (plus a little
 * overscan) are mounted, which keeps a 50k-image dataset responsive without
 * pulling in another dependency.
 */
export function VirtualGrid<T>({
  items,
  minColumnWidth,
  rowHeight,
  gap,
  overscanRows = 2,
  renderItem,
  getKey,
}: VirtualGridProps<T>) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [width, setWidth] = useState(0)
  const [height, setHeight] = useState(0)
  const [scrollTop, setScrollTop] = useState(0)

  useEffect(() => {
    const element = containerRef.current
    if (!element) {
      return
    }
    const measure = (): void => {
      setWidth(element.clientWidth)
      setHeight(element.clientHeight)
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  const columns = computeColumnCount(width, minColumnWidth, gap, gap)
  const gridWindow = computeGridWindow({
    columns,
    rowHeight,
    scrollTop,
    viewportHeight: height,
    itemCount: items.length,
    overscanRows,
  })

  const cells: ReactNode[] = []
  const firstIndex = gridWindow.firstRow * columns
  const lastIndex = Math.min(items.length - 1, (gridWindow.lastRow + 1) * columns - 1)
  for (let index = firstIndex; index <= lastIndex; index += 1) {
    const item = items[index]
    cells.push(
      <Box key={getKey(item)} sx={{ minWidth: 0 }}>
        {renderItem(item)}
      </Box>,
    )
  }

  return (
    <Box
      ref={containerRef}
      data-testid="virtual-grid"
      onScroll={(event) => setScrollTop(event.currentTarget.scrollTop)}
      sx={{ flex: 1, overflowY: 'auto', position: 'relative' }}
    >
      <Box sx={{ height: gridWindow.totalHeight, position: 'relative' }}>
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            transform: `translateY(${gridWindow.offsetY}px)`,
            display: 'grid',
            gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
            gap: `${gap}px`,
            p: `${gap}px`,
          }}
        >
          {cells}
        </Box>
      </Box>
    </Box>
  )
}
