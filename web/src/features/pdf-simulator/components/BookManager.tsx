// web/src/features/pdf-simulator/components/BookManager.tsx

import React, { useState, useEffect } from 'react'
import { simApiClient, type BookRecord } from '../api.js'

export interface BookManagerProps {
  onOpenBook: (book: BookRecord, localFile?: File | null) => void
  serverStatus: 'online' | 'offline' | 'checking'
}

export const BookManager: React.FC<BookManagerProps> = ({ onOpenBook, serverStatus }) => {
  const [books, setBooks] = useState<BookRecord[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [customTitle, setCustomTitle] = useState('')
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [activeJobId, setActiveJobId] = useState<string | null>(null)
  const [deleteLoadingId, setDeleteLoadingId] = useState<string | null>(null)

  // Fetch book list
  const loadBooks = async () => {
    try {
      setIsLoading(true)
      const list = await simApiClient.listBooks()
      setBooks(list)
    } catch (err: any) {
      console.error('[BookManager] Failed to load books:', err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadBooks()
  }, [])

  // Poll for background worker updates when any book is not ready/failed
  useEffect(() => {
    const hasPendingBooks = books.some(
      (b) => b.status === 'pending' || b.status === 'extracting' || b.status === 'classifying'
    )

    if (!hasPendingBooks && !activeJobId) return

    const interval = setInterval(async () => {
      try {
        const updated = await simApiClient.listBooks()
        setBooks(updated)
      } catch (err) {
        console.error('[BookManager] Error polling books:', err)
      }
    }, 2500)

    return () => clearInterval(interval)
  }, [books, activeJobId])

  const handleFileDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault()
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0]
      if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
        setSelectedFile(file)
        if (!customTitle) {
          setCustomTitle(file.name.replace(/\.pdf$/i, ''))
        }
      }
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setSelectedFile(file)
      if (!customTitle) {
        setCustomTitle(file.name.replace(/\.pdf$/i, ''))
      }
    }
  }

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedFile) return

    setIsUploading(true)
    setUploadError(null)

    try {
      const formData = new FormData()
      formData.append('pdf', selectedFile)
      formData.append('title', customTitle.trim() || selectedFile.name.replace(/\.pdf$/i, ''))

      const res = await fetch('/api/sim/books', {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) {
        const errData = await res.json()
        throw new Error(errData.error || 'Failed to upload PDF')
      }

      const data = await res.json()
      setActiveJobId(data.book.id)
      setSelectedFile(null)
      setCustomTitle('')
      await loadBooks()
    } catch (err: any) {
      setUploadError(err.message || 'Upload failed')
    } finally {
      setIsUploading(false)
    }
  }

  const handleDelete = async (bookId: string, title: string) => {
    if (!window.confirm(`Are you sure you want to delete "${title}" and all its simulations?`)) {
      return
    }

    try {
      setDeleteLoadingId(bookId)
      await simApiClient.deleteBook(bookId)
      setBooks((prev) => prev.filter((b) => b.id !== bookId))
    } catch (err: any) {
      alert(`Failed to delete book: ${err.message}`)
    } finally {
      setDeleteLoadingId(null)
    }
  }

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(380px, 440px) 1fr',
        gap: '1.25rem',
        height: 'calc(100vh - 57px)',
        width: '100vw',
        padding: '1.25rem',
        backgroundColor: 'var(--color-bg)',
        overflow: 'hidden',
      }}
    >
      {/* LEFT SIDE: Upload & Extraction Controls */}
      <div
        className="glass-card"
        style={{
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          overflowY: 'auto',
          padding: '1.5rem',
        }}
      >
        <div className="glass-card-header" style={{ marginBottom: '1.25rem' }}>
          <div>
            <h2 className="card-title" style={{ fontSize: '1.05rem' }}>
              <span>📤</span> Upload & Extract PDF
            </h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '0.2rem' }}>
              Upload science textbooks for AI-curated simulation generation
            </p>
          </div>
          <span className="badge badge-physics">Pipeline</span>
        </div>

        <form onSubmit={handleUpload} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
          {/* Drag and Drop Zone */}
          <label
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleFileDrop}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '2rem 1.25rem',
              border: '2px dashed var(--color-border)',
              borderRadius: 'var(--radius-lg)',
              background: selectedFile ? 'var(--color-primary-subtle)' : 'var(--color-surface-2)',
              cursor: 'pointer',
              textAlign: 'center',
              transition: 'all 0.15s ease',
            }}
          >
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '50%',
                background: 'var(--color-surface)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.4rem',
                marginBottom: '0.6rem',
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              📄
            </div>
            <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-text)' }}>
              {selectedFile ? selectedFile.name : 'Choose or drop a PDF textbook'}
            </span>
            <span style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
              Supports NCERT, OpenStax & STEM PDFs (max 50MB)
            </span>
            <input
              type="file"
              accept=".pdf,application/pdf"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
            />
          </label>

          {/* Title Input */}
          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text)', display: 'block', marginBottom: '0.35rem' }}>
              Textbook / Chapter Title
            </label>
            <input
              type="text"
              placeholder="e.g. Chapter 12 - Magnetic Effects of Electric Current"
              value={customTitle}
              onChange={(e) => setCustomTitle(e.target.value)}
              style={{
                width: '100%',
                padding: '0.6rem 0.85rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border)',
                background: 'var(--color-surface)',
                color: 'var(--color-text)',
                fontSize: '0.85rem',
                outline: 'none',
              }}
            />
          </div>

          {/* Action Trigger Button */}
          <button
            type="submit"
            disabled={!selectedFile || isUploading || serverStatus !== 'online'}
            className="action-btn"
            style={{ width: '100%', padding: '0.65rem 1rem', fontSize: '0.9rem' }}
          >
            {isUploading ? 'Uploading to Supabase Storage...' : 'Start Simulation Extraction →'}
          </button>
        </form>

        {uploadError && (
          <div
            style={{
              marginTop: '1rem',
              background: '#fef2f2',
              border: '1px solid #fecaca',
              color: 'var(--color-danger)',
              padding: '0.75rem',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.82rem',
            }}
          >
            ⚠️ {uploadError}
          </div>
        )}

        {/* Feature Highlights / Info Box */}
        <div style={{ marginTop: 'auto', paddingTop: '1.25rem' }}>
          <div
            style={{
              background: 'var(--color-surface-2)',
              padding: '0.85rem 1rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border-subtle)',
              fontSize: '0.78rem',
              color: 'var(--color-text-muted)',
              lineHeight: 1.45,
            }}
          >
            <strong style={{ color: 'var(--color-text)', display: 'block', marginBottom: '0.2rem' }}>
              ⚡ Automated Pipeline:
            </strong>
            1. Spatial text extraction per page.<br />
            2. LLM concept curator & formula generator.<br />
            3. Backend math guard validation for 60fps animations.
          </div>
        </div>
      </div>

      {/* RIGHT SIDE: Uploaded PDF List */}
      <div
        className="glass-card"
        style={{
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          padding: '1.5rem',
          minWidth: 0,
        }}
      >
        <div className="glass-card-header" style={{ marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <h2 className="card-title" style={{ fontSize: '1.1rem' }}>
              <span>📚</span> Uploaded Textbooks
            </h2>
            <span className="badge badge-physics" style={{ fontSize: '0.72rem' }}>
              {books.length} {books.length === 1 ? 'Book' : 'Books'}
            </span>
          </div>

          <button
            onClick={loadBooks}
            className="action-btn-secondary"
            style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
            disabled={isLoading}
          >
            {isLoading ? 'Refreshing...' : '↻ Refresh List'}
          </button>
        </div>

        {/* Scrollable List Area */}
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem', paddingRight: '0.25rem' }}>
          {books.length === 0 ? (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                color: 'var(--color-text-muted)',
                textAlign: 'center',
                padding: '2rem',
              }}
            >
              <div style={{ fontSize: '3rem', marginBottom: '0.75rem', opacity: 0.7 }}>📚</div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--color-text)', marginBottom: '0.3rem' }}>
                No Textbooks Uploaded Yet
              </h3>
              <p style={{ fontSize: '0.85rem', maxWidth: '380px' }}>
                Use the form on the left to upload your first textbook PDF. Once processed, it will appear here ready to read and simulate.
              </p>
            </div>
          ) : (
            books.map((book) => {
              const isReady = book.status === 'ready'
              const isProcessing =
                book.status === 'extracting' ||
                book.status === 'classifying' ||
                book.status === 'pending'
              const isFailed = book.status === 'failed'

              const statusColor = isReady
                ? { bg: '#ecfdf5', text: '#047857', border: '#a7f3d0' }
                : isFailed
                ? { bg: '#fef2f2', text: '#dc2626', border: '#fecaca' }
                : { bg: '#fffbeb', text: '#b45309', border: '#fde68a' }

              return (
                <div
                  key={book.id}
                  style={{
                    background: 'var(--color-surface-2)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-lg)',
                    padding: '1.1rem 1.25rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '1.25rem',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.9rem', flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        width: '42px',
                        height: '42px',
                        borderRadius: 'var(--radius-md)',
                        background: isReady ? 'var(--color-primary-subtle)' : 'var(--color-surface-3)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.3rem',
                        flexShrink: 0,
                      }}
                    >
                      {isReady ? '📖' : isProcessing ? '⚙️' : '⚠️'}
                    </div>

                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <h3
                          style={{
                            fontSize: '0.95rem',
                            fontWeight: 600,
                            color: 'var(--color-text)',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                          title={book.title}
                        >
                          {book.title}
                        </h3>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            padding: '0.15rem 0.55rem',
                            borderRadius: 'var(--radius-full)',
                            fontSize: '0.7rem',
                            fontWeight: 600,
                            background: statusColor.bg,
                            color: statusColor.text,
                            border: `1px solid ${statusColor.border}`,
                            textTransform: 'uppercase',
                            flexShrink: 0,
                          }}
                        >
                          {book.status}
                        </span>
                      </div>

                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.75rem',
                          fontSize: '0.78rem',
                          color: 'var(--color-text-muted)',
                          marginTop: '0.25rem',
                        }}
                      >
                        <span>Pages: {book.page_count ?? 'Calculating...'}</span>
                        <span>•</span>
                        <span>{new Date(book.created_at).toLocaleDateString()}</span>
                        {book.error && (
                          <>
                            <span>•</span>
                            <span style={{ color: 'var(--color-danger)' }}>{book.error}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
                    <button
                      className="action-btn"
                      onClick={() => onOpenBook(book)}
                      disabled={isProcessing}
                      style={{ padding: '0.45rem 0.95rem', fontSize: '0.82rem' }}
                    >
                      {isProcessing ? 'Processing...' : 'Read & Simulate →'}
                    </button>

                    <button
                      className="action-btn-secondary"
                      onClick={() => handleDelete(book.id, book.title)}
                      disabled={deleteLoadingId === book.id}
                      style={{
                        padding: '0.45rem 0.75rem',
                        fontSize: '0.82rem',
                        color: 'var(--color-danger)',
                        borderColor: '#fecaca',
                      }}
                      title="Delete Textbook"
                    >
                      {deleteLoadingId === book.id ? '...' : '🗑️'}
                    </button>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
