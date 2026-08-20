import { describe, it, expect, vi, beforeEach } from 'vitest'
import express from 'express'
import { simulationRouter } from '../simulation.js'
import * as repository from '../../services/sim/repository.js'
import * as worker from '../../workers/annotateBook.js'
import { physicsFixture } from '@pdf-sim/shared'

vi.mock('../../services/sim/repository.js')
vi.mock('../../workers/annotateBook.js')

describe('Simulation Routes', () => {
  const app = express()
  app.use(express.json())
  app.use('/api/sim', simulationRouter)

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('GET /api/sim/books lists books', async () => {
    const mockBooks = [
      {
        id: '11111111-1111-1111-1111-111111111111',
        slug: 'physics-101',
        title: 'Physics 101',
        storage_path: 'books/physics.pdf',
        page_count: 10,
        status: 'ready',
        error: null,
        created_at: new Date().toISOString(),
      },
    ]

    vi.mocked(repository.listBooks).mockResolvedValue(mockBooks as any)

    // Simulate express request
    const req = { method: 'GET', url: '/api/sim/books' }
    // Using simple mock request handler invocation
    const res: any = {
      statusCode: 200,
      json: vi.fn(),
      status(code: number) {
        this.statusCode = code
        return this
      },
    }

    const handler = (simulationRouter as any).stack.find(
      (s: any) => s.route?.path === '/books' && s.route?.methods?.get
    )?.route?.stack[0]?.handle

    expect(handler).toBeDefined()
    await handler({} as any, res)

    expect(res.json).toHaveBeenCalledWith({ books: mockBooks })
  })

  it('GET /api/sim/books/:id/status returns status info', async () => {
    vi.mocked(repository.getBookById).mockResolvedValue({
      id: 'book-123',
      slug: 'calculus-vol-1',
      title: 'Calculus Vol 1',
      storage_path: 'books/calc.pdf',
      page_count: 50,
      status: 'classifying',
      error: null,
      created_at: new Date().toISOString(),
    } as any)

    const res: any = {
      statusCode: 200,
      json: vi.fn(),
      status(code: number) {
        this.statusCode = code
        return this
      },
    }

    const handler = (simulationRouter as any).stack.find(
      (s: any) => s.route?.path === '/books/:id/status' && s.route?.methods?.get
    )?.route?.stack[0]?.handle

    expect(handler).toBeDefined()
    await handler({ params: { id: 'book-123' } } as any, res)

    expect(res.json).toHaveBeenCalledWith({
      id: 'book-123',
      status: 'classifying',
      pageCount: 50,
      error: null,
    })
  })

  it('GET /api/sim/books/:id/annotations returns annotations list', async () => {
    const mockAnnotations = [
      {
        id: 'ann-1',
        book_id: 'book-123',
        page_number: 4,
        quote: 'A projectile launched...',
        spec: physicsFixture,
        spec_version: '2.0',
        content_hash: 'abc123hash',
        created_at: new Date().toISOString(),
      },
    ]

    vi.mocked(repository.getAnnotationsByBookId).mockResolvedValue(mockAnnotations as any)

    const res: any = {
      statusCode: 200,
      json: vi.fn(),
      status(code: number) {
        this.statusCode = code
        return this
      },
    }

    const handler = (simulationRouter as any).stack.find(
      (s: any) => s.route?.path === '/books/:id/annotations' && s.route?.methods?.get
    )?.route?.stack[0]?.handle

    expect(handler).toBeDefined()
    await handler({ params: { id: 'book-123' }, query: { page: '4' } } as any, res)

    expect(res.json).toHaveBeenCalledWith({
      bookId: 'book-123',
      pageNumber: 4,
      count: 1,
      annotations: mockAnnotations,
    })
  })

  it('POST /api/sim/generate generates on-demand simulation for a prompt', async () => {
    const handler = (simulationRouter as any).stack.find(
      (s: any) => s.route?.path === '/generate' && s.route?.methods?.post
    )?.route?.stack[0]?.handle

    expect(handler).toBeDefined()

    const res: any = {
      statusCode: 200,
      json: vi.fn(),
      status(code: number) {
        this.statusCode = code
        return this
      },
    }

    // Mock request with missing prompt should return 400
    await handler({ body: {} } as any, res)
    expect(res.statusCode).toBe(400)
  })

  it('POST /api/sim/explain generates student explanation', async () => {
    const handler = (simulationRouter as any).stack.find(
      (s: any) => s.route?.path === '/explain' && s.route?.methods?.post
    )?.route?.stack[0]?.handle

    expect(handler).toBeDefined()

    const res: any = {
      statusCode: 200,
      json: vi.fn(),
      status(code: number) {
        this.statusCode = code
        return this
      },
    }

    // Call with valid physics fixture
    await handler(
      {
        body: {
          spec: physicsFixture,
          quote: 'Newton second law',
          mode: 'standard',
        },
      } as any,
      res
    )

    expect(res.json).toHaveBeenCalled()
    const callArg = res.json.mock.calls[0][0]
    expect(callArg.success).toBe(true)
    expect(callArg.explanation).toBeDefined()
    expect(callArg.explanation.summary).toBeDefined()
  })
})


