// server/src/services/sim/classify.ts

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { GoogleGenerativeAI } from '@google/generative-ai'
import OpenAI from 'openai'
import { Candidate, CandidateSchema, CandidateListSchema } from './candidateSchema.js'
import { generateProceduralSimSpec, type ConceptContext } from './proceduralSim.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

let cachedPrompt: string | null = null

function getSystemPrompt(): string {
  if (cachedPrompt) return cachedPrompt
  try {
    const promptPath = path.resolve(__dirname, '../../prompts/simspec.v3.md')
    cachedPrompt = fs.readFileSync(promptPath, 'utf-8')
    return cachedPrompt
  } catch {
    // Fallback if prompt file cannot be read directly
    return 'You are an educational simulation curator. Analyze the textbook page text and output a JSON array of up to 3 simulation candidates with version 2.0 and importance 1-10.'
  }
}

export type LLMProvider = 'groq' | 'openrouter' | 'gemini' | 'openai'

export interface ClassifyOptions {
  provider?: LLMProvider
  apiKey?: string
  modelName?: string
  maxRetries?: number
  initialDelayMs?: number
  systemPrompt?: string
}

/**
 * Strips markdown code fences (e.g. ```json ... ```) from LLM output.
 */
export function cleanJsonResponse(raw: string): string {
  const trimmed = raw.trim()
  if (trimmed.startsWith('```')) {
    return trimmed
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```$/, '')
      .trim()
  }
  return trimmed
}

/**
 * Parses raw JSON string into a validated Candidate array.
 * Handles single-object responses and wrapper objects ({ candidates: [...] }).
 */
export function parseCandidateResponse(jsonStr: string): Candidate[] {
  const cleaned = cleanJsonResponse(jsonStr)
  if (!cleaned || cleaned === '[]') return []

  let parsed: unknown
  try {
    parsed = JSON.parse(cleaned)
  } catch {
    // Try to extract JSON substring if there was conversational prefix/suffix
    const firstBracket = cleaned.indexOf('[')
    const firstBrace = cleaned.indexOf('{')
    const start = firstBracket !== -1 && (firstBrace === -1 || firstBracket < firstBrace) ? firstBracket : firstBrace
    const lastBracket = cleaned.lastIndexOf(']')
    const lastBrace = cleaned.lastIndexOf('}')
    const end = Math.max(lastBracket, lastBrace)

    if (start !== -1 && end > start) {
      try {
        parsed = JSON.parse(cleaned.substring(start, end + 1))
      } catch {
        return []
      }
    } else {
      return []
    }
  }

  let list: unknown[]
  if (Array.isArray(parsed)) {
    list = parsed
  } else if (typeof parsed === 'object' && parsed !== null) {
    if ('candidates' in parsed && Array.isArray((parsed as any).candidates)) {
      list = (parsed as any).candidates
    } else if ('simulations' in parsed && Array.isArray((parsed as any).simulations)) {
      list = (parsed as any).simulations
    } else {
      list = [parsed]
    }
  } else {
    return []
  }

  // Parse each candidate, dropping invalid ones
  const validCandidates: Candidate[] = []
  for (const item of list) {
    const result = CandidateSchema.safeParse(item)
    if (result.success) {
      validCandidates.push(result.data as Candidate)
    }
    if (validCandidates.length >= 3) break
  }

  return validCandidates
}

/**
 * Executes prompt using Groq (OpenAI-compatible ultra-fast inference)
 */
async function callGroq(
  pageText: string,
  systemPrompt: string,
  apiKey: string,
  modelName: string
): Promise<string> {
  const openai = new OpenAI({
    apiKey,
    baseURL: 'https://api.groq.com/openai/v1',
  })

  const completion = await openai.chat.completions.create({
    model: modelName,
    messages: [
      { role: 'system', content: systemPrompt },
      {
        role: 'user',
        content: `Analyze the following text and return valid JSON simulation array:\n\n---\n${pageText}\n---`,
      },
    ],
    temperature: 0.2,
  })

  return completion.choices[0]?.message?.content ?? ''
}

/**
 * Executes prompt using OpenRouter (OpenAI-compatible)
 */
async function callOpenRouter(
  pageText: string,
  systemPrompt: string,
  apiKey: string,
  modelName: string
): Promise<string> {
  const openai = new OpenAI({
    apiKey,
    baseURL: 'https://openrouter.ai/api/v1',
    defaultHeaders: {
      'HTTP-Referer': 'https://github.com/pdf-simulation',
      'X-Title': 'PDF Simulation Generator',
    },
  })

  const completion = await openai.chat.completions.create({
    model: modelName,
    messages: [
      { role: 'system', content: systemPrompt },
      {
        role: 'user',
        content: `Analyze the following textbook page text and extract 0 to 3 high-value simulations in valid JSON array format:\n\n---\n${pageText}\n---`,
      },
    ],
    temperature: 0.2,
  })

  return completion.choices[0]?.message?.content ?? ''
}

/**
 * Executes prompt using Google Gemini SDK
 */
async function callGemini(
  pageText: string,
  systemPrompt: string,
  apiKey: string,
  modelName: string
): Promise<string> {
  const genAI = new GoogleGenerativeAI(apiKey)
  const model = genAI.getGenerativeModel({
    model: modelName,
    systemInstruction: systemPrompt,
    generationConfig: {
      responseMimeType: 'application/json',
      temperature: 0.2,
    },
  })

  const userPrompt = `Analyze the following textbook page text and extract 0 to 3 high-value simulations:\n\n---\n${pageText}\n---`
  const response = await model.generateContent(userPrompt)
  return response.response.text()
}

/**
 * Calls a single provider with exponential backoff on 429 errors.
 */
async function callSingleProvider(
  provider: LLMProvider,
  pageText: string,
  systemPrompt: string,
  options: ClassifyOptions
): Promise<Candidate[]> {
  const maxRetries = options.maxRetries ?? 2
  const initialDelayMs = options.initialDelayMs ?? 1000

  let apiKey: string | undefined
  let modelName: string

  if (provider === 'openrouter') {
    apiKey = options.apiKey ?? process.env.OPENROUTER_API_KEY
    modelName = options.modelName ?? process.env.OPENROUTER_MODEL ?? 'nvidia/nemotron-3.5-lightning:free'
    if (!apiKey) throw new Error('OPENROUTER_API_KEY is missing')
  } else if (provider === 'groq') {
    apiKey = options.apiKey ?? process.env.GROQ_API_KEY
    modelName = options.modelName ?? process.env.GROQ_MODEL ?? 'openai/gpt-oss-120b'
    if (!apiKey) throw new Error('GROQ_API_KEY is missing')
  } else {
    apiKey = options.apiKey ?? process.env.GEMINI_API_KEY
    modelName = options.modelName ?? process.env.GEMINI_MODEL ?? 'gemini-3.6-flash'
    if (!apiKey) throw new Error('GEMINI_API_KEY is missing')
  }

  let attempt = 0
  let delay = initialDelayMs

  while (attempt < maxRetries) {
    try {
      let rawText = ''
      if (provider === 'openrouter') {
        rawText = await callOpenRouter(pageText, systemPrompt, apiKey, modelName)
      } else if (provider === 'groq') {
        rawText = await callGroq(pageText, systemPrompt, apiKey, modelName)
      } else {
        rawText = await callGemini(pageText, systemPrompt, apiKey, modelName)
      }
      return parseCandidateResponse(rawText)
    } catch (err: any) {
      attempt++
      const isRateLimit =
        err?.status === 429 ||
        err?.message?.includes('429') ||
        err?.message?.includes('RESOURCE_EXHAUSTED') ||
        err?.message?.includes('Rate limit exceeded') ||
        err?.message?.includes('Too Many Requests')

      if (attempt >= maxRetries || !isRateLimit) {
        throw err
      }

      const jitter = Math.random() * 200
      await new Promise((resolve) => setTimeout(resolve, delay + jitter))
      delay *= 2
    }
  }

  return []
}

/**
 * Calls configured LLM (OpenRouter -> Groq -> Gemini) to curate and generate SimSpec candidates.
 * OpenRouter is the primary provider, cascading to Groq and Gemini on errors or rate limits.
 */
export async function classifyPage(
  pageText: string,
  options: ClassifyOptions = {}
): Promise<Candidate[]> {
  const systemPrompt = options.systemPrompt ?? getSystemPrompt()

  // If specific provider was requested or LLM_PROVIDER is set
  let provider: LLMProvider | undefined = options.provider ?? (process.env.LLM_PROVIDER as LLMProvider)
  
  if (!provider && options.apiKey) {
    if (options.apiKey.startsWith('sk-or-')) {
      provider = 'openrouter'
    } else if (options.apiKey.startsWith('gsk_')) {
      provider = 'groq'
    } else {
      provider = 'gemini'
    }
  }

  if (provider) {
    return callSingleProvider(provider, pageText, systemPrompt, options)
  }

  // Priority Cascade: 1. OpenRouter -> 2. Groq -> 3. Gemini
  const cascade: LLMProvider[] = []
  if (process.env.OPENROUTER_API_KEY) cascade.push('openrouter')
  if (process.env.GROQ_API_KEY) cascade.push('groq')
  if (process.env.GEMINI_API_KEY) cascade.push('gemini')

  // Default fallback if no keys configured
  if (cascade.length === 0) {
    cascade.push('openrouter')
  }

  for (const provider of cascade) {
    try {
      const candidates = await callSingleProvider(provider, pageText, systemPrompt, options)
      if (candidates.length > 0) {
        return candidates
      }
    } catch (err: any) {
      console.warn(`[classify] Provider ${provider} failed, falling back to next provider:`, err?.message || err)
    }
  }

  return []
}

/**
 * Generates an on-demand custom SVG simulation from a user prompt or specific textbook excerpt.
 * Cascades across Groq -> OpenRouter -> Gemini -> Procedural engine for 100% reliability.
 */
export async function generateCustomSimulation(
  promptOrText: string,
  options: ClassifyOptions = {},
  context: ConceptContext = {}
): Promise<Candidate> {
  const customSystemPrompt = `${getSystemPrompt()}

IMPORTANT INSTRUCTION FOR ON-DEMAND GENERATION:
You must design a single, richly animated, visually clear SVG simulation specifically visualizing the exact concept, equations, and physical principles described in the user prompt.
Return a JSON array with exactly ONE Candidate object containing isSimulatable: true and a valid stage.elements array.`

  const queryText = context.title
    ? `Concept to animate:
Title: ${context.title}
Subtitle: ${context.subtitle || ''}
Domain: ${context.domain || 'physics'}
Parent Topic: ${context.parentTopic || ''}
Equations: ${(context.equations || []).join('; ')}
Explanation: ${context.topicExplanation || ''}
Textbook Context / Quote: "${context.quote || promptOrText}"

Design a unique, high-detail 2D SVG animation specifically for "${context.title}".`
    : promptOrText

  try {
    const candidates = await classifyPage(queryText, {
      ...options,
      systemPrompt: customSystemPrompt,
    })

    if (candidates.length > 0 && candidates[0].isSimulatable && candidates[0].stage) {
      return candidates[0]
    }
  } catch (err: any) {
    console.warn('[classify] All LLM providers exhausted, switching to procedural simulation engine:', err?.message || err)
  }

  // Graceful high-fidelity procedural generation fallback tailored to this exact concept
  return generateProceduralSimSpec(promptOrText, context)
}




