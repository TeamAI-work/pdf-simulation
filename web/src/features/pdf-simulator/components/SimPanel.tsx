// web/src/features/pdf-simulator/components/SimPanel.tsx

import React, { useState } from 'react'
import type { SimSpec } from '@pdf-sim/shared'
import { SimStage } from '../sim/SimStage.js'

export interface SimPanelProps {
  spec: SimSpec | null
  onClose?: () => void
  onRegenerateWithAi?: () => Promise<void>
  isAnimationVisible?: boolean
  onToggleAnimation?: () => void
}

export const SimPanel: React.FC<SimPanelProps> = ({
  spec,
  onClose,
  onRegenerateWithAi,
  isAnimationVisible = true,
  onToggleAnimation,
}) => {
  const [isRegenerating, setIsRegenerating] = useState(false)

  const handleRegenerate = async () => {
    if (!onRegenerateWithAi) return
    try {
      setIsRegenerating(true)
      await onRegenerateWithAi()
    } finally {
      setIsRegenerating(false)
    }
  }

  if (!spec || !spec.stage) {
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

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
        width: '100%',
      }}
    >
      {/* Simulation Header */}
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

          {onRegenerateWithAi && (
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

      {/* Main SVG Simulation Canvas (auto-playing) — Collapsible for text focus */}
      {isAnimationVisible ? (
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            padding: '1rem',
            backgroundColor: 'var(--color-bg)',
            minHeight: '260px',
            maxHeight: '340px',
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
            }}
          >
            <SimStage
              stage={spec.stage}
              autoPlay={true}
              initialSpeed={1}
              showControls={true}
            />
          </div>
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
