// web/src/features/pdf-simulator/components/ExplainPanel.tsx

import React, { useState, useEffect } from 'react'
import type { SimSpec } from '@pdf-sim/shared'
import {
  simApiClient,
  type StudentExplanation,
} from '../api.js'

export interface ExplainPanelProps {
  spec: SimSpec | null
  quote?: string
  pageText?: string
  isSimAnimationVisible?: boolean
  onToggleSimAnimation?: () => void
}

type ExplainTab = 'intuition' | 'visual' | 'math' | 'quiz' | 'realworld'
type LearningLevel = 'beginner' | 'standard' | 'advanced'

export const ExplainPanel: React.FC<ExplainPanelProps> = ({
  spec,
  quote,
  pageText,
  isSimAnimationVisible = true,
  onToggleSimAnimation: _onToggleSimAnimation,
}) => {
  const [activeTab, setActiveTab] = useState<ExplainTab>('intuition')
  const [level, setLevel] = useState<LearningLevel>('standard')
  const [explanation, setExplanation] = useState<StudentExplanation | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Thought experiment interaction state
  const [showHint, setShowHint] = useState(false)
  const [showAnswer, setShowAnswer] = useState(false)

  // AI Tutor Q&A state
  const [tutorQuestion, setTutorQuestion] = useState('')
  const [isAskingTutor, setIsAskingTutor] = useState(false)
  const [tutorConversation, setTutorConversation] = useState<
    Array<{ question: string; answer: string }>
  >([])

  // Fetch or generate explanation whenever spec or level changes
  useEffect(() => {
    if (!spec) {
      setExplanation(null)
      return
    }

    let isMounted = true
    setIsLoading(true)
    setError(null)
    setShowHint(false)
    setShowAnswer(false)

    simApiClient
      .fetchStudentExplanation({
        spec,
        quote: quote || spec.quote,
        pageText,
        mode: level,
      })
      .then((data) => {
        if (isMounted) {
          setExplanation(data)
        }
      })
      .catch((err) => {
        console.warn('[ExplainPanel] Error generating LLM explanation, falling back to local spec:', err)
        if (isMounted) {
          setError(err.message || 'Could not load complete explanation')
          // Build minimal fallback
          setExplanation({
            summary: spec.subtitle || spec.title,
            intuition: [spec.topicExplanation || 'Continuous physical state evolution governed by mathematical laws.'],
            animationGuide: (spec.stage?.elements || []).map((el) => ({
              element: `${el.type} (${el.id})`,
              meaning: el.role === 'projectile' ? 'Active moving body' : 'Spatial boundary reference',
            })),
            equationBreakdown: (spec.equations || []).map((eq) => ({
              formula: eq,
              description: 'Governing mathematical model.',
              variables: [],
            })),
            realWorldApplications: ['Physical science instrumentation', 'Everyday mechanics and physics'],
            thoughtExperiment: {
              question: 'How would changing the parameters alter the simulation rate?',
              answer: 'The speed or frequency would shift in direct accordance with the governing equations.',
            },
            keyTakeaways: [spec.topicExplanation || spec.title],
          })
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false)
        }
      })

    return () => {
      isMounted = false
    }
  }, [spec, level, quote, pageText])

  const handleDeepenWithAi = async () => {
    if (!spec) return
    setIsLoading(true)
    setError(null)
    try {
      const data = await simApiClient.fetchStudentExplanation({
        spec,
        quote: quote || spec.quote,
        pageText,
        mode: level,
        skipCache: true,
      })
      setExplanation(data)
    } catch (err: any) {
      setError(err.message || 'Failed to refresh explanation')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAskTutor = async (qToAsk?: string) => {
    const questionText = (qToAsk || tutorQuestion).trim()
    if (!questionText || !spec) return

    setIsAskingTutor(true)
    try {
      const res = await simApiClient.fetchStudentExplanation({
        spec,
        quote: quote || spec.quote,
        pageText,
        mode: level,
        customQuestion: questionText,
      })

      if (res.tutorAnswer) {
        setTutorConversation((prev) => [
          ...prev,
          { question: questionText, answer: res.tutorAnswer! },
        ])
        setTutorQuestion('')
      }
    } catch (err: any) {
      setTutorConversation((prev) => [
        ...prev,
        {
          question: questionText,
          answer: 'Sorry, I could not process your question right now. Please try again.',
        },
      ])
    } finally {
      setIsAskingTutor(false)
    }
  }

  if (!spec) return null

  const domainClass = `badge badge-${spec.domain || 'general'}`

  return (
    <div
      className="explain-panel-container"
      style={{
        borderTop: isSimAnimationVisible ? '1px solid var(--color-border)' : 'none',
        background: 'var(--color-surface)',
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
        minHeight: 0,
        overflow: 'hidden',
      }}
    >
      {/* Top Header with Domain Badge, Title & Level Selector */}
      <div
        style={{
          padding: '0.85rem 1.15rem',
          borderBottom: '1px solid var(--color-border)',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem',
          background: 'var(--color-surface-2)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0 }}>
            <span className={domainClass}>{spec.domain}</span>
            {spec.parentTopic && (
              <span
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  color: 'var(--color-text-subtle)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                }}
              >
                {spec.parentTopic}
              </span>
            )}
          </div>

          {/* Level Switcher */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', background: 'var(--color-surface-3)', padding: '2px', borderRadius: 'var(--radius-md)' }}>
            {(['beginner', 'standard', 'advanced'] as LearningLevel[]).map((lvl) => (
              <button
                key={lvl}
                type="button"
                onClick={() => setLevel(lvl)}
                style={{
                  padding: '0.2rem 0.55rem',
                  fontSize: '0.7rem',
                  fontWeight: level === lvl ? 600 : 400,
                  borderRadius: 'var(--radius-sm)',
                  border: 'none',
                  background: level === lvl ? 'var(--color-surface)' : 'transparent',
                  color: level === lvl ? 'var(--color-primary)' : 'var(--color-text-muted)',
                  cursor: 'pointer',
                  boxShadow: level === lvl ? 'var(--shadow-xs)' : 'none',
                  textTransform: 'capitalize',
                }}
              >
                {lvl}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
          <div>
            <h4
              style={{
                fontSize: '0.98rem',
                fontWeight: 600,
                color: 'var(--color-text)',
                margin: 0,
              }}
            >
              🎓 {spec.title}
            </h4>
            {explanation?.summary && (
              <p
                style={{
                  fontSize: '0.8rem',
                  color: 'var(--color-text-muted)',
                  marginTop: '0.15rem',
                }}
              >
                {explanation.summary}
              </p>
            )}
            {error && (
              <div style={{ fontSize: '0.72rem', color: 'var(--color-danger)', marginTop: '0.2rem' }}>
                ⚠️ {error}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            {/* {onToggleSimAnimation && (
              <button
                type="button"
                onClick={onToggleSimAnimation}
                className="action-btn-secondary"
                style={{
                  padding: '0.3rem 0.65rem',
                  fontSize: '0.72rem',
                  borderRadius: 'var(--radius-sm)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                  whiteSpace: 'nowrap',
                  background: isSimAnimationVisible ? 'var(--color-surface)' : 'var(--color-primary-subtle)',
                  borderColor: isSimAnimationVisible ? 'var(--color-border)' : 'var(--color-primary)',
                  color: isSimAnimationVisible ? 'var(--color-text-muted)' : 'var(--color-primary)',
                  fontWeight: isSimAnimationVisible ? 400 : 600,
                  cursor: 'pointer',
                }}
                title={isSimAnimationVisible ? 'Hide simulation animation to expand and focus on explanation text' : 'Show simulation animation'}
              >
                <span>{isSimAnimationVisible ? '👁️' : '🎬'}</span>
                <span>{isSimAnimationVisible ? 'Hide Simulation' : 'Show Simulation'}</span>
              </button>
            )} */}

            <button
              type="button"
              onClick={handleDeepenWithAi}
              disabled={isLoading}
              className="action-btn-secondary"
              style={{
                padding: '0.3rem 0.65rem',
                fontSize: '0.72rem',
                borderRadius: 'var(--radius-sm)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.3rem',
                whiteSpace: 'nowrap',
                color: 'var(--color-primary)',
                borderColor: 'rgba(37, 99, 235, 0.3)',
                cursor: 'pointer',
              }}
              title="Generate a fresh pedagogical explanation using LLM"
            >
              <span>{isLoading ? '⏳' : '✨'}</span>
              <span>{isLoading ? 'Analyzing...' : 'Deepen with AI'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Structured Navigation Tabs */}
      <div
        style={{
          display: 'flex',
          borderBottom: '1px solid var(--color-border)',
          background: 'var(--color-surface)',
          padding: '0 0.5rem',
          overflowX: 'auto',
        }}
      >
        {[
          { key: 'intuition', label: 'Concept & Intuition' },
          { key: 'visual', label: 'Visual Guide' },
          { key: 'math', label: 'Formulas & Math' },
          { key: 'quiz', label: 'Challenge Quiz' },
          { key: 'realworld', label: 'Real World' },
        ].map((tab) => {
          const isActive = activeTab === tab.key
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key as ExplainTab)}
              style={{
                padding: '0.55rem 0.85rem',
                border: 'none',
                borderBottom: isActive ? '2px solid var(--color-primary)' : '2px solid transparent',
                background: 'transparent',
                color: isActive ? 'var(--color-primary)' : 'var(--color-text-muted)',
                fontWeight: isActive ? 600 : 400,
                fontSize: '0.78rem',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease',
              }}
            >
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Main Tab Content Area */}
      <div
        style={{
          padding: '1.1rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
        }}
      >
        {isLoading ? (
          /* Shimmer Skeleton Loader */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', padding: '0.5rem 0' }}>
            <div style={{ height: '16px', background: 'var(--color-surface-3)', borderRadius: '4px', width: '80%' }} />
            <div style={{ height: '14px', background: 'var(--color-surface-3)', borderRadius: '4px', width: '95%' }} />
            <div style={{ height: '14px', background: 'var(--color-surface-3)', borderRadius: '4px', width: '90%' }} />
            <div style={{ height: '14px', background: 'var(--color-surface-3)', borderRadius: '4px', width: '65%' }} />
          </div>
        ) : (
          <>
            {/* 1. INTUITION TAB */}
            {activeTab === 'intuition' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                  {(explanation?.intuition || [spec.topicExplanation]).map((p, idx) => (
                    <p
                      key={idx}
                      style={{
                        fontSize: '0.85rem',
                        lineHeight: '1.6',
                        color: 'var(--color-text)',
                      }}
                    >
                      {p}
                    </p>
                  ))}
                </div>

                {/* Key Takeaways */}
                {explanation?.keyTakeaways && explanation.keyTakeaways.length > 0 && (
                  <div
                    style={{
                      marginTop: '0.4rem',
                      padding: '0.85rem',
                      background: 'var(--color-primary-subtle)',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid rgba(37, 99, 235, 0.15)',
                    }}
                  >
                    <div
                      style={{
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        color: 'var(--color-primary)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                        marginBottom: '0.4rem',
                      }}
                    >
                      Key Takeaways
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
              </div>
            )}

            {/* 2. VISUAL GUIDE TAB */}
            {activeTab === 'visual' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                  Here is what each dynamic element and movement in the simulation visualizes:
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {(explanation?.animationGuide || []).map((guide, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '0.75rem',
                        padding: '0.65rem 0.85rem',
                        background: 'var(--color-surface-2)',
                        border: '1px solid var(--color-border)',
                        borderRadius: 'var(--radius-md)',
                      }}
                    >
                      <span style={{ fontSize: '1rem', marginTop: '0.1rem' }}>🔹</span>
                      <div>
                        <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--color-primary)' }}>
                          {guide.element}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '0.15rem' }}>
                          {guide.meaning}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {spec.caption && (
                  <div
                    style={{
                      fontSize: '0.8rem',
                      color: 'var(--color-text-subtle)',
                      padding: '0.6rem',
                      borderLeft: '3px solid var(--color-primary)',
                      background: 'var(--color-bg-subtle)',
                      borderRadius: '0 var(--radius-sm) var(--radius-sm) 0',
                    }}
                  >
                    <strong>Motion Dynamic:</strong> {spec.caption}
                  </div>
                )}

                {/* Textbook Excerpt */}
                {(quote || spec.quote) && (
                  <div style={{ marginTop: '0.4rem' }}>
                    <div
                      style={{
                        fontSize: '0.72rem',
                        fontWeight: 600,
                        color: 'var(--color-text-subtle)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                        marginBottom: '0.3rem',
                      }}
                    >
                      Original Textbook Excerpt
                    </div>
                    <div className="sim-quote-box" style={{ margin: 0, fontSize: '0.8rem' }}>
                      “{quote || spec.quote}”
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 3. FORMULAS & MATH TAB */}
            {activeTab === 'math' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                {(!explanation?.equationBreakdown || explanation.equationBreakdown.length === 0) &&
                (!spec.equations || spec.equations.length === 0) ? (
                  <div style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
                    No specific governing formulas attached to this qualitative concept.
                  </div>
                ) : (
                  (explanation?.equationBreakdown || []).map((eq, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.5rem',
                        padding: '0.85rem',
                        background: 'var(--color-surface-2)',
                        border: '1px solid var(--color-border)',
                        borderRadius: 'var(--radius-md)',
                      }}
                    >
                      <div
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: '0.9rem',
                          fontWeight: 600,
                          color: 'var(--color-primary)',
                          background: 'var(--color-surface)',
                          padding: '0.45rem 0.75rem',
                          borderRadius: 'var(--radius-sm)',
                          border: '1px solid var(--color-border)',
                        }}
                      >
                        {eq.formula}
                      </div>

                      {eq.description && (
                        <p style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', margin: 0 }}>
                          {eq.description}
                        </p>
                      )}

                      {eq.variables && eq.variables.length > 0 && (
                        <div style={{ marginTop: '0.3rem' }}>
                          <div
                            style={{
                              fontSize: '0.72rem',
                              fontWeight: 600,
                              color: 'var(--color-text-subtle)',
                              textTransform: 'uppercase',
                              letterSpacing: '0.03em',
                              marginBottom: '0.35rem',
                            }}
                          >
                            Variable Dictionary:
                          </div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                            {eq.variables.map((v, vIdx) => (
                              <div
                                key={vIdx}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.4rem',
                                  padding: '0.25rem 0.55rem',
                                  background: 'var(--color-surface)',
                                  borderRadius: 'var(--radius-sm)',
                                  border: '1px solid var(--color-border)',
                                  fontSize: '0.75rem',
                                }}
                              >
                                <strong style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-primary)' }}>
                                  {v.symbol}
                                </strong>
                                <span style={{ color: 'var(--color-text)' }}>= {v.meaning}</span>
                                {v.unit && (
                                  <span style={{ color: 'var(--color-text-subtle)', fontSize: '0.7rem' }}>
                                    ({v.unit})
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}

            {/* 4. CHALLENGE QUIZ TAB */}
            {activeTab === 'quiz' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                <div
                  style={{
                    padding: '1rem',
                    background: 'var(--color-surface-2)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-lg)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.75rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {/* <span style={{ fontSize: '1.2rem' }}></span> */}
                    <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--color-primary)' }}>
                      Student Concept Check
                    </span>
                  </div>

                  <p style={{ fontSize: '0.88rem', fontWeight: 500, color: 'var(--color-text)', margin: 0 }}>
                    {explanation?.thoughtExperiment?.question ||
                      'What happens to the simulation if the key rate parameter is doubled?'}
                  </p>

                  {/* Hint Toggle */}
                  {explanation?.thoughtExperiment?.hint && (
                    <div>
                      <button
                        type="button"
                        onClick={() => setShowHint((prev) => !prev)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: 'var(--color-text-muted)',
                          fontSize: '0.75rem',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.3rem',
                          padding: 0,
                        }}
                      >
                        <span>{showHint ? '▾ Hide Hint' : '▸ Need a Hint?'}</span>
                      </button>
                      {showHint && (
                        <div
                          style={{
                            fontSize: '0.8rem',
                            color: 'var(--color-text-muted)',
                            background: 'var(--color-surface)',
                            padding: '0.5rem 0.75rem',
                            borderRadius: 'var(--radius-sm)',
                            border: '1px dashed var(--color-border)',
                            marginTop: '0.4rem',
                          }}
                        >
                          {explanation.thoughtExperiment.hint}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Reveal Answer Button */}
                  <div>
                    {!showAnswer ? (
                      <button
                        type="button"
                        className="action-btn"
                        onClick={() => setShowAnswer(true)}
                        style={{ padding: '0.4rem 0.9rem', fontSize: '0.78rem' }}
                      >
                        Reveal Explanation & Answer →
                      </button>
                    ) : (
                      <div
                        style={{
                          padding: '0.75rem',
                          background: 'rgba(5, 150, 105, 0.08)',
                          border: '1px solid rgba(5, 150, 105, 0.2)',
                          borderRadius: 'var(--radius-md)',
                        }}
                      >
                        <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-success)', marginBottom: '0.25rem' }}>
                          ✓ Correct Reasoning:
                        </div>
                        <p style={{ fontSize: '0.82rem', color: 'var(--color-text)', margin: 0, lineHeight: '1.5' }}>
                          {explanation?.thoughtExperiment?.answer}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* 5. REAL WORLD TAB */}
            {activeTab === 'realworld' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                  Where you encounter this phenomenon in modern engineering, nature, and technology:
                </div>

                {(explanation?.realWorldApplications || []).map((app, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.65rem',
                      padding: '0.65rem 0.85rem',
                      background: 'var(--color-surface-2)',
                      border: '1px solid var(--color-border)',
                      borderRadius: 'var(--radius-md)',
                    }}
                  >
                    {/* <span style={{ fontSize: '1.1rem' }}>🚀</span> */}
                    <span style={{ fontSize: '0.82rem', color: 'var(--color-text)' }}>{app}</span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Ask AI Tutor Section */}
        <div
          style={{
            marginTop: '0.5rem',
            paddingTop: '0.85rem',
            borderTop: '1px solid var(--color-border)',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.6rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <span>💬</span> Ask AI Tutor About This Simulation
            </span>
            <span style={{ fontSize: '0.7rem', color: 'var(--color-text-subtle)' }}>
              Instant answers tailored to this concept
            </span>
          </div>

          {/* Past Q&A history */}
          {tutorConversation.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '0.4rem' }}>
              {tutorConversation.map((item, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: '0.65rem 0.85rem',
                    background: 'var(--color-surface-2)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-border)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.35rem',
                  }}
                >
                  <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--color-primary)' }}>
                    Q: {item.question}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-text)', lineHeight: '1.45' }}>
                    {item.answer}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div style={{ display: 'flex', gap: '0.4rem' }}>
            <input
              type="text"
              placeholder={`Ask a question (e.g. "What happens if velocity increases?")`}
              value={tutorQuestion}
              onChange={(e) => setTutorQuestion(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAskTutor()
              }}
              disabled={isAskingTutor}
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
              onClick={() => handleAskTutor()}
              disabled={isAskingTutor || !tutorQuestion.trim()}
              style={{ padding: '0.45rem 0.85rem', fontSize: '0.78rem', whiteSpace: 'nowrap' }}
            >
              {isAskingTutor ? 'Thinking...' : 'Ask Tutor'}
            </button>
          </div>

          {/* Suggestion Chips */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
            {[
              'Explain in simpler words',
              'What happens if we double the speed?',
              'Where is this formula used in technology?',
            ].map((sug, sIdx) => (
              <button
                key={sIdx}
                type="button"
                onClick={() => handleAskTutor(sug)}
                disabled={isAskingTutor}
                style={{
                  background: 'transparent',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-full)',
                  padding: '0.15rem 0.5rem',
                  fontSize: '0.7rem',
                  color: 'var(--color-text-muted)',
                  cursor: 'pointer',
                }}
              >
                + {sug}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
