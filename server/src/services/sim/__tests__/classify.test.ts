import { describe, it, expect, vi, beforeEach } from 'vitest'
import { cleanJsonResponse, parseCandidateResponse, classifyPage } from '../classify.js'
import { physicsFixture, mathFixture, chemistryFixture } from '@pdf-sim/shared'
import { GoogleGenerativeAI } from '@google/generative-ai'
import OpenAI from 'openai'

vi.mock('@google/generative-ai')
vi.mock('openai')

describe('Classify Service: JSON cleaning and parsing', () => {
  it('strips markdown code blocks', () => {
    const raw = '```json\n[{"id": 1}]\n```'
    expect(cleanJsonResponse(raw)).toBe('[{"id": 1}]')
  })

  it('parses valid candidate list', () => {
    const json = JSON.stringify([
      { ...physicsFixture, importance: 9 },
      { ...mathFixture, importance: 8 },
    ])
    const candidates = parseCandidateResponse(json)
    expect(candidates).toHaveLength(2)
    expect(candidates[0].importance).toBe(9)
    expect(candidates[1].importance).toBe(8)
  })

  it('extracts candidates from wrapper object', () => {
    const json = JSON.stringify({
      candidates: [{ ...chemistryFixture, importance: 7 }],
    })
    const candidates = parseCandidateResponse(json)
    expect(candidates).toHaveLength(1)
    expect(candidates[0].domain).toBe('chemistry')
  })

  it('parses single candidate object into single-element array', () => {
    const json = JSON.stringify({ ...physicsFixture, importance: 9 })
    const candidates = parseCandidateResponse(json)
    expect(candidates).toHaveLength(1)
    expect(candidates[0].title).toBe(physicsFixture.title)
  })

  it('caps candidates at 3 even if LLM produces more', () => {
    const json = JSON.stringify([
      { ...physicsFixture, title: 'Sim 1', importance: 9 },
      { ...physicsFixture, title: 'Sim 2', importance: 8 },
      { ...physicsFixture, title: 'Sim 3', importance: 7 },
      { ...physicsFixture, title: 'Sim 4', importance: 6 },
    ])
    const candidates = parseCandidateResponse(json)
    expect(candidates).toHaveLength(3)
    expect(candidates.map((c) => c.title)).toEqual(['Sim 1', 'Sim 2', 'Sim 3'])
  })

  it('silently filters out malformed candidates', () => {
    const json = JSON.stringify([
      { ...physicsFixture, importance: 9 },
      { invalid: true }, // Should be dropped
      { ...mathFixture, importance: 6 },
    ])
    const candidates = parseCandidateResponse(json)
    expect(candidates).toHaveLength(2)
    expect(candidates[0].importance).toBe(9)
    expect(candidates[1].importance).toBe(6)
  })
})

describe('Classify Service: classifyPage execution & retries', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('calls Gemini model and returns parsed candidates', async () => {
    const mockResponseText = JSON.stringify([{ ...physicsFixture, importance: 9 }])
    const mockGenerateContent = vi.fn().mockResolvedValue({
      response: { text: () => mockResponseText },
    })

    const mockGetGenerativeModel = vi.fn().mockReturnValue({
      generateContent: mockGenerateContent,
    })

    ;(GoogleGenerativeAI as any).mockImplementation(() => ({
      getGenerativeModel: mockGetGenerativeModel,
    }))

    const candidates = await classifyPage('A ball is launched with initial velocity v0 at angle theta...', {
      apiKey: 'test-key',
    })

    expect(candidates).toHaveLength(1)
    expect(candidates[0].title).toBe(physicsFixture.title)
    expect(mockGenerateContent).toHaveBeenCalledTimes(1)
  })

  it('retries on HTTP 429 rate limit and recovers', async () => {
    const error429 = new Error('429 Too Many Requests')
    ;(error429 as any).status = 429

    const mockResponseText = JSON.stringify([{ ...mathFixture, importance: 8 }])
    const mockGenerateContent = vi
      .fn()
      .mockRejectedValueOnce(error429)
      .mockResolvedValueOnce({
        response: { text: () => mockResponseText },
      })

    const mockGetGenerativeModel = vi.fn().mockReturnValue({
      generateContent: mockGenerateContent,
    })

    ;(GoogleGenerativeAI as any).mockImplementation(() => ({
      getGenerativeModel: mockGetGenerativeModel,
    }))

    const candidates = await classifyPage('Geometric transformations of sine waves', {
      apiKey: 'test-key',
      initialDelayMs: 10,
      maxRetries: 2,
    })

    expect(candidates).toHaveLength(1)
    expect(mockGenerateContent).toHaveBeenCalledTimes(2)
  })

  it('calls OpenRouter provider when configured and returns parsed candidates', async () => {
    const mockResponseText = JSON.stringify([{ ...physicsFixture, importance: 9 }])
    const mockCreate = vi.fn().mockResolvedValue({
      choices: [{ message: { content: mockResponseText } }],
    })

    ;(OpenAI as any).mockImplementation(() => ({
      chat: {
        completions: {
          create: mockCreate,
        },
      },
    }))

    const candidates = await classifyPage('Projectile motion page content', {
      provider: 'openrouter',
      apiKey: 'sk-or-test-key',
      modelName: 'deepseek/deepseek-chat',
    })

    expect(candidates).toHaveLength(1)
    expect(candidates[0].title).toBe(physicsFixture.title)
    expect(mockCreate).toHaveBeenCalledTimes(1)
  })
})
