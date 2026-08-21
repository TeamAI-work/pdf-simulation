// web/src/features/pdf-simulator/types/chat.ts

export type ChatMessageRole = 'user' | 'ai' | 'system'

export type RightTab = 'chat' | 'sim' | 'notes'

export interface ChatMessage {
  id: string
  role: ChatMessageRole
  content: string
  timestamp: Date
  sourceHighlight?: { text: string; page: number }
  relatedFormulas?: string[]
  keyTakeaways?: string[]
  conceptTitle?: string
  selectedText?: string
  surroundingContext?: string
  isLoading?: boolean
  isError?: boolean
}
