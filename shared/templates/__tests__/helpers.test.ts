import { describe, it, expect } from 'vitest'
import {
  echoTime,
  heatEnergy,
  liquidPressure,
  mirrorImage,
  ohmCurrent,
  parallelReq,
  pressure,
  rampAcceleration,
  seriesReq,
  thinPrismDeviation,
  workFs,
} from '../physics.js'
import {
  apSum,
  apTerm,
  complement,
  motionGraphs,
  sectionPoint,
  sectorArea,
  supplement,
  tangentLength,
} from '../math.js'

describe('math helpers', () => {
  it('motionGraphs matches s = ut + ½at²', () => {
    const { sMax, vEnd } = motionGraphs(0, 2, 5)
    expect(sMax).toBe(25)
    expect(vEnd).toBe(10)
  })

  it('AP term and sum', () => {
    expect(apTerm(2, 3, 5)).toBe(14)
    expect(apSum(2, 3, 5)).toBe(40)
  })

  it('complement and supplement', () => {
    expect(complement(30)).toBe(60)
    expect(supplement(30)).toBe(150)
  })

  it('tangent length and section midpoint', () => {
    expect(tangentLength(3, 5).length).toBeCloseTo(4, 8)
    expect(tangentLength(5, 3).real).toBe(false)
    const mid = sectionPoint(0, 0, 4, 2, 1, 1)
    expect(mid.x).toBe(2)
    expect(mid.y).toBe(1)
  })

  it('quarter-circle sector area', () => {
    expect(sectorArea(2, 90)).toBeCloseTo(Math.PI, 8)
  })
})

describe('physics helpers', () => {
  it('pressure, liquid pressure, heat, echo, work', () => {
    expect(pressure(10, 2)).toBe(5)
    expect(liquidPressure(2, 1000, 10)).toBe(20000)
    expect(heatEnergy(2, 3, 4)).toBe(48)
    expect(echoTime(340, 340)).toBe(2)
    expect(workFs(10, 2, 0)).toBeCloseTo(20, 8)
    expect(workFs(10, 2, 90)).toBeCloseTo(0, 8)
  })

  it('series and parallel resistance', () => {
    expect(seriesReq(2, 3)).toBe(5)
    expect(parallelReq(2, 2)).toBe(1)
    expect(ohmCurrent(10, seriesReq(2, 3))).toBe(2)
  })

  it('concave mirror real image when u > f', () => {
    const img = mirrorImage(30, 10, 0)
    expect(img.v).toBeCloseTo(15, 5)
    expect(img.real).toBe(true)
  })

  it('convex mirror gives a virtual image', () => {
    const img = mirrorImage(20, 10, 1)
    expect(img.real).toBe(false)
    expect(img.v).toBeLessThan(0)
  })

  it('thin prism deviation', () => {
    expect(thinPrismDeviation(6, 1.5)).toBeCloseTo(3, 8)
  })

  it('ramp a = g(sinθ − μ cosθ) and stays put when tanθ ≤ μ', () => {
    const g = 9.81
    const ice = rampAcceleration(30, 0, g)
    expect(ice.willSlide).toBe(true)
    expect(ice.a).toBeCloseTo(g * 0.5, 8)
    const stuck = rampAcceleration(30, 1, g)
    expect(stuck.willSlide).toBe(false)
    expect(stuck.a).toBe(0)
    const kinetic = rampAcceleration(30, 0.2, g)
    expect(kinetic.willSlide).toBe(true)
    expect(kinetic.a).toBeCloseTo(g * (Math.sin(Math.PI / 6) - 0.2 * Math.cos(Math.PI / 6)), 8)
  })
})
