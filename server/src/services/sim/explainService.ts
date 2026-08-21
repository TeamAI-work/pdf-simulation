// server/src/services/sim/explainService.ts

import { GoogleGenerativeAI } from '@google/generative-ai'
import OpenAI from 'openai'
import type { SimSpec } from '@pdf-sim/shared'

export interface VariableExplanation {
  symbol: string
  meaning: string
  unit?: string
}

export interface EquationBreakdown {
  formula: string
  description: string
  variables: VariableExplanation[]
}

export interface AnimationElementGuide {
  element: string
  meaning: string
}

export interface ThoughtExperiment {
  question: string
  hint?: string
  answer: string
}

export interface StudentExplanation {
  summary: string
  intuition: string[]
  animationGuide: AnimationElementGuide[]
  equationBreakdown: EquationBreakdown[]
  realWorldApplications: string[]
  thoughtExperiment: ThoughtExperiment
  keyTakeaways: string[]
  tutorAnswer?: string
}

export interface SelectionExplanation {
  selectedText: string
  conceptTitle: string
  domain: string
  summary: string
  detailedExplanation: string[]
  keyTakeaways: string[]
  realWorldExample?: string
  relatedFormulas?: string[]
}

export interface ExplainSelectionOptions {
  selectedText: string
  surroundingContext?: string
  parentTopic?: string
  domain?: string
  mode?: 'beginner' | 'standard' | 'advanced'
}

export interface ExplainOptions {
  spec: SimSpec
  quote?: string
  pageText?: string
  mode?: 'beginner' | 'standard' | 'advanced'
  customQuestion?: string
  metrics?: Record<string, number | string | boolean>
}

function formatBookNumbers(
  spec: SimSpec,
  metrics?: Record<string, number | string | boolean>
): string {
  const params = spec.params || {}
  const meta = spec.paramMeta || {}
  const paramBits = Object.entries(params).map(([k, v]) => {
    const src = meta[k]?.source === 'extracted' ? 'from the textbook' : 'catalog default'
    return `${k} = ${v} (${src})`
  })
  const metricBits = Object.entries(metrics || {}).map(([k, v]) => `${k} = ${v}`)
  const parts = [
    paramBits.length ? `Textbook / slider params: ${paramBits.join(', ')}` : '',
    metricBits.length ? `Computed metrics (use these numbers in the explanation): ${metricBits.join(', ')}` : '',
  ].filter(Boolean)
  return parts.join('\n')
}

export interface ChatTurn {
  role: 'user' | 'assistant'
  content: string
}

export interface ChatBookContext {
  title?: string
  currentPage?: number
  parentTopic?: string
  domain?: string
}

export interface ChatReply {
  reply: string
  relatedFormulas?: string[]
  keyTakeaways?: string[]
}

export interface SimBrief {
  about: string
  howItWorks: string
}

const MAX_CHAT_TURNS = 24

/**
 * Procedural fallback student explanation generator for high reliability when LLMs are unavailable.
 */
export function generateProceduralStudentExplanation(
  spec: SimSpec,
  quote?: string,
  mode: 'beginner' | 'standard' | 'advanced' = 'standard',
  customQuestion?: string,
  metrics?: Record<string, number | string | boolean>
): StudentExplanation {
  const domain = spec.domain || 'physics'
  const title = spec.title || 'Scientific Concept'
  const numbers = formatBookNumbers(spec, metrics)

  // Extract variables from equations if available
  const equationBreakdowns: EquationBreakdown[] = (spec.equations || []).map((eq) => {
    const vars: VariableExplanation[] = []
    if (eq.includes('F')) vars.push({ symbol: 'F', meaning: 'Net Force acting on object', unit: 'Newtons (N)' })
    if (eq.includes('m')) vars.push({ symbol: 'm', meaning: 'Mass of the moving body', unit: 'Kilograms (kg)' })
    if (eq.includes('a')) vars.push({ symbol: 'a', meaning: 'Acceleration of the object', unit: 'm/s²' })
    if (eq.includes('v') || eq.includes('\\vec{v}')) vars.push({ symbol: 'v', meaning: 'Instantaneous Velocity', unit: 'm/s' })
    if (eq.includes('B') || eq.includes('\\vec{B}')) vars.push({ symbol: 'B', meaning: 'Magnetic Field Strength', unit: 'Tesla (T)' })
    if (eq.includes('I')) vars.push({ symbol: 'I', meaning: 'Electric Current flow', unit: 'Amperes (A)' })
    if (eq.includes('r') || eq.includes('R')) vars.push({ symbol: 'r', meaning: 'Radial distance or radius', unit: 'Meters (m)' })
    if (eq.includes('q')) vars.push({ symbol: 'q', meaning: 'Electric Charge', unit: 'Coulombs (C)' })
    if (eq.includes('\\omega')) vars.push({ symbol: 'ω', meaning: 'Angular frequency', unit: 'rad/s' })
    if (eq.includes('k')) vars.push({ symbol: 'k', meaning: 'Spring / constant parameter', unit: 'N/m' })
    if (eq.includes('g')) vars.push({ symbol: 'g', meaning: 'Gravitational acceleration (approx 9.8)', unit: 'm/s²' })
    if (eq.includes('t') || eq.includes('time')) vars.push({ symbol: 't', meaning: 'Elapsed time', unit: 'seconds (s)' })

    if (vars.length === 0) {
      vars.push({ symbol: 'Variables', meaning: 'Parameters governing rate of change and equilibrium' })
    }

    return {
      formula: eq,
      description: `Governs the quantitative relationship and dynamical equilibrium of ${title}.`,
      variables: vars,
    }
  })

  // Map elements from stage
  const animationGuide: AnimationElementGuide[] = []
  if (spec.stage?.elements) {
    for (const el of spec.stage.elements) {
      if (el.type === 'circle' && el.role === 'projectile') {
        animationGuide.push({ element: 'Moving Particle (Circle)', meaning: 'Represents the active particle/body moving continuously over elapsed time.' })
      } else if (el.type === 'wave') {
        animationGuide.push({ element: 'Sinusoidal Waveform', meaning: 'Visualizes continuous wave propagation and phase oscillation across space.' })
      } else if (el.type === 'arrow') {
        animationGuide.push({ element: 'Directional Vector (Arrow)', meaning: 'Shows the instantaneous direction of force, velocity, or field intensity.' })
      } else if (el.type === 'line' || el.type === 'rect') {
        animationGuide.push({ element: 'Reference Boundary / Axis', meaning: 'Provides the spatial coordinate frame or physical physical constraint.' })
      } else if (el.type === 'particles') {
        animationGuide.push({ element: 'Particle Ensemble', meaning: 'Illustrates statistical/thermal distribution of microscopic entities.' })
      }
    }
  }

  if (animationGuide.length === 0) {
    animationGuide.push({ element: 'Animated SVG Elements', meaning: `Continuously update according to mathematical time-functions $f(time)$ to model ${title}.` })
  }

  const intuition = [
    spec.topicExplanation ||
      `${title} illustrates how physical states evolve predictably under governing natural laws.`,
    mode === 'beginner'
      ? `Imagine rolling a ball on a smooth track or watching water ripples spread: the motion follows strict rules that keep repeating smoothly without stopping.`
      : mode === 'advanced'
      ? `The state vector transitions through continuous phase space, where energy or quantity conservation dictates the exact path at every infinitesimal time step.`
      : `As time progresses in the simulation, observe how changing one physical quantity directly alters the motion and speed of the surrounding elements.`,
  ]

  let tutorAnswer: string | undefined = undefined
  if (customQuestion) {
    tutorAnswer = `Regarding "${customQuestion}": In ${title}, the behavior is fundamentally dictated by the governing parameters. Changing one variable causes an immediate proportional shift in the simulated trajectory and energy dynamics.`
  }

  return {
    summary: spec.subtitle || `Interactive pedagogical simulation demonstrating ${title} in ${domain}.`,
    intuition,
    animationGuide,
    equationBreakdown: equationBreakdowns,
    realWorldApplications: [
      `Modern engineering and technology systems utilizing ${title}`,
      `Everyday physical phenomena where ${domain} principles maintain equilibrium`,
      `Scientific measurement instruments and computational models`,
    ],
    thoughtExperiment: {
      question: `What would happen to the simulation motion if the governing rate parameter or mass was doubled?`,
      hint: `Check the governing equation to see if the variable is directly or inversely proportional.`,
      answer: `The frequency or acceleration would shift inversely or proportionally, causing the animation cycles to either speed up or slow down according to the formula.`,
    },
    keyTakeaways: [
      `${title} operates deterministically as a function of elapsed time and physical constraints.`,
      numbers
        ? `Explain using spec.params and computed metrics only. ${numbers}`
        : `The visual components in the stage reflect exact algebraic balance.`,
      `Understanding this foundational principle simplifies advanced topics across ${domain}.`,
    ],
    tutorAnswer,
  }
}

/**
 * Builds the comprehensive educational prompt for the LLM.
 */
function buildPrompt(options: ExplainOptions): { systemPrompt: string; userPrompt: string } {
  const { spec, quote, pageText, mode = 'standard', customQuestion, metrics } = options
  const bookNumbers = formatBookNumbers(spec, metrics)

  const systemPrompt = `You are a world-class STEM professor and educational explainer known for making physics, chemistry, mathematics, and science crystal-clear, fascinating, and deeply intuitive for high-school and undergraduate students.

Your objective: Explain the interactive visual simulation provided below with utmost clarity, pedagogical rigor, and relatable intuition.
Explain using spec.params and computed metrics only. Walk through those textbook numbers; do not invent replacements.

Respond ONLY with a valid, clean JSON object matching this structure (no markdown formatting fences, just pure JSON):
{
  "summary": "1 memorable sentence summarizing the core principle",
  "intuition": [
    "Paragraph 1: Clear, jargon-free explanation with a relatable real-world analogy (e.g. sports, car, swing, water, guitar string)",
    "Paragraph 2: Explanation of the underlying physical/mathematical mechanism and cause-and-effect"
  ],
  "animationGuide": [
    { "element": "Name/Color of visual part", "meaning": "What this moving element specifically represents in the real world" }
  ],
  "equationBreakdown": [
    {
      "formula": "LaTeX or plain math formula",
      "description": "Plain English explanation of what the equation tells us",
      "variables": [
        { "symbol": "v", "meaning": "Velocity", "unit": "m/s" }
      ]
    }
  ],
  "realWorldApplications": [
    "Concrete real-world application 1 (e.g. Smartphone accelerometers)",
    "Concrete real-world application 2 (e.g. Planetary orbits & satellites)",
    "Concrete real-world application 3 (e.g. Acoustic sound engineering)"
  ],
  "thoughtExperiment": {
    "question": "An intriguing 'What if?' challenge question for the student to test their understanding",
    "hint": "A subtle hint pointing to the relationship in the formula",
    "answer": "Clear, satisfying answer explaining the correct physical reasoning"
  },
  "keyTakeaways": [
    "Takeaway 1 (concise bullet)",
    "Takeaway 2 (concise bullet)",
    "Takeaway 3 (concise bullet)"
  ]${customQuestion ? ',\n  "tutorAnswer": "Direct, friendly, concise and pedagogically insightful answer to the student\'s question."' : ''}
}`

  const userPrompt = `Target Learning Level: ${mode.toUpperCase()}
Simulation Title: ${spec.title}
Subtitle: ${spec.subtitle || ''}
Domain: ${spec.domain || 'physics'}
Parent Topic: ${spec.parentTopic || ''}
Governing Equations: ${(spec.equations || []).join('; ') || 'None provided'}
Initial Concept Note: ${spec.topicExplanation || ''}
Visual Caption: ${spec.caption || ''}
${bookNumbers ? `${bookNumbers}\n` : ''}
Stage Elements: ${JSON.stringify(spec.stage?.elements || []).substring(0, 500)}
${quote ? `Textbook Excerpt: "${quote}"\n` : ''}
${pageText ? `Page Context: "${pageText.substring(0, 400)}"\n` : ''}
${customQuestion ? `Student's Specific Question: "${customQuestion}"\n` : ''}

Provide a deep, engaging, student-friendly explanation JSON.`

  return { systemPrompt, userPrompt }
}

function cleanJson(raw: string): string {
  const trimmed = raw.trim()
  if (trimmed.startsWith('```')) {
    return trimmed
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```$/, '')
      .trim()
  }
  return trimmed
}

/** Chat + explain paths use Groq first for latency. Classify pipeline stays OpenRouter-first. */
function groqChatModel(): string {
  return process.env.GROQ_CHAT_MODEL || process.env.GROQ_MODEL || 'openai/gpt-oss-120b'
}

type LlmChatMessage = { role: 'system' | 'user' | 'assistant'; content: string }

async function tryGroqJsonFromMessages(
  llmMessages: LlmChatMessage[],
  label: string
): Promise<unknown | null> {
  if (!process.env.GROQ_API_KEY) return null
  try {
    const openai = new OpenAI({
      apiKey: process.env.GROQ_API_KEY,
      baseURL: 'https://api.groq.com/openai/v1',
    })
    const model = groqChatModel()
    console.log(`[explainService] ${label} via Groq (${model})`)
    const completion = await openai.chat.completions.create({
      model,
      messages: llmMessages,
      temperature: 0.3,
      response_format: { type: 'json_object' },
    })
    const text = completion.choices[0]?.message?.content || ''
    return JSON.parse(cleanJson(text))
  } catch (err: any) {
    console.warn(`[explainService] Groq ${label} failed, falling back:`, err?.message || err)
    return null
  }
}

async function tryGroqJson(systemPrompt: string, userPrompt: string, label: string): Promise<unknown | null> {
  return tryGroqJsonFromMessages(
    [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    label
  )
}

export async function generateStudentExplanation(options: ExplainOptions): Promise<StudentExplanation> {
  const { systemPrompt, userPrompt } = buildPrompt(options)

  // 1. Groq first — chat follow-ups and tutor Q&A need low latency
  const groqParsed = await tryGroqJson(systemPrompt, userPrompt, 'student explanation')
  if (groqParsed && typeof groqParsed === 'object' && groqParsed !== null) {
    const parsed = groqParsed as StudentExplanation
    if (parsed.summary && parsed.intuition) {
      return parsed
    }
  }

  // 2. Try OpenRouter
  if (process.env.OPENROUTER_API_KEY) {
    try {
      const openai = new OpenAI({
        apiKey: process.env.OPENROUTER_API_KEY,
        baseURL: 'https://openrouter.ai/api/v1',
        defaultHeaders: {
          'HTTP-Referer': 'https://github.com/pdf-simulation',
          'X-Title': 'PDF Simulation Explainer',
        },
      })
      const model = process.env.OPENROUTER_MODEL || 'nvidia/nemotron-3.5-lightning:free'
      const completion = await openai.chat.completions.create({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.3,
      })
      const text = completion.choices[0]?.message?.content || ''
      const cleaned = cleanJson(text)
      const parsed = JSON.parse(cleaned)
      if (parsed.summary && parsed.intuition) {
        return parsed as StudentExplanation
      }
    } catch (err: any) {
      console.warn('[explainService] OpenRouter failed, trying Gemini:', err?.message || err)
    }
  }

  // 3. Try Gemini
  if (process.env.GEMINI_API_KEY) {
    try {
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
      const modelName = process.env.GEMINI_MODEL || 'gemini-3.6-flash'
      const model = genAI.getGenerativeModel({
        model: modelName,
        systemInstruction: systemPrompt,
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.3,
        },
      })
      const result = await model.generateContent(userPrompt)
      const text = result.response.text()
      const cleaned = cleanJson(text)
      const parsed = JSON.parse(cleaned)
      if (parsed.summary && parsed.intuition) {
        return parsed as StudentExplanation
      }
    } catch (err: any) {
      console.warn('[explainService] Gemini failed, using procedural fallback:', err?.message || err)
    }
  }

  // Fallback
  return generateProceduralStudentExplanation(options.spec, options.quote, options.mode, options.customQuestion, options.metrics)
}

/**
 * Procedural fallback for explaining selected text snippets.
 */
export function generateProceduralSelectionExplanation(
  options: ExplainSelectionOptions
): SelectionExplanation {
  const { selectedText, parentTopic, domain = 'physics', mode = 'standard' } = options
  const trimmed = selectedText.trim()
  const title = trimmed.length > 50 ? `${trimmed.substring(0, 47)}...` : trimmed

  return {
    selectedText: trimmed,
    conceptTitle: parentTopic ? `${parentTopic}: ${title}` : title,
    domain,
    summary: `Explanation of "${trimmed}" in the context of ${parentTopic || domain}.`,
    detailedExplanation: [
      `In ${domain}, "${trimmed}" relates to the fundamental physical principles governing the system's state, balance, and dynamical evolution.`,
      mode === 'beginner'
        ? `Think of it like a key component in an interconnected machine: when this aspect changes, it directly influences the observable outcome and behavior.`
        : `This term or phrase establishes the boundary condition and analytical basis used to describe the underlying quantitative relationship.`,
    ],
    keyTakeaways: [
      `Key concept in ${parentTopic || domain}: "${trimmed}"`,
      `Interpreted in the context of the surrounding textbook material.`,
      `Crucial for setting up the governing equation or conceptual model.`,
    ],
    realWorldExample: `Practical application of ${title} in scientific analysis and everyday technology.`,
    relatedFormulas: [],
  }
}

/**
 * Generates an in-depth student explanation for arbitrary selected text within textbook / topic context.
 */
export async function generateSelectionExplanation(
  options: ExplainSelectionOptions
): Promise<SelectionExplanation> {
  const { selectedText, surroundingContext, parentTopic, domain = 'physics', mode = 'standard' } = options

  const systemPrompt = `You are a friendly STEM tutor for high-school and first-year college students. A student highlighted a term, phrase, or sentence in their textbook.

Explain it so they understand it the first time:
- Use simple everyday language. Define any jargon in one short phrase.
- Lead with a plain-English meaning, then a real-life example (sports, vehicles, phones, cooking, weather).
- Make the idea easier with a short analogy and, if useful, a tiny step-by-step.
- Keep it short. Prefer bullets or a small comparison table over a long essay.

Inside detailedExplanation strings you MAY use GitHub-flavored Markdown: bullet lists, numbered lists, **bold** key terms, and pipe tables. Do not wrap the JSON in markdown fences.
Write formulas in LaTeX with dollar signs: inline $F = ma$, display $$F_{net} = ma$$. Never put math in backticks.

Respond ONLY with a valid JSON object matching this schema (pure JSON):
{
  "selectedText": "the selected text",
  "conceptTitle": "A clear, concise title for this concept (3-6 words)",
  "domain": "physics|chemistry|math|general",
  "summary": "1 simple sentence a student could repeat to a friend",
  "detailedExplanation": [
    "Everyday analogy + real-life example (markdown bullets OK)",
    "How it works in this textbook context; a small markdown table if comparing cases"
  ],
  "keyTakeaways": [
    "Bullet point 1 in simple words",
    "Bullet point 2",
    "Bullet point 3"
  ],
  "realWorldExample": "One concrete everyday or modern-engineering example",
  "relatedFormulas": ["optional relevant formula in LaTeX/plain text if applicable"]
}`

  const userPrompt = `Target Learning Level: ${mode.toUpperCase()}
Selected Text: "${selectedText}"
${parentTopic ? `Parent Topic / Chapter: "${parentTopic}"\n` : ''}
${domain ? `Academic Domain: "${domain}"\n` : ''}
${surroundingContext ? `Surrounding Page / Paragraph Context: "${surroundingContext.substring(0, 600)}"\n` : ''}

Explain this highlighted text clearly for the student.`

  // 1. Groq first — ChatPane + PDF highlight inject
  const groqParsed = await tryGroqJson(systemPrompt, userPrompt, 'selection explanation')
  if (groqParsed && typeof groqParsed === 'object' && groqParsed !== null) {
    const parsed = groqParsed as SelectionExplanation
    if (parsed.summary && parsed.detailedExplanation) {
      return parsed
    }
  }

  // 2. Try OpenRouter
  if (process.env.OPENROUTER_API_KEY) {
    try {
      const openai = new OpenAI({
        apiKey: process.env.OPENROUTER_API_KEY,
        baseURL: 'https://openrouter.ai/api/v1',
        defaultHeaders: {
          'HTTP-Referer': 'https://github.com/pdf-simulation',
          'X-Title': 'PDF Simulation Selection Explainer',
        },
      })
      const model = process.env.OPENROUTER_MODEL || 'nvidia/nemotron-3.5-lightning:free'
      const completion = await openai.chat.completions.create({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.3,
      })
      const text = completion.choices[0]?.message?.content || ''
      const cleaned = cleanJson(text)
      const parsed = JSON.parse(cleaned)
      if (parsed.summary && parsed.detailedExplanation) {
        return parsed as SelectionExplanation
      }
    } catch (err: any) {
      console.warn('[explainService] OpenRouter selection explanation failed, trying Gemini:', err?.message || err)
    }
  }

  // 3. Try Gemini
  if (process.env.GEMINI_API_KEY) {
    try {
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
      const modelName = process.env.GEMINI_MODEL || 'gemini-3.6-flash'
      const model = genAI.getGenerativeModel({
        model: modelName,
        systemInstruction: systemPrompt,
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.3,
        },
      })
      const result = await model.generateContent(userPrompt)
      const text = result.response.text()
      const cleaned = cleanJson(text)
      const parsed = JSON.parse(cleaned)
      if (parsed.summary && parsed.detailedExplanation) {
        return parsed as SelectionExplanation
      }
    } catch (err: any) {
      console.warn('[explainService] Gemini selection explanation failed, using procedural fallback:', err?.message || err)
    }
  }

  return generateProceduralSelectionExplanation(options)
}

function sanitizeChatTurns(messages: ChatTurn[]): ChatTurn[] {
  return messages
    .filter(
      (m) =>
        m &&
        (m.role === 'user' || m.role === 'assistant') &&
        typeof m.content === 'string' &&
        m.content.trim().length > 0
    )
    .map((m) => ({ role: m.role, content: m.content.trim() }))
    .slice(-MAX_CHAT_TURNS)
}

function buildChatSystemPrompt(bookContext: ChatBookContext): string {
  const title = bookContext.title || 'this textbook'
  const domain = bookContext.domain || 'physics'
  const topic = bookContext.parentTopic ? ` The student is currently studying: ${bookContext.parentTopic}.` : ''
  const page =
    typeof bookContext.currentPage === 'number' ? ` They are on page ${bookContext.currentPage}.` : ''

  return `You are a friendly STEM tutor for high-school and first-year college students reading "${title}" (${domain}).${topic}${page}

Write so a student who is stuck on this page can understand it the first time:
- Use simple everyday language. Avoid jargon; if you must use a term, define it in one short phrase.
- Start with the idea in plain English, then add just enough detail to make it click.
- Always include at least one real-life example (sports, vehicles, phones, cooking, weather, or something they already know).
- Make the concept easier with a short analogy, then a tiny step-by-step if it helps.
- Keep answers focused. Prefer 1 short intro + bullets or a small table over a long essay.
- Use earlier turns for continuity. If a prior message is tagged as a PDF highlight, that passage is the current focus.

Format the "reply" string with GitHub-flavored Markdown (this is rendered in the chat UI):
- Use bullet lists (- item) or numbered lists for steps and takeaways.
- Use a markdown table when comparing two or more ideas (e.g. with vs without friction).
- You may use **bold** for key terms. Do not wrap the whole reply in a code fence.
- Write every formula in LaTeX with dollar signs so it renders as math: inline $F = ma$, display $$\\vec{F}_{net} = m\\vec{a}$$.
- Never put formulas in backticks or a boxed/code style. Do not wrap math in \\( \\) if you can use $ $.

Respond ONLY with a valid JSON object (no markdown fences around the JSON):
{
  "reply": "Markdown answer with bullets and/or a small table, plus a real-life example. Math uses $...$.",
  "relatedFormulas": ["F = ma"],
  "keyTakeaways": ["optional 1-3 short bullets"]
}`
}

function asChatReply(parsed: unknown): ChatReply | null {
  if (!parsed || typeof parsed !== 'object') return null
  const reply = (parsed as { reply?: unknown }).reply
  if (typeof reply !== 'string' || !reply.trim()) return null
  const formulas = (parsed as { relatedFormulas?: unknown }).relatedFormulas
  const takeaways = (parsed as { keyTakeaways?: unknown }).keyTakeaways
  return {
    reply: reply.trim(),
    relatedFormulas: Array.isArray(formulas)
      ? formulas.filter((f): f is string => typeof f === 'string' && f.trim().length > 0)
      : undefined,
    keyTakeaways: Array.isArray(takeaways)
      ? takeaways.filter((t): t is string => typeof t === 'string' && t.trim().length > 0)
      : undefined,
  }
}

export function generateProceduralChatReply(
  messages: ChatTurn[],
  bookContext: ChatBookContext = {}
): ChatReply {
  const lastUser = [...sanitizeChatTurns(messages)].reverse().find((m) => m.role === 'user')
  const topic = bookContext.parentTopic || bookContext.title || bookContext.domain || 'this topic'
  const question = lastUser?.content || 'your question'
  return {
    reply: `In the context of **${topic}**, here is a simple way to think about "${question}":

- It connects to the main idea on this page of the textbook.
- Picture a real-life version of the same idea (a moving car, a phone, or a ball you throw).
- This is a local fallback while the AI tutor is unavailable.

| Piece | What to notice |
| --- | --- |
| Your question | ${question.slice(0, 80)} |
| Context | ${topic} |`,
    relatedFormulas: [],
    keyTakeaways: [`Focus: ${question.slice(0, 80)}`, `Context: ${topic}`],
  }
}

/**
 * Multi-turn tutor reply. Sends the conversation history so the model can reference prior turns.
 * Cascade: Groq → OpenRouter → Gemini → procedural.
 */
export async function generateChatReply(
  messages: ChatTurn[],
  bookContext: ChatBookContext = {}
): Promise<ChatReply> {
  const turns = sanitizeChatTurns(messages)
  if (turns.length === 0 || turns[turns.length - 1].role !== 'user') {
    return generateProceduralChatReply(turns, bookContext)
  }

  const systemPrompt = buildChatSystemPrompt(bookContext)
  const llmMessages: LlmChatMessage[] = [{ role: 'system', content: systemPrompt }, ...turns]

  const groqParsed = await tryGroqJsonFromMessages(llmMessages, 'chat reply')
  const groqReply = asChatReply(groqParsed)
  if (groqReply) return groqReply

  if (process.env.OPENROUTER_API_KEY) {
    try {
      const openai = new OpenAI({
        apiKey: process.env.OPENROUTER_API_KEY,
        baseURL: 'https://openrouter.ai/api/v1',
        defaultHeaders: {
          'HTTP-Referer': 'https://github.com/pdf-simulation',
          'X-Title': 'PDF Simulation Chat',
        },
      })
      const model = process.env.OPENROUTER_MODEL || 'nvidia/nemotron-3.5-lightning:free'
      const completion = await openai.chat.completions.create({
        model,
        messages: llmMessages,
        temperature: 0.3,
      })
      const text = completion.choices[0]?.message?.content || ''
      const parsed = JSON.parse(cleanJson(text))
      const reply = asChatReply(parsed)
      if (reply) return reply
    } catch (err: any) {
      console.warn('[explainService] OpenRouter chat failed, trying Gemini:', err?.message || err)
    }
  }

  if (process.env.GEMINI_API_KEY) {
    try {
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
      const modelName = process.env.GEMINI_MODEL || 'gemini-3.6-flash'
      const model = genAI.getGenerativeModel({
        model: modelName,
        systemInstruction: systemPrompt,
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.3,
        },
      })
      const contents = turns.map((turn) => ({
        role: turn.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: turn.content }],
      }))
      const result = await model.generateContent({ contents })
      const text = result.response.text()
      const parsed = JSON.parse(cleanJson(text))
      const reply = asChatReply(parsed)
      if (reply) return reply
    } catch (err: any) {
      console.warn('[explainService] Gemini chat failed, using procedural fallback:', err?.message || err)
    }
  }

  return generateProceduralChatReply(turns, bookContext)
}

export function generateProceduralSimBrief(spec: SimSpec, quote?: string): SimBrief {
  const title = spec.title || 'this concept'
  const excerpt = (quote || spec.quote || '').trim()
  const aboutBits = [
    `This simulation is about **${title}**${spec.subtitle ? `: ${spec.subtitle}` : '.'}`,
    spec.caption || spec.topicExplanation || 'Watch the moving parts to see how the idea plays out over time.',
  ]
  const howBits = [
    spec.topicExplanation
      ? spec.topicExplanation
      : `In this animation, the on-screen motion follows the same rules as ${title} in the textbook.`,
    spec.equations && spec.equations.length > 0
      ? `The key relationship is $${spec.equations[0]}$. When a value in that formula changes, the animation path changes with it.`
      : 'Each moving piece stands for a real quantity (position, speed, or force). As time ticks, those quantities update together.',
    excerpt ? `The textbook says: "${excerpt}"` : '',
    formatBookNumbers(spec) || '',
    'Try changing a slider if you have one: that is the same as changing a number in the formula and watching what nature would do.',
  ]

  return {
    about: aboutBits.filter(Boolean).join('\n\n'),
    howItWorks: howBits.filter(Boolean).join('\n\n'),
  }
}

export async function generateSimBrief(spec: SimSpec, quote?: string): Promise<SimBrief> {
  const excerpt = (quote || spec.quote || '').trim()
  const systemPrompt = `You are a friendly STEM tutor for high-school students. Explain ONE simulation in two short sections.

Rules:
- Simple language. Define jargon in a short phrase.
- Include one everyday example in howItWorks.
- Use markdown: short paragraphs, bullets, **bold** key terms, and $LaTeX$ for formulas.
- Do NOT write a long essay. about: 3–5 sentences. howItWorks: 1 short intro + 3–5 bullets.

Respond ONLY with JSON (no markdown fences around the JSON):
{
  "about": "What this simulation is showing and why it exists.",
  "howItWorks": "How the topic works in THIS animation (what moves, what the formula means, one real-life example)."
}`

  const userPrompt = `Title: ${spec.title}
Subtitle: ${spec.subtitle || ''}
Domain: ${spec.domain || 'physics'}
Topic notes: ${spec.topicExplanation || ''}
Caption: ${spec.caption || ''}
Equations: ${(spec.equations || []).join('; ') || 'none'}
Textbook excerpt: ${excerpt || 'none'}
${formatBookNumbers(spec)}
Stage elements: ${JSON.stringify(spec.stage?.elements || []).substring(0, 400)}

Write the two-section student brief.`

  const parsed = await tryGroqJson(systemPrompt, userPrompt, 'sim brief')
  if (parsed && typeof parsed === 'object' && parsed !== null) {
    const about = (parsed as { about?: unknown }).about
    const howItWorks = (parsed as { howItWorks?: unknown }).howItWorks
    if (typeof about === 'string' && about.trim() && typeof howItWorks === 'string' && howItWorks.trim()) {
      return { about: about.trim(), howItWorks: howItWorks.trim() }
    }
  }

  return generateProceduralSimBrief(spec, quote)
}



