// server/src/services/mcp-physics/__tests__/mcpPhysics.test.ts

import { describe, it, expect } from 'vitest'
import {
  calculateAirDensity,
  calculateProjectileMotion,
  simulateUnderwaterMotion,
  calculate2DCollision,
} from '../mcpPhysicsEngine.js'

describe('IBM/Chuk-MCP Physics Engine Tools', () => {
  it('calculates barometric air density correctly with altitude and temperature', () => {
    const seaLevel = calculateAirDensity(0, 15)
    expect(seaLevel).toBeCloseTo(1.225, 2)

    const denverAltitude = calculateAirDensity(1600, 15) // Denver ~1600m
    expect(denverAltitude).toBeLessThan(seaLevel)
    expect(denverAltitude).toBeGreaterThan(0.9)
  })

  it('calculates projectile motion with drag and Magnus effect', () => {
    // 90 mph fastball (~40.2 m/s) with backspin
    const result = calculateProjectileMotion({
      velocity: 40.2,
      angleDeg: 35,
      mass: 0.145,
      radius: 0.037,
      dragCoefficient: 0.3,
      spinRpm: 1800,
      spinAxis: 'backspin',
    })

    expect(result.frames.length).toBeGreaterThan(10)
    expect(result.metrics.range).toBeGreaterThan(0)
    expect(result.metrics.idealRange).toBeGreaterThan(result.metrics.range) // Drag reduces range
    expect(result.metrics.energyLostToDrag).toBeGreaterThan(0)
    expect(result.metrics.rangeDifferencePercent).toBeGreaterThan(10)
  })

  it('calculates underwater motion with buoyancy and hydrodynamic drag', () => {
    const result = simulateUnderwaterMotion({
      massKg: 100,
      volumeM3: 0.08, // Denser than water -> will sink
      dragCoefficient: 0.04,
      crossSectionAreaM2: 0.03,
      initialVelocity: 20,
      durationSec: 5,
    })

    expect(result.buoyantForceN).toBeGreaterThan(0)
    expect(result.weightN).toBeGreaterThan(result.buoyantForceN)
    expect(result.willFloat).toBe(false)
    expect(result.trajectories.length).toBeGreaterThan(10)
    expect(result.terminalVelocityMs).toBeGreaterThan(0)
  })

  it('calculates 2D elastic rigid-body collision with energy conservation', () => {
    const bodyA = {
      id: 'ball-1',
      mass: 1.0,
      radius: 0.5,
      position: [0, 0] as [number, number],
      velocity: [10, 0] as [number, number],
    }

    const bodyB = {
      id: 'ball-2',
      mass: 1.0,
      radius: 0.5,
      position: [5, 0] as [number, number],
      velocity: [0, 0] as [number, number],
    }

    const result = calculate2DCollision(bodyA, bodyB, 1.0)
    expect(result.willCollide).toBe(true)
    expect(result.timeToCollisionSec).toBeCloseTo(0.4, 1)
    expect(result.finalVelocityA[0]).toBeCloseTo(0, 1) // Momentum transferred to body B
    expect(result.finalVelocityB[0]).toBeCloseTo(10, 1)
    expect(result.energyLossJ).toBeCloseTo(0, 1) // Conserves kinetic energy
  })
})
