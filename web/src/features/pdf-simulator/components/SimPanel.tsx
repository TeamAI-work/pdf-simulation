// web/src/features/pdf-simulator/components/SimPanel.tsx

import React, { useEffect, useMemo, useState } from 'react'
import {
  bindTemplate,
  isTemplateId,
  randomizeTemplateParams,
  TEMPLATE_CATALOG,
  type SimSpec,
} from '@pdf-sim/shared'
import { SimStage } from '../sim/SimStage.js'

export interface SimPanelProps {
  spec: SimSpec | null
  onClose?: () => void
  onRegenerateWithAi?: () => Promise<void>
  isAnimationVisible?: boolean
  onToggleAnimation?: () => void
}

function formatMetricKey(key: string): string {
  return key
    .replace(/_/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

function formatMetricValue(value: number | string | boolean): string {
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) return '—'
    if (Number.isInteger(value)) return String(value)
    return Math.abs(value) >= 100 ? value.toFixed(1) : value.toFixed(2)
  }
  return String(value)
}

function textbookParams(spec: SimSpec): Record<string, number> {
  const out: Record<string, number> = {}
  for (const [k, v] of Object.entries(spec.params || {})) {
    const n = typeof v === 'number' ? v : Number(v)
    if (Number.isFinite(n)) out[k] = n
  }
  return out
}

export const SimPanel: React.FC<SimPanelProps> = ({
  spec,
  onClose,
  onRegenerateWithAi,
  isAnimationVisible = true,
  onToggleAnimation,
}) => {
  const [isRegenerating, setIsRegenerating] = useState(false)
  const templated = Boolean(spec?.templateId && isTemplateId(spec.templateId))
  const [sliderParams, setSliderParams] = useState<Record<string, number>>({})

  useEffect(() => {
    if (spec) setSliderParams(textbookParams(spec))
  }, [spec])

  const bound = useMemo(() => {
    if (!spec?.templateId || !isTemplateId(spec.templateId)) return null
    return bindTemplate(spec.templateId, sliderParams, spec)
  }, [spec, sliderParams])

  const stage = bound?.spec.stage ?? spec?.stage
  const playable = Boolean(spec && (stage || templated))

  const handleRegenerate = async () => {
    if (!onRegenerateWithAi) return
    try {
      setIsRegenerating(true)
      await onRegenerateWithAi()
    } finally {
      setIsRegenerating(false)
    }
  }

  if (!spec || !playable || !stage) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          padding: '2rem',
          color: 'var(--color-text-muted)',
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: '2.5rem', marginBottom: '1rem', opacity: 0.6 }}>⚛️</div>
        <h4 style={{ color: 'var(--color-text)', fontWeight: 600, marginBottom: '0.4rem' }}>
          No Simulation Selected
        </h4>
        <p style={{ fontSize: '0.85rem', maxWidth: '320px' }}>
          Navigate through the textbook pages. When interactive simulations are detected, click the ⚡ FAB button to launch one.
        </p>
      </div>
    )
  }

  const domainClass = `badge badge-${spec.domain || 'general'}`
  const paramDefs = templated && spec.templateId && isTemplateId(spec.templateId)
    ? TEMPLATE_CATALOG[spec.templateId].params
    : []
  const metrics = bound?.metrics ?? {}
  const metricEntries = Object.entries(metrics)

  return (
    <div
      className="sim-panel"
      style={{
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
        minHeight: 0,
        width: '100%',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.75rem 1.25rem',
          borderBottom: '1px solid var(--color-border)',
          background: 'var(--color-surface)',
          gap: '0.5rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', minWidth: 0 }}>
          <span className={domainClass}>{spec.domain}</span>
          <h3
            style={{
              fontSize: '0.95rem',
              fontWeight: 600,
              color: 'var(--color-text)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
            title={spec.title}
          >
            {spec.title}
          </h3>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexShrink: 0 }}>
          {onToggleAnimation && (
            <button
              type="button"
              onClick={onToggleAnimation}
              className="action-btn-secondary"
              style={{
                padding: '0.25rem 0.6rem',
                fontSize: '0.75rem',
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.3rem',
                background: isAnimationVisible ? 'var(--color-surface)' : 'var(--color-primary-subtle)',
                borderColor: isAnimationVisible ? 'var(--color-border)' : 'var(--color-primary)',
                color: isAnimationVisible ? 'var(--color-text-muted)' : 'var(--color-primary)',
                fontWeight: isAnimationVisible ? 400 : 600,
              }}
                title={isAnimationVisible ? 'Hide simulation animation' : 'Show simulation animation'}
            >
              <span>{isAnimationVisible ? '👁️' : '🎬'}</span>
              <span>{isAnimationVisible ? 'Hide Animation' : 'Show Animation'}</span>
            </button>
          )}

          {templated && spec.templateId && isTemplateId(spec.templateId) && (
            <>
              <button
                type="button"
                onClick={() => setSliderParams(textbookParams(spec))}
                className="action-btn-secondary"
                style={{
                  padding: '0.25rem 0.6rem',
                  fontSize: '0.75rem',
                  borderRadius: 'var(--radius-sm)',
                  cursor: 'pointer',
                }}
                title="Restore numbers extracted from the textbook"
              >
                Reset to textbook values
              </button>
              <button
                type="button"
                onClick={() => {
                  if (spec.templateId && isTemplateId(spec.templateId)) {
                    setSliderParams(randomizeTemplateParams(spec.templateId))
                  }
                }}
                className="action-btn-secondary"
                style={{
                  padding: '0.25rem 0.6rem',
                  fontSize: '0.75rem',
                  borderRadius: 'var(--radius-sm)',
                  cursor: 'pointer',
                }}
                title="Fill sliders with random in-range values to preview animation quality"
              >
                Randomize values
              </button>
            </>
          )}

          {onRegenerateWithAi && !templated && (
            <button
              onClick={handleRegenerate}
              disabled={isRegenerating}
              className="action-btn-secondary"
              style={{
                padding: '0.25rem 0.6rem',
                fontSize: '0.75rem',
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.3rem',
                color: 'var(--color-primary)',
                borderColor: 'rgba(37, 99, 235, 0.3)',
              }}
              title="Ask LLM to re-generate / enhance this simulation"
            >
              <span>{isRegenerating ? '⚙️' : '✨'}</span>
              <span>{isRegenerating ? 'Generating...' : 'Re-animate with LLM'}</span>
            </button>
          )}

          {onClose && (
            <button
              onClick={onClose}
              className="action-btn-secondary"
              style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem', borderRadius: 'var(--radius-sm)', cursor: 'pointer' }}
              title="Collapse Simulation Panel"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {metricEntries.length > 0 && (
        <div className="sim-results">
          {bound?.warnings && bound.warnings.length > 0 && (
            <div className="sim-result-warn">{bound.warnings.join(' · ')}</div>
          )}
          {metricEntries.map(([k, v]) => (
            <div key={k} className="sim-result-card">
              <span className="sim-result-card__key">{formatMetricKey(k)}</span>
              <span className="sim-result-card__value">{formatMetricValue(v)}</span>
            </div>
          ))}
        </div>
      )}

      {isAnimationVisible ? (
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            minHeight: 0,
            backgroundColor: 'var(--color-bg)',
          }}
        >
          <div
            style={{
              flex: 1,
              minHeight: 0,
              height: 0,
              padding: '0.75rem 1rem 0',
              display: 'flex',
            }}
          >
            <div
              style={{
                flex: 1,
                minHeight: 0,
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-lg)',
                overflow: 'hidden',
                boxShadow: 'var(--shadow-sm)',
                display: 'flex',
                position: 'relative',
              }}
            >
              <SimStage
                key={`${spec.templateId || spec.title}:${JSON.stringify(sliderParams)}`}
                stage={stage}
                autoPlay={true}
                initialSpeed={1}
                showControls={true}
              />
            </div>
          </div>

          {templated && paramDefs.length > 0 && (
            <div className="sim-controls">
              <div className="sim-controls__title">Parameters</div>
              {paramDefs.map((def) => {
                const raw = sliderParams[def.key] ?? def.defaultValue
                const setValue = (next: number) =>
                  setSliderParams((prev) => ({ ...prev, [def.key]: next }))

                if (def.options?.length) {
                  const selected =
                    def.options.reduce((best, opt) =>
                      Math.abs(opt.value - raw) < Math.abs(best.value - raw) ? opt : best
                    ).value
                  const useSelect = def.options.length > 5
                  return (
                    <div key={def.key} className="sim-param sim-param--choice">
                      <span className="sim-param__label">{def.label}</span>
                      {useSelect ? (
                        <select
                          className="sim-choice-select"
                          value={selected}
                          onChange={(e) => setValue(Number(e.target.value))}
                        >
                          {def.options.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <div className="sim-choice" role="group" aria-label={def.label}>
                          {def.options.map((opt) => (
                            <button
                              key={opt.value}
                              type="button"
                              className="sim-choice__btn"
                              aria-pressed={opt.value === selected}
                              onClick={() => setValue(opt.value)}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                }

                return (
                  <label
                    key={def.key}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '110px 1fr 64px',
                      alignItems: 'center',
                      gap: '0.5rem',
                      fontSize: '0.75rem',
                      color: 'var(--color-text-muted)',
                    }}
                  >
                    <span>
                      {def.label}
                      {def.unit ? ` (${def.unit})` : ''}
                    </span>
                    <input
                      type="range"
                      min={def.min}
                      max={def.max}
                      step={def.step}
                      value={raw}
                      onChange={(e) => setValue(Number(e.target.value))}
                    />
                    <span style={{ fontFamily: 'var(--font-mono)', textAlign: 'right' }}>
                      {raw.toFixed(def.step < 1 ? 2 : 0)}
                    </span>
                  </label>
                )
              })}
            </div>
          )}
        </div>
      ) : (
        <div
          style={{
            padding: '0.65rem 1.25rem',
            background: 'var(--color-primary-subtle)',
            borderBottom: '1px solid rgba(37, 99, 235, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.78rem',
            color: 'var(--color-primary)',
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span>📖</span>
            <strong>Animation hidden</strong>
          </span>
          {onToggleAnimation && (
            <button
              type="button"
              onClick={onToggleAnimation}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--color-primary)',
                fontWeight: 600,
                cursor: 'pointer',
                textDecoration: 'underline',
                fontSize: '0.78rem',
              }}
            >
              Show Animation 🎬
            </button>
          )}
        </div>
      )}
    </div>
  )
}
