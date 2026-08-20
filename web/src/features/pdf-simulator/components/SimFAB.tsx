// web/src/features/pdf-simulator/components/SimFAB.tsx

import React from 'react'

export interface SimFABProps {
  count: number
  onClick: () => void
  isOpen?: boolean
}

export const SimFAB: React.FC<SimFABProps> = ({ count, onClick, isOpen = false }) => {
  return (
    <button
      className="sim-fab"
      onClick={onClick}
      aria-label={count > 0 ? `${count} simulations available on this page` : 'Open AI simulation drawer'}
      title={count > 0 ? `${count} interactive simulations available for this page` : 'Generate an AI simulation for this page'}
      style={count === 0 ? { background: 'var(--color-surface)', color: 'var(--color-primary)', border: '1px solid var(--color-primary)' } : undefined}
    >
      <span style={{ fontSize: '1rem' }}>{count > 0 ? '⚡' : '✨'}</span>
      <span>
        {isOpen
          ? 'Close Drawer'
          : count > 0
          ? count === 1
            ? '1 Simulation'
            : `${count} Simulations`
          : 'AI Simulate'}
      </span>
      {count > 0 && <span className="sim-fab-count">{count}</span>}
    </button>
  )
}
