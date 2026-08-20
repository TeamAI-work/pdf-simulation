// server/src/services/pdf/shouldClassify.ts

/**
 * Counts words in a text string.
 */
export function countWords(text: string): number {
  if (!text) return 0
  const trimmed = text.trim()
  if (!trimmed) return 0
  return trimmed.split(/\s+/).filter(Boolean).length
}

/**
 * Determines whether a page contains sufficient educational substance to classify.
 * Skips pages with fewer than `minWords` (e.g. blanks, covers, table of contents, copyright).
 *
 * @param pageText Extracted text content of the page
 * @param minWords Minimum required word count (defaults to 100 as per Master Plan)
 */
export function shouldClassify(pageText: string, minWords = 100): boolean {
  if (!pageText) return false
  return countWords(pageText) >= minWords
}
