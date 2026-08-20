// web/src/features/pdf-simulator/routes/ReaderRoute.tsx

import React, { useState, useEffect, useMemo } from 'react'
import { simApiClient, type SimAnnotation } from '../api.js'
import { PdfPane } from '../components/PdfPane.js'
import { SimFAB } from '../components/SimFAB.js'
import { SimDrawer } from '../components/SimDrawer.js'
import { SimPanel } from '../components/SimPanel.js'
import { ExplainPanel } from '../components/ExplainPanel.js'
import { SplitResizer } from '../components/SplitResizer.js'
import { TextSelectionExplainer } from '../components/TextSelectionExplainer.js'

export interface ReaderRouteProps {
  bookId?: string
  pdfSource?: string | File | ArrayBuffer | null
  bookTitle?: string
  initialPage?: number
  onBack?: () => void
}

export const ReaderRoute: React.FC<ReaderRouteProps> = ({
  bookId,
  pdfSource = null,
  bookTitle,
  initialPage = 1,
}) => {
  const [currentPage, setCurrentPage] = useState<number>(initialPage)
  const [allAnnotations, setAllAnnotations] = useState<SimAnnotation[]>([])
  const [customSimulations, setCustomSimulations] = useState<SimAnnotation[]>(() => {
    try {
      const saved = localStorage.getItem('pdf_sim_custom_simulations')
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [selectedAnnotation, setSelectedAnnotation] = useState<SimAnnotation | null>(null)
  const [splitWidthPercentage, setSplitWidthPercentage] = useState<number>(55)
  const [isAnimationVisible, setIsAnimationVisible] = useState<boolean>(true)

  // Load annotations for the book into memory cache (KP-11 & Acceptance Gate 6)
  useEffect(() => {
    if (!bookId) return

    let isMounted = true

    simApiClient
      .fetchBookAnnotations(bookId)
      .then((annotations) => {
        if (isMounted) {
          setAllAnnotations(annotations)
        }
      })
      .catch((err) => {
        console.error('[ReaderRoute] Error fetching book annotations:', err)
      })

    return () => {
      isMounted = false
    }
  }, [bookId])

  // Persist custom simulations to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('pdf_sim_custom_simulations', JSON.stringify(customSimulations))
    } catch (e) {
      console.warn('[ReaderRoute] Could not save custom simulations to localStorage:', e)
    }
  }, [customSimulations])

  // Filter annotations for current page from cache
  const currentPageAnnotations = useMemo(() => {
    return allAnnotations.filter((a) => a.page_number === currentPage)
  }, [allAnnotations, currentPage])

  // If page changes and current selected annotation is not from this page, keep or clear
  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage)
    setIsDrawerOpen(false)
  }

  const handleSelectSimulation = (annotation: SimAnnotation) => {
    setSelectedAnnotation(annotation)
    setIsDrawerOpen(false)
  }

  const handleAnnotationAdded = (newAnnotation: SimAnnotation) => {
    setAllAnnotations((prev) => {
      const index = prev.findIndex((a) => a.id === newAnnotation.id)
      if (index >= 0) {
        const copy = [...prev]
        copy[index] = newAnnotation
        return copy
      }
      return [...prev, newAnnotation]
    })
  }

  const handleCustomSimulationAdded = (newCustomSim: SimAnnotation) => {
    setCustomSimulations((prev) => [newCustomSim, ...prev])
  }

  const handleDeleteCustomSimulation = (id: string) => {
    setCustomSimulations((prev) => prev.filter((s) => s.id !== id))
    if (selectedAnnotation?.id === id) {
      setSelectedAnnotation(null)
    }
  }

  const handleRegenerateCurrentSim = async () => {
    if (!selectedAnnotation) return
    const spec = selectedAnnotation.spec
    const isCustom = customSimulations.some((s) => s.id === selectedAnnotation.id)
    const result = await simApiClient.generateAiSimulation({
      prompt: spec.title,
      bookId: isCustom ? undefined : bookId,
      pageNumber: isCustom ? undefined : currentPage,
      annotationId: isCustom ? undefined : selectedAnnotation.id,
      existingSpec: spec,
    })
    const updatedAnn: SimAnnotation = {
      ...selectedAnnotation,
      spec: result.spec,
    }
    setSelectedAnnotation(updatedAnn)
    if (isCustom) {
      setCustomSimulations((prev) =>
        prev.map((s) => (s.id === selectedAnnotation.id ? updatedAnn : s))
      )
    } else {
      handleAnnotationAdded(updatedAnn)
    }
  }

  const hasActiveSim = Boolean(selectedAnnotation)

  return (
    <div className="reader-layout">
      {/* Left: PDF Document View */}
      <div
        className="reader-pdf-container"
        style={{
          width: hasActiveSim ? `${splitWidthPercentage}%` : '100%',
          transition: 'width 0.1s ease',
        }}
      >
        <PdfPane
          pdfSource={pdfSource}
          currentPage={currentPage}
          onPageChange={handlePageChange}
        >
          {/* FAB button attached to bottom right of PDF view */}
          <SimFAB
            count={currentPageAnnotations.length}
            onClick={() => setIsDrawerOpen((prev) => !prev)}
            isOpen={isDrawerOpen}
          />
        </PdfPane>

        {/* Bottom Drawer Overlay */}
        <SimDrawer
          isOpen={isDrawerOpen}
          onClose={() => setIsDrawerOpen(false)}
          annotations={currentPageAnnotations}
          customSimulations={customSimulations}
          pageNumber={currentPage}
          bookId={bookId}
          selectedAnnotationId={selectedAnnotation?.id || null}
          onSelectSimulation={handleSelectSimulation}
          onAnnotationAdded={handleAnnotationAdded}
          onCustomSimulationAdded={handleCustomSimulationAdded}
          onDeleteCustomSimulation={handleDeleteCustomSimulation}
        />
      </div>

      {/* Draggable Resizer when Simulation is active */}
      {hasActiveSim && (
        <SplitResizer
          onResize={(newWidth) => setSplitWidthPercentage(newWidth)}
          minPercentage={35}
          maxPercentage={75}
        />
      )}

      {/* Right: Simulation & Explanation Workspace */}
      {hasActiveSim && (
        <div
          className="reader-sim-container"
          style={{
            width: `${100 - splitWidthPercentage}%`,
          }}
        >
          <SimPanel
            spec={selectedAnnotation?.spec || null}
            onClose={() => setSelectedAnnotation(null)}
            onRegenerateWithAi={handleRegenerateCurrentSim}
            isAnimationVisible={isAnimationVisible}
            onToggleAnimation={() => setIsAnimationVisible((v) => !v)}
          />
          <ExplainPanel
            spec={selectedAnnotation?.spec || null}
            quote={selectedAnnotation?.quote}
            isSimAnimationVisible={isAnimationVisible}
            onToggleSimAnimation={() => setIsAnimationVisible((v) => !v)}
          />
        </div>
      )}

      {/* Floating Text Selection Mini Button & Explainer Modal */}
      <TextSelectionExplainer
        parentTopic={selectedAnnotation?.spec.parentTopic || bookTitle}
        domain={selectedAnnotation?.spec.domain || 'physics'}
      />
    </div>
  )
}
