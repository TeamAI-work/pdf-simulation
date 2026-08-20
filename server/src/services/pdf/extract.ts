// server/src/services/pdf/extract.ts

import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs'
import { itemsToPageText, TextItemLike } from './chunk.js'
import { countWords } from './shouldClassify.js'

export interface ExtractedPage {
  pageNumber: number
  text: string
  wordCount: number
}

export interface ExtractPdfOptions {
  /**
   * Optional password for encrypted PDFs.
   */
  password?: string
}

/**
 * Extracts clean, reading-order text page-by-page from a PDF buffer.
 *
 * @param buffer Uint8Array or Buffer containing PDF binary data
 * @param options Optional extraction configuration
 * @returns Array of extracted pages with text and word counts
 */
export async function extractPdfStructure(
  buffer: Uint8Array | Buffer,
  options: ExtractPdfOptions = {}
): Promise<ExtractedPage[]> {
  let data: Uint8Array
  if (buffer instanceof Uint8Array && buffer.constructor.name === 'Uint8Array') {
    data = buffer
  } else {
    // In Node.js, Buffer is a subclass of Uint8Array, but pdfjs-dist rejects Buffer instances.
    const ab = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength)
    data = new Uint8Array(ab)
  }

  const loadingTask = pdfjsLib.getDocument({
    data,
    password: options.password,
    isEvalSupported: false,
    useSystemFonts: true,
  })

  const pdfDoc = await loadingTask.promise
  const numPages = pdfDoc.numPages
  const pages: ExtractedPage[] = []

  for (let pageNum = 1; pageNum <= numPages; pageNum++) {
    const page = await pdfDoc.getPage(pageNum)
    const textContent = await page.getTextContent()

    const rawItems: TextItemLike[] = []
    for (const item of textContent.items) {
      if ('str' in item && typeof item.str === 'string') {
        rawItems.push({
          str: item.str,
          transform: item.transform,
          width: 'width' in item ? (item.width as number) : undefined,
          height: 'height' in item ? (item.height as number) : undefined,
        })
      }
    }

    const text = itemsToPageText(rawItems)
    const wordCount = countWords(text)

    pages.push({
      pageNumber: pageNum,
      text,
      wordCount,
    })
  }

  return pages
}
