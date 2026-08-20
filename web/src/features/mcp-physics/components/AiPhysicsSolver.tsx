// web/src/features/mcp-physics/components/AiPhysicsSolver.tsx

import React, { useState } from 'react'
import { mcpPhysicsClient, type AiSolverResult } from '../api.js'
import { PhysicsTrajectoryCanvas } from './PhysicsTrajectoryCanvas.js'

const SAMPLE_PROMPTS = [
  'How far does a 90 mph baseball fastball actually travel with realistic air resistance and 1800 rpm backspin?',
  'Pro golfer hits a drive at 70 m/s at 12° launch angle. Compare Denver altitude (1600m) vs sea level.',
  'Soccer penalty kick: 28 m/s with 600 rpm spin against a 5 m/s headwind. Will it clear the wall?',
  'Calculate the aerodynamic drag on a skydiver in belly-to-earth position and determine terminal velocity.',
]

export const AiPhysicsSolver: React.FC = () => {
  const [prompt, setPrompt] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<AiSolverResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleSolve = async (customPrompt?: string) => {
    const textToSolve = (customPrompt || prompt).trim()
    if (!textToSolve) return

    setIsLoading(true)
    setError(null)

    try {
      const res = await mcpPhysicsClient.solveWithAi(textToSolve)
      setResult(res)
    } catch (err: any) {
      console.error('[AiPhysicsSolver] Error:', err)
      setError(err.message || 'Failed to solve physics problem.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Input Card */}
      <div
        style={{
          background: 'var(--color-surface)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--color-border)',
          padding: '1.25rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <div>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--color-text)', margin: '0 0 0.3rem 0' }}>
            🤖 AI Physics MCP Solver
          </h3>
          <p style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', margin: 0 }}>
            Enter any physical question or scenario in plain English. The AI executes the exact mathematical tools from IBM/Chuk-MCP-Physics and generates computed trajectories.
          </p>
        </div>

        {/* Text Input */}
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Ask a real-world physics question (e.g., 'If I throw a ball at 35 m/s at 40° with 1500 rpm backspin...')"
            rows={2}
            style={{
              flex: 1,
              padding: '0.6rem 0.8rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border)',
              background: 'var(--color-surface-2)',
              color: 'var(--color-text)',
              fontSize: '0.85rem',
              resize: 'none',
              outline: 'none',
            }}
          />
          <button
            type="button"
            className="action-btn"
            onClick={() => handleSolve()}
            disabled={isLoading || !prompt.trim()}
            style={{
              padding: '0 1.25rem',
              fontSize: '0.85rem',
              whiteSpace: 'nowrap',
            }}
          >
            {isLoading ? 'Computing...' : 'Solve with MCP ⚡'}
          </button>
        </div>

        {/* Quick Sample Prompts */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', alignItems: 'center' }}>
          <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>Try sample:</span>
          {SAMPLE_PROMPTS.map((p, idx) => (
            <button
              key={idx}
              type="button"
              className="action-btn-secondary"
              onClick={() => {
                setPrompt(p)
                handleSolve(p)
              }}
              style={{
                fontSize: '0.72rem',
                padding: '0.2rem 0.5rem',
                borderRadius: 'var(--radius-full)',
              }}
            >
              {p.substring(0, 48)}...
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div style={{ padding: '0.75rem', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--color-danger)', borderRadius: 'var(--radius-md)', fontSize: '0.85rem' }}>
          ⚠️ {error}
        </div>
      )}

      {/* Results View */}
      {result && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
          {/* Left: AI Physical Explanation & Step-by-Step Proof */}
          <div
            style={{
              background: 'var(--color-surface)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--color-border)',
              padding: '1.25rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
            }}
          >
            <div>
              <span
                style={{
                  fontSize: '0.7rem',
                  color: 'var(--color-primary)',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                }}
              >
                MCP Calculation: {result.calculationTool}
              </span>
              <h4 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-text)', marginTop: '0.2rem' }}>
                Mathematical Proof & Analysis
              </h4>
            </div>

            <p style={{ fontSize: '0.85rem', lineHeight: '1.55', color: 'var(--color-text)', margin: 0 }}>
              {result.explanation}
            </p>

            {result.stepByStepProof && result.stepByStepProof.length > 0 && (
              <div
                style={{
                  padding: '0.85rem',
                  background: 'var(--color-surface-2)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--color-border)',
                }}
              >
                <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--color-primary)', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
                  📝 Step-by-Step Derivation
                </div>
                <ol style={{ margin: 0, paddingLeft: '1.2rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  {result.stepByStepProof.map((step, i) => (
                    <li key={i} style={{ fontSize: '0.8rem', color: 'var(--color-text)', lineHeight: '1.45' }}>
                      {step}
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </div>

          {/* Right: Dynamic Computed Trajectory Plot */}
          <div>
            <PhysicsTrajectoryCanvas
              data={result.computedData}
              showIdeal={true}
              showVectors={true}
              label={`Computed Solution: ${result.computedData.metrics.range}m range (-${result.computedData.metrics.rangeDifferencePercent}% vs vacuum)`}
            />
          </div>
        </div>
      )}
    </div>
  )
}
