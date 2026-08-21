// web/src/features/pdf-simulator/__tests__/chatHelpers.test.ts

import { describe, it, expect } from 'vitest'
import type { SelectionExplanation } from '../api.js'
import type { ChatMessage } from '../types/chat.js'
import {
  buildFollowupSpec,
  buildSimExplainPrompt,
  CHAT_ERROR_CONTENT,
  coerceDomain,
  formatSelectionReply,
  formulaToMarkdown,
  getLastAiMessage,
  normalizeChatMath,
  toChatApiMessages,
} from '../utils/chatHelpers.js'

function msg(overrides: Partial<ChatMessage> & Pick<ChatMessage, 'id' | 'role' | 'content'>): ChatMessage {
  return {
    timestamp: new Date(),
    ...overrides,
  }
}

describe('chatHelpers', () => {
  it('formatSelectionReply joins summary and detailed paragraphs', () => {
    const result: SelectionExplanation = {
      selectedText: 'inertia',
      conceptTitle: 'Inertia',
      domain: 'physics',
      summary: 'Objects resist changes in motion.',
      detailedExplanation: ['Paragraph one.', 'Paragraph two.'],
      keyTakeaways: ['Stay at rest', 'Stay in motion'],
    }

    expect(formatSelectionReply(result)).toBe(
      'Objects resist changes in motion.\n\nParagraph one.\n\nParagraph two.'
    )
  })

  it('formatSelectionReply appends the everyday example when present', () => {
    const result: SelectionExplanation = {
      selectedText: 'inertia',
      conceptTitle: 'Inertia',
      domain: 'physics',
      summary: 'Objects resist changes in motion.',
      detailedExplanation: ['Paragraph one.'],
      keyTakeaways: [],
      realWorldExample: 'A passenger lurches forward when a bus stops.',
    }

    expect(formatSelectionReply(result)).toContain('**Everyday example:** A passenger lurches forward when a bus stops.')
  })

  it('getLastAiMessage skips loading and error bubbles', () => {
    const messages: ChatMessage[] = [
      msg({ id: 'u1', role: 'user', content: 'What is inertia?' }),
      msg({
        id: 'a1',
        role: 'ai',
        content: 'Inertia is resistance to change in motion.',
        conceptTitle: 'Inertia',
      }),
      msg({ id: 'u2', role: 'user', content: 'And friction?' }),
      msg({ id: 'a2', role: 'ai', content: '', isLoading: true }),
    ]

    const last = getLastAiMessage(messages)
    expect(last?.id).toBe('a1')
    expect(last?.conceptTitle).toBe('Inertia')
  })

  it('getLastAiMessage ignores failed replies so the next send can retry', () => {
    const messages: ChatMessage[] = [
      msg({ id: 'a1', role: 'ai', content: 'Good answer', conceptTitle: 'Inertia' }),
      msg({ id: 'a2', role: 'ai', content: CHAT_ERROR_CONTENT, isError: true }),
    ]

    expect(getLastAiMessage(messages)?.id).toBe('a1')
  })

  it('coerceDomain falls back to physics for unknown values', () => {
    expect(coerceDomain('chemistry')).toBe('chemistry')
    expect(coerceDomain('not-a-domain')).toBe('physics')
    expect(coerceDomain(undefined)).toBe('physics')
  })

  it('buildFollowupSpec keeps concept metadata for the tutor path', () => {
    const lastAi = msg({
      id: 'a1',
      role: 'ai',
      content: 'Inertia resists acceleration.\n\nMore detail here.',
      conceptTitle: 'Inertia',
      selectedText: 'an object at rest stays at rest',
      relatedFormulas: ['F = ma'],
    })

    const spec = buildFollowupSpec(lastAi, 'Classical Mechanics', 'physics')
    expect(spec.version).toBe('2.0')
    expect(spec.title).toBe('Inertia')
    expect(spec.isSimulatable).toBe(false)
    expect(spec.quote).toBe('an object at rest stays at rest')
    expect(spec.equations).toEqual(['F = ma'])
    expect(spec.topicExplanation).toBe('Inertia resists acceleration.')
  })

  it('toChatApiMessages maps roles and skips loading/error bubbles', () => {
    const mapped = toChatApiMessages([
      msg({
        id: 's1',
        role: 'system',
        content: 'Newton first law',
        sourceHighlight: { text: 'Newton first law', page: 3 },
      }),
      msg({ id: 'a1', role: 'ai', content: 'It is inertia.', conceptTitle: 'Inertia' }),
      msg({ id: 'u1', role: 'user', content: 'What about friction?' }),
      msg({ id: 'load', role: 'ai', content: '', isLoading: true }),
      msg({ id: 'err', role: 'ai', content: CHAT_ERROR_CONTENT, isError: true }),
    ])

    expect(mapped).toEqual([
      { role: 'user', content: '[PDF highlight, page 3] Newton first law' },
      { role: 'assistant', content: 'It is inertia.' },
      { role: 'user', content: 'What about friction?' },
    ])
  })

  it('normalizeChatMath converts LaTeX delimiters to dollar math', () => {
    expect(normalizeChatMath('Use \\(F = ma\\) here.')).toBe('Use $F = ma$ here.')
    expect(normalizeChatMath('Display \\[a = \\frac{F}{m}\\] now')).toContain('$$\n')
    expect(normalizeChatMath('Display \\[a = \\frac{F}{m}\\] now')).toContain('a = \\frac{F}{m}')
  })

  it('formulaToMarkdown wraps bare LaTeX for display math', () => {
    expect(formulaToMarkdown('F = ma')).toBe('$$F = ma$$')
    expect(formulaToMarkdown('$F = ma$')).toBe('$F = ma$')
  })

  it('buildSimExplainPrompt wraps sim data in explain me (...)', () => {
    const prompt = buildSimExplainPrompt(
      {
        version: '2.0',
        title: 'Projectile Motion',
        subtitle: 'A ball in flight',
        domain: 'physics',
        isSimulatable: true,
        topicExplanation: 'Gravity pulls the ball down.',
        caption: '',
        parentTopic: '',
        quote: 'an object launched at an angle',
        equations: ['y = v0 t - 0.5 g t^2'],
        reasonIfNotSimulatable: '',
      },
      'an object launched at an angle'
    )
    expect(prompt.startsWith('explain me (')).toBe(true)
    expect(prompt).toContain('Projectile Motion')
    expect(prompt).toContain('Gravity pulls the ball down.')
    expect(prompt).toContain('y = v0 t - 0.5 g t^2')
    expect(prompt.endsWith(')')).toBe(true)
  })
})
