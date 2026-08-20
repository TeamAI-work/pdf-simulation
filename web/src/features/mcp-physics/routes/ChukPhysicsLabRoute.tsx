// web/src/features/mcp-physics/routes/ChukPhysicsLabRoute.tsx

import React, { useState } from 'react'
import { InteractivePlayground } from '../components/InteractivePlayground.js'
import { AiPhysicsSolver } from '../components/AiPhysicsSolver.js'

export interface ChukPhysicsLabRouteProps {
  onBack?: () => void
}

export const ChukPhysicsLabRoute: React.FC<ChukPhysicsLabRouteProps> = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState<'playground' | 'aiSolver'>('playground')

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: 'calc(100vh - 57px)',
        backgroundColor: 'var(--color-bg)',
        overflowY: 'auto',
        padding: '1.5rem',
      }}
    >
      <div style={{ maxWidth: '1200px', width: '100%', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {/* Lab Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingBottom: '1rem',
            borderBottom: '1px solid var(--color-border)',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <span style={{ fontSize: '1.5rem' }}>🧪</span>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--color-text)', margin: 0 }}>
                Physics MCP Lab <span style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--color-primary)', background: 'var(--color-primary-subtle)', padding: '0.2rem 0.5rem', borderRadius: 'var(--radius-full)' }}>IBM / chuk-mcp-physics Engine</span>
              </h2>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', margin: '0.25rem 0 0 0' }}>
              Testbed for real-world ballistics (aerodynamic drag, spin, Magnus effect), fluid dynamics, rigid-body collisions, and natural language physics solver.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            {onBack && (
              <button
                type="button"
                className="action-btn-secondary"
                onClick={onBack}
                style={{ padding: '0.45rem 0.85rem', fontSize: '0.8rem' }}
              >
                ← Back to Reader
              </button>
            )}
          </div>
        </div>

        {/* Navigation Switcher */}
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            type="button"
            className="action-btn"
            onClick={() => setActiveTab('playground')}
            style={{
              background: activeTab === 'playground' ? 'var(--color-primary)' : 'var(--color-surface)',
              color: activeTab === 'playground' ? '#ffffff' : 'var(--color-text)',
              border: '1px solid var(--color-border)',
              fontSize: '0.85rem',
              padding: '0.5rem 1rem',
            }}
          >
            🎮 Interactive Physics Tools & Playground
          </button>

          <button
            type="button"
            className="action-btn"
            onClick={() => setActiveTab('aiSolver')}
            style={{
              background: activeTab === 'aiSolver' ? 'var(--color-primary)' : 'var(--color-surface)',
              color: activeTab === 'aiSolver' ? '#ffffff' : 'var(--color-text)',
              border: '1px solid var(--color-border)',
              fontSize: '0.85rem',
              padding: '0.5rem 1rem',
            }}
          >
            ✨ AI Natural Language Problem Solver
          </button>
        </div>

        {/* Tab Views */}
        {activeTab === 'playground' ? <InteractivePlayground /> : <AiPhysicsSolver />}
      </div>
    </div>
  )
}
