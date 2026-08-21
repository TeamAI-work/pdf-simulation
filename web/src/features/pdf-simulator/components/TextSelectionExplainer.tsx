// web/src/features/pdf-simulator/components/TextSelectionExplainer.tsx

import React, { useCallback, useEffect, useState } from 'react'

export interface TextSelectionExplainerProps {
  currentPage: number
  onExplain: (selectedText: string, page: number, context: string) => void
  onAddNote?: (selectedText: string, page: number) => void
}

interface PopoverPos {
  top: number
  left: number
}

export const TextSelectionExplainer: React.FC<TextSelectionExplainerProps> = ({
  currentPage,
  onExplain,
  onAddNote,
}) => {
  const [selectedText, setSelectedText] = useState('')
  const [surroundingContext, setSurroundingContext] = useState('')
  const [buttonPos, setButtonPos] = useState<PopoverPos | null>(null)

  const dismiss = useCallback(() => {
    setButtonPos(null)
    setSelectedText('')
    setSurroundingContext('')
  }, [])

  useEffect(() => {
    const handleSelection = () => {
      const selection = window.getSelection()
      if (!selection || selection.isCollapsed) {
        setButtonPos(null)
        return
      }

      const text = selection.toString().trim()
      if (text.length < 3 || text.length > 1000) {
        setButtonPos(null)
        return
      }

      try {
        const range = selection.getRangeAt(0)
        const rect = range.getBoundingClientRect()
        if (rect.width === 0 || rect.height === 0) {
          setButtonPos(null)
          return
        }

        let contextText = ''
        const parentElem = range.commonAncestorContainer.parentElement
        if (parentElem) {
          contextText = (parentElem.innerText || parentElem.textContent || '').trim()
        }

        setSelectedText(text)
        setSurroundingContext(contextText)

        const topPos = rect.top > 60 ? rect.top - 46 : rect.bottom + 10
        const leftPos = Math.max(10, Math.min(window.innerWidth - 260, rect.left + rect.width / 2 - 120))

        setButtonPos({ top: topPos, left: leftPos })
      } catch {
        setButtonPos(null)
      }
    }

    const handleMouseUp = () => {
      window.setTimeout(handleSelection, 100)
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        dismiss()
        return
      }
      window.setTimeout(handleSelection, 100)
    }

    document.addEventListener('mouseup', handleMouseUp)
    document.addEventListener('keyup', handleKeyUp)

    return () => {
      document.removeEventListener('mouseup', handleMouseUp)
      document.removeEventListener('keyup', handleKeyUp)
    }
  }, [dismiss])

  const handleExplain = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!selectedText.trim()) return
    const text = selectedText
    const context = surroundingContext
    dismiss()
    window.getSelection()?.removeAllRanges()
    onExplain(text, currentPage, context)
  }

  const handleAddNote = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!selectedText.trim()) return
    const text = selectedText
    dismiss()
    window.getSelection()?.removeAllRanges()
    onAddNote?.(text, currentPage)
  }

  if (!buttonPos) return null

  return (
    <div
      className="selection-action-bar"
      style={{
        position: 'fixed',
        top: `${buttonPos.top}px`,
        left: `${buttonPos.left}px`,
        zIndex: 9999,
      }}
      onMouseDown={(e) => e.preventDefault()}
    >
      <button type="button" className="selection-action-btn selection-action-btn--explain" onClick={handleExplain}>
        <span>✨</span>
        <span>Explain</span>
      </button>
      {onAddNote && (
        <button type="button" className="selection-action-btn selection-action-btn--note" onClick={handleAddNote}>
          <span>📓</span>
          <span>Add Note</span>
        </button>
      )}
    </div>
  )
}
