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

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
        width: '100%',
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
              title={isAnimationVisible ? 'Hide simulation animation to focus on explanation' : 'Show simulation animation'}
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

      {isAnimationVisible ? (
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            padding: '1rem',
            backgroundColor: 'var(--color-bg)',
            minHeight: '260px',
            maxHeight: templated ? '420px' : '340px',
          }}
        >
          <div
            style={{
              flex: 1,
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-lg)',
              overflow: 'hidden',
              boxShadow: 'var(--shadow-sm)',
              display: 'flex',
              flexDirection: 'column',
              position: 'relative',
              minHeight: '220px',
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

          {templated && paramDefs.length > 0 && (
            <div
              style={{
                marginTop: '0.65rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.35rem',
              }}
            >
              {bound?.warnings && bound.warnings.length > 0 && (
                <div style={{ fontSize: '0.75rem', color: 'var(--color-danger)' }}>
                  {bound.warnings.join(' · ')}
                </div>
              )}
              {bound?.metrics && (
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '0.45rem',
                    fontSize: '0.72rem',
                    fontFamily: 'var(--font-mono)',
                    color: 'var(--color-primary)',
                  }}
                >
                  {Object.entries(bound.metrics).map(([k, v]) => (
                    <span
                      key={k}
                      style={{
                        background: 'var(--color-primary-subtle)',
                        padding: '0.12rem 0.4rem',
                        borderRadius: 'var(--radius-sm)',
                      }}
                    >
                      {k}={typeof v === 'number' ? Number(v).toFixed(2) : String(v)}
                    </span>
                  ))}
                </div>
              )}
              {paramDefs.map((def) => (
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
                    value={sliderParams[def.key] ?? def.defaultValue}
                    onChange={(e) =>
                      setSliderParams((prev) => ({
                        ...prev,
                        [def.key]: Number(e.target.value),
                      }))
                    }
                  />
                  <span style={{ fontFamily: 'var(--font-mono)', textAlign: 'right' }}>
                    {(sliderParams[def.key] ?? def.defaultValue).toFixed(
                      def.step < 1 ? 2 : 0
                    )}
                  </span>
                </label>
              ))}
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
            <strong>Focus Mode Active:</strong> Animation hidden to maximize explanation & theory view
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
