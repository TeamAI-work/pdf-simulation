// web/src/features/pdf-simulator/components/SimDrawer.tsx

import React, { useState } from 'react'
import { simApiClient, type SimAnnotation } from '../api.js'
import { createTemplateSpec, matchTemplateFromText } from '@pdf-sim/shared'

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
  'Projectile motion',
  'Simple pendulum',
  'Light refraction (Snell)',
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

  const launch = (item: SimAnnotation) => {
    onSelectSimulation(item)
    onClose()
  }

  const list = activeTab === 'page' ? annotations : customSimulations

  return (
    <div className="sim-drawer-overlay" onClick={onClose}>
      <div className="sim-drawer sim-hub" onClick={(e) => e.stopPropagation()}>
        <header className="sim-hub__header">
          <div>
            <h3>Simulations</h3>
            <p>Page {pageNumber} concepts and custom AI sims</p>
          </div>
          <button type="button" className="sim-hub__close" onClick={onClose} title="Close">
            ✕
          </button>
        </header>

        <div className="sim-hub__generate">
          <div className="sim-hub__generate-row">
            <input
              type="text"
              className="sim-hub__input"
              placeholder="Describe a concept to simulate…"
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleGenerateCustom()
              }}
              disabled={isGenerating}
              aria-label="Custom simulation prompt"
            />
            <button
              type="button"
              className="action-btn sim-hub__generate-btn"
              onClick={() => handleGenerateCustom()}
              disabled={isGenerating || !customPrompt.trim()}
            >
              {isGenerating ? 'Generating…' : 'Generate'}
            </button>
          </div>
          <div className="sim-hub__chips">
            {QUICK_PROMPTS.map((q) => (
              <button
                key={q}
                type="button"
                className="sim-hub__chip"
                onClick={() => handleGenerateCustom(q)}
                disabled={isGenerating}
              >
                {q}
              </button>
            ))}
          </div>
          {generateError && <p className="sim-hub__error">⚠️ {generateError}</p>}
        </div>

        <div className="sim-hub__tabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'page'}
            className={`sim-hub__tab${activeTab === 'page' ? ' is-active' : ''}`}
            onClick={() => setActiveTab('page')}
          >
            This page
            <span className="sim-hub__count">{annotations.length}</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'custom'}
            className={`sim-hub__tab${activeTab === 'custom' ? ' is-active' : ''}`}
            onClick={() => setActiveTab('custom')}
          >
            Custom
            <span className="sim-hub__count">{customSimulations.length}</span>
          </button>
        </div>

        <div className="sim-hub__list">
          {list.length === 0 ? (
            <div className="sim-hub__empty">
              {activeTab === 'page'
                ? 'No simulations on this page yet. Generate one above.'
                : 'No custom simulations yet. Type a concept and generate.'}
            </div>
          ) : (
            list.map((item) => {
              const spec = item.spec
              const isSelected = selectedAnnotationId === item.id
              const isCustom = activeTab === 'custom'

              return (
                <article
                  key={item.id}
                  className={`sim-card sim-hub__card${isSelected ? ' is-active' : ''}`}
                >
                  <div className="sim-hub__card-top">
                    <span className={`badge badge-${spec.domain || 'general'}`}>{spec.domain}</span>
                    <h4 className="sim-hub__card-title" title={spec.title}>
                      {spec.title}
                    </h4>
                    {isSelected && <span className="sim-hub__active">Active</span>}
                  </div>
                  {spec.subtitle && <p className="sim-hub__card-sub">{spec.subtitle}</p>}
                  <div className="sim-hub__card-actions">
                    {isCustom && onDeleteCustomSimulation && (
                      <button
                        type="button"
                        className="sim-hub__text-btn sim-hub__text-btn--danger"
                        onClick={() => onDeleteCustomSimulation(item.id)}
                      >
                        Delete
                      </button>
                    )}
                    {!isCustom && !item.spec.templateId && (
                      <button
                        type="button"
                        className="sim-hub__text-btn"
                        onClick={() => handleReanimateCard(item)}
                        disabled={isGenerating}
                      >
                        Re-animate
                      </button>
                    )}
                    <button
                      type="button"
                      className="action-btn sim-hub__launch"
                      onClick={() => launch(item)}
                    >
                      {isSelected ? 'View' : 'Launch'}
                    </button>
                  </div>
                </article>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
