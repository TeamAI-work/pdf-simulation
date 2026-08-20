// web/src/features/pdf-simulator/sim/SimStage.tsx

import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react'
import type { SimStage as SimStageType } from '@pdf-sim/shared'
import { createCompiledSpec, evalSpec, type ResolvedStage } from './evalSpec.js'
import { ElementRenderer } from './elements/index.js'
import type { Point } from './elements/ActivePath.js'

export interface SimStageProps {
  stage: SimStageType
  autoPlay?: boolean
  initialSpeed?: number
  className?: string
  showControls?: boolean
}

export const SimStage: React.FC<SimStageProps> = ({
  stage,
  autoPlay = true,
  initialSpeed = 1,
  className = '',
  showControls = true,
}) => {
  const [isPlaying, setIsPlaying] = useState(autoPlay)
  const speed = initialSpeed
  const [time, setTime] = useState(0)

  // Pre-compile expressions once when stage definition changes
  const compiledStage = useMemo(() => createCompiledSpec(stage), [stage])

  // Track trajectories and active path histories (KP-7)
  const historyMapRef = useRef<Map<string, Point[]>>(new Map())
  const lastTimeRef = useRef<number>(0)
  const animFrameRef = useRef<number | null>(null)
  const startTimeRef = useRef<number | null>(null)
  const timeOffsetRef = useRef<number>(0)

  // Reset history on stage change or explicit reset
  const resetSimulation = useCallback(() => {
    historyMapRef.current.clear()
    startTimeRef.current = null
    timeOffsetRef.current = 0
    setTime(0)
    lastTimeRef.current = 0
  }, [])

  useEffect(() => {
    resetSimulation()
  }, [stage, resetSimulation])

  // requestAnimationFrame loop
  useEffect(() => {
    if (!isPlaying) {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current)
      }
      startTimeRef.current = null
      return
    }

    const loop = (timestamp: number) => {
      if (startTimeRef.current === null) {
        startTimeRef.current = timestamp - (timeOffsetRef.current / speed) * 1000
      }

      const elapsed = ((timestamp - startTimeRef.current) / 1000) * speed
      timeOffsetRef.current = elapsed
      setTime(elapsed)

      animFrameRef.current = requestAnimationFrame(loop)
    }

    animFrameRef.current = requestAnimationFrame(loop)

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current)
      }
    }
  }, [isPlaying, speed])

  // Evaluate current frame
  const resolvedStage: ResolvedStage = useMemo(() => {
    const resolved = evalSpec(compiledStage, time)

    // Update history for projectile and active-path roles
    // If time wrapped or jumped backwards, clear history
    if (time < lastTimeRef.current - 0.5) {
      historyMapRef.current.clear()
    }
    lastTimeRef.current = time

    for (const elem of resolved.elements) {
      if (elem.role === 'projectile' || elem.type === 'active-path') {
        const x = Number(elem.props.cx ?? elem.props.x ?? 0)
        const y = Number(elem.props.cy ?? elem.props.y ?? 0)

        const points = historyMapRef.current.get(elem.id) || []
        points.push({ x, y })

        // Cap history at 100 points to prevent memory growth (KP-7)
        if (points.length > 100) {
          points.shift()
        }
        historyMapRef.current.set(elem.id, points)
      }
    }

    return resolved
  }, [compiledStage, time])

  // Find projectile history to pass to active-path elements if needed
  const primaryTrajectoryPoints = useMemo(() => {
    for (const [_id, points] of historyMapRef.current.entries()) {
      if (points.length > 0) return points
    }
    return []
  }, [resolvedStage])

  return (
    <div
      className={`relative w-full h-full flex flex-col items-center justify-center bg-slate-950 rounded-xl overflow-hidden border border-slate-800 select-none shadow-2xl ${className}`}
    >
      {/* Dynamic SVG Canvas */}
      <svg
        viewBox={resolvedStage.viewBox}
        className="w-full h-full max-h-[500px] object-contain"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          {/* Subtle grid pattern background */}
          <pattern
            id="sim-grid-pattern"
            width="25"
            height="25"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M 25 0 L 0 0 0 25"
              fill="none"
              stroke="#1e293b"
              strokeWidth="0.5"
              strokeDasharray="2 2"
            />
          </pattern>
        </defs>

        <rect
          x="-1000"
          y="-1000"
          width="3000"
          height="3000"
          fill="url(#sim-grid-pattern)"
          opacity={0.7}
        />

        {/* Render elements */}
        {resolvedStage.elements.map((elem) => {
          const history = historyMapRef.current.get(elem.id) || primaryTrajectoryPoints
          return (
            <ElementRenderer
              key={elem.id}
              element={elem}
              historyPoints={history}
            />
          )
        })}
      </svg>

      {/* Minimalist Floating Playback Controls */}
      {showControls && (
        <div
          style={{
            position: 'absolute',
            bottom: '0.75rem',
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.35rem 0.75rem',
            background: 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(8px)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-full)',
            boxShadow: 'var(--shadow-md)',
            fontSize: '0.78rem',
            color: 'var(--color-text)',
            zIndex: 10,
          }}
        >
          {/* Play / Pause Button */}
          <button
            type="button"
            onClick={() => setIsPlaying((p) => !p)}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0.2rem',
              color: 'var(--color-text)',
            }}
            title={isPlaying ? 'Pause Simulation' : 'Play Simulation'}
          >
            {isPlaying ? '⏸' : '▶'}
          </button>

          {/* Reset Button */}
          <button
            type="button"
            onClick={resetSimulation}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0.2rem',
              color: 'var(--color-text-muted)',
            }}
            title="Reset Simulation"
          >
            ↺
          </button>

          <div style={{ width: '1px', height: '14px', background: 'var(--color-border)' }} />

          {/* Elapsed Time */}
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.72rem',
              color: 'var(--color-primary)',
              fontWeight: 600,
              minWidth: '35px',
              textAlign: 'right',
            }}
          >
            {time.toFixed(1)}s
          </span>
        </div>
      )}
    </div>
  )
}
