// web/src/App.tsx

import { useState, useEffect } from 'react'
import {
  physicsFixture,
  chemistryFixture,
  mathFixture,
  generalFixture,
} from '@pdf-sim/shared'
import { ReaderRoute } from './features/pdf-simulator/routes/ReaderRoute.js'
import { BookManager } from './features/pdf-simulator/components/BookManager.js'
import { ChukPhysicsLabRoute } from './features/mcp-physics/routes/ChukPhysicsLabRoute.js'
import { simApiClient, type BookRecord, type SimAnnotation } from './features/pdf-simulator/api.js'

export function App() {
  const [activeScreen, setActiveScreen] = useState<'reader' | 'library' | 'lab'>('library')
  const [selectedBook, setSelectedBook] = useState<BookRecord | null>(null)
  const [localFile, setLocalFile] = useState<File | null>(null)
  const [serverStatus, setServerStatus] = useState<'checking' | 'online' | 'offline'>('checking')

  // Check backend server health
  useEffect(() => {
    const checkServer = async () => {
      try {
        const res = await fetch('/health')
        if (res.ok) {
          setServerStatus('online')
        } else {
          setServerStatus('offline')
        }
      } catch {
        setServerStatus('offline')
      }
    }
    checkServer()
    const interval = setInterval(checkServer, 5000)
    return () => clearInterval(interval)
  }, [])

  // Pre-seed demo annotations for initial testing
  useEffect(() => {
    const demoAnnotations: SimAnnotation[] = [
      {
        id: 'demo-ann-1',
        book_id: 'demo-book',
        page_number: 1,
        quote: 'A body continues in its state of rest, or of uniform motion in a straight line, unless compelled to change by forces impressed upon it.',
        spec: physicsFixture,
        spec_version: '2.0',
        created_at: new Date().toISOString(),
      },
      {
        id: 'demo-ann-2',
        book_id: 'demo-book',
        page_number: 1,
        quote: 'Molecular kinetic theory states that gas pressure results from particle collisions against the vessel walls.',
        spec: chemistryFixture,
        spec_version: '2.0',
        created_at: new Date().toISOString(),
      },
      {
        id: 'demo-ann-3',
        book_id: 'demo-book',
        page_number: 2,
        quote: 'Harmonic oscillator displacement follows trigonometric curves parameterized by angular frequency omega.',
        spec: mathFixture,
        spec_version: '2.0',
        created_at: new Date().toISOString(),
      },
      {
        id: 'demo-ann-4',
        book_id: 'demo-book',
        page_number: 3,
        quote: 'Orbital trajectories and planetary mechanics governed by universal gravitation.',
        spec: generalFixture,
        spec_version: '2.0',
        created_at: new Date().toISOString(),
      },
    ]
    simApiClient.seedAnnotations('demo-book', demoAnnotations)

    // Load available books on startup and auto-select the latest ready book if available
    simApiClient.listBooks().then((books) => {
      const readyBook = books.find((b) => b.status === 'ready') || books[0]
      if (readyBook) {
        setSelectedBook(readyBook)
      }
    }).catch(() => {})
  }, [])

  const handleOpenBook = (book: BookRecord, file?: File | null) => {
    setSelectedBook(book)
    setLocalFile(file || null)
    setActiveScreen('reader')
  }

  // Determine the PDF source to load in Reader
  const pdfSource = localFile
    ? localFile
    : selectedBook
    ? simApiClient.getBookPdfUrl(selectedBook.id)
    : null

  return (
    <div className="app-container">
      {/* Global Clean Top Navbar */}
      <header className="top-navbar">
        <div className="brand-badge">
          <div className="brand-icon">Δ</div>
          <span>
            PDF Simulator <span style={{ fontSize: '0.75rem', color: 'var(--color-text-subtle)', fontWeight: 500 }}>v2.0</span>
          </span>
        </div>

        {/* Two Screen Switcher */}
        <div
          style={{
            display: 'flex',
            background: 'var(--color-surface-3)',
            padding: '3px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--color-border)',
            gap: '2px',
          }}
        >
          <button
            type="button"
            onClick={() => setActiveScreen('reader')}
            className={`tab-btn ${activeScreen === 'reader' ? 'active' : ''}`}
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <span>📖</span>
            <span>Textbook & Simulations</span>
            {selectedBook && (
              <span
                style={{
                  fontSize: '0.72rem',
                  maxWidth: '130px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  opacity: 0.8,
                }}
              >
                ({selectedBook.title})
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveScreen('library')}
            className={`tab-btn ${activeScreen === 'library' ? 'active' : ''}`}
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <span>📁</span>
            <span>PDF Library & Upload</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveScreen('lab')}
            className={`tab-btn ${activeScreen === 'lab' ? 'active' : ''}`}
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <span>🧪</span>
            <span>Physics MCP Lab</span>
          </button>
        </div>

        {/* Backend Server Status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.8rem' }}>
          <span
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor:
                serverStatus === 'online'
                  ? 'var(--color-success)'
                  : serverStatus === 'checking'
                  ? 'var(--color-warning)'
                  : 'var(--color-danger)',
              boxShadow:
                serverStatus === 'online'
                  ? '0 0 8px var(--color-success)'
                  : 'none',
            }}
          />
          <span style={{ color: 'var(--color-text-muted)' }}>
            Backend: <strong style={{ color: serverStatus === 'online' ? 'var(--color-success)' : 'inherit' }}>
              {serverStatus === 'online' ? 'Online (:3001)' : serverStatus === 'checking' ? 'Connecting...' : 'Offline'}
            </strong>
          </span>
        </div>
      </header>

      {/* Main Screen Views */}
      {activeScreen === 'lab' ? (
        <ChukPhysicsLabRoute onBack={() => setActiveScreen('reader')} />
      ) : activeScreen === 'library' ? (
        <BookManager
          onOpenBook={handleOpenBook}
          serverStatus={serverStatus}
        />
      ) : selectedBook || localFile ? (
        <ReaderRoute
          bookId={selectedBook?.id}
          pdfSource={pdfSource}
          bookTitle={selectedBook?.title || localFile?.name || 'Textbook'}
          onBack={() => setActiveScreen('library')}
        />
      ) : (
        /* Empty Reader State when no book has been picked */
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: 'calc(100vh - 57px)',
            backgroundColor: 'var(--color-bg)',
            padding: '2rem',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '3rem', marginBottom: '1rem', opacity: 0.8 }}>📚</div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--color-text)', marginBottom: '0.5rem' }}>
            No Textbook Currently Selected
          </h2>
          <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', maxWidth: '420px', marginBottom: '1.5rem' }}>
            Visit the PDF Library to choose an existing textbook or upload a new chapter for automated concept simulation.
          </p>
          <button
            className="action-btn"
            onClick={() => setActiveScreen('library')}
            style={{ padding: '0.6rem 1.4rem' }}
          >
            Go to PDF Library & Upload →
          </button>
        </div>
      )}
    </div>
  )
}

export default App
