// web/src/features/mcp-physics/components/PhysicsTrajectoryCanvas.tsx

import React, { useRef, useEffect, useState } from 'react'
import type { TrajectoryResult } from '../api.js'

export interface PhysicsTrajectoryCanvasProps {
  data: TrajectoryResult | null
  showIdeal?: boolean
  showVectors?: boolean
  playbackSpeed?: number
  label?: string
}

export const PhysicsTrajectoryCanvas: React.FC<PhysicsTrajectoryCanvasProps> = ({
  data,
  showIdeal = true,
  showVectors = true,
  playbackSpeed = 1.0,
  label,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isPlaying, setIsPlaying] = useState(true)
  const [currentFrameIdx, setCurrentFrameIdx] = useState(0)

  // Animation Loop
  useEffect(() => {
    if (!data || data.frames.length === 0 || !isPlaying) return

    let animationFrameId: number
    let lastTime = performance.now()

    const loop = (now: number) => {
      const delta = (now - lastTime) / 1000
      lastTime = now

      // Advance frames based on dt and playback speed
      const frameAdvance = (delta / (data.dt || 0.016)) * playbackSpeed
      setCurrentFrameIdx((prev) => {
        const next = prev + frameAdvance
        if (next >= data.frames.length) {
          return 0 // loop
        }
        return next
      })

      animationFrameId = requestAnimationFrame(loop)
    }

    animationFrameId = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(animationFrameId)
  }, [data, isPlaying, playbackSpeed])

  // Canvas Drawing
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !data || data.frames.length === 0) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const width = canvas.width
    const height = canvas.height

    // Determine spatial bounding box with padding
    const maxX = Math.max(data.metrics.range, data.metrics.idealRange || data.metrics.range, 10) * 1.15
    const maxY = Math.max(data.metrics.maxHeight, 5) * 1.35

    const padding = 50
    const plotWidth = width - padding * 2
    const plotHeight = height - padding * 2

    const scaleX = plotWidth / maxX
    const scaleY = plotHeight / maxY

    const toCanvasX = (x: number) => padding + x * scaleX
    const toCanvasY = (y: number) => height - padding - y * scaleY

    // Clear Canvas
    ctx.clearRect(0, 0, width, height)

    // Draw Grid & Axes
    ctx.strokeStyle = '#e2e8f0'
    ctx.lineWidth = 1
    ctx.font = '10px JetBrains Mono, monospace'
    ctx.fillStyle = '#94a3b8'

    const xGridStep = Math.max(10, Math.pow(10, Math.floor(Math.log10(maxX / 4))))
    const yGridStep = Math.max(5, Math.pow(10, Math.floor(Math.log10(maxY / 4))))

    // Vertical grid lines
    for (let x = 0; x <= maxX; x += xGridStep) {
      const cx = toCanvasX(x)
      ctx.beginPath()
      ctx.moveTo(cx, padding)
      ctx.lineTo(cx, height - padding)
      ctx.stroke()
      ctx.fillText(`${x}m`, cx - 8, height - padding + 16)
    }

    // Horizontal grid lines
    for (let y = 0; y <= maxY; y += yGridStep) {
      const cy = toCanvasY(y)
      ctx.beginPath()
      ctx.moveTo(padding, cy)
      ctx.lineTo(width - padding, cy)
      ctx.stroke()
      ctx.fillText(`${y}m`, padding - 32, cy + 3)
    }

    // Ground Plane
    ctx.fillStyle = '#0f172a'
    ctx.fillRect(padding, height - padding, plotWidth, 2)

    // 1. Draw Ideal Parabolic Trajectory (Vacuum without Drag)
    if (showIdeal && data.metrics.idealRange) {
      const v0 = data.metrics.initialVelocity
      const thetaRad = (data.metrics.launchAngleDeg * Math.PI) / 180
      const g = 9.81

      ctx.beginPath()
      ctx.setLineDash([4, 4])
      ctx.strokeStyle = '#94a3b8'
      ctx.lineWidth = 1.5

      let first = true
      for (let ix = 0; ix <= data.metrics.idealRange; ix += maxX / 100) {
        const iy = ix * Math.tan(thetaRad) - (g * ix * ix) / (2 * v0 * v0 * Math.cos(thetaRad) ** 2)
        if (iy < 0 && !first) break
        const cx = toCanvasX(ix)
        const cy = toCanvasY(Math.max(0, iy))
        if (first) {
          ctx.moveTo(cx, cy)
          first = false
        } else {
          ctx.lineTo(cx, cy)
        }
      }
      ctx.stroke()
      ctx.setLineDash([])
    }

    // 2. Draw Realistic Trajectory Trail (Solid Line)
    ctx.beginPath()
    ctx.strokeStyle = '#2563eb'
    ctx.lineWidth = 2.5
    data.frames.forEach((f, i) => {
      const cx = toCanvasX(f.position[0])
      const cy = toCanvasY(f.position[1])
      if (i === 0) ctx.moveTo(cx, cy)
      else ctx.lineTo(cx, cy)
    })
    ctx.stroke()

    // 3. Draw Active Projectile & Vector Arrows at current frame
    const activeIdx = Math.min(Math.floor(currentFrameIdx), data.frames.length - 1)
    const frame = data.frames[activeIdx]
    if (frame) {
      const px = toCanvasX(frame.position[0])
      const py = toCanvasY(frame.position[1])

      // Velocity Vector Arrow
      if (showVectors && frame.speed > 0) {
        const vectorScale = 0.8
        const vxCanvas = frame.velocity[0] * vectorScale
        const vyCanvas = -frame.velocity[1] * vectorScale // Invert Y for canvas

        ctx.strokeStyle = '#dc2626'
        ctx.fillStyle = '#dc2626'
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.moveTo(px, py)
        ctx.lineTo(px + vxCanvas, py + vyCanvas)
        ctx.stroke()

        // Arrowhead
        const angle = Math.atan2(vyCanvas, vxCanvas)
        ctx.beginPath()
        ctx.moveTo(px + vxCanvas, py + vyCanvas)
        ctx.lineTo(
          px + vxCanvas - 8 * Math.cos(angle - Math.PI / 6),
          py + vyCanvas - 8 * Math.sin(angle - Math.PI / 6)
        )
        ctx.lineTo(
          px + vxCanvas - 8 * Math.cos(angle + Math.PI / 6),
          py + vyCanvas - 8 * Math.sin(angle + Math.PI / 6)
        )
        ctx.closePath()
        ctx.fill()
      }

      // Ball / Projectile Body
      ctx.beginPath()
      ctx.arc(px, py, 7, 0, Math.PI * 2)
      ctx.fillStyle = '#2563eb'
      ctx.fill()
      ctx.strokeStyle = '#ffffff'
      ctx.lineWidth = 2
      ctx.stroke()

      // Current Telemetry Tag
      ctx.fillStyle = '#0f172a'
      ctx.font = 'bold 11px JetBrains Mono, monospace'
      ctx.fillText(`t=${frame.t}s | v=${frame.speed} m/s`, px + 12, py - 12)
    }

    // Legend
    ctx.font = '11px Inter, sans-serif'
    // Realistic Trail Legend
    ctx.fillStyle = '#2563eb'
    ctx.fillRect(width - 240, 20, 12, 12)
    ctx.fillStyle = '#0f172a'
    ctx.fillText(`Realistic (Drag + Spin): ${data.metrics.range}m`, width - 220, 30)

    // Ideal Vacuum Legend
    if (showIdeal && data.metrics.idealRange) {
      ctx.strokeStyle = '#94a3b8'
      ctx.lineWidth = 2
      ctx.setLineDash([3, 3])
      ctx.beginPath()
      ctx.moveTo(width - 240, 48)
      ctx.lineTo(width - 228, 48)
      ctx.stroke()
      ctx.setLineDash([])
      ctx.fillStyle = '#64748b'
      ctx.fillText(`Ideal (Vacuum): ${data.metrics.idealRange}m (-${data.metrics.rangeDifferencePercent}%)`, width - 220, 52)
    }
  }, [data, currentFrameIdx, showIdeal, showVectors])

  if (!data) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '320px',
          background: 'var(--color-surface)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--color-border)',
          color: 'var(--color-text-muted)',
        }}
      >
        No trajectory data loaded. Select or calculate a scenario above.
      </div>
    )
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '0.6rem',
        background: 'var(--color-surface)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--color-border)',
        padding: '1rem',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      {/* Header with Title & Playback Controls */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <span style={{ fontSize: '1rem' }}>📈</span>
          <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-text)' }}>
            {label || 'Real-World Ballistics Trajectory'}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button
            type="button"
            className="action-btn-secondary"
            onClick={() => setIsPlaying((p) => !p)}
            style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem' }}
          >
            {isPlaying ? '⏸ Pause' : '▶ Play'}
          </button>
          <button
            type="button"
            className="action-btn-secondary"
            onClick={() => setCurrentFrameIdx(0)}
            style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
            title="Reset"
          >
            ⏮
          </button>
        </div>
      </div>

      {/* Canvas */}
      <div style={{ position: 'relative', width: '100%', overflow: 'hidden', borderRadius: 'var(--radius-md)', background: '#fafbfc' }}>
        <canvas
          ref={canvasRef}
          width={720}
          height={320}
          style={{ width: '100%', height: 'auto', display: 'block' }}
        />
      </div>

      {/* Metrics Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.5rem', marginTop: '0.2rem' }}>
        <div style={{ padding: '0.5rem 0.75rem', background: 'var(--color-surface-2)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--color-text-subtle)', textTransform: 'uppercase' }}>Actual Range</div>
          <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-primary)' }}>{data.metrics.range} m</div>
        </div>
        <div style={{ padding: '0.5rem 0.75rem', background: 'var(--color-surface-2)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--color-text-subtle)', textTransform: 'uppercase' }}>Peak Altitude</div>
          <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-text)' }}>{data.metrics.maxHeight} m</div>
        </div>
        <div style={{ padding: '0.5rem 0.75rem', background: 'var(--color-surface-2)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--color-text-subtle)', textTransform: 'uppercase' }}>Flight Time</div>
          <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-text)' }}>{data.metrics.flightTime} s</div>
        </div>
        {data.metrics.energyLostToDrag !== undefined && (
          <div style={{ padding: '0.5rem 0.75rem', background: 'var(--color-surface-2)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--color-text-subtle)', textTransform: 'uppercase' }}>Energy Lost (Drag)</div>
            <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-danger)' }}>{data.metrics.energyLostToDrag} J</div>
          </div>
        )}
      </div>
    </div>
  )
}
