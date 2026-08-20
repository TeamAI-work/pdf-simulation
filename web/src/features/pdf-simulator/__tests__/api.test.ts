// web/src/features/pdf-simulator/__tests__/api.test.ts

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { simApiClient, type SimAnnotation } from '../api.js'
import { physicsFixture, chemistryFixture } from '@pdf-sim/shared'

const mockAnnotations: SimAnnotation[] = [
  {
    id: 'ann-1',
    book_id: 'book-123',
    page_number: 1,
    quote: 'An object in motion remains in motion...',
    spec: physicsFixture,
    spec_version: '2.0',
    created_at: new Date().toISOString(),
  },
  {
    id: 'ann-2',
    book_id: 'book-123',
    page_number: 1,
    quote: 'Chemical bonding occurs when...',
    spec: chemistryFixture,
    spec_version: '2.0',
    created_at: new Date().toISOString(),
  },
  {
    id: 'ann-3',
    book_id: 'book-123',
    page_number: 4,
    quote: 'Gravitational acceleration near the surface...',
    spec: physicsFixture,
    spec_version: '2.0',
    created_at: new Date().toISOString(),
  },
]

describe('SimulationApiClient (In-Memory Cache & Deduping)', () => {
  beforeEach(() => {
    simApiClient.clearCache()
    vi.restoreAllMocks()
  })

  afterEach(() => {
    simApiClient.clearCache()
    vi.restoreAllMocks()
  })

  it('fetches book annotations and caches them in memory', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({ annotations: mockAnnotations }),
    } as any)

    // First call: hits network
    const res1 = await simApiClient.fetchBookAnnotations('book-123')
    expect(res1).toHaveLength(3)
    expect(fetchSpy).toHaveBeenCalledTimes(1)

    // Second call: served from in-memory cache
    const res2 = await simApiClient.fetchBookAnnotations('book-123')
    expect(res2).toEqual(res1)
    expect(fetchSpy).toHaveBeenCalledTimes(1) // No second network call!
  })

  it('deduplicates concurrent in-flight requests (single-flight promise)', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(async () => {
      // Simulate network latency
      await new Promise((r) => setTimeout(r, 20))
      return {
        ok: true,
        json: async () => ({ annotations: mockAnnotations }),
      } as any
    })

    // Fire 5 concurrent requests at once
    const results = await Promise.all([
      simApiClient.fetchBookAnnotations('book-concurrent'),
      simApiClient.fetchBookAnnotations('book-concurrent'),
      simApiClient.fetchBookAnnotations('book-concurrent'),
      simApiClient.fetchBookAnnotations('book-concurrent'),
      simApiClient.fetchBookAnnotations('book-concurrent'),
    ])

    expect(results).toHaveLength(5)
    results.forEach((r) => expect(r).toHaveLength(3))
    // Exactly 1 network call occurred
    expect(fetchSpy).toHaveBeenCalledTimes(1)
  })

  it('serves rapid page flips (50 pages) from memory with zero redundant API calls', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({ annotations: mockAnnotations }),
    } as any)

    // Rapidly request 50 different page numbers in sequence
    for (let page = 1; page <= 50; page++) {
      const pageAnns = await simApiClient.getPageAnnotations('book-123', page)
      if (page === 1) {
        expect(pageAnns).toHaveLength(2)
      } else if (page === 4) {
        expect(pageAnns).toHaveLength(1)
      } else {
        expect(pageAnns).toHaveLength(0)
      }
    }

    // Zero redundant network calls: only 1 initial fetch was made
    expect(fetchSpy).toHaveBeenCalledTimes(1)
  })

  it('provides synchronous cache lookups with getCachedPageAnnotations', () => {
    // Before seeding
    expect(simApiClient.hasCachedPageAnnotations('book-seed', 1)).toBe(false)
    expect(simApiClient.getCachedPageAnnotations('book-seed', 1)).toEqual([])

    // Seed cache
    simApiClient.seedAnnotations('book-seed', mockAnnotations)

    // Synchronous lookups
    expect(simApiClient.hasCachedPageAnnotations('book-seed', 1)).toBe(true)
    expect(simApiClient.getCachedPageAnnotations('book-seed', 1)).toHaveLength(2)
    expect(simApiClient.hasCachedPageAnnotations('book-seed', 4)).toBe(true)
    expect(simApiClient.getCachedPageAnnotations('book-seed', 4)).toHaveLength(1)
    expect(simApiClient.hasCachedPageAnnotations('book-seed', 2)).toBe(false)
  })
})
