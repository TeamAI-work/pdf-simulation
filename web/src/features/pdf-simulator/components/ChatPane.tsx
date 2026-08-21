// web/src/features/pdf-simulator/components/ChatPane.tsx

import React, { useCallback, useEffect, useRef, useState } from 'react'
import type { ChatMessage } from '../types/chat.js'
import { formulaToMarkdown } from '../utils/chatHelpers.js'
import { ChatMarkdown } from './ChatMarkdown.js'

export interface ChatPaneProps {
  messages: ChatMessage[]
  isLoading: boolean
  bookTitle?: string
  onSendMessage: (text: string) => void
  onClear: () => void
}

function truncateHighlight(text: string, maxLen = 48): string {
  const trimmed = text.trim()
  if (trimmed.length <= maxLen) return trimmed
  return `${trimmed.slice(0, maxLen - 1)}…`
}

function HighlightPill({ message }: { message: ChatMessage }) {
  const page = message.sourceHighlight?.page ?? '?'
  const text = message.sourceHighlight?.text ?? message.content
  return (
    <div className="chat-highlight-pill" title={text}>
      📄 From page {page}: &ldquo;{truncateHighlight(text)}&rdquo;
    </div>
  )
}

function UserBubble({ message }: { message: ChatMessage }) {
  return (
    <div className="chat-bubble-user">
      <span className="chat-bubble-label">You</span>
      <div className="chat-bubble-body">{message.content}</div>
    </div>
  )
}

function ChatThinking() {
  return (
    <div className="chat-bubble-ai chat-thinking" aria-busy="true" aria-live="polite" aria-label="AI is thinking">
      <span className="chat-thinking__orb" aria-hidden="true" />
      <span className="chat-thinking__label">Thinking</span>
      <span className="chat-thinking__dots" aria-hidden="true">
        <span />
        <span />
        <span />
      </span>
    </div>
  )
}

function AiBubble({ message }: { message: ChatMessage }) {
  if (message.isLoading) {
    return <ChatThinking />
  }

  return (
    <div className={`chat-bubble-ai${message.isError ? ' error' : ''}`}>
      <span className="chat-bubble-label">AI</span>
      {message.isError ? (
        <div className="chat-bubble-body">{message.content}</div>
      ) : (
        <ChatMarkdown>{message.content}</ChatMarkdown>
      )}
      {!message.isError && message.relatedFormulas && message.relatedFormulas.length > 0 && (
        <div className="chat-formula-list">
          {message.relatedFormulas.map((formula, idx) => (
            <ChatMarkdown key={`${formula}-${idx}`}>{formulaToMarkdown(formula)}</ChatMarkdown>
          ))}
        </div>
      )}
      {!message.isError && message.keyTakeaways && message.keyTakeaways.length > 0 && (
        <ul className="chat-takeaways">
          {message.keyTakeaways.map((item, idx) => (
            <li key={`${idx}-${item}`}>
              <ChatMarkdown>{item}</ChatMarkdown>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function ChatMessageItem({ message }: { message: ChatMessage }) {
  if (message.role === 'system') {
    return <HighlightPill message={message} />
  }
  if (message.role === 'user') {
    return <UserBubble message={message} />
  }
  return <AiBubble message={message} />
}

export const ChatPane: React.FC<ChatPaneProps> = ({
  messages,
  isLoading,
  bookTitle,
  onSendMessage,
  onClear,
}) => {
  const [draft, setDraft] = useState('')
  const listRef = useRef<HTMLDivElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const userScrolledUpRef = useRef(false)

  const resizeTextarea = useCallback(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`
  }, [])

  useEffect(() => {
    resizeTextarea()
  }, [draft, resizeTextarea])

  const handleScroll = () => {
    const el = listRef.current
    if (!el) return
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight
    userScrolledUpRef.current = distanceFromBottom > 80
  }

  useEffect(() => {
    if (userScrolledUpRef.current) return
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const submit = () => {
    const text = draft.trim()
    if (!text || isLoading) return
    onSendMessage(text)
    setDraft('')
    userScrolledUpRef.current = false
    requestAnimationFrame(resizeTextarea)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      submit()
    }
  }

  const hasMessages = messages.length > 0

  return (
    <div className="chat-pane">
      {hasMessages && (
        <div className="chat-pane__toolbar">
          <button
            type="button"
            className="chat-clear-btn"
            onClick={onClear}
            disabled={isLoading}
          >
            Clear
          </button>
        </div>
      )}

      <div
        ref={listRef}
        className="chat-messages-list"
        onScroll={handleScroll}
      >
        {!hasMessages ? (
          <div className="chat-empty-state">
            <span className="chat-empty-state__icon">🤖</span>
            <p className="chat-empty-state__title">Ask me anything about this PDF.</p>
            <p className="chat-empty-state__desc">
              Select text to get an instant explanation, or type your question below.
              {bookTitle ? ` Reading: ${bookTitle}` : ''}
            </p>
          </div>
        ) : (
          messages.map((message) => (
            <ChatMessageItem key={message.id} message={message} />
          ))
        )}
        <div ref={bottomRef} />
      </div>

      <div className="chat-input-footer">
        <textarea
          ref={textareaRef}
          className="chat-input"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask anything about this PDF…"
          rows={1}
          disabled={isLoading}
          aria-label="Chat message input"
        />
        <button
          type="button"
          className="chat-send-btn"
          onClick={submit}
          disabled={isLoading || !draft.trim()}
          aria-label="Send message"
        >
          →
        </button>
      </div>
    </div>
  )
}
