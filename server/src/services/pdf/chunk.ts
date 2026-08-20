// server/src/services/pdf/chunk.ts

export interface TextItemLike {
  str: string
  transform: number[]
  width?: number
  height?: number
}

/**
 * Normalizes raw extracted text by removing extraneous whitespace,
 * repairing broken hyphenated words at line-breaks, and normalizing unicode spaces.
 */
export function normalizePageText(rawText: string): string {
  if (!rawText) return ''

  return (
    rawText
      // Normalize various unicode spaces to standard space
      .replace(/[\u00A0\u1680\u2000-\u200A\u202F\u205F\u3000]/g, ' ')
      // Fix hyphenation across line breaks (e.g. "accele-\nration" -> "acceleration")
      .replace(/(\w+)-\s*\n\s*(\w+)/g, '$1$2')
      // Collapse multiple horizontal spaces/tabs
      .replace(/[ \t]+/g, ' ')
      // Collapse more than two consecutive newlines into a standard paragraph break
      .replace(/\n\s*\n\s*\n+/g, '\n\n')
      .trim()
  )
}

/**
 * Converts pdfjs text content items into clean, reading-order page text.
 */
export function itemsToPageText(items: TextItemLike[]): string {
  if (!items || items.length === 0) return ''

  // Filter out empty items
  const validItems = items.filter((item) => item.str && item.str.trim().length > 0)
  if (validItems.length === 0) return ''

  // Sort items primarily by Y descending (top to bottom in PDF coordinates),
  // then X ascending (left to right)
  const sorted = [...validItems].sort((a, b) => {
    const yA = a.transform[5] ?? 0
    const yB = b.transform[5] ?? 0
    const xA = a.transform[4] ?? 0
    const xB = b.transform[4] ?? 0

    // If Y difference is small (within ~4 points), consider them on the same line
    if (Math.abs(yA - yB) < 4) {
      return xA - xB
    }
    return yB - yA // PDF coordinate (0,0) is bottom-left, so higher Y is higher on page
  })

  const lines: string[] = []
  let currentLine: string[] = []
  let lastY = sorted[0]?.transform[5] ?? 0

  for (const item of sorted) {
    const y = item.transform[5] ?? 0
    const text = item.str

    if (Math.abs(y - lastY) >= 6) {
      if (currentLine.length > 0) {
        lines.push(currentLine.join(' '))
        currentLine = []
      }
      lastY = y
    }

    currentLine.push(text)
  }

  if (currentLine.length > 0) {
    lines.push(currentLine.join(' '))
  }

  return normalizePageText(lines.join('\n'))
}
