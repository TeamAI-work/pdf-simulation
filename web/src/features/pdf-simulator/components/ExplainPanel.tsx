// web/src/features/pdf-simulator/components/ExplainPanel.tsx

import React, { useEffect, useState } from 'react'
import type { SimSpec } from '@pdf-sim/shared'
import { simApiClient, type SimBrief } from '../api.js'
import { ChatMarkdown } from './ChatMarkdown.js'
import { formulaToMarkdown } from '../utils/chatHelpers.js'

export interface ExplainPanelProps {
  spec: SimSpec | null
  quote?: string
  pageText?: string
  isSimAnimationVisible?: boolean
  onToggleSimAnimation?: () => void
  onChatAboutSim?: () => void
}

export const ExplainPanel: React.FC<ExplainPanelProps> = ({
  spec,
  quote,
  onChatAboutSim,
}) => {
  const [brief, setBrief] = useState<SimBrief | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!spec) {
      setBrief(null)
      return
    }

    let isMounted = true
    setIsLoading(true)

    simApiClient
      .fetchSimBrief({ spec, quote: quote || spec.quote })
      .then((data) => {
        if (isMounted) setBrief(data)
      })
      .catch((err) => {
        console.warn('[ExplainPanel] Sim brief failed, using local notes:', err)
        if (isMounted) {
          setBrief({
            about: spec.subtitle
              ? `This simulation is about **${spec.title}**: ${spec.subtitle}`
              : `This simulation is about **${spec.title}**.`,
            howItWorks:
              spec.topicExplanation ||
              spec.caption ||
              'Watch the animation: the moving parts follow the same rules as the topic in the textbook.',
          })
        }
      })
      .finally(() => {
        if (isMounted) setIsLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [spec, quote])

  if (!spec) return null

  const equations = (spec.equations || []).filter(Boolean).slice(0, 3)

  return (
    <div className="sim-brief">
      {isLoading && !brief && (
        <div className="sim-brief__loading" aria-busy="true">
          <span className="chat-thinking__orb" aria-hidden="true" />
          <span>Writing a short explanation…</span>
        </div>
      )}

      {brief && (
        <>
          <section className="sim-brief__section">
            <h4 className="sim-brief__heading">What this simulation is</h4>
            <ChatMarkdown>{brief.about}</ChatMarkdown>
          </section>
          <section className="sim-brief__section">
            <h4 className="sim-brief__heading">How it works here</h4>
            <ChatMarkdown>{brief.howItWorks}</ChatMarkdown>
          </section>
        </>
      )}

      {equations.length > 0 && (
        <div className="sim-brief__math">
          {equations.map((eq) => (
            <ChatMarkdown key={eq}>{formulaToMarkdown(eq)}</ChatMarkdown>
          ))}
        </div>
      )}

      {onChatAboutSim && (
        <button type="button" className="sim-brief__chat-btn" onClick={onChatAboutSim}>
          💬 Chat about this sim
        </button>
      )}
    </div>
  )
}
