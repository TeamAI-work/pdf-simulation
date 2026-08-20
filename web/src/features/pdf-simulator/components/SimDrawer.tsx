// web/src/features/pdf-simulator/components/SimDrawer.tsx

import React, { useState } from 'react'
import { simApiClient, type SimAnnotation } from '../api.js'
import { createTemplateSpec, matchTemplateFromText, randomizeTemplateParams, TEMPLATE_CATALOG, TEMPLATE_IDS } from '@pdf-sim/shared'

export interface SimDrawerProps {
  isOpen: boolean
  onClose: () => void
  annotations: SimAnnotation[]
  customSimulations?: SimAnnotation[]
  pageNumber: number
  bookId?: string
  selectedAnnotationId: string | null
  onSelectSimulation: (annotation: SimAnnotation) => void
  onAnnotationAdded?: (newAnnotation: SimAnnotation) => void
  onCustomSimulationAdded?: (newCustomSim: SimAnnotation) => void
  onDeleteCustomSimulation?: (id: string) => void
}

const QUICK_PROMPTS = [
  'Unit circle rotation and sin/cos wave graph',
  'Magnetic field concentric circles around electric wire',
  'Projectile motion under gravity with trajectory path',
  'Simple harmonic motion of pendulum with kinetic energy',
  'Optics light refraction at medium boundary (Snell law)',
]

export const SimDrawer: React.FC<SimDrawerProps> = ({
  isOpen,
  onClose,
  annotations,
  customSimulations = [],
  pageNumber,
  bookId,
  selectedAnnotationId,
  onSelectSimulation,
  onAnnotationAdded,
  onCustomSimulationAdded,
  onDeleteCustomSimulation,
}) => {
  const [activeTab, setActiveTab] = useState<'page' | 'custom'>('page')
  const [customPrompt, setCustomPrompt] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [generateError, setGenerateError] = useState<string | null>(null)

  if (!isOpen) return null

  const handleGenerateCustom = async (promptToUse?: string) => {
    const text = (promptToUse || customPrompt).trim()
    if (!text) return

    setIsGenerating(true)
    setGenerateError(null)

    try {
      const matched = matchTemplateFromText(text)
      if (matched) {
        const spec = createTemplateSpec(matched.templateId, matched.params, {
          title: matched.title,
          quote: text,
          domain: 'physics',
        })
        const customSim: SimAnnotation = {
          id: `custom-sim-${Date.now()}`,
          book_id: 'custom-prompts',
          page_number: pageNumber,
          quote: text,
          spec,
          spec_version: '2.0',
          created_at: new Date().toISOString(),
        }
        onCustomSimulationAdded?.(customSim)
        onSelectSimulation(customSim)
        setCustomPrompt('')
        setActiveTab('custom')
        onClose()
        return
      }

      const result = await simApiClient.generateAiSimulation({
        prompt: text,
      })

      const customSim: SimAnnotation = {
        id: `custom-sim-${Date.now()}`,
        book_id: 'custom-prompts',
        page_number: pageNumber,
        quote: text,
        spec: result.spec,
        spec_version: '2.0',
        created_at: new Date().toISOString(),
      }

      onCustomSimulationAdded?.(customSim)
      onSelectSimulation(customSim)
      setCustomPrompt('')
      setActiveTab('custom')
      onClose()
    } catch (err: any) {
      console.error('[SimDrawer] Error generating custom simulation:', err)
      setGenerateError(err.message || 'Failed to generate simulation. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleReanimateCard = async (item: SimAnnotation) => {
    if (item.spec.templateId) {
      onSelectSimulation(item)
      onClose()
      return
    }
    setIsGenerating(true)
    setGenerateError(null)

    try {
      const result = await simApiClient.generateAiSimulation({
        prompt: item.spec.title,
        bookId,
        pageNumber,
        annotationId: item.id,
        existingSpec: item.spec,
      })

      const updatedAnnotation: SimAnnotation = result.annotation || {
        ...item,
        spec: result.spec,
      }

      onAnnotationAdded?.(updatedAnnotation)
      onSelectSimulation(updatedAnnotation)
      onClose()
    } catch (err: any) {
      console.error('[SimDrawer] Error re-animating simulation:', err)
      setGenerateError(err.message || 'Failed to re-animate simulation. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleLaunchRandomTemplate = (templateId: (typeof TEMPLATE_IDS)[number]) => {
    const def = TEMPLATE_CATALOG[templateId]
    const params = randomizeTemplateParams(templateId)
    const paramSummary = Object.entries(params)
      .map(([k, v]) => `${k}=${typeof v === 'number' ? Number(v.toFixed(2)) : v}`)
      .join(', ')
    const spec = createTemplateSpec(templateId, params, {
      title: `${def.label} (random test)`,
      subtitle: def.description,
      quote: `Quality preview with random params: ${paramSummary}`,
      domain: 'physics',
    })
    const customSim: SimAnnotation = {
      id: `template-test-${templateId}-${Date.now()}`,
      book_id: 'custom-prompts',
      page_number: pageNumber,
      quote: spec.quote,
      spec,
      spec_version: '2.0',
      created_at: new Date().toISOString(),
    }
    onCustomSimulationAdded?.(customSim)
    onSelectSimulation(customSim)
    setActiveTab('custom')
    onClose()
  }

  return (
    <div className="sim-drawer-overlay" onClick={onClose}>
      <div
        className="sim-drawer"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '840px', maxHeight: '85vh' }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingBottom: '0.75rem',
            borderBottom: '1px solid var(--color-border)',
          }}
        >
          <div>
            <h3
              style={{
                fontSize: '1.05rem',
                fontWeight: 600,
                color: 'var(--color-text)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              <span>⚡ Simulations Hub</span>
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '0.2rem' }}>
              Textbook page visualizations and standalone custom AI simulations.
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              fontSize: '1.25rem',
              color: 'var(--color-text-muted)',
              cursor: 'pointer',
              padding: '0.25rem 0.5rem',
              borderRadius: 'var(--radius-sm)',
            }}
            title="Close"
          >
            ✕
          </button>
        </div>

        {/* On-Demand AI Generator Bar */}
        <div
          style={{
            background: 'var(--color-primary-subtle)',
            border: '1px solid rgba(37, 99, 235, 0.2)',
            borderRadius: 'var(--radius-lg)',
            padding: '1rem 1.15rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.6rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span>✨</span> Generate Standalone Custom Simulation
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
              Saved separately from textbook
            </span>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input
              type="text"
              placeholder="Enter any physics/math concept (e.g. 'Magnetic field lines around current wire')"
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleGenerateCustom()
              }}
              disabled={isGenerating}
              style={{
                flex: 1,
                padding: '0.55rem 0.85rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border)',
                background: 'var(--color-surface)',
                color: 'var(--color-text)',
                fontSize: '0.82rem',
                outline: 'none',
              }}
            />
            <button
              className="action-btn"
              onClick={() => handleGenerateCustom()}
              disabled={isGenerating || !customPrompt.trim()}
              style={{ padding: '0.55rem 1.1rem', fontSize: '0.82rem', whiteSpace: 'nowrap' }}
            >
              {isGenerating ? 'Generating...' : 'Generate with AI ⚡'}
            </button>
          </div>

          {/* Quick suggestion chips */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.2rem' }}>
            {QUICK_PROMPTS.map((q, idx) => (
              <button
                key={idx}
                onClick={() => handleGenerateCustom(q)}
                disabled={isGenerating}
                style={{
                  background: 'var(--color-surface)',
                  border: '1px solid rgba(37, 99, 235, 0.15)',
                  borderRadius: 'var(--radius-full)',
                  padding: '0.2rem 0.6rem',
                  fontSize: '0.72rem',
                  color: 'var(--color-text-muted)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = 'var(--color-primary)'
                  e.currentTarget.style.borderColor = 'var(--color-primary)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = 'var(--color-text-muted)'
                  e.currentTarget.style.borderColor = 'rgba(37, 99, 235, 0.15)'
                }}
              >
                + {q}
              </button>
            ))}
          </div>

          {generateError && (
            <div style={{ color: 'var(--color-danger)', fontSize: '0.8rem', marginTop: '0.3rem' }}>
              ⚠️ {generateError}
            </div>
          )}
        </div>

        <div
          style={{
            background: 'var(--color-surface)',
            border: '1px dashed var(--color-border)',
            borderRadius: 'var(--radius-lg)',
            padding: '0.85rem 1.15rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.55rem',
          }}
        >
          <div>
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--color-text)' }}>
              Test templates with random data
            </span>
            <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.15rem' }}>
              No PDF or LLM. Opens a catalog animation with randomized in-range values so you can judge motion quality.
            </p>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
            {TEMPLATE_IDS.map((id) => (
              <button
                key={id}
                type="button"
                className="action-btn-secondary"
                onClick={() => handleLaunchRandomTemplate(id)}
                style={{
                  padding: '0.3rem 0.65rem',
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                }}
                title={`Launch ${TEMPLATE_CATALOG[id].label} with random params`}
              >
                {TEMPLATE_CATALOG[id].label}
              </button>
            ))}
          </div>
        </div>

        {/* Distinct Separation Tabs */}
        <div
          style={{
            display: 'flex',
            gap: '0.5rem',
            borderBottom: '1px solid var(--color-border)',
            paddingBottom: '0.5rem',
          }}
        >
          <button
            onClick={() => setActiveTab('page')}
            style={{
              padding: '0.45rem 0.9rem',
              borderRadius: 'var(--radius-md)',
              border: activeTab === 'page' ? '1px solid var(--color-primary)' : '1px solid transparent',
              background: activeTab === 'page' ? 'var(--color-surface)' : 'transparent',
              color: activeTab === 'page' ? 'var(--color-primary)' : 'var(--color-text-muted)',
              fontSize: '0.82rem',
              fontWeight: activeTab === 'page' ? 600 : 400,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
            }}
          >
            <span>📖 Page {pageNumber} Concepts</span>
            <span
              style={{
                background: activeTab === 'page' ? 'var(--color-primary-subtle)' : 'var(--color-surface-2)',
                color: activeTab === 'page' ? 'var(--color-primary)' : 'var(--color-text-muted)',
                padding: '0.1rem 0.4rem',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.72rem',
              }}
            >
              {annotations.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('custom')}
            style={{
              padding: '0.45rem 0.9rem',
              borderRadius: 'var(--radius-md)',
              border: activeTab === 'custom' ? '1px solid var(--color-primary)' : '1px solid transparent',
              background: activeTab === 'custom' ? 'var(--color-surface)' : 'transparent',
              color: activeTab === 'custom' ? 'var(--color-primary)' : 'var(--color-text-muted)',
              fontSize: '0.82rem',
              fontWeight: activeTab === 'custom' ? 600 : 400,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
            }}
          >
            <span>✨ Custom AI Simulations</span>
            <span
              style={{
                background: activeTab === 'custom' ? 'var(--color-primary-subtle)' : 'var(--color-surface-2)',
                color: activeTab === 'custom' ? 'var(--color-primary)' : 'var(--color-text-muted)',
                padding: '0.1rem 0.4rem',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.72rem',
              }}
            >
              {customSimulations.length}
            </span>
          </button>
        </div>

        {/* Tab Content Display */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', overflowY: 'auto' }}>
          {activeTab === 'page' && (
            <>
              {annotations.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '1.5rem 1rem', color: 'var(--color-text-muted)', background: 'var(--color-surface-2)', borderRadius: 'var(--radius-md)' }}>
                  <p style={{ fontSize: '0.85rem' }}>No automatic simulations generated yet for this page.</p>
                  <p style={{ fontSize: '0.78rem', color: 'var(--color-text-subtle)', marginTop: '0.25rem' }}>
                    You can generate a standalone custom simulation above anytime!
                  </p>
                </div>
              ) : (
                annotations.map((item, idx) => {
                  const spec = item.spec
                  const isSelected = selectedAnnotationId === item.id
                  const domainClass = `badge badge-${spec.domain || 'general'}`

                  return (
                    <div
                      key={item.id || idx}
                      className="sim-card"
                      style={{
                        borderColor: isSelected ? 'var(--color-primary)' : 'var(--color-border)',
                        boxShadow: isSelected ? '0 0 0 1px var(--color-primary), var(--shadow-sm)' : undefined,
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span className={domainClass}>{spec.domain}</span>
                          <span style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--color-text)' }}>
                            {spec.title}
                          </span>
                        </div>
                        {isSelected && (
                          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-primary)' }}>
                            ● Active
                          </span>
                        )}
                      </div>

                      {spec.subtitle && (
                        <p style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>
                          {spec.subtitle}
                        </p>
                      )}

                      {item.quote && (
                        <div className="sim-quote-box">
                          “{item.quote}”
                        </div>
                      )}

                      {spec.equations && spec.equations.length > 0 && (
                        <div
                          style={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            gap: '0.4rem',
                            fontFamily: 'var(--font-mono)',
                            fontSize: '0.75rem',
                            color: 'var(--color-primary)',
                          }}
                        >
                          {spec.equations.map((eq, eqIdx) => (
                            <span
                              key={eqIdx}
                              style={{
                                background: 'var(--color-primary-subtle)',
                                padding: '0.15rem 0.45rem',
                                borderRadius: 'var(--radius-sm)',
                                border: '1px solid rgba(37, 99, 235, 0.2)',
                              }}
                            >
                              {eq}
                            </span>
                          ))}
                        </div>
                      )}

                      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
                          {item.spec.templateId ? (
                            <span
                              style={{
                                fontSize: '0.72rem',
                                color: 'var(--color-text-muted)',
                                padding: '0.35rem 0.5rem',
                              }}
                            >
                              Template: {item.spec.templateId}
                            </span>
                          ) : (
                            <button
                              type="button"
                              className="action-btn-secondary"
                              onClick={() => handleReanimateCard(item)}
                              disabled={isGenerating}
                              style={{
                                padding: '0.35rem 0.75rem',
                                fontSize: '0.75rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.3rem',
                                color: 'var(--color-primary)',
                                borderColor: 'rgba(37, 99, 235, 0.3)',
                              }}
                              title="Re-animate this specific textbook concept using LLM"
                            >
                              <span>✨</span>
                              <span>Re-animate with LLM</span>
                            </button>
                          )}

                        <button
                          className="action-btn"
                          onClick={() => {
                            onSelectSimulation(item)
                            onClose()
                          }}
                          style={{ padding: '0.4rem 0.9rem', fontSize: '0.8rem' }}
                        >
                          {isSelected ? 'View Simulation' : 'Launch Simulation →'}
                        </button>
                      </div>
                    </div>
                  )
                })
              )}
            </>
          )}

          {activeTab === 'custom' && (
            <>
              {customSimulations.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '1.5rem 1rem', color: 'var(--color-text-muted)', background: 'var(--color-surface-2)', borderRadius: 'var(--radius-md)' }}>
                  <p style={{ fontSize: '0.85rem' }}>No custom AI simulations created yet.</p>
                  <p style={{ fontSize: '0.78rem', color: 'var(--color-text-subtle)', marginTop: '0.25rem' }}>
                    Type a prompt above or click one of the quick suggestions to generate a custom animation!
                  </p>
                </div>
              ) : (
                customSimulations.map((item, idx) => {
                  const spec = item.spec
                  const isSelected = selectedAnnotationId === item.id
                  const domainClass = `badge badge-${spec.domain || 'general'}`

                  return (
                    <div
                      key={item.id || idx}
                      className="sim-card"
                      style={{
                        borderColor: isSelected ? 'var(--color-primary)' : 'var(--color-border)',
                        boxShadow: isSelected ? '0 0 0 1px var(--color-primary), var(--shadow-sm)' : undefined,
                        background: 'var(--color-surface)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span className={domainClass}>{spec.domain}</span>
                          <span style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--color-text)' }}>
                            {spec.title}
                          </span>
                        </div>
                        {isSelected && (
                          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-primary)' }}>
                            ● Active
                          </span>
                        )}
                      </div>

                      {spec.subtitle && (
                        <p style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>
                          {spec.subtitle}
                        </p>
                      )}

                      {item.quote && (
                        <div className="sim-quote-box" style={{ fontStyle: 'normal' }}>
                          Prompt: <strong>{item.quote}</strong>
                        </div>
                      )}

                      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
                        {onDeleteCustomSimulation && (
                          <button
                            type="button"
                            className="action-btn-secondary"
                            onClick={() => onDeleteCustomSimulation(item.id)}
                            style={{
                              padding: '0.35rem 0.6rem',
                              fontSize: '0.75rem',
                              color: 'var(--color-danger)',
                            }}
                            title="Delete this custom simulation"
                          >
                            🗑️ Delete
                          </button>
                        )}

                        <button
                          className="action-btn"
                          onClick={() => {
                            onSelectSimulation(item)
                            onClose()
                          }}
                          style={{ padding: '0.4rem 0.9rem', fontSize: '0.8rem' }}
                        >
                          {isSelected ? 'View Simulation' : 'Launch Simulation →'}
                        </button>
                      </div>
                    </div>
                  )
                })
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
