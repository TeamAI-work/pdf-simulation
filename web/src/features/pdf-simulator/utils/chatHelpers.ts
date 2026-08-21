// web/src/features/pdf-simulator/utils/chatHelpers.ts

import type { SimSpec } from '@pdf-sim/shared'
import type { SelectionExplanation } from '../api.js'
import type { ChatMessage } from '../types/chat.js'

const DOMAINS = ['physics', 'chemistry', 'math', 'general'] as const
export type ChatDomain = (typeof DOMAINS)[number]

export function formatSelectionReply(result: SelectionExplanation): string {
  const parts = [result.summary, ...result.detailedExplanation].filter(Boolean)
  if (result.realWorldExample) {
    parts.push(`**Everyday example:** ${result.realWorldExample}`)
  }
  return parts.join('\n\n')
}

/** Convert \(...\) / \[...\] / ```latex blocks into $ / $$ so KaTeX can render them. */
export function normalizeChatMath(text: string): string {
  return text
    .replace(/```(?:latex|tex|math)\s*\n([\s\S]*?)```/gi, (_, inner: string) => `\n\n$$\n${inner.trim()}\n$$\n\n`)
    .replace(/\\\[([\s\S]*?)\\\]/g, (_, inner: string) => `\n\n$$\n${inner.trim()}\n$$\n\n`)
    .replace(/\\\(([\s\S]*?)\\\)/g, (_, inner: string) => `$${inner.trim()}$`)
}

export function formulaToMarkdown(formula: string): string {
  const trimmed = formula.trim()
  if (!trimmed) return ''
  if (trimmed.startsWith('$$') || (trimmed.startsWith('$') && trimmed.endsWith('$'))) {
    return trimmed
  }
  const unwrapped = trimmed
    .replace(/^\\\(|\\\)$/g, '')
    .replace(/^\\\[|\\\]$/g, '')
    .replace(/^\$+|\$+$/g, '')
    .trim()
  return `$$${unwrapped}$$`
}

export function getLastAiMessage(msgs: ChatMessage[]): ChatMessage | undefined {
  return [...msgs].reverse().find(
    (m) => m.role === 'ai' && !m.isLoading && !m.isError && Boolean(m.content)
  )
}

export function coerceDomain(value?: string): ChatDomain {
  if (value && (DOMAINS as readonly string[]).includes(value)) {
    return value as ChatDomain
  }
  return 'physics'
}

export function buildSimExplainPrompt(spec: SimSpec, quote?: string): string {
  const title = spec.title?.trim() || 'this simulation'
  const parts = [title]
  if (spec.subtitle?.trim()) parts.push(spec.subtitle.trim())
  if (spec.topicExplanation?.trim()) parts.push(spec.topicExplanation.trim())
  const excerpt = (quote || spec.quote || '').trim()
  if (excerpt) parts.push(`textbook: "${excerpt}"`)
  if (spec.equations && spec.equations.length > 0) {
    parts.push(`equations: ${spec.equations.join('; ')}`)
  }
  const inner = parts.join('. ')
  return `explain me (${inner})`
}

export function buildFollowupSpec(
  lastAi: ChatMessage,
  parentTopic: string,
  domain: ChatDomain
): SimSpec {
  const summary = lastAi.content.split('\n\n')[0] || lastAi.content
  return {
    version: '2.0',
    title: lastAi.conceptTitle || 'Follow-up',
    domain,
    isSimulatable: false,
    topicExplanation: summary,
    parentTopic,
    subtitle: summary,
    caption: '',
    quote: lastAi.selectedText || '',
    equations: lastAi.relatedFormulas || [],
    reasonIfNotSimulatable: '',
  }
}

export const CHAT_ERROR_CONTENT = '⚠️ Could not get a response. Please try again.'

export function toChatApiMessages(msgs: ChatMessage[]): Array<{ role: 'user' | 'assistant'; content: string }> {
  return msgs
    .filter((m) => !m.isLoading && !m.isError && Boolean(m.content?.trim()))
    .map((m) => {
      if (m.role === 'ai') {
        return { role: 'assistant' as const, content: m.content.trim() }
      }
      if (m.role === 'system') {
        const page = m.sourceHighlight?.page
        const text = (m.sourceHighlight?.text || m.content).trim()
        const prefix = typeof page === 'number' ? `[PDF highlight, page ${page}] ` : '[PDF highlight] '
        return { role: 'user' as const, content: `${prefix}${text}` }
      }
      return { role: 'user' as const, content: m.content.trim() }
    })
}
