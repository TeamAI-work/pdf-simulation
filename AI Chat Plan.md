# AI Chat Section — Implementation Plan

## What Already Exists (Don't Duplicate)

| Piece | File | What it does |
|-------|------|-------------|
| `TextSelectionExplainer` | `components/TextSelectionExplainer.tsx` | Floating button on PDF text selection → full-screen modal with concept explanation + follow-up Q&A thread |
| `explainSelectionText()` | `api.ts` → `/api/sim/explain-selection` | One-shot selection explanation (returns `SelectionExplanation`) |
| `fetchStudentExplanation()` | `api.ts` → `/api/sim/explain` | Deep spec explanation with `tutorAnswer` for a custom question |
| Follow-up Q&A in modal | `TextSelectionExplainer.tsx` lines 140–177 | Already a mini-chat inside the modal, but stateless and modal-only |

**Key insight:** The existing `TextSelectionExplainer` is a *modal* — it vanishes on close and holds no history. The new `ChatPane` is a **persistent inline panel** in the right sidebar that survives navigation, accumulates a full conversation thread, and is always visible.

---

## What ChatPane Is

The **Chat tab** is one of three views in the right panel. The right panel shows only the **active tab** at a time, switched by buttons at the top:

```
┌──────────────────────────────────┐
│  [💬 Chat] [🔬 Sim] [📓 Notes]  │  ← tab bar
├──────────────────────────────────┤
│                                  │
│  ┌────────────────────────────┐  │
│  │ 📄 From page 3 (highlight) │  │  ← highlight inject pill
│  │  "Newton's First Law..."   │  │
│  └────────────────────────────┘  │
│                                  │
│  [AI]  Newton's First Law says   │  ← AI bubble
│        that an object at rest    │
│        stays at rest unless...   │
│                                  │
│  [You] What about friction?      │  ← user bubble
│                                  │
│  [AI]  Great question! Friction  │
│        is a contact force that…  │
│        🔗 Related: F = μN        │
│                                  │
│  ┌── [Ask anything about PDF]──┐ │
│  │  Type here... (Enter/Send)  │ │  ← input footer
│  └─────────────────────[ → ]──┘ │
└──────────────────────────────────┘
```

The Chat tab is **programmatically activated** whenever the user clicks "✨ Explain" on selected PDF text — `ReaderRoute` calls `setActiveTab('chat')` before injecting the message.

---

## Message Types

```typescript
type ChatMessageRole = 'user' | 'ai' | 'system'

interface ChatMessage {
  id: string                    // crypto.randomUUID()
  role: ChatMessageRole
  content: string               // plain text or markdown
  timestamp: Date
  sourceHighlight?: {           // set when message was injected from PDF selection
    text: string
    page: number
  }
  relatedFormulas?: string[]    // from SelectionExplanation
  keyTakeaways?: string[]       // from SelectionExplanation
  isLoading?: boolean           // true while AI is responding
  isError?: boolean
}
```

---

## Two Input Modes

### Mode 1 — Free-type Question
User types a question in the input bar and presses Enter / clicks Send.

**What happens:**
1. A `user` message is appended to the thread
2. A skeleton `ai` message (with `isLoading: true`) is appended
3. Call `/api/sim/explain-selection` with:
   - `selectedText` = user's typed question
   - `surroundingContext` = last AI message content (for conversational continuity)
   - `parentTopic` = `selectedAnnotation?.spec.parentTopic || bookTitle`
   - `domain` = `selectedAnnotation?.spec.domain || 'physics'`
4. Replace the skeleton with the real AI response

### Mode 2 — PDF Highlight Inject
User selects text in the PDF → clicks **"✨ Explain"** button (existing `TextSelectionExplainer`) → instead of opening a modal, it **injects into ChatPane**.

**What happens:**
1. A `system` pill message is appended: `📄 From page N: "selected text"`
2. A skeleton `ai` message is appended
3. Call `/api/sim/explain-selection` with the selected text + context
4. Replace skeleton with AI response including `relatedFormulas`, `keyTakeaways`

> **This means `TextSelectionExplainer` no longer opens a modal.** Instead it calls `onInjectToChat(selectedText, page, surroundingContext)` provided by `ReaderRoute`. The modal is retired.

---

## Backend Changes

### Phase 1 — Reuse Existing Endpoints (no new backend needed)

| Endpoint | Used for |
|----------|---------|
| `POST /api/sim/explain-selection` | All chat messages (both modes) |
| `POST /api/sim/explain` | When user asks about the *active simulation* specifically |

### Phase 2 — New `/api/sim/chat` Endpoint (Multi-turn)

For true **multi-turn context** — sends the full conversation history to the LLM so it can reference previous messages.

```typescript
// POST /api/sim/chat
// Body:
{
  messages: Array<{ role: 'user' | 'assistant', content: string }>,
  bookContext: {
    title: string,
    currentPage: number,
    parentTopic?: string,
    domain?: string,
  }
}
// Returns: { reply: string, relatedFormulas?: string[] }
```

This endpoint uses the LLM cascade (OpenRouter → Groq → Gemini) and passes the message array as `messages` to the chat completion API. The server builds a system prompt:

> *"You are an AI tutor helping a student reading [bookTitle]. Answer questions clearly and concisely in the context of the book."*

**Build order:** Ship Phase 1 first. Add `/api/sim/chat` in Phase 2 for true conversational context.

---

## Frontend — `ChatPane.tsx`

### Props

```typescript
interface ChatPaneProps {
  messages: ChatMessage[]
  isLoading: boolean              // true while any AI message is pending
  bookTitle?: string
  parentTopic?: string
  domain?: string
  onSendMessage: (text: string) => void
  onClear: () => void
}
```

### Internal Structure

```
ChatPane
├── .chat-messages-list         ← scrollable message thread
│   ├── HighlightPill           ← for role='system' (highlight inject)
│   ├── UserBubble              ← for role='user'
│   └── AiBubble                ← for role='ai', renders markdown
│       ├── content text
│       ├── [formula chips]     ← relatedFormulas
│       └── [takeaway list]     ← keyTakeaways
└── .chat-input-footer
    ├── <textarea>              ← auto-expands, Enter sends, Shift+Enter newline
    └── <button> Send
```

### Scroll Behaviour
- Auto-scroll to bottom on every new message (`useEffect` with `scrollIntoView`)
- Scroll is suppressed if user has manually scrolled up (detect via scroll position)

### Empty State
When `messages.length === 0`:
```
  🤖
  Ask me anything about this PDF.
  Select text to get an instant explanation,
  or type your question below.
```

---

## State Management in `ReaderRoute.tsx`

All chat state lives in `ReaderRoute`. Critically, `activeTab` also lives here so that:
- Clicking "✨ Explain" on PDF text → `setActiveTab('chat')` then injects message
- The Chat tab content (`ChatPane`) is **unmounted** when another tab is active, but `chatMessages` survives in `ReaderRoute` state

```typescript
type RightTab = 'chat' | 'sim' | 'notes'

const [activeTab, setActiveTab] = useState<RightTab>('chat')
const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
const [isChatLoading, setIsChatLoading] = useState(false)

const handleSendChatMessage = async (text: string) => {
  const userMsg: ChatMessage = {
    id: crypto.randomUUID(), role: 'user', content: text, timestamp: new Date()
  }
  const loadingMsg: ChatMessage = {
    id: crypto.randomUUID(), role: 'ai', content: '', timestamp: new Date(), isLoading: true
  }

  setChatMessages(prev => [...prev, userMsg, loadingMsg])
  setIsChatLoading(true)

  const result = await simApiClient.explainSelectionText({
    selectedText: text,
    surroundingContext: chatMessages.at(-1)?.content, // last AI reply as context
    parentTopic: selectedAnnotation?.spec.parentTopic || bookTitle,
    domain: selectedAnnotation?.spec.domain || 'physics',
  })

  setChatMessages(prev => prev.map(m =>
    m.isLoading ? {
      ...m,
      isLoading: false,
      content: result.detailedExplanation.join('\n\n'),
      relatedFormulas: result.relatedFormulas,
      keyTakeaways: result.keyTakeaways,
    } : m
  ))
  setIsChatLoading(false)
}

const handleInjectToChat = async (selectedText: string, page: number, context: string) => {
  setActiveTab('chat')   // ← switch to chat tab first

  const pill: ChatMessage = {
    id: crypto.randomUUID(), role: 'system',
    content: selectedText, timestamp: new Date(),
    sourceHighlight: { text: selectedText, page },
  }
  const loading: ChatMessage = {
    id: crypto.randomUUID(), role: 'ai', content: '', timestamp: new Date(), isLoading: true
  }

  setChatMessages(prev => [...prev, pill, loading])
  setIsChatLoading(true)

  const result = await simApiClient.explainSelectionText({
    selectedText,
    surroundingContext: context,
    parentTopic: selectedAnnotation?.spec.parentTopic || bookTitle,
    domain: selectedAnnotation?.spec.domain || 'physics',
  })

  setChatMessages(prev => prev.map(m =>
    m.isLoading ? {
      ...m,
      isLoading: false,
      content: [result.summary, ...result.detailedExplanation].join('\n\n'),
      relatedFormulas: result.relatedFormulas,
      keyTakeaways: result.keyTakeaways,
    } : m
  ))
  setIsChatLoading(false)
}
```

---

## `TextSelectionExplainer` Rework

The existing component is **modified, not deleted**.

| | Before | After |
|--|--------|-------|
| Size | ~510 lines | ~80 lines |
| Responsibility | Manages fetch + full-screen modal | Only tracks selection position, fires callbacks |
| Modal | Opens full-screen overlay | **Removed** |
| State | `isExplaining`, `explanation`, `followupThread`, `followupQ` | **All removed** |

```typescript
// NEW props — replaces all old props
interface TextSelectionExplainerProps {
  onExplain: (selectedText: string, page: number, context: string) => void  // → Chat inject
  onAddNote?: (selectedText: string, page: number) => void                   // → Notebook
  currentPage: number
}
```

The floating button row near the selection now shows two buttons side by side:
```
[ ✨ Explain ]  [ 📓 Add Note ]
```

---

## CSS Design (`index.css` additions)

### Tab Bar
```css
.right-panel__tab-bar {
  display: flex;
  border-bottom: 1px solid var(--color-border);
  background: var(--color-surface-2);
  padding: 0 0.5rem;
  gap: 0.25rem;
}

.right-panel__tab-btn {
  flex: 1;
  padding: 0.6rem 0.5rem;
  font-size: 0.78rem;
  font-weight: 600;
  border: none;
  background: transparent;
  color: var(--color-text-muted);
  cursor: pointer;
  border-bottom: 2px solid transparent;
  transition: color 0.15s, border-color 0.15s;
}

.right-panel__tab-btn.active {
  color: var(--color-primary);
  border-bottom-color: var(--color-primary);
}
```

### Chat Panel Layout
```css
.chat-pane {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.chat-messages-list {
  flex: 1;
  overflow-y: auto;
  padding: 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  scroll-behavior: smooth;
}

.chat-input-footer {
  padding: 0.6rem 0.75rem;
  border-top: 1px solid var(--color-border);
  display: flex;
  gap: 0.5rem;
  align-items: flex-end;
  background: var(--color-surface-2);
}
```

### Message Bubbles
```css
/* User bubble — right-aligned, primary accent */
.chat-bubble-user {
  align-self: flex-end;
  background: linear-gradient(135deg, var(--color-primary), var(--color-accent));
  color: #fff;
  border-radius: 1rem 1rem 0.25rem 1rem;
  padding: 0.55rem 0.85rem;
  max-width: 85%;
  font-size: 0.83rem;
  line-height: 1.5;
}

/* AI bubble — left-aligned, surface */
.chat-bubble-ai {
  align-self: flex-start;
  background: var(--color-surface-2);
  border: 1px solid var(--color-border);
  border-radius: 1rem 1rem 1rem 0.25rem;
  padding: 0.65rem 0.9rem;
  max-width: 92%;
  font-size: 0.82rem;
  line-height: 1.6;
}

/* Skeleton shimmer for loading AI message */
.chat-bubble-ai.loading .chat-skeleton-line {
  height: 12px;
  border-radius: 4px;
  background: linear-gradient(90deg,
    var(--color-surface-3) 25%,
    var(--color-surface-2) 50%,
    var(--color-surface-3) 75%);
  background-size: 200% 100%;
  animation: shimmer 1.4s infinite;
}

/* Highlight inject pill */
.chat-highlight-pill {
  align-self: center;
  background: var(--color-primary-subtle);
  border: 1px solid rgba(37,99,235,0.2);
  border-radius: var(--radius-full);
  padding: 0.3rem 0.75rem;
  font-size: 0.75rem;
  color: var(--color-primary);
  font-style: italic;
  max-width: 90%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
```

### Input Textarea
```css
.chat-input {
  flex: 1;
  resize: none;
  min-height: 36px;
  max-height: 120px;
  padding: 0.45rem 0.7rem;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  color: var(--color-text);
  font-size: 0.82rem;
  font-family: var(--font-sans);
  line-height: 1.5;
  outline: none;
  transition: border-color 0.15s;
}

.chat-input:focus {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(37,99,235,0.12);
}
```

---

## File Change Summary

| Status | File | Change |
|--------|------|--------|
| **NEW** | `web/src/features/pdf-simulator/components/ChatPane.tsx` | Full chat UI component |
| **MODIFY** | `web/src/features/pdf-simulator/components/TextSelectionExplainer.tsx` | Strip modal/fetch logic → emit callbacks only (~80 lines) |
| **MODIFY** | `web/src/features/pdf-simulator/routes/ReaderRoute.tsx` | Add `activeTab`, `chatMessages`, `handleSendChatMessage`, `handleInjectToChat` |
| **MODIFY** | `web/src/index.css` | Tab bar, chat bubble, pill, input, shimmer styles |
| **OPTIONAL NEW** | `server/src/routes/simulation.ts` | `POST /sim/chat` for multi-turn (Phase 2) |
| **OPTIONAL MODIFY** | `server/src/services/sim/explainService.ts` | `generateChatReply()` with message history (Phase 2) |

---

## Build Phases

### Phase 1 — Core Chat (No new backend)
- [ ] Create `ChatPane.tsx` with message list, bubble rendering, input footer
- [ ] Add `activeTab` + `chatMessages` state in `ReaderRoute`
- [ ] Wire `handleSendChatMessage` → reuse `/api/sim/explain-selection`
- [ ] Rework `TextSelectionExplainer` to fire `onExplain` + `onAddNote` callbacks
- [ ] CSS: tab bar, bubbles, pill, shimmer loader, input
- [ ] Test: type question → AI replies; select PDF text → tab switches, pill + reply appear

### Phase 2 — Multi-turn Context
- [ ] Add `POST /api/sim/chat` route on server
- [ ] Implement `generateChatReply(messages[], bookContext)` in `explainService.ts`
- [ ] Send full `chatMessages` history to `/api/sim/chat` instead of single-shot `/explain-selection`

---

## Verification Checklist

1. Open book → right panel visible, Chat tab active by default with empty state
2. Type a question → user bubble appears → skeleton shimmer → AI bubble with answer
3. Type a follow-up → AI reply references previous context (Phase 2)
4. Select text in PDF → two buttons appear: "✨ Explain" and "📓 Add Note"
5. Click "✨ Explain" → Chat tab auto-activates → highlight pill + AI explanation appear (no modal)
6. After injection, user can type a follow-up question about the highlight
7. Click **Clear** → messages reset to empty state
8. Switch book page → chat history persists (session-level `useState` in `ReaderRoute`)
9. Error state: server unreachable → AI bubble shows ⚠️ error message inline
10. Loading: skeleton shimmer lines visible while AI is responding
11. Long thread: chat auto-scrolls to newest message on each new message
