import dotenv from 'dotenv'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import express from 'express'
import cors from 'cors'
import { simulationRouter } from './routes/simulation.js'
import { mcpPhysicsRouter } from './routes/mcpPhysics.js'
import { initWorker } from './workers/annotateBook.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
// Load root .env file as well as local .env
dotenv.config({ path: path.resolve(__dirname, '../../.env') })
dotenv.config()

const PORT = process.env.PORT ?? 3001

const app = express()

app.use(cors())
app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ extended: true, limit: '50mb' }))

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Simulation Routes (Standard App)
app.use('/api/sim', simulationRouter)
app.use('/sim', simulationRouter)

// Dedicated Isolated MCP Physics Engine Routes
app.use('/api/mcp-physics', mcpPhysicsRouter)

// Initialize background worker (resets stale jobs)
initWorker().catch((err) => {
  console.warn('[server] Warning during worker initialization:', err)
})

app.listen(PORT, () => {
  console.log(`[server] listening on http://localhost:${PORT}`)
})

export default app
