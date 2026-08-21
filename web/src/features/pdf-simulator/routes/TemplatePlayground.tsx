import { useMemo, useState } from 'react'
import { createTemplateSpec, TEMPLATE_CATALOG, TEMPLATE_IDS, type TemplateId } from '@pdf-sim/shared'
import { SimPanel } from '../../pdf-simulator/components/SimPanel.js'

const CHECKS: { id: TemplateId; label: string; params: Record<string, number>; expect: string }[] = [
  { id: 'prism', label: 'Prism δ = 3°', params: { A: 6, mu: 1.5 }, expect: 'δ = (μ−1)A = 3°' },
  { id: 'echo', label: 'Echo t = 2 s', params: { distance: 340, vSound: 340 }, expect: 't = 2d/v = 2 s' },
  { id: 'series_parallel', label: 'Series I = 2 A', params: { V: 10, R1: 2, R2: 3, mode: 0 }, expect: 'Req = 5 Ω, I = 2 A' },
  { id: 'st_vt_graph', label: 's–t sMax = 25', params: { u: 0, a: 2, tMax: 5 }, expect: 'sMax = 25, vEnd = 10' },
]

export function TemplatePlayground() {
  const [templateId, setTemplateId] = useState<TemplateId>('prism')
  const [params, setParams] = useState<Record<string, number>>(CHECKS[0].params)

  const spec = useMemo(() => createTemplateSpec(templateId, params), [templateId, params])
  const check = CHECKS.find((c) => c.id === templateId)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 57px)', background: 'var(--color-bg)' }}>
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '0.6rem',
          alignItems: 'center',
          padding: '0.75rem 1rem',
          borderBottom: '1px solid var(--color-border)',
          background: 'var(--color-surface)',
        }}
      >
        <label style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
          Template{' '}
          <select
            value={templateId}
            onChange={(e) => {
              const id = e.target.value as TemplateId
              setTemplateId(id)
              const preset = CHECKS.find((c) => c.id === id)
              setParams(preset?.params ?? {})
            }}
            style={{ marginLeft: '0.35rem', padding: '0.25rem 0.4rem' }}
          >
            {TEMPLATE_IDS.map((id) => (
              <option key={id} value={id}>
                {TEMPLATE_CATALOG[id].label} ({id})
              </option>
            ))}
          </select>
        </label>
        {CHECKS.map((c) => (
          <button
            key={c.id}
            type="button"
            className="action-btn-secondary"
            onClick={() => {
              setTemplateId(c.id)
              setParams(c.params)
            }}
            style={{ padding: '0.25rem 0.55rem', fontSize: '0.75rem' }}
          >
            {c.label}
          </button>
        ))}
        <span style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
          {check ? `Check: ${check.expect}` : `${TEMPLATE_CATALOG[templateId].label}`}
        </span>
      </div>
      <div style={{ flex: 1, minHeight: 0, display: 'flex' }}>
        <SimPanel spec={spec} />
      </div>
    </div>
  )
}
