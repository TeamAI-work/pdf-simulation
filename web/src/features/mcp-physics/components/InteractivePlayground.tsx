// web/src/features/mcp-physics/components/InteractivePlayground.tsx

import React, { useState, useEffect } from 'react'
import {
  mcpPhysicsClient,
  type TrajectoryResult,
  type UnderwaterResult,
  type CollisionResult,
  type ProjectileParams,
} from '../api.js'
import { PhysicsTrajectoryCanvas } from './PhysicsTrajectoryCanvas.js'

type LabCategory = 'ballistics' | 'underwater' | 'collision'

const PRESET_SCENARIOS = [
  {
    id: 'baseball-90mph',
    title: '⚾ 90 mph Baseball Fastball',
    description: '145g baseball at 40.2 m/s with 1800 rpm backspin (Magnus lift) in sea-level air.',
    category: 'ballistics' as const,
    params: {
      velocity: 40.2,
      angleDeg: 32,
      mass: 0.145,
      radius: 0.037,
      dragCoefficient: 0.3,
      spinRpm: 1800,
      spinAxis: 'backspin' as const,
      altitudeMeters: 0,
      windVelocityX: 0,
    },
  },
  {
    id: 'golf-denver',
    title: '⛳ Pro Golf Drive in Denver (1600m)',
    description: '45g golf ball at 70 m/s with 2500 rpm backspin in thin mountain air vs sea level.',
    category: 'ballistics' as const,
    params: {
      velocity: 70,
      angleDeg: 12,
      mass: 0.045,
      radius: 0.021,
      dragCoefficient: 0.25,
      spinRpm: 2500,
      spinAxis: 'backspin' as const,
      altitudeMeters: 1600,
      windVelocityX: 0,
    },
  },
  {
    id: 'soccer-curler',
    title: '⚽ Soccer Free-Kick with Headwind',
    description: '430g soccer ball at 28 m/s with 600 rpm spin against a -5 m/s headwind.',
    category: 'ballistics' as const,
    params: {
      velocity: 28,
      angleDeg: 26,
      mass: 0.43,
      radius: 0.11,
      dragCoefficient: 0.25,
      spinRpm: 600,
      spinAxis: 'backspin' as const,
      altitudeMeters: 0,
      windVelocityX: -5,
    },
  },
]

export const InteractivePlayground: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<LabCategory>('ballistics')

  // Ballistics State
  const [ballisticsParams, setBallisticsParams] = useState<ProjectileParams>(PRESET_SCENARIOS[0].params)
  const [ballisticsResult, setBallisticsResult] = useState<TrajectoryResult | null>(null)
  const [isComputingBallistics, setIsComputingBallistics] = useState(false)

  // Underwater State
  const [underwaterParams, setUnderwaterParams] = useState({
    massKg: 100,
    volumeM3: 0.08,
    dragCoefficient: 0.04,
    crossSectionAreaM2: 0.03,
    initialVelocity: 20,
    fluidDensity: 1025,
    durationSec: 8,
  })
  const [underwaterResult, setUnderwaterResult] = useState<UnderwaterResult | null>(null)

  // Collision State
  const [collisionParams, setCollisionParams] = useState({
    v1: 12,
    m1: 2.0,
    v2: 0,
    m2: 1.0,
    restitution: 1.0,
  })
  const [collisionResult, setCollisionResult] = useState<CollisionResult | null>(null)

  // Calculate ballistics whenever params change
  useEffect(() => {
    let isMounted = true
    const run = async () => {
      setIsComputingBallistics(true)
      try {
        const res = await mcpPhysicsClient.calculateProjectile(ballisticsParams)
        if (isMounted) setBallisticsResult(res)
      } catch (err) {
        console.error('[Playground] Ballistics error:', err)
      } finally {
        if (isMounted) setIsComputingBallistics(false)
      }
    }
    run()
    return () => {
      isMounted = false
    }
  }, [ballisticsParams])

  // Calculate underwater when category active
  useEffect(() => {
    if (activeCategory !== 'underwater') return
    let isMounted = true
    const run = async () => {
      try {
        const res = await mcpPhysicsClient.simulateUnderwater(underwaterParams)
        if (isMounted) setUnderwaterResult(res)
      } catch (err) {
        console.error('[Playground] Underwater error:', err)
      }
    }
    run()
    return () => {
      isMounted = false
    }
  }, [activeCategory, underwaterParams])

  // Calculate collision when category active
  useEffect(() => {
    if (activeCategory !== 'collision') return
    let isMounted = true
    const run = async () => {
      try {
        const res = await mcpPhysicsClient.calculateCollision({
          bodyA: {
            id: 'body-1',
            mass: collisionParams.m1,
            radius: 0.5,
            position: [0, 0],
            velocity: [collisionParams.v1, 0],
          },
          bodyB: {
            id: 'body-2',
            mass: collisionParams.m2,
            radius: 0.5,
            position: [6, 0],
            velocity: [collisionParams.v2, 0],
          },
          restitution: collisionParams.restitution,
        })
        if (isMounted) setCollisionResult(res)
      } catch (err) {
        console.error('[Playground] Collision error:', err)
      }
    }
    run()
    return () => {
      isMounted = false
    }
  }, [activeCategory, collisionParams])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Category Tabs */}
      <div
        style={{
          display: 'flex',
          gap: '0.5rem',
          padding: '0.4rem',
          background: 'var(--color-surface-2)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--color-border)',
          width: 'fit-content',
        }}
      >
        <button
          type="button"
          className="action-btn"
          onClick={() => setActiveCategory('ballistics')}
          style={{
            background: activeCategory === 'ballistics' ? 'var(--color-primary)' : 'transparent',
            color: activeCategory === 'ballistics' ? '#ffffff' : 'var(--color-text)',
            border: 'none',
            fontSize: '0.82rem',
            padding: '0.45rem 0.9rem',
          }}
        >
          🌀 Ballistics, Drag & Spin (Magnus)
        </button>
        <button
          type="button"
          className="action-btn"
          onClick={() => setActiveCategory('underwater')}
          style={{
            background: activeCategory === 'underwater' ? 'var(--color-primary)' : 'transparent',
            color: activeCategory === 'underwater' ? '#ffffff' : 'var(--color-text)',
            border: 'none',
            fontSize: '0.82rem',
            padding: '0.45rem 0.9rem',
          }}
        >
          🌊 Fluid Dynamics & Buoyancy
        </button>
        <button
          type="button"
          className="action-btn"
          onClick={() => setActiveCategory('collision')}
          style={{
            background: activeCategory === 'collision' ? 'var(--color-primary)' : 'transparent',
            color: activeCategory === 'collision' ? '#ffffff' : 'var(--color-text)',
            border: 'none',
            fontSize: '0.82rem',
            padding: '0.45rem 0.9rem',
          }}
        >
          💥 2D Rigid-Body Collisions
        </button>
      </div>

      {/* Category 1: Real-World Ballistics */}
      {activeCategory === 'ballistics' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 380px) 1fr', gap: '1.25rem' }}>
          {/* Controls Column */}
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
              <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--color-text)', margin: '0 0 0.5rem 0' }}>
                Preset Scenarios
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                {PRESET_SCENARIOS.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setBallisticsParams(s.params)}
                    className="action-btn-secondary"
                    style={{
                      textAlign: 'left',
                      padding: '0.5rem 0.75rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.2rem',
                      fontSize: '0.8rem',
                    }}
                  >
                    <strong style={{ color: 'var(--color-primary)' }}>{s.title}</strong>
                    <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>{s.description}</span>
                  </button>
                ))}
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '0.8rem' }}>
              <h4 style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text)', margin: '0 0 0.8rem 0' }}>
                Physical Parameters
              </h4>

              {/* Velocity */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', marginBottom: '0.6rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem' }}>
                  <span>Launch Velocity:</span>
                  <strong>{ballisticsParams.velocity} m/s ({Math.round(ballisticsParams.velocity * 2.237)} mph)</strong>
                </div>
                <input
                  type="range"
                  min="5"
                  max="120"
                  step="1"
                  value={ballisticsParams.velocity}
                  onChange={(e) => setBallisticsParams({ ...ballisticsParams, velocity: Number(e.target.value) })}
                />
              </div>

              {/* Angle */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', marginBottom: '0.6rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem' }}>
                  <span>Launch Angle:</span>
                  <strong>{ballisticsParams.angleDeg}°</strong>
                </div>
                <input
                  type="range"
                  min="1"
                  max="85"
                  step="1"
                  value={ballisticsParams.angleDeg}
                  onChange={(e) => setBallisticsParams({ ...ballisticsParams, angleDeg: Number(e.target.value) })}
                />
              </div>

              {/* Drag Coefficient */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', marginBottom: '0.6rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem' }}>
                  <span>Drag Coeff (Cd):</span>
                  <strong>{ballisticsParams.dragCoefficient}</strong>
                </div>
                <input
                  type="range"
                  min="0.0"
                  max="1.0"
                  step="0.05"
                  value={ballisticsParams.dragCoefficient ?? 0.3}
                  onChange={(e) => setBallisticsParams({ ...ballisticsParams, dragCoefficient: Number(e.target.value) })}
                />
              </div>

              {/* Spin RPM */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', marginBottom: '0.6rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem' }}>
                  <span>Spin (Magnus Lift):</span>
                  <strong>{ballisticsParams.spinRpm} RPM</strong>
                </div>
                <input
                  type="range"
                  min="0"
                  max="4000"
                  step="100"
                  value={ballisticsParams.spinRpm ?? 0}
                  onChange={(e) => setBallisticsParams({ ...ballisticsParams, spinRpm: Number(e.target.value) })}
                />
              </div>

              {/* Altitude */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', marginBottom: '0.6rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem' }}>
                  <span>Altitude:</span>
                  <strong>{ballisticsParams.altitudeMeters} m ({ballisticsParams.altitudeMeters === 1600 ? 'Denver' : ballisticsParams.altitudeMeters === 0 ? 'Sea Level' : `${ballisticsParams.altitudeMeters}m`})</strong>
                </div>
                <input
                  type="range"
                  min="0"
                  max="4000"
                  step="200"
                  value={ballisticsParams.altitudeMeters ?? 0}
                  onChange={(e) => setBallisticsParams({ ...ballisticsParams, altitudeMeters: Number(e.target.value) })}
                />
              </div>

              {/* Wind */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem' }}>
                  <span>Headwind / Tailwind:</span>
                  <strong>{ballisticsParams.windVelocityX} m/s</strong>
                </div>
                <input
                  type="range"
                  min="-15"
                  max="15"
                  step="1"
                  value={ballisticsParams.windVelocityX ?? 0}
                  onChange={(e) => setBallisticsParams({ ...ballisticsParams, windVelocityX: Number(e.target.value) })}
                />
              </div>
            </div>
          </div>

          {/* Visualizer Column */}
          <div>
            <PhysicsTrajectoryCanvas
              data={ballisticsResult}
              showIdeal={true}
              showVectors={true}
              label={
                isComputingBallistics
                  ? 'Calculating trajectory with aerodynamic drag...'
                  : `${ballisticsParams.velocity} m/s at ${ballisticsParams.angleDeg}° with Cd=${ballisticsParams.dragCoefficient}, ${ballisticsParams.spinRpm} RPM Spin`
              }
            />
          </div>
        </div>
      )}

      {/* Category 2: Underwater Fluid Dynamics */}
      {activeCategory === 'underwater' && underwaterResult && (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 380px) 1fr', gap: '1.25rem' }}>
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
            <h4 style={{ fontSize: '0.95rem', fontWeight: 600, margin: 0 }}>Underwater Torpedo & Buoyancy</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem' }}>
                <span>Mass:</span>
                <strong>{underwaterParams.massKg} kg</strong>
              </div>
              <input
                type="range"
                min="10"
                max="500"
                value={underwaterParams.massKg}
                onChange={(e) => setUnderwaterParams({ ...underwaterParams, massKg: Number(e.target.value) })}
              />

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem' }}>
                <span>Displaced Volume:</span>
                <strong>{underwaterParams.volumeM3} m³</strong>
              </div>
              <input
                type="range"
                min="0.01"
                max="0.5"
                step="0.01"
                value={underwaterParams.volumeM3}
                onChange={(e) => setUnderwaterParams({ ...underwaterParams, volumeM3: Number(e.target.value) })}
              />

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem' }}>
                <span>Initial Launch Speed:</span>
                <strong>{underwaterParams.initialVelocity} m/s</strong>
              </div>
              <input
                type="range"
                min="5"
                max="50"
                value={underwaterParams.initialVelocity}
                onChange={(e) => setUnderwaterParams({ ...underwaterParams, initialVelocity: Number(e.target.value) })}
              />
            </div>
          </div>

          {/* Results Summary */}
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '1.2rem' }}>{underwaterResult.willFloat ? '🟢' : '⚓'}</span>
              <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>
                {underwaterResult.willFloat ? 'Object Will Float (Buoyancy > Weight)' : 'Object Will Sink (Weight > Buoyancy)'}
              </h4>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.8rem' }}>
              <div style={{ padding: '0.75rem', background: 'var(--color-surface-2)', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--color-text-subtle)' }}>Buoyant Force</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-primary)' }}>{underwaterResult.buoyantForceN} N</div>
              </div>
              <div style={{ padding: '0.75rem', background: 'var(--color-surface-2)', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--color-text-subtle)' }}>Gravity Weight</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-text)' }}>{underwaterResult.weightN} N</div>
              </div>
              <div style={{ padding: '0.75rem', background: 'var(--color-surface-2)', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--color-text-subtle)' }}>Terminal Velocity</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-accent)' }}>{underwaterResult.terminalVelocityMs} m/s</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Category 3: 2D Rigid Body Collisions */}
      {activeCategory === 'collision' && collisionResult && (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 380px) 1fr', gap: '1.25rem' }}>
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
            <h4 style={{ fontSize: '0.95rem', fontWeight: 600, margin: 0 }}>Collision Parameters</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem' }}>
                <span>Body A Velocity:</span>
                <strong>{collisionParams.v1} m/s</strong>
              </div>
              <input
                type="range"
                min="0"
                max="30"
                value={collisionParams.v1}
                onChange={(e) => setCollisionParams({ ...collisionParams, v1: Number(e.target.value) })}
              />

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem' }}>
                <span>Body A Mass:</span>
                <strong>{collisionParams.m1} kg</strong>
              </div>
              <input
                type="range"
                min="0.5"
                max="10"
                step="0.5"
                value={collisionParams.m1}
                onChange={(e) => setCollisionParams({ ...collisionParams, m1: Number(e.target.value) })}
              />

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem' }}>
                <span>Body B Mass:</span>
                <strong>{collisionParams.m2} kg</strong>
              </div>
              <input
                type="range"
                min="0.5"
                max="10"
                step="0.5"
                value={collisionParams.m2}
                onChange={(e) => setCollisionParams({ ...collisionParams, m2: Number(e.target.value) })}
              />

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem' }}>
                <span>Restitution (Elasticity):</span>
                <strong>{collisionParams.restitution === 1 ? '1.0 (Elastic)' : collisionParams.restitution === 0 ? '0.0 (Inelastic)' : collisionParams.restitution}</strong>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={collisionParams.restitution}
                onChange={(e) => setCollisionParams({ ...collisionParams, restitution: Number(e.target.value) })}
              />
            </div>
          </div>

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
            <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>Post-Collision Momentum & Energy Transfer</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.8rem' }}>
              <div style={{ padding: '0.75rem', background: 'var(--color-surface-2)', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--color-text-subtle)' }}>Body A Final Velocity</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-primary)' }}>{collisionResult.finalVelocityA[0]} m/s</div>
              </div>
              <div style={{ padding: '0.75rem', background: 'var(--color-surface-2)', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--color-text-subtle)' }}>Body B Final Velocity</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-primary)' }}>{collisionResult.finalVelocityB[0]} m/s</div>
              </div>
            </div>

            <div style={{ padding: '0.85rem', background: 'var(--color-surface-2)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '0.3rem' }}>
                <span>Initial Kinetic Energy:</span>
                <strong>{collisionResult.kineticEnergyBeforeJ} J</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '0.3rem' }}>
                <span>Final Kinetic Energy:</span>
                <strong>{collisionResult.kineticEnergyAfterJ} J</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: 'var(--color-danger)' }}>
                <span>Energy Loss to Inelasticity:</span>
                <strong>{collisionResult.energyLossJ} J</strong>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
