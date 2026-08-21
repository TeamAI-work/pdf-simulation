// web/src/features/pdf-simulator/fixtures/chatUiPreview.ts

import type { ChatMessage } from '../types/chat.js'

/** Sample thread for Phase 1B UI preview (all bubble types). */
export const CHAT_UI_PREVIEW_MESSAGES: ChatMessage[] = [
  {
    id: 'preview-system',
    role: 'system',
    content: "Newton's First Law states that an object at rest stays at rest",
    timestamp: new Date(),
    sourceHighlight: {
      text: "Newton's First Law states that an object at rest stays at rest",
      page: 3,
    },
  },
  {
    id: 'preview-ai',
    role: 'ai',
    content:
      "Newton's First Law (the law of inertia) says an object keeps its velocity unless a net force acts on it.\n\nIn everyday terms: a book on a table stays put until you push it.",
    timestamp: new Date(),
    relatedFormulas: ['F_net = ma', 'F = μN'],
    keyTakeaways: [
      'Inertia resists changes in motion',
      'Net force is required to accelerate',
      'Friction is a real force that can stop motion',
    ],
    conceptTitle: "Newton's First Law",
    selectedText: "Newton's First Law states that an object at rest stays at rest",
  },
  {
    id: 'preview-user',
    role: 'user',
    content: 'What about friction?',
    timestamp: new Date(),
  },
  {
    id: 'preview-error',
    role: 'ai',
    content: '⚠️ Could not get a response. Please try again.',
    timestamp: new Date(),
    isError: true,
  },
]
