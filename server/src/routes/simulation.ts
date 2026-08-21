// server/src/routes/simulation.ts

import { Router, Request, Response } from 'express'
import multer from 'multer'
import {
  createBook,
  getBookById,
  getBookBySlug,
  listBooks,
  getAnnotationsByBookId,
  uploadPdfToStorage,
  downloadPdfFromStorage,
  deleteBook,
  insertAnnotations,
  updateAnnotation,
} from '../services/sim/repository.js'
import { processBookJob } from '../workers/annotateBook.js'
import { generateCustomSimulation } from '../services/sim/classify.js'
import { validateMathExpressions } from '../services/sim/ingest.js'
import {
  generateStudentExplanation,
  generateSelectionExplanation,
  generateChatReply,
  generateSimBrief,
} from '../services/sim/explainService.js'
import { bindTemplate, isTemplateId } from '@pdf-sim/shared'

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
})

export const simulationRouter = Router()

function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-')
}

/**
 * POST /sim/books
 * Uploads a PDF, saves to Supabase Storage, creates a book record, and dispatches the worker.
 * Returns < 500ms with 'pending' status.
 */
simulationRouter.post('/books', upload.single('pdf'), async (req: Request, res: Response): Promise<void> => {
  try {
    let pdfBuffer: Buffer | null = null
    let filename = 'document.pdf'

    if (req.file) {
      pdfBuffer = req.file.buffer
      filename = req.file.originalname
    } else if (req.body?.pdfBase64) {
      pdfBuffer = Buffer.from(req.body.pdfBase64, 'base64')
      if (req.body.filename) {
        filename = req.body.filename
      }
    }

    if (!pdfBuffer || pdfBuffer.length === 0) {
      res.status(400).json({ error: 'A valid PDF file or pdfBase64 payload is required' })
      return
    }

    const title = req.body?.title || filename.replace(/\.pdf$/i, '') || 'Untitled Book'
    const baseSlug = slugify(req.body?.slug || title || 'book')
    const uniqueSuffix = Date.now().toString(36)
    const slug = `${baseSlug}-${uniqueSuffix}`
    const storagePath = `books/${slug}.pdf`

    // 1. Upload to Supabase Storage
    await uploadPdfToStorage(storagePath, pdfBuffer)

    // 2. Create DB record with status 'pending'
    const book = await createBook({
      slug,
      title,
      storage_path: storagePath,
    })

    // 3. Trigger worker asynchronously (do NOT await)
    processBookJob(book.id).catch((err) => {
      console.error(`[routes] Background worker error for book ${book.id}:`, err)
    })

    // 4. Return fast response (< 500ms)
    res.status(201).json({
      success: true,
      book: {
        id: book.id,
        slug: book.slug,
        title: book.title,
        status: book.status,
        created_at: book.created_at,
      },
    })
  } catch (err: any) {
    console.error(`[routes] Failed to create book:`, err)
    res.status(500).json({ error: err?.message || 'Internal server error creating book' })
  }
})

/**
 * GET /sim/books
 * Lists all books.
 */
simulationRouter.get('/books', async (_req: Request, res: Response): Promise<void> => {
  try {
    const books = await listBooks()
    res.json({ books })
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to list books' })
  }
})

/**
 * GET /sim/books/:id
 * Gets book details by UUID or slug.
 */
simulationRouter.get('/books/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const rawId = req.params.id
    const idOrSlug = Array.isArray(rawId) ? rawId[0] : rawId
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      idOrSlug
    )

    const book = isUuid ? await getBookById(idOrSlug) : await getBookBySlug(idOrSlug)

    if (!book) {
      res.status(404).json({ error: 'Book not found' })
      return
    }

    res.json({ book })
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to retrieve book' })
  }
})

/**
 * GET /sim/books/:id/status
 * Polling endpoint for worker status.
 */
simulationRouter.get('/books/:id/status', async (req: Request, res: Response): Promise<void> => {
  try {
    const rawId = req.params.id
    const bookId = Array.isArray(rawId) ? rawId[0] : rawId
    const book = await getBookById(bookId)
    if (!book) {
      res.status(404).json({ error: 'Book not found' })
      return
    }

    res.json({
      id: book.id,
      status: book.status,
      pageCount: book.page_count,
      error: book.error,
    })
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to check book status' })
  }
})

/**
 * GET /sim/books/:id/annotations
 * Fetches all SimSpec annotations for a book, optionally filtered by ?page=
 */
simulationRouter.get('/books/:id/annotations', async (req: Request, res: Response): Promise<void> => {
  try {
    const rawId = req.params.id
    const bookId = Array.isArray(rawId) ? rawId[0] : rawId
    const pageNumber = req.query.page ? parseInt(req.query.page as string, 10) : undefined

    const annotations = await getAnnotationsByBookId(
      bookId,
      isNaN(pageNumber as number) ? undefined : pageNumber
    )

    res.json({
      bookId,
      pageNumber: pageNumber ?? null,
      count: annotations.length,
      annotations,
    })
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to fetch annotations' })
  }
})

/**
 * GET /sim/books/:id/pdf
 * Streams the PDF file for the book from Supabase Storage.
 */
simulationRouter.get('/books/:id/pdf', async (req: Request, res: Response): Promise<void> => {
  try {
    const rawId = req.params.id
    const idOrSlug = Array.isArray(rawId) ? rawId[0] : rawId
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      idOrSlug
    )

    const book = isUuid ? await getBookById(idOrSlug) : await getBookBySlug(idOrSlug)
    if (!book) {
      res.status(404).json({ error: 'Book not found' })
      return
    }

    const pdfBuffer = await downloadPdfFromStorage(book.storage_path)
    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(book.slug)}.pdf"`)
    res.send(pdfBuffer)
  } catch (err: any) {
    console.error(`[routes] Failed to stream PDF:`, err)
    res.status(500).json({ error: err?.message || 'Failed to retrieve PDF' })
  }
})

/**
 * DELETE /sim/books/:id
 * Deletes a book, its storage file, and associated annotations.
 */
simulationRouter.delete('/books/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const rawId = req.params.id
    const bookId = Array.isArray(rawId) ? rawId[0] : rawId

    await deleteBook(bookId)
    res.json({ success: true, message: `Book ${bookId} deleted successfully` })
  } catch (err: any) {
    console.error(`[routes] Failed to delete book:`, err)
    res.status(500).json({ error: err?.message || 'Failed to delete book' })
  }
})

/**
 * POST /sim/generate
 * On-demand AI simulation generator for custom prompts or specific textbook page context.
 */
simulationRouter.post('/generate', async (req: Request, res: Response): Promise<void> => {
  try {
    const { prompt, pageText, bookId, pageNumber, annotationId, existingSpec } = req.body

    const queryText = (prompt || pageText || existingSpec?.title || '').trim()
    if (!queryText) {
      res.status(400).json({ error: 'A prompt or concept title is required to generate a simulation' })
      return
    }

    const context = {
      title: existingSpec?.title || (prompt && prompt.length < 80 ? prompt : undefined),
      subtitle: existingSpec?.subtitle,
      parentTopic: existingSpec?.parentTopic,
      domain: existingSpec?.domain,
      topicExplanation: existingSpec?.topicExplanation,
      equations: existingSpec?.equations,
      quote: existingSpec?.quote || prompt,
    }

    console.log(`[routes] Generating on-demand AI simulation for: "${queryText.substring(0, 80)}..."`, context.title ? `(Concept: ${context.title})` : '')
    const candidate = await generateCustomSimulation(queryText, {}, context)

    const playable = Boolean(
      (candidate.templateId && candidate.isSimulatable) ||
        (candidate.stage && candidate.stage.elements.length > 0)
    )
    if (!candidate || !candidate.isSimulatable || !playable) {
      res.status(422).json({
        error: 'The AI could not generate a valid animated simulation for this prompt. Please try a more specific physical or mathematical concept.',
      })
      return
    }

    // Run Backend Math Guard
    const isValidMath = validateMathExpressions(candidate)
    if (!isValidMath) {
      res.status(422).json({
        error: 'Generated simulation contained invalid mathematical syntax. Please try again.',
      })
      return
    }

    let savedAnnotation = null

    // Only update database when explicitly re-animating an existing textbook annotation
    if (annotationId) {
      try {
        const { importance, ...simSpec } = candidate
        savedAnnotation = await updateAnnotation(annotationId, simSpec, simSpec.quote || queryText.substring(0, 200))
      } catch (updateErr) {
        console.warn(`[routes] Could not update annotation ${annotationId}:`, updateErr)
      }
    }

    res.json({
      success: true,
      spec: candidate,
      annotation: savedAnnotation,
      isCustom: !annotationId,
    })
  } catch (err: any) {
    console.error('[routes] Error generating simulation:', err)
    res.status(500).json({ error: err?.message || 'Failed to generate simulation' })
  }
})

/**
 * POST /sim/explain
 * Generates an in-depth, pedagogical student explanation for a simulation using LLMs.
 */
simulationRouter.post('/explain', async (req: Request, res: Response): Promise<void> => {
  try {
    const { spec, quote, pageText, mode, customQuestion } = req.body

    if (!spec || !spec.title) {
      res.status(400).json({ error: 'A valid SimSpec with title is required' })
      return
    }

    console.log(`[routes] Generating student explanation for: "${spec.title}" (mode: ${mode || 'standard'})`)
    const metrics =
      spec.templateId && isTemplateId(spec.templateId)
        ? bindTemplate(spec.templateId, spec.params).metrics
        : undefined
    const explanation = await generateStudentExplanation({
      spec,
      quote,
      pageText,
      mode: mode || 'standard',
      customQuestion,
      metrics,
    })

    res.json({
      success: true,
      explanation,
    })
  } catch (err: any) {
    console.error('[routes] Error generating student explanation:', err)
    res.status(500).json({ error: err?.message || 'Failed to generate student explanation' })
  }
})

/**
 * POST /sim/explain-selection
 * Generates an on-demand explanation for user-selected text on the screen within topic context.
 */
simulationRouter.post('/explain-selection', async (req: Request, res: Response): Promise<void> => {
  try {
    const { selectedText, surroundingContext, parentTopic, domain, mode } = req.body

    const textToExplain = (selectedText || '').trim()
    if (!textToExplain) {
      res.status(400).json({ error: 'Selected text is required' })
      return
    }

    console.log(`[routes] Generating explanation for selected text: "${textToExplain.substring(0, 60)}..." (topic: ${parentTopic || 'general'})`)
    const explanation = await generateSelectionExplanation({
      selectedText: textToExplain,
      surroundingContext,
      parentTopic,
      domain: domain || 'physics',
      mode: mode || 'standard',
    })

    res.json({
      success: true,
      explanation,
    })
  } catch (err: any) {
    console.error('[routes] Error generating selection explanation:', err)
    res.status(500).json({ error: err?.message || 'Failed to generate selection explanation' })
  }
})

/**
 * POST /sim/chat
 * Multi-turn tutor reply using full conversation history.
 */
simulationRouter.post('/chat', async (req: Request, res: Response): Promise<void> => {
  try {
    const { messages, bookContext } = req.body || {}

    if (!Array.isArray(messages) || messages.length === 0) {
      res.status(400).json({ error: 'messages array is required' })
      return
    }

    const last = messages[messages.length - 1]
    if (!last || last.role !== 'user' || !String(last.content || '').trim()) {
      res.status(400).json({ error: 'The last message must be a non-empty user turn' })
      return
    }

    const title = bookContext?.title || bookContext?.parentTopic || 'general'
    console.log(`[routes] Chat reply (${messages.length} turns, topic: ${title})`)

    const result = await generateChatReply(messages, bookContext || {})

    res.json({
      success: true,
      reply: result.reply,
      relatedFormulas: result.relatedFormulas,
      keyTakeaways: result.keyTakeaways,
    })
  } catch (err: any) {
    console.error('[routes] Error generating chat reply:', err)
    res.status(500).json({ error: err?.message || 'Failed to generate chat reply' })
  }
})

/**
 * POST /sim/sim-brief
 * Short "what this is" + "how it works here" for the Sim tab (not the full tutor essay).
 */
simulationRouter.post('/sim-brief', async (req: Request, res: Response): Promise<void> => {
  try {
    const { spec, quote } = req.body || {}
    if (!spec || !spec.title) {
      res.status(400).json({ error: 'A valid SimSpec with title is required' })
      return
    }

    console.log(`[routes] Generating sim brief for: "${spec.title}"`)
    const brief = await generateSimBrief(spec, quote)

    res.json({
      success: true,
      brief,
    })
  } catch (err: any) {
    console.error('[routes] Error generating sim brief:', err)
    res.status(500).json({ error: err?.message || 'Failed to generate sim brief' })
  }
})




