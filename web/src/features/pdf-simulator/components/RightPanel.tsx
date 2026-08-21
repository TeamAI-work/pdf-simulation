// web/src/features/pdf-simulator/components/RightPanel.tsx

import React from 'react'
import type { RightTab } from '../types/chat.js'

export interface RightPanelProps {
  activeTab: RightTab
  onTabChange: (tab: RightTab) => void
  chat: React.ReactNode
  sim: React.ReactNode | null
  notes?: React.ReactNode
}

const TABS: { id: RightTab; icon: string; label: string }[] = [
  { id: 'chat', icon: '💬', label: 'Chat' },
  { id: 'sim', icon: '🔬', label: 'Sim' },
  { id: 'notes', icon: '📓', label: 'Notes' },
]

function PanelEmptyState({
  icon,
  title,
  description,
}: {
  icon: string
  title: string
  description: string
}) {
  return (
    <div className="right-panel__empty-state">
      <span className="right-panel__empty-state-icon">{icon}</span>
      <p className="right-panel__empty-state-title">{title}</p>
      <p className="right-panel__empty-state-desc">{description}</p>
    </div>
  )
}

export const RightPanel: React.FC<RightPanelProps> = ({
  activeTab,
  onTabChange,
  chat,
  sim,
  notes,
}) => {
  const renderActiveContent = () => {
    switch (activeTab) {
      case 'chat':
        return chat
      case 'sim':
        return sim ?? (
          <PanelEmptyState
            icon="🔬"
            title="No simulation selected"
            description="Open the drawer and pick a simulation on this page."
          />
        )
      case 'notes':
        return (
          notes ?? (
            <PanelEmptyState
              icon="📓"
              title="Notes coming soon"
              description="Highlight text in the PDF to capture notes — this feature is next."
            />
          )
        )
      default:
        return null
    }
  }

  return (
    <div className="right-panel">
      <div className="right-panel__tab-bar" role="tablist">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            className={`right-panel__tab-btn${activeTab === tab.id ? ' active' : ''}`}
            onClick={() => onTabChange(tab.id)}
          >
            <span aria-hidden="true">{tab.icon}</span> {tab.label}
          </button>
        ))}
      </div>
      <div className="right-panel__content" role="tabpanel">
        {renderActiveContent()}
      </div>
    </div>
  )
}
