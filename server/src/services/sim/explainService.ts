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
}

/**
 * Procedural fallback student explanation generator for high reliability when LLMs are unavailable.
 */
export function generateProceduralStudentExplanation(
  spec: SimSpec,
  quote?: string,
  mode: 'beginner' | 'standard' | 'advanced' = 'standard',
  customQuestion?: string
): StudentExplanation {
  const domain = spec.domain || 'physics'
  const title = spec.title || 'Scientific Concept'

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
      `The visual components in the stage reflect exact algebraic balance.`,
      `Understanding this foundational principle simplifies advanced topics across ${domain}.`,
    ],
    tutorAnswer,
  }
}

/**
 * Builds the comprehensive educational prompt for the LLM.
 */
function buildPrompt(options: ExplainOptions): { systemPrompt: string; userPrompt: string } {
  const { spec, quote, pageText, mode = 'standard', customQuestion } = options

  const systemPrompt = `You are a world-class STEM professor and educational explainer known for making physics, chemistry, mathematics, and science crystal-clear, fascinating, and deeply intuitive for high-school and undergraduate students.

Your objective: Explain the interactive visual simulation provided below with utmost clarity, pedagogical rigor, and relatable intuition.

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

export async function generateStudentExplanation(options: ExplainOptions): Promise<StudentExplanation> {
  const { systemPrompt, userPrompt } = buildPrompt(options)

  // 1. Try OpenRouter
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
      console.warn('[explainService] OpenRouter failed, trying Groq/Gemini:', err?.message || err)
    }
  }

  // 2. Try Groq
  if (process.env.GROQ_API_KEY) {
    try {
      const openai = new OpenAI({
        apiKey: process.env.GROQ_API_KEY,
        baseURL: 'https://api.groq.com/openai/v1',
      })
      const model = process.env.GROQ_MODEL || 'openai/gpt-oss-120b'
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
      console.warn('[explainService] Groq failed, trying Gemini:', err?.message || err)
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
  return generateProceduralStudentExplanation(options.spec, options.quote, options.mode, options.customQuestion)
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

  const systemPrompt = `You are a world-class STEM educator. A student highlighted a specific term, phrase, or sentence from their textbook.
Your task is to provide a clear, intuitive, and pedagogically rich explanation of the selected text in the context of the surrounding material.

Respond ONLY with a valid JSON object matching this schema (no markdown fences, pure JSON):
{
  "selectedText": "the selected text",
  "conceptTitle": "A clear, concise title for this concept (3-6 words)",
  "domain": "physics|chemistry|math|general",
  "summary": "1 crisp, memorable sentence explaining what this selected text means",
  "detailedExplanation": [
    "Paragraph 1: Clear, intuitive explanation with a real-world analogy",
    "Paragraph 2: Detailed explanation of how this works and why it matters in this context"
  ],
  "keyTakeaways": [
    "Bullet point 1",
    "Bullet point 2",
    "Bullet point 3"
  ],
  "realWorldExample": "A practical everyday or modern engineering example of this concept",
  "relatedFormulas": ["optional relevant formula in LaTeX/plain text if applicable"]
}`

  const userPrompt = `Target Learning Level: ${mode.toUpperCase()}
Selected Text: "${selectedText}"
${parentTopic ? `Parent Topic / Chapter: "${parentTopic}"\n` : ''}
${domain ? `Academic Domain: "${domain}"\n` : ''}
${surroundingContext ? `Surrounding Page / Paragraph Context: "${surroundingContext.substring(0, 600)}"\n` : ''}

Explain this highlighted text clearly for the student.`

  // 1. Try OpenRouter
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
      console.warn('[explainService] OpenRouter selection explanation failed, trying Groq/Gemini:', err?.message || err)
    }
  }

  // 2. Try Groq
  if (process.env.GROQ_API_KEY) {
    try {
      const openai = new OpenAI({
        apiKey: process.env.GROQ_API_KEY,
        baseURL: 'https://api.groq.com/openai/v1',
      })
      const model = process.env.GROQ_MODEL || 'openai/gpt-oss-120b'
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
      console.warn('[explainService] Groq selection explanation failed, trying Gemini:', err?.message || err)
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

