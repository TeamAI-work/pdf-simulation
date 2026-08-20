// server/src/routes/mcpPhysics.ts
/**
 * Dedicated isolated API router for IBM/chuk-mcp-physics engine testing and playground.
 * Mounted on /api/mcp-physics/* — completely separated from existing /api/sim routes.
 */

import { Router, Request, Response } from 'express'
import {
  calculateProjectileMotion,
  simulateUnderwaterMotion,
  calculate2DCollision,
  solvePhysicsProblemWithAi,
  type ProjectileParams,
  type UnderwaterParams,
} from '../services/mcp-physics/mcpPhysicsEngine.js'

export const mcpPhysicsRouter = Router()

/**
 * POST /api/mcp-physics/projectile
 * Calculates real-world aerodynamic ballistics with Drag, Magnus Effect, Wind, and Altitude.
 */
mcpPhysicsRouter.post('/projectile', (req: Request, res: Response): void => {
  try {
    const params = req.body as ProjectileParams
    if (typeof params.velocity !== 'number' || typeof params.angleDeg !== 'number') {
      res.status(400).json({ error: 'velocity (m/s) and angleDeg (0-90) are required' })
      return
    }

    const result = calculateProjectileMotion(params)
    res.json({
      success: true,
      result,
    })
  } catch (err: any) {
    console.error('[mcpPhysicsRouter] Error calculating projectile:', err)
    res.status(500).json({ error: err?.message || 'Calculation error' })
  }
})

/**
 * POST /api/mcp-physics/underwater
 * Simulates underwater buoyancy (Archimedes) and hydrodynamic drag for submersibles / torpedoes.
 */
mcpPhysicsRouter.post('/underwater', (req: Request, res: Response): void => {
  try {
    const params = req.body as UnderwaterParams
    if (typeof params.massKg !== 'number' || typeof params.volumeM3 !== 'number') {
      res.status(400).json({ error: 'massKg and volumeM3 are required' })
      return
    }

    const result = simulateUnderwaterMotion(params)
    res.json({
      success: true,
      result,
    })
  } catch (err: any) {
    console.error('[mcpPhysicsRouter] Error simulating underwater:', err)
    res.status(500).json({ error: err?.message || 'Simulation error' })
  }
})

/**
 * POST /api/mcp-physics/collision
 * Solves 2D elastic/inelastic rigid-body collision and kinetic energy transfer.
 */
mcpPhysicsRouter.post('/collision', (req: Request, res: Response): void => {
  try {
    const { bodyA, bodyB, restitution } = req.body
    if (!bodyA || !bodyB) {
      res.status(400).json({ error: 'bodyA and bodyB with mass, radius, position, and velocity are required' })
      return
    }

    const result = calculate2DCollision(bodyA, bodyB, restitution ?? 1.0)
    res.json({
      success: true,
      result,
    })
  } catch (err: any) {
    console.error('[mcpPhysicsRouter] Error calculating collision:', err)
    res.status(500).json({ error: err?.message || 'Collision calculation error' })
  }
})

/**
 * POST /api/mcp-physics/ai-solve
 * Natural language AI physics solver that uses verified calculation tools.
 */
mcpPhysicsRouter.post('/ai-solve', async (req: Request, res: Response): Promise<void> => {
  try {
    const { prompt } = req.body
    if (!prompt || !prompt.trim()) {
      res.status(400).json({ error: 'A physical problem prompt is required' })
      return
    }

    console.log(`[mcpPhysicsRouter] Solving physics problem: "${prompt.substring(0, 60)}..."`)
    const result = await solvePhysicsProblemWithAi(prompt)
    res.json({
      success: true,
      ...result,
    })
  } catch (err: any) {
    console.error('[mcpPhysicsRouter] Error solving physics with AI:', err)
    res.status(500).json({ error: err?.message || 'Failed to solve physics problem' })
  }
})
