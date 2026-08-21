import { z } from 'zod'
import { num, param, type SimFile } from '../contract.js'
import { VIEW, circle, label, line, n, pathEl, rect } from '../stage.js'

/** Lamp-to-screen distance (cm). Object stays between the lamp and the wall. */
const SCREEN_CM = 120

export const shadow_light: SimFile = {
  id: 'shadow_light',
  domain: 'physics',
  classBand: '6-8',
  label: 'Shadow of an object',
  ncertClass: 6,
  description: 'Point source, opaque card, and screen: similar triangles give H/h = D/u',
  equations: ['H / h = D / u', 'H = h \\cdot D / u'],
  keywords: ['shadow', 'light source', 'umbra', 'rectilinear propagation'],
  params: [
    param('sourceDistance', 'Source distance u', 'cm', 10, 110, 1, 40),
    param('objectHeight', 'Object height h', 'cm', 5, 40, 1, 15),
  ],
  schema: z.object({
    sourceDistance: num(5, 200, 40),
    objectHeight: num(1, 80, 15),
  }),
  run(params) {
    const h = params.objectHeight
    const D = SCREEN_CM
    const u = Math.min(Math.max(params.sourceDistance, 8), D - 10)
    const H = (h * D) / u
    const srcX = 56
    const screenX = 438
    const px = (screenX - srcX) / D
    const ground = 258
    const stand = 28
    const lampY = ground - stand
    const objX = srcX + u * px
    const objW = 14
    const objTop = lampY - h * px
    const shadowTop = lampY - H * px
    const wallTop = 32
    const visTop = Math.max(wallTop, shadowTop)
    const visH = Math.max(0, lampY - visTop)
    return {
      stage: {
        viewBox: VIEW,
        elements: [
          label('vals', 28, 24, `h = ${h} cm    u = ${u} cm    D = ${D} cm`),
          label('H', 28, 42, `H = h·D/u = ${H.toFixed(1)} cm`),
          rect('wall', {
            x: screenX,
            y: wallTop,
            width: 18,
            height: ground - wallTop,
            fill: '#e2e8f0',
            stroke: '#94a3b8',
            strokeWidth: 1,
          }),
          rect('lit', {
            x: screenX + 1,
            y: wallTop,
            width: 16,
            height: Math.max(0, visTop - wallTop),
            fill: '#fde68a',
          }),
          rect('shadow', {
            x: screenX + 1,
            y: visTop,
            width: 16,
            height: visH,
            fill: '#1e293b',
          }),
          line('floor', { x1: 20, y1: ground, x2: 480, y2: ground, stroke: '#64748b', strokeWidth: 3 }),
          pathEl('beam', {
            d: `M ${n(srcX)} ${n(lampY)} L ${n(objX)} ${n(objTop)} L ${n(screenX)} ${n(shadowTop)} L ${n(screenX)} ${n(lampY)} Z`,
            fill: '#fbbf2433',
            stroke: 'none',
          }),
          line('ray-top', {
            x1: srcX,
            y1: lampY,
            x2: screenX,
            y2: shadowTop,
            stroke: '#d97706',
            strokeWidth: 1.5,
          }),
          line('ray-bot', {
            x1: srcX,
            y1: lampY,
            x2: screenX,
            y2: lampY,
            stroke: '#d97706',
            strokeWidth: 1.5,
          }),
          rect('lamp-stand', {
            x: srcX - 4,
            y: lampY,
            width: 8,
            height: stand,
            fill: '#78716c',
          }),
          circle('glow', { cx: srcX, cy: lampY, r: 18, fill: '#fde68a', opacity: 0.55 }),
          circle('lamp', { cx: srcX, cy: lampY, r: 11, fill: '#facc15' }),
          rect('obj-stand', {
            x: objX + 3,
            y: lampY,
            width: 8,
            height: stand,
            fill: '#78716c',
          }),
          rect('object', {
            x: objX,
            y: objTop,
            width: objW,
            height: h * px,
            fill: '#1e3a5f',
            rx: 2,
          }),
          label('h-tag', objX - 2, objTop - 8, `h`),
          label('H-tag', screenX - 28, visTop + 14, `H`),
          label('u-tag', (srcX + objX) / 2 - 6, lampY + 18, `u`),
          label('D-tag', (srcX + screenX) / 2 - 6, ground + 16, `D`),
        ],
      },
      metrics: {
        u,
        h,
        D,
        shadowHeight: Number(H.toFixed(4)),
      },
      warnings: u !== params.sourceDistance ? ['Object kept between the lamp and the screen'] : [],
    }
  },
}
