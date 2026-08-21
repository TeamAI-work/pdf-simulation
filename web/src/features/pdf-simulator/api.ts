// web/src/features/pdf-simulator/api.ts

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

export interface ChatApiTurn {
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

export interface SimAnnotation {
  id: string
  book_id: string
  page_number: number
  quote: string
  spec: SimSpec
  spec_version: string
  content_hash?: string
  created_at: string
}

export interface BookRecord {
  id: string
  slug: string
  title: string
  storage_path: string
  page_count?: number
  status: 'pending' | 'extracting' | 'classifying' | 'ready' | 'failed'
  error?: string | null
  created_at: string
}

/**
 * In-memory cache for book annotations to guarantee zero redundant network requests (KP-11 mitigation).
 */
class SimulationApiClient {
  // bookId -> SimAnnotation[]
  private bookAnnotationsCache: Map<string, SimAnnotation[]> = new Map()
  // bookId -> BookRecord
  private bookCache: Map<string, BookRecord> = new Map()
  // specKey -> StudentExplanation
  private explanationCache: Map<string, StudentExplanation> = new Map()
  private simBriefCache: Map<string, SimBrief> = new Map()
  // Single-flight in-flight request deduping: requestKey -> Promise<any>
  private pendingRequests: Map<string, Promise<any>> = new Map()

  /**
   * Fetch book details by ID or slug.
   */
  async fetchBook(bookIdOrSlug: string): Promise<BookRecord | null> {
    if (this.bookCache.has(bookIdOrSlug)) {
      return this.bookCache.get(bookIdOrSlug)!
    }

    const key = `book:${bookIdOrSlug}`
    if (this.pendingRequests.has(key)) {
      return this.pendingRequests.get(key)!
    }

    const request = (async () => {
      try {
        const res = await fetch(`/api/sim/books/${encodeURIComponent(bookIdOrSlug)}`)
        if (!res.ok) {
          if (res.status === 404) return null
          throw new Error(`Failed to fetch book: ${res.statusText}`)
        }
        const data = await res.json()
        if (data?.book) {
          this.bookCache.set(data.book.id, data.book)
          this.bookCache.set(data.book.slug, data.book)
          return data.book as BookRecord
        }
        return null
      } finally {
        this.pendingRequests.delete(key)
      }
    })()

    this.pendingRequests.set(key, request)
    return request
  }

  /**
   * Fetch all annotations for a book, populating the in-memory cache.
   */
  async fetchBookAnnotations(bookId: string): Promise<SimAnnotation[]> {
    if (this.bookAnnotationsCache.has(bookId)) {
      return this.bookAnnotationsCache.get(bookId)!
    }

    const key = `annotations:${bookId}`
    if (this.pendingRequests.has(key)) {
      return this.pendingRequests.get(key)!
    }

    const request = (async () => {
      try {
        const res = await fetch(`/api/sim/books/${encodeURIComponent(bookId)}/annotations`)
        if (!res.ok) {
          throw new Error(`Failed to fetch book annotations: ${res.statusText}`)
        }
        const data = await res.json()
        const annotations = (data?.annotations || []) as SimAnnotation[]
        this.bookAnnotationsCache.set(bookId, annotations)
        return annotations
      } finally {
        this.pendingRequests.delete(key)
      }
    })()

    this.pendingRequests.set(key, request)
    return request
  }

  /**
   * Get annotations for a specific page of a book.
   * If the full book annotations are already cached, filters in-memory with zero network calls.
   * Otherwise, fetches and caches all book annotations.
   */
  async getPageAnnotations(bookId: string, pageNumber: number): Promise<SimAnnotation[]> {
    if (this.bookAnnotationsCache.has(bookId)) {
      const all = this.bookAnnotationsCache.get(bookId)!
      return all.filter((a) => a.page_number === pageNumber)
    }

    // Fetch and populate cache
    const all = await this.fetchBookAnnotations(bookId)
    return all.filter((a) => a.page_number === pageNumber)
  }

  /**
   * Check if a specific page has any simulations available synchronously from cache.
   */
  hasCachedPageAnnotations(bookId: string, pageNumber: number): boolean {
    if (!this.bookAnnotationsCache.has(bookId)) return false
    return this.bookAnnotationsCache
      .get(bookId)!
      .some((a) => a.page_number === pageNumber)
  }

  /**
   * Synchronously retrieve cached annotations for a page (returns empty array if not yet loaded).
   */
  getCachedPageAnnotations(bookId: string, pageNumber: number): SimAnnotation[] {
    if (!this.bookAnnotationsCache.has(bookId)) return []
    return this.bookAnnotationsCache
      .get(bookId)!
      .filter((a) => a.page_number === pageNumber)
  }

  /**
   * List all books.
   */
  async listBooks(): Promise<BookRecord[]> {
    const res = await fetch('/api/sim/books')
    if (!res.ok) {
      throw new Error(`Failed to list books: ${res.statusText}`)
    }
    const data = await res.json()
    const books = (data?.books || []) as BookRecord[]
    for (const b of books) {
      this.bookCache.set(b.id, b)
      this.bookCache.set(b.slug, b)
    }
    return books
  }

  /**
   * Delete a book by ID.
   */
  async deleteBook(bookId: string): Promise<boolean> {
    const res = await fetch(`/api/sim/books/${encodeURIComponent(bookId)}`, {
      method: 'DELETE',
    })
    if (!res.ok) {
      throw new Error(`Failed to delete book: ${res.statusText}`)
    }
    this.bookCache.delete(bookId)
    this.bookAnnotationsCache.delete(bookId)
    return true
  }

  /**
   * Returns the streaming PDF URL for a book.
   */
  getBookPdfUrl(bookId: string): string {
    return `/api/sim/books/${encodeURIComponent(bookId)}/pdf`
  }

  /**
   * Generates an on-demand simulation using AI for a given prompt, page text, or existing simulation point.
   */
  async generateAiSimulation(params: {
    prompt?: string
    pageText?: string
    bookId?: string
    pageNumber?: number
    annotationId?: string
    existingSpec?: SimSpec
  }): Promise<{ spec: SimSpec; annotation?: SimAnnotation | null }> {
    const res = await fetch('/api/sim/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.error || `Generation failed: ${res.statusText}`)
    }

    const data = await res.json()
    const spec = data.spec as SimSpec
    const annotation = (data.annotation as SimAnnotation) || null

    // Only update bookAnnotationsCache if re-animating an existing book annotation
    if (annotation && params.bookId && params.annotationId) {
      const cached = this.bookAnnotationsCache.get(params.bookId) || []
      const updated = cached.map((item) => (item.id === params.annotationId ? annotation : item))
      this.bookAnnotationsCache.set(params.bookId, updated)
    }

    return { spec, annotation }
  }

  /**
   * Generates or fetches an in-depth student explanation using LLMs with in-memory caching.
   */
  async fetchStudentExplanation(params: {
    spec: SimSpec
    quote?: string
    pageText?: string
    mode?: 'beginner' | 'standard' | 'advanced'
    customQuestion?: string
    skipCache?: boolean
  }): Promise<StudentExplanation> {
    const mode = params.mode || 'standard'
    const cacheKey = `${params.spec.title}:${mode}:${params.customQuestion || ''}`

    if (!params.skipCache && !params.customQuestion && this.explanationCache.has(cacheKey)) {
      return this.explanationCache.get(cacheKey)!
    }

    const res = await fetch('/api/sim/explain', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        spec: params.spec,
        quote: params.quote,
        pageText: params.pageText,
        mode,
        customQuestion: params.customQuestion,
      }),
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.error || `Failed to fetch explanation: ${res.statusText}`)
    }

    const data = await res.json()
    const explanation = data.explanation as StudentExplanation

    if (!params.customQuestion) {
      this.explanationCache.set(cacheKey, explanation)
    }

    return explanation
  }

  /**
   * Explains a specific highlighted text snippet in the context of the page/topic using LLMs.
   */
  async explainSelectionText(params: {
    selectedText: string
    surroundingContext?: string
    parentTopic?: string
    domain?: string
    mode?: 'beginner' | 'standard' | 'advanced'
  }): Promise<SelectionExplanation> {
    const res = await fetch('/api/sim/explain-selection', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.error || `Failed to explain selected text: ${res.statusText}`)
    }

    const data = await res.json()
    return data.explanation as SelectionExplanation
  }

  /**
   * Multi-turn chat reply using full conversation history.
   */
  async sendChatMessage(params: {
    messages: ChatApiTurn[]
    bookContext?: ChatBookContext
  }): Promise<ChatReply> {
    const res = await fetch('/api/sim/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.error || `Failed to send chat message: ${res.statusText}`)
    }

    const data = await res.json()
    return {
      reply: data.reply as string,
      relatedFormulas: data.relatedFormulas,
      keyTakeaways: data.keyTakeaways,
    }
  }

  /**
   * Short "what this is" + "how it works" blurb for the Sim tab.
   */
  async fetchSimBrief(params: { spec: SimSpec; quote?: string }): Promise<SimBrief> {
    const cacheKey = `${params.spec.title}:${params.spec.subtitle || ''}:${params.quote || params.spec.quote || ''}`
    if (this.simBriefCache.has(cacheKey)) {
      return this.simBriefCache.get(cacheKey)!
    }

    const res = await fetch('/api/sim/sim-brief', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.error || `Failed to fetch sim brief: ${res.statusText}`)
    }

    const data = await res.json()
    const brief = data.brief as SimBrief
    this.simBriefCache.set(cacheKey, brief)
    return brief
  }

  /**
   * Manually pre-seed annotations (useful after polling status completes or for testing).
   */
  seedAnnotations(bookId: string, annotations: SimAnnotation[]): void {
    this.bookAnnotationsCache.set(bookId, annotations)
  }

  /**
   * Clear the in-memory cache.
   */
  clearCache(): void {
    this.bookAnnotationsCache.clear()
    this.bookCache.clear()
    this.explanationCache.clear()
    this.simBriefCache.clear()
    this.pendingRequests.clear()
  }
}

export const simApiClient = new SimulationApiClient()

