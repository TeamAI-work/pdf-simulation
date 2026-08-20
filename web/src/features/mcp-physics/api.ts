// web/src/features/mcp-physics/api.ts
/**
 * Client API for IBM/chuk-mcp-physics calculation & simulation engine.
 */

export interface TrajectoryPoint {
  t: number
  position: [number, number, number]
  velocity: [number, number, number]
  speed: number
  acceleration?: [number, number, number]
}

export interface TrajectoryResult {
  dt: number
  frames: TrajectoryPoint[]
  metrics: {
    range: number
    maxHeight: number
    flightTime: number
    initialVelocity: number
    launchAngleDeg: number
    impactVelocity: number
    energyLostToDrag?: number
    idealRange?: number
    rangeDifferencePercent?: number
  }
  meta: {
    model: string
    parameters: Record<string, any>
  }
}

export interface ProjectileParams {
  velocity: number
  angleDeg: number
  mass?: number
  radius?: number
  dragCoefficient?: number
  airDensity?: number
  altitudeMeters?: number
  temperatureC?: number
  spinRpm?: number
  spinAxis?: 'backspin' | 'topspin' | 'sidespin'
  windVelocityX?: number
  windVelocityY?: number
  gravity?: number
  initialHeight?: number
}

export interface UnderwaterResult {
  buoyantForceN: number
  weightN: number
  netVerticalForceN: number
  willFloat: boolean
  terminalVelocityMs: number
  trajectories: Array<{ t: number; depth: number; distance: number; velocity: number }>
}

export interface CollisionResult {
  willCollide: boolean
  timeToCollisionSec: number | null
  finalVelocityA: [number, number]
  finalVelocityB: [number, number]
  kineticEnergyBeforeJ: number
  kineticEnergyAfterJ: number
  energyLossJ: number
}

export interface AiSolverResult {
  explanation: string
  calculationTool: string
  computedData: TrajectoryResult
  stepByStepProof: string[]
}

class McpPhysicsClient {
  async calculateProjectile(params: ProjectileParams): Promise<TrajectoryResult> {
    const res = await fetch('/api/mcp-physics/projectile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.error || `Calculation failed: ${res.statusText}`)
    }
    const data = await res.json()
    return data.result as TrajectoryResult
  }

  async simulateUnderwater(params: {
    massKg: number
    volumeM3: number
    dragCoefficient?: number
    crossSectionAreaM2: number
    initialVelocity: number
    fluidDensity?: number
    durationSec?: number
  }): Promise<UnderwaterResult> {
    const res = await fetch('/api/mcp-physics/underwater', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.error || `Underwater simulation failed: ${res.statusText}`)
    }
    const data = await res.json()
    return data.result as UnderwaterResult
  }

  async calculateCollision(params: {
    bodyA: { id: string; mass: number; radius: number; position: [number, number]; velocity: [number, number] }
    bodyB: { id: string; mass: number; radius: number; position: [number, number]; velocity: [number, number] }
    restitution?: number
  }): Promise<CollisionResult> {
    const res = await fetch('/api/mcp-physics/collision', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.error || `Collision calculation failed: ${res.statusText}`)
    }
    const data = await res.json()
    return data.result as CollisionResult
  }

  async solveWithAi(prompt: string): Promise<AiSolverResult> {
    const res = await fetch('/api/mcp-physics/ai-solve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.error || `AI physics solving failed: ${res.statusText}`)
    }
    return await res.json()
  }
}

export const mcpPhysicsClient = new McpPhysicsClient()
