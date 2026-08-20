// web/src/features/pdf-simulator/components/TextSelectionExplainer.tsx

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { simApiClient, type SelectionExplanation } from '../api.js'

export interface TextSelectionExplainerProps {
  parentTopic?: string
  domain?: string
}

interface PopoverPos {
  top: number
  left: number
}

export const TextSelectionExplainer: React.FC<TextSelectionExplainerProps> = ({
  parentTopic,
  domain = 'physics',
}) => {
  const [selectedText, setSelectedText] = useState('')
  const [surroundingContext, setSurroundingContext] = useState('')
  const [buttonPos, setButtonPos] = useState<PopoverPos | null>(null)
  const [isExplaining, setIsExplaining] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [explanation, setExplanation] = useState<SelectionExplanation | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Follow-up Q&A
  const [followupQ, setFollowupQ] = useState('')
  const [isAskingFollowup, setIsAskingFollowup] = useState(false)
  const [followupThread, setFollowupThread] = useState<Array<{ q: string; a: string }>>([])

  const modalRef = useRef<HTMLDivElement>(null)

  // Clear state when clicking outside modal
  const handleClose = useCallback(() => {
    setIsExplaining(false)
    setButtonPos(null)
    setSelectedText('')
    setExplanation(null)
    setError(null)
    setFollowupThread([])
    setFollowupQ('')
  }, [])

  // Listen for selection changes on window
  useEffect(() => {
    const handleSelection = () => {
      // If modal is open, don't clear or reposition button
      if (isExplaining) return

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

        // Retrieve surrounding block text context
        let contextText = ''
        const parentElem = range.commonAncestorContainer.parentElement
        if (parentElem) {
          contextText = (parentElem.innerText || parentElem.textContent || '').trim()
        }

        setSelectedText(text)
        setSurroundingContext(contextText)

        // Position button above selection, or below if too close to top
        const topPos = rect.top > 60 ? rect.top - 42 : rect.bottom + 10
        const leftPos = Math.max(10, Math.min(window.innerWidth - 180, rect.left + rect.width / 2 - 80))

        setButtonPos({
          top: topPos,
          left: leftPos,
        })
      } catch {
        setButtonPos(null)
      }
    }

    const handleMouseUp = () => {
      setTimeout(handleSelection, 100)
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isExplaining) {
        handleClose()
      } else {
        setTimeout(handleSelection, 100)
      }
    }

    document.addEventListener('mouseup', handleMouseUp)
    document.addEventListener('keyup', handleKeyUp)

    return () => {
      document.removeEventListener('mouseup', handleMouseUp)
      document.removeEventListener('keyup', handleKeyUp)
    }
  }, [isExplaining, handleClose])

  const handleTriggerExplanation = async () => {
    if (!selectedText.trim()) return

    setIsExplaining(true)
    setIsLoading(true)
    setError(null)
    setButtonPos(null)

    try {
      const result = await simApiClient.explainSelectionText({
        selectedText,
        surroundingContext,
        parentTopic,
        domain,
      })
      setExplanation(result)
    } catch (err: any) {
      console.error('[TextSelectionExplainer] Error generating explanation:', err)
      setError(err.message || 'Could not explain selected text.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAskFollowup = async (customQ?: string) => {
    const query = (customQ || followupQ).trim()
    if (!query || !explanation) return

    setIsAskingFollowup(true)
    try {
      const answerRes = await simApiClient.fetchStudentExplanation({
        spec: {
          version: '2.0',
          title: explanation.conceptTitle,
          domain: (explanation.domain as any) || 'physics',
          isSimulatable: false,
          topicExplanation: explanation.summary,
          parentTopic: parentTopic || '',
          subtitle: explanation.summary,
          caption: '',
          quote: selectedText,
          equations: explanation.relatedFormulas || [],
          reasonIfNotSimulatable: '',
        },
        quote: selectedText,
        pageText: surroundingContext,
        customQuestion: query,
      })

      if (answerRes.tutorAnswer) {
        setFollowupThread((prev) => [...prev, { q: query, a: answerRes.tutorAnswer! }])
        setFollowupQ('')
      }
    } catch {
      setFollowupThread((prev) => [
        ...prev,
        { q: query, a: 'Sorry, I could not generate a response right now. Please try again.' },
      ])
    } finally {
      setIsAskingFollowup(false)
    }
  }

  return (
    <>
      {/* Floating Mini Action Button when user selects text */}
      {buttonPos && !isExplaining && (
        <div
          style={{
            position: 'fixed',
            top: `${buttonPos.top}px`,
            left: `${buttonPos.left}px`,
            zIndex: 9999,
            animation: 'fadeIn 0.15s ease-out',
          }}
        >
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              handleTriggerExplanation()
            }}
            className="action-btn"
            style={{
              padding: '0.35rem 0.75rem',
              fontSize: '0.75rem',
              borderRadius: 'var(--radius-full)',
              background: 'linear-gradient(135deg, var(--color-primary), var(--color-accent))',
              color: '#ffffff',
              boxShadow: '0 4px 16px rgba(37, 99, 235, 0.4), 0 2px 6px rgba(0, 0, 0, 0.1)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            <span>✨</span>
            <span>Explain Selection</span>
          </button>
        </div>
      )}

      {/* Floating Detailed Explanation Modal / Card */}
      {isExplaining && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.35)',
            backdropFilter: 'blur(4px)',
            zIndex: 10000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.5rem',
            animation: 'fadeIn 0.2s ease-out',
          }}
          onClick={handleClose}
        >
          <div
            ref={modalRef}
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-xl)',
              boxShadow: 'var(--shadow-lg)',
              width: '100%',
              maxWidth: '680px',
              maxHeight: '85vh',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              animation: 'slideUp 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          >
            {/* Header */}
            <div
              style={{
                padding: '1rem 1.25rem',
                borderBottom: '1px solid var(--color-border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: 'var(--color-surface-2)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <span style={{ fontSize: '1.2rem' }}>✨</span>
                <div>
                  <h3
                    style={{
                      fontSize: '1rem',
                      fontWeight: 600,
                      color: 'var(--color-text)',
                      margin: 0,
                    }}
                  >
                    {explanation?.conceptTitle || 'Explaining Highlighted Concept'}
                  </h3>
                  {parentTopic && (
                    <span style={{ fontSize: '0.72rem', color: 'var(--color-primary)', fontWeight: 600, textTransform: 'uppercase' }}>
                      {parentTopic}
                    </span>
                  )}
                </div>
              </div>

              <button
                onClick={handleClose}
                style={{
                  background: 'transparent',
                  border: 'none',
                  fontSize: '1.2rem',
                  color: 'var(--color-text-muted)',
                  cursor: 'pointer',
                  padding: '0.2rem 0.5rem',
                  borderRadius: 'var(--radius-sm)',
                }}
                title="Close"
              >
                ✕
              </button>
            </div>

            {/* Content Scroll Area */}
            <div
              style={{
                padding: '1.25rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
                overflowY: 'auto',
                flex: 1,
              }}
            >
              {/* Highlighted Quote Box */}
              <div className="sim-quote-box" style={{ margin: 0, fontSize: '0.85rem' }}>
                “{selectedText}”
              </div>

              {isLoading ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', padding: '1rem 0' }}>
                  <div style={{ height: '18px', background: 'var(--color-surface-3)', borderRadius: '4px', width: '75%' }} />
                  <div style={{ height: '14px', background: 'var(--color-surface-3)', borderRadius: '4px', width: '95%' }} />
                  <div style={{ height: '14px', background: 'var(--color-surface-3)', borderRadius: '4px', width: '90%' }} />
                  <div style={{ height: '14px', background: 'var(--color-surface-3)', borderRadius: '4px', width: '85%' }} />
                </div>
              ) : error ? (
                <div style={{ color: 'var(--color-danger)', fontSize: '0.85rem', padding: '0.5rem' }}>
                  ⚠️ {error}
                </div>
              ) : explanation ? (
                <>
                  {/* Summary Callout */}
                  <div
                    style={{
                      padding: '0.85rem 1rem',
                      background: 'var(--color-primary-subtle)',
                      border: '1px solid rgba(37, 99, 235, 0.2)',
                      borderRadius: 'var(--radius-md)',
                      fontSize: '0.88rem',
                      fontWeight: 500,
                      color: 'var(--color-text)',
                      lineHeight: '1.5',
                    }}
                  >
                    💡 {explanation.summary}
                  </div>

                  {/* Detailed paragraphs */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                    {explanation.detailedExplanation.map((para, idx) => (
                      <p
                        key={idx}
                        style={{
                          fontSize: '0.85rem',
                          lineHeight: '1.6',
                          color: 'var(--color-text)',
                          margin: 0,
                        }}
                      >
                        {para}
                      </p>
                    ))}
                  </div>

                  {/* Key Takeaways */}
                  {explanation.keyTakeaways && explanation.keyTakeaways.length > 0 && (
                    <div
                      style={{
                        padding: '0.85rem',
                        background: 'var(--color-surface-2)',
                        border: '1px solid var(--color-border)',
                        borderRadius: 'var(--radius-md)',
                      }}
                    >
                      <div
                        style={{
                          fontSize: '0.72rem',
                          fontWeight: 600,
                          color: 'var(--color-primary)',
                          textTransform: 'uppercase',
                          letterSpacing: '0.04em',
                          marginBottom: '0.4rem',
                        }}
                      >
                        📌 Key Takeaways
                      </div>
                      <ul style={{ margin: 0, paddingLeft: '1.2rem', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                        {explanation.keyTakeaways.map((item, idx) => (
                          <li key={idx} style={{ fontSize: '0.82rem', color: 'var(--color-text)', lineHeight: '1.45' }}>
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Real World Example */}
                  {explanation.realWorldExample && (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '0.65rem',
                        padding: '0.75rem 0.95rem',
                        background: 'var(--color-surface-2)',
                        border: '1px solid var(--color-border)',
                        borderRadius: 'var(--radius-md)',
                      }}
                    >
                      <span style={{ fontSize: '1.1rem' }}>🚀</span>
                      <div>
                        <strong style={{ fontSize: '0.78rem', color: 'var(--color-primary)' }}>Real-World Connection:</strong>
                        <div style={{ fontSize: '0.82rem', color: 'var(--color-text)', marginTop: '0.15rem' }}>
                          {explanation.realWorldExample}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Related Formulas */}
                  {explanation.relatedFormulas && explanation.relatedFormulas.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                      {explanation.relatedFormulas.map((f, idx) => (
                        <div
                          key={idx}
                          style={{
                            fontFamily: 'var(--font-mono)',
                            fontSize: '0.82rem',
                            padding: '0.3rem 0.6rem',
                            background: 'var(--color-surface-2)',
                            borderRadius: 'var(--radius-sm)',
                            border: '1px solid var(--color-border)',
                            color: 'var(--color-primary)',
                          }}
                        >
                          {f}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Follow-up Q&A thread */}
                  {followupThread.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
                      {followupThread.map((item, idx) => (
                        <div
                          key={idx}
                          style={{
                            padding: '0.65rem 0.85rem',
                            background: 'var(--color-surface-2)',
                            borderRadius: 'var(--radius-md)',
                            border: '1px solid var(--color-border)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.3rem',
                          }}
                        >
                          <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--color-primary)' }}>
                            Q: {item.q}
                          </div>
                          <div style={{ fontSize: '0.82rem', color: 'var(--color-text)', lineHeight: '1.45' }}>
                            {item.a}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Ask Followup input */}
                  <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.5rem' }}>
                    <input
                      type="text"
                      placeholder="Ask AI Tutor a question about this selection..."
                      value={followupQ}
                      onChange={(e) => setFollowupQ(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleAskFollowup()
                      }}
                      disabled={isAskingFollowup}
                      style={{
                        flex: 1,
                        padding: '0.45rem 0.75rem',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--color-border)',
                        background: 'var(--color-surface)',
                        color: 'var(--color-text)',
                        fontSize: '0.8rem',
                        outline: 'none',
                      }}
                    />
                    <button
                      type="button"
                      className="action-btn"
                      onClick={() => handleAskFollowup()}
                      disabled={isAskingFollowup || !followupQ.trim()}
                      style={{ padding: '0.45rem 0.85rem', fontSize: '0.78rem', whiteSpace: 'nowrap' }}
                    >
                      {isAskingFollowup ? 'Thinking...' : 'Ask AI'}
                    </button>
                  </div>
                </>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
