import { describe, it, expect } from 'vitest'
import { shouldClassify, countWords } from '../shouldClassify.js'
import { normalizePageText, itemsToPageText } from '../chunk.js'
import { extractPdfStructure } from '../extract.js'

describe('PDF Service: shouldClassify & countWords', () => {
  it('returns 0 for empty or whitespace-only text', () => {
    expect(countWords('')).toBe(0)
    expect(countWords('   \n\t  ')).toBe(0)
    expect(shouldClassify('')).toBe(false)
    expect(shouldClassify('   \n\t  ')).toBe(false)
  })

  it('rejects text under 100 words by default', () => {
    const text50Words = Array.from({ length: 50 }, (_, i) => `word${i}`).join(' ')
    expect(countWords(text50Words)).toBe(50)
    expect(shouldClassify(text50Words)).toBe(false)
  })

  it('accepts text with 100 or more words', () => {
    const text100Words = Array.from({ length: 100 }, (_, i) => `word${i}`).join(' ')
    expect(countWords(text100Words)).toBe(100)
    expect(shouldClassify(text100Words)).toBe(true)

    const text150Words = Array.from({ length: 150 }, (_, i) => `word${i}`).join(' ')
    expect(countWords(text150Words)).toBe(150)
    expect(shouldClassify(text150Words)).toBe(true)
  })

  it('respects custom minWords threshold', () => {
    const text30Words = Array.from({ length: 30 }, (_, i) => `word${i}`).join(' ')
    expect(shouldClassify(text30Words, 25)).toBe(true)
    expect(shouldClassify(text30Words, 35)).toBe(false)
  })
})

describe('PDF Service: chunk & normalizePageText', () => {
  it('repairs hyphenated words split across line breaks', () => {
    const raw = 'The accele-\nration of the particle causes dynamic os-\n  cillation.'
    const normalized = normalizePageText(raw)
    expect(normalized).toContain('acceleration')
    expect(normalized).toContain('oscillation')
  })

  it('collapses extraneous whitespace and multiple blank lines', () => {
    const raw = 'Heading\n\n\n\nSome    spaced    text.\n\n\nNext paragraph.'
    const normalized = normalizePageText(raw)
    expect(normalized).toBe('Heading\n\nSome spaced text.\n\nNext paragraph.')
  })

  it('orders items by reading order (Y descending, X ascending)', () => {
    const items = [
      // Line 2
      { str: 'World', transform: [1, 0, 0, 1, 100, 100] },
      { str: 'Hello', transform: [1, 0, 0, 1, 20, 100] },
      // Line 1 (Higher Y = higher on page)
      { str: 'Title', transform: [1, 0, 0, 1, 20, 200] },
    ]

    const text = itemsToPageText(items)
    expect(text).toBe('Title\nHello World')
  })

  it('handles empty or blank item lists gracefully', () => {
    expect(itemsToPageText([])).toBe('')
    expect(itemsToPageText([{ str: '   ', transform: [1, 0, 0, 1, 0, 0] }])).toBe('')
  })
})

describe('PDF Service: extractPdfStructure', () => {
  // A minimal valid PDF with "Hello PDF World" text stream
  const minimalPdfBase64 =
    'JVBERi0xLjQKMSAwIG9iago8PAovVHlwZSAvQ2F0YWxvZwovUGFnZXMgMiAwIFIKPj4KZW5kb2JqCjIgMCBvYmoKPDwKL1R5cGUgL1BhZ2VzCi9LaWRzIFszIDAgUl0KL0NvdW50IDEKPj4KZW5kb2JqCjMgMCBvYmoKPDwKL1R5cGUgL1BhZ2UKL1BhcmVudCAyIDAgUgovTWVkaWFCb3ggWzAgMCA2MTIgNzkyXQovQ29udGVudHMgNCAwIFIKL1Jlc291cmNlcyA8PAovRm9udCA8PAovRjEgNSAwIFIKPj4KPj4KPj4KZW5kb2JqCjQgMCBvYmoKPDwKL0xlbmd0aCA0NAo+PgpzdHJlYW0KQlQKL0YxIDI0IFRmCjEwMCA3MDAgVGROCihIZWxsbyBQREYgV29ybGQpIFRqCkVUCmVuZHN0cmVhbQplbmRvYmoKNSAwIG9iago8PAovVHlwZSAvRm9udAovU3VidHlwZSAvVHlwZTEKL0Jhc2VGb250IC9IZWx2ZXRpY2EKPj4KZW5kb2JqCnhyZWYKMCA2CjAwMDAwMDAwMDAgNjU1MzUgZiAKMDAwMDAwMDAxMCAwMDAwMCBuIAowMDAwMDAwMDU5IDAwMDAwIG4gCjAwMDAwMDAxMTYgMDAwMDAgbiAKMDAwMDAwMDIyNyAwMDAwMCBuIAowMDAwMDAwMzIxIDAwMDAwIG4gCnRyYWlsZXIKPDwKL1NpemUgNgovUm9vdCAxIDAgUgo+PgpzdGFydHhyZWYKNDAxCiUlRU9G'

  it('extracts text structure and page count accurately from PDF buffer', async () => {
    const buffer = Buffer.from(minimalPdfBase64, 'base64')
    const pages = await extractPdfStructure(buffer)

    expect(pages).toHaveLength(1)
    expect(pages[0].pageNumber).toBe(1)
    expect(pages[0].text).toContain('Hello PDF World')
    expect(pages[0].wordCount).toBe(3)
  })
})
