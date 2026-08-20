// web/src/features/pdf-simulator/components/SplitResizer.tsx

import React, { useState, useEffect, useCallback } from 'react'

export interface SplitResizerProps {
  onResize: (newWidthPercentage: number) => void
  minPercentage?: number
  maxPercentage?: number
}

export const SplitResizer: React.FC<SplitResizerProps> = ({
  onResize,
  minPercentage = 30,
  maxPercentage = 75,
}) => {
  const [isDragging, setIsDragging] = useState(false)

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging) return
      const totalWidth = window.innerWidth
      const rawPercentage = (e.clientX / totalWidth) * 100
      const clamped = Math.min(Math.max(rawPercentage, minPercentage), maxPercentage)
      onResize(clamped)
    },
    [isDragging, minPercentage, maxPercentage, onResize]
  )

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = 'col-resize'
      document.body.style.userSelect = 'none'
    } else {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
  }, [isDragging, handleMouseMove, handleMouseUp])

  return (
    <div
      className={`split-resizer ${isDragging ? 'dragging' : ''}`}
      onMouseDown={handleMouseDown}
      role="separator"
      aria-orientation="vertical"
      title="Drag to resize panels"
    />
  )
}
