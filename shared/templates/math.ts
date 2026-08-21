// shared/templates/math.ts
// Closed-form maths helpers for new catalog templates.

export function motionGraphs(u: number, a: number, tMax: number): { sMax: number; vEnd: number } {
  const t = Math.max(tMax, 0)
  return {
    sMax: u * t + 0.5 * a * t * t,
    vEnd: u + a * t,
  }
}

export function apTerm(a: number, d: number, n: number): number {
  return a + (Math.max(1, n) - 1) * d
}

export function apSum(a: number, d: number, n: number): number {
  const nn = Math.max(1, n)
  return (nn / 2) * (2 * a + (nn - 1) * d)
}

export function complement(deg: number): number {
  return 90 - deg
}

export function supplement(deg: number): number {
  return 180 - deg
}

export function tangentLength(r: number, d: number): { length: number; real: boolean } {
  const disc = d * d - r * r
  if (disc < 0) return { length: 0, real: false }
  return { length: Math.sqrt(disc), real: true }
}

export function sectorArea(r: number, thetaDeg: number): number {
  return (thetaDeg / 360) * Math.PI * r * r
}

/** Segment area: (r²/2)(θ − sin θ) with θ in radians. */
export function segmentArea(r: number, thetaDeg: number): number {
  const theta = (thetaDeg * Math.PI) / 180
  return (r * r / 2) * (theta - Math.sin(theta))
}

export function sectionPoint(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  m: number,
  n: number
): { x: number; y: number } {
  const den = m + n
  if (Math.abs(den) < 1e-9) return { x: x1, y: y1 }
  return {
    x: (m * x2 + n * x1) / den,
    y: (m * y2 + n * y1) / den,
  }
}
