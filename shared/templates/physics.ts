// shared/templates/physics.ts
// Closed-form solvers used by binders and accuracy tests.

export interface ProjectileResult {
  range: number
  flightTime: number
  maxHeight: number
  vx: number
  vy: number
}

export function solveProjectile(v0: number, angleDeg: number, h0: number, g: number): ProjectileResult {
  const theta = (angleDeg * Math.PI) / 180
  const vx = v0 * Math.cos(theta)
  const vy = v0 * Math.sin(theta)
  const disc = Math.max(0, vy * vy + 2 * g * h0)
  const flightTime = (vy + Math.sqrt(disc)) / g
  const range = vx * flightTime
  const maxHeight = h0 + (vy * vy) / (2 * g)
  return { range, flightTime, maxHeight, vx, vy }
}

/** Flat-ground analytic range. Used as the accuracy gate when h0 ≈ 0. */
export function analyticFlatRange(v0: number, angleDeg: number, g: number): number {
  const theta = (angleDeg * Math.PI) / 180
  return (v0 * v0 * Math.sin(2 * theta)) / g
}

export interface CollisionResult {
  v1: number
  v2: number
  keBefore: number
  keAfter: number
  energyLoss: number
  timeToCollision: number
}

export function solveCollision1d(
  m1: number,
  m2: number,
  u1: number,
  u2: number,
  e: number,
  gapMeters = 8
): CollisionResult {
  const closing = u1 - u2
  const timeToCollision = closing > 1e-9 ? gapMeters / closing : 1e9
  const v1 = (m1 * u1 + m2 * u2 - m2 * e * (u1 - u2)) / (m1 + m2)
  const v2 = (m1 * u1 + m2 * u2 + m1 * e * (u1 - u2)) / (m1 + m2)
  const keBefore = 0.5 * m1 * u1 * u1 + 0.5 * m2 * u2 * u2
  const keAfter = 0.5 * m1 * v1 * v1 + 0.5 * m2 * v2 * v2
  return {
    v1,
    v2,
    keBefore,
    keAfter,
    energyLoss: Math.max(0, keBefore - keAfter),
    timeToCollision,
  }
}

export function pendulumPeriod(length: number, g: number): number {
  return 2 * Math.PI * Math.sqrt(length / g)
}

export function rampAcceleration(angleDeg: number, mu: number, g = 9.81): { a: number; willSlide: boolean } {
  const theta = (angleDeg * Math.PI) / 180
  const willSlide = Math.tan(theta) > mu + 1e-9
  const a = willSlide ? g * (Math.sin(theta) - mu * Math.cos(theta)) : 0
  return { a: Math.max(0, a), willSlide }
}

export function buoyancyResult(densityObject: number, densityFluid: number, volume: number, g = 9.81) {
  const weight = densityObject * volume * g
  const buoyantForce = densityFluid * volume * g
  const willFloat = densityObject < densityFluid
  return { weight, buoyantForce, willFloat, netForce: buoyantForce - weight }
}

export function shmPeriod(k: number, m: number): number {
  return 2 * Math.PI * Math.sqrt(m / Math.max(k, 1e-9))
}

export function snellTheta2(n1: number, n2: number, theta1Deg: number): { theta2Deg: number; tir: boolean } {
  const s = (n1 / Math.max(n2, 1e-9)) * Math.sin((theta1Deg * Math.PI) / 180)
  if (Math.abs(s) > 1) return { theta2Deg: 90, tir: true }
  return { theta2Deg: (Math.asin(s) * 180) / Math.PI, tir: false }
}

/** School-book convex lens: u, f > 0 as distances; v = 1/(1/f − 1/u). */
export function lensImageDistance(u: number, f: number): { v: number; real: boolean; m: number } {
  const denom = 1 / f - 1 / Math.max(u, 1e-6)
  if (Math.abs(denom) < 1e-9) return { v: 1e6, real: true, m: -1e6 }
  const v = 1 / denom
  return { v, real: v > 0, m: -v / u }
}

export function ohmCurrent(V: number, R: number): number {
  return V / Math.max(R, 1e-9)
}

export function pressure(force: number, area: number): number {
  return force / Math.max(area, 1e-12)
}

export function liquidPressure(h: number, rho: number, g = 9.81): number {
  return h * rho * g
}

export function seriesReq(R1: number, R2: number): number {
  return R1 + R2
}

export function parallelReq(R1: number, R2: number): number {
  const den = R1 + R2
  if (Math.abs(den) < 1e-12) return 0
  return (R1 * R2) / den
}

export function heatEnergy(I: number, R: number, t: number): number {
  return I * I * R * t
}

export function echoTime(distance: number, vSound: number): number {
  return (2 * distance) / Math.max(vSound, 1e-9)
}

export function workFs(force: number, s: number, angleDeg: number): number {
  return force * s * Math.cos((angleDeg * Math.PI) / 180)
}

/**
 * School-book mirror formula with positive object distance u.
 * kind 0 = concave (f > 0 converging), kind 1 = convex (f treated as −|f|).
 */
export function mirrorImage(
  u: number,
  f: number,
  kind: number
): { v: number; m: number; real: boolean } {
  const fEff = kind >= 0.5 ? -Math.abs(f) : Math.abs(f)
  const uu = Math.max(u, 1e-6)
  const denom = 1 / fEff - 1 / uu
  if (Math.abs(denom) < 1e-9) return { v: 1e6, m: -1e6, real: true }
  const v = 1 / denom
  return { v, m: -v / uu, real: v > 0 }
}

/** Thin prism: δ = (μ − 1)A with A and δ in degrees. */
export function thinPrismDeviation(A: number, mu: number): number {
  return (mu - 1) * A
}

export function bounceTimes(h0: number, e: number, g: number) {
  const tDown = Math.sqrt((2 * h0) / g)
  const v0 = Math.sqrt(2 * g * h0)
  const v1 = e * v0
  const h1 = (v1 * v1) / (2 * g)
  const tBounce1 = (2 * v1) / g
  const v2 = e * v1
  const h2 = (v2 * v2) / (2 * g)
  const tBounce2 = (2 * v2) / g
  return { tDown, v0, v1, v2, h1, h2, tBounce1, tBounce2, total: tDown + tBounce1 + tBounce2 }
}
