import { z } from 'zod'
import { sectorArea, segmentArea } from '../math.js'
import { num, param, type SimFile } from '../contract.js'
import { VIEW, circle, label, line, pathEl } from '../stage.js'

export const sector_segment: SimFile = {
  id: 'sector_segment',
  domain: 'math',
  classBand: '9-10',
  ncertClass: 10,
  label: 'Sector and segment',
  description: 'Area of a sector and the corresponding segment of a circle',
  equations: [
    '\\text{sector} = (\\theta/360)\\pi r^2',
    '\\text{segment} = \\tfrac{r^2}{2}(\\theta - \\sin\\theta)',
  ],
  keywords: ['sector', 'segment', 'areas related to circles', 'minor segment'],
  params: [
    param('r', 'Radius r', '', 1, 10, 0.1, 4),
    param('thetaDeg', 'Angle θ', 'deg', 20, 180, 1, 90),
  ],
  schema: z.object({
    r: num(0.5, 20, 4),
    thetaDeg: num(5, 350, 90),
  }),
  run(params) {
    const { r, thetaDeg } = params
    const sector = sectorArea(r, thetaDeg)
    const segment = segmentArea(r, thetaDeg)
    const cx = 250
    const cy = 160
    const s = 18
    const R = r * s
    const rad = (thetaDeg * Math.PI) / 180
    const x1 = cx + R
    const y1 = cy
    const x2 = cx + R * Math.cos(rad)
    const y2 = cy - R * Math.sin(rad)
    const large = thetaDeg > 180 ? 1 : 0
    const d = `M ${cx} ${cy} L ${x1.toFixed(1)} ${y1.toFixed(1)} A ${R.toFixed(1)} ${R.toFixed(1)} 0 ${large} 0 ${x2.toFixed(1)} ${y2.toFixed(1)} Z`
    return {
      stage: {
        viewBox: VIEW,
        elements: [
          circle('circ', { cx, cy, r: R, fill: 'none', stroke: '#475569', strokeWidth: 2 }),
          pathEl('sec', { d, fill: '#38bdf833', stroke: '#38bdf8', strokeWidth: 2 }),
          line('chord', { x1: x1, y1: y1, x2: x2, y2: y2, stroke: '#f472b6', strokeWidth: 2 }),
          label('eq', 28, 28, `sector = ${sector.toFixed(2)}`),
          label('eq2', 28, 46, `segment = ${segment.toFixed(2)}`),
        ],
      },
      metrics: {
        r,
        thetaDeg,
        sectorArea: Number(sector.toFixed(4)),
        segmentArea: Number(segment.toFixed(4)),
      },
      warnings: [],
    }
  },
}
