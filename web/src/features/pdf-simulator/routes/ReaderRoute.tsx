// web/src/features/pdf-simulator/routes/ReaderRoute.tsx

import React, { useState, useEffect, useMemo, useRef } from 'react'
import { simApiClient, type SimAnnotation } from '../api.js'
import { PdfPane } from '../components/PdfPane.js'
import { SimFAB } from '../components/SimFAB.js'
import { SimDrawer } from '../components/SimDrawer.js'
import { SimPanel } from '../components/SimPanel.js'
import { ExplainPanel } from '../components/ExplainPanel.js'
import { SplitResizer } from '../components/SplitResizer.js'
import { RightPanel } from '../components/RightPanel.js'
import { ChatPane } from '../components/ChatPane.js'
import { TextSelectionExplainer } from '../components/TextSelectionExplainer.js'
import type { ChatMessage, RightTab } from '../types/chat.js'
import {
  buildSimExplainPrompt,
  CHAT_ERROR_CONTENT,
  coerceDomain,
  formatSelectionReply,
  toChatApiMessages,
} from '../utils/chatHelpers.js'

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
  const [splitWidthPercentage, setSplitWidthPercentage] = useState<number>(60)
  const [isAnimationVisible, setIsAnimationVisible] = useState<boolean>(true)
  const [activeTab, setActiveTab] = useState<RightTab>('chat')
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [isChatLoading, setIsChatLoading] = useState(false)
  const chatInFlightRef = useRef(false)

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
    setActiveTab('sim')
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
    if (spec.templateId) return
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

  const parentTopic = selectedAnnotation?.spec.parentTopic || bookTitle
  const domain = coerceDomain(selectedAnnotation?.spec.domain)

  const failLoadingMessage = (loadingId: string) => {
    setChatMessages((prev) =>
      prev.map((m) =>
        m.id === loadingId
          ? { ...m, isLoading: false, isError: true, content: CHAT_ERROR_CONTENT }
          : m
      )
    )
  }

  const handleSendChatMessage = async (text: string) => {
    const trimmed = text.trim()
    if (!trimmed || isChatLoading || chatInFlightRef.current) return
    chatInFlightRef.current = true

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: trimmed,
      timestamp: new Date(),
    }
    const loadingId = crypto.randomUUID()
    const loadingMsg: ChatMessage = {
      id: loadingId,
      role: 'ai',
      content: '',
      timestamp: new Date(),
      isLoading: true,
    }

    setChatMessages((prev) => [...prev, userMsg, loadingMsg])
    setIsChatLoading(true)

    try {
      const result = await simApiClient.sendChatMessage({
        messages: toChatApiMessages([...chatMessages, userMsg]),
        bookContext: {
          title: bookTitle,
          currentPage,
          parentTopic,
          domain,
        },
      })
      const reply = result.reply?.trim()
      if (!reply) {
        failLoadingMessage(loadingId)
        return
      }
      setChatMessages((prev) =>
        prev.map((m) =>
          m.id === loadingId
            ? {
                ...m,
                isLoading: false,
                content: reply,
                relatedFormulas: result.relatedFormulas,
                keyTakeaways: result.keyTakeaways,
              }
            : m
        )
      )
    } catch (err) {
      console.error('[ReaderRoute] Chat send failed:', err)
      failLoadingMessage(loadingId)
    } finally {
      chatInFlightRef.current = false
      setIsChatLoading(false)
    }
  }

  const handleInjectToChat = async (selectedText: string, page: number, context: string) => {
    setActiveTab('chat')
    if (isChatLoading || chatInFlightRef.current) return
    chatInFlightRef.current = true

    const pill: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'system',
      content: selectedText,
      timestamp: new Date(),
      sourceHighlight: { text: selectedText, page },
    }
    const loadingId = crypto.randomUUID()
    const loadingMsg: ChatMessage = {
      id: loadingId,
      role: 'ai',
      content: '',
      timestamp: new Date(),
      isLoading: true,
    }

    setChatMessages((prev) => [...prev, pill, loadingMsg])
    setIsChatLoading(true)

    try {
      const result = await simApiClient.explainSelectionText({
        selectedText,
        surroundingContext: context,
        parentTopic,
        domain,
      })
      setChatMessages((prev) =>
        prev.map((m) =>
          m.id === loadingId
            ? {
                ...m,
                isLoading: false,
                content: formatSelectionReply(result),
                relatedFormulas: result.relatedFormulas,
                keyTakeaways: result.keyTakeaways,
                conceptTitle: result.conceptTitle,
                selectedText,
                surroundingContext: context,
              }
            : m
        )
      )
    } catch (err) {
      console.error('[ReaderRoute] Highlight inject failed:', err)
      failLoadingMessage(loadingId)
    } finally {
      chatInFlightRef.current = false
      setIsChatLoading(false)
    }
  }

  const handleClearChat = () => {
    chatInFlightRef.current = false
    setChatMessages([])
    setIsChatLoading(false)
  }

  const handleAddNote = (_selectedText: string, _page: number) => {
    setActiveTab('notes')
  }

  const handleChatAboutSim = () => {
    if (!selectedAnnotation) return
    const prompt = buildSimExplainPrompt(selectedAnnotation.spec, selectedAnnotation.quote)
    setActiveTab('chat')
    void handleSendChatMessage(prompt)
  }

  const simTabContent = selectedAnnotation ? (
    <div className="sim-tab">
      <SimPanel
        spec={selectedAnnotation.spec}
        onClose={() => setSelectedAnnotation(null)}
        onRegenerateWithAi={handleRegenerateCurrentSim}
        isAnimationVisible={isAnimationVisible}
        onToggleAnimation={() => setIsAnimationVisible((v) => !v)}
      />
      <ExplainPanel
        spec={selectedAnnotation.spec}
        quote={selectedAnnotation.quote}
        isSimAnimationVisible={isAnimationVisible}
        onToggleSimAnimation={() => setIsAnimationVisible((v) => !v)}
        onChatAboutSim={handleChatAboutSim}
      />
    </div>
  ) : null

  return (
    <div className="reader-layout">
      {/* Left: PDF Document View */}
      <div
        className="reader-pdf-container"
        style={{
          width: `${splitWidthPercentage}%`,
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

      <SplitResizer
        onResize={(newWidth) => setSplitWidthPercentage(newWidth)}
        minPercentage={35}
        maxPercentage={75}
      />

      {/* Right: Chat / Sim / Notes workspace */}
      <div
        className="reader-sim-container"
        style={{
          width: `${100 - splitWidthPercentage}%`,
        }}
      >
        <RightPanel
          activeTab={activeTab}
          onTabChange={setActiveTab}
          chat={
            <ChatPane
              messages={chatMessages}
              isLoading={isChatLoading}
              bookTitle={bookTitle}
              onSendMessage={handleSendChatMessage}
              onClear={handleClearChat}
            />
          }
          sim={simTabContent}
        />
      </div>

      <TextSelectionExplainer
        currentPage={currentPage}
        onExplain={handleInjectToChat}
        onAddNote={handleAddNote}
      />
    </div>
  )
}
