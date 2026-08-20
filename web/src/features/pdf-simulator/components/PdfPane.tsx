// web/src/features/pdf-simulator/components/PdfPane.tsx

import React, { useState, useRef } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'

// KP-9 mitigation: explicitly configure pdfjs-dist worker matching pdfjs.version
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`

export interface PdfPaneProps {
  pdfSource: string | File | ArrayBuffer | null
  currentPage: number
  onPageChange: (newPage: number) => void
  onDocumentLoaded?: (totalNumPages: number) => void
  children?: React.ReactNode
}

export const PdfPane: React.FC<PdfPaneProps> = ({
  pdfSource,
  currentPage,
  onPageChange,
  onDocumentLoaded,
  children,
}) => {
  const [numPages, setNumPages] = useState<number | null>(null)
  const [scale, setScale] = useState<number>(1.1)
  const [error, setError] = useState<string | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages)
    setError(null)
    onDocumentLoaded?.(numPages)
  }

  const handleDocumentLoadError = (err: Error) => {
    console.error('[PdfPane] Error loading PDF:', err)
    setError(err.message || 'Failed to render PDF document')
  }

  const goToPrevPage = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1)
    }
  }

  const goToNextPage = () => {
    if (numPages && currentPage < numPages) {
      onPageChange(currentPage + 1)
    }
  }

  const zoomIn = () => setScale((prev) => Math.min(prev + 0.15, 2.5))
  const zoomOut = () => setScale((prev) => Math.max(prev - 0.15, 0.6))
  const resetZoom = () => setScale(1.1)

  return (
    <div className="pdf-pane-wrapper" style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Top Reading Toolbar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.5rem 1rem',
          background: 'var(--color-surface)',
          borderBottom: '1px solid var(--color-border)',
          fontSize: '0.82rem',
          zIndex: 10,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button
            className="action-btn-secondary"
            onClick={goToPrevPage}
            disabled={currentPage <= 1}
            style={{ padding: '0.3rem 0.6rem', borderRadius: 'var(--radius-sm)', cursor: 'pointer' }}
            title="Previous Page"
          >
            ←
          </button>
          <span style={{ color: 'var(--color-text-muted)', fontWeight: 500 }}>
            Page{' '}
            <strong style={{ color: 'var(--color-text)' }}>{currentPage}</strong> of{' '}
            <strong style={{ color: 'var(--color-text)' }}>{numPages ?? '...'}</strong>
          </span>
          <button
            className="action-btn-secondary"
            onClick={goToNextPage}
            disabled={!numPages || currentPage >= numPages}
            style={{ padding: '0.3rem 0.6rem', borderRadius: 'var(--radius-sm)', cursor: 'pointer' }}
            title="Next Page"
          >
            →
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <button
            className="action-btn-secondary"
            onClick={zoomOut}
            style={{ padding: '0.3rem 0.6rem', borderRadius: 'var(--radius-sm)', cursor: 'pointer' }}
            title="Zoom Out"
          >
            -
          </button>
          <span
            onClick={resetZoom}
            style={{
              color: 'var(--color-text-subtle)',
              minWidth: '45px',
              textAlign: 'center',
              cursor: 'pointer',
              userSelect: 'none',
            }}
            title="Reset Zoom"
          >
            {Math.round(scale * 100)}%
          </span>
          <button
            className="action-btn-secondary"
            onClick={zoomIn}
            style={{ padding: '0.3rem 0.6rem', borderRadius: 'var(--radius-sm)', cursor: 'pointer' }}
            title="Zoom In"
          >
            +
          </button>
        </div>
      </div>

      {/* Main PDF Scroll View */}
      <div
        ref={containerRef}
        style={{
          flex: 1,
          overflow: 'auto',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'flex-start',
          padding: '1.5rem',
          backgroundColor: '#f1f5f9',
        }}
      >
        {!pdfSource ? (
          <div style={{ margin: 'auto', color: 'var(--color-text-muted)', textAlign: 'center' }}>
            <p>No PDF loaded.</p>
          </div>
        ) : error ? (
          <div style={{ margin: 'auto', color: 'var(--color-danger)', textAlign: 'center', maxWidth: '400px' }}>
            <p style={{ fontWeight: 600, marginBottom: '0.5rem' }}>Failed to load PDF</p>
            <p style={{ fontSize: '0.85rem' }}>{error}</p>
          </div>
        ) : (
          <Document
            file={pdfSource}
            onLoadSuccess={handleDocumentLoadSuccess}
            onLoadError={handleDocumentLoadError}
            loading={
              <div style={{ margin: 'auto', color: 'var(--color-text-subtle)', padding: '2rem' }}>
                Loading document...
              </div>
            }
          >
            <div
              style={{
                boxShadow: '0 4px 20px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.04)',
                borderRadius: 'var(--radius-sm)',
                overflow: 'hidden',
                background: '#ffffff',
              }}
            >
              <Page
                pageNumber={currentPage}
                scale={scale}
                renderTextLayer={true}
                renderAnnotationLayer={false}
              />
            </div>
          </Document>
        )}
      </div>

      {/* Children overlay slot (for SimFAB) */}
      {children}
    </div>
  )
}
