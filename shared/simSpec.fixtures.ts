// shared/simSpec.fixtures.ts
// Standardized fixtures for test suites and component rendering across all domains.

import type { SimSpec } from './simSpec.js'

export const physicsFixture: SimSpec = {
  version: '2.0',
  parentTopic: 'Kinematics',
  title: 'Projectile Motion with Gravity',
  subtitle: 'Trajectory of a particle launched at 45 degrees',
  domain: 'physics',
  topicExplanation:
    'A projectile launched with an initial velocity decomposes into constant horizontal velocity and vertical deceleration due to gravity.',
  caption: 'Position over time: x(t) = v0*cos(θ)*t, y(t) = v0*sin(θ)*t - 0.5*g*t^2',
  isSimulatable: true,
  reasonIfNotSimulatable: '',
  quote: 'The path followed by a projectile in the absence of air resistance is a parabola.',
  equations: ['x = v_0 \\cos(\\theta) t', 'y = v_0 \\sin(\\theta) t - \\frac{1}{2} g t^2'],
  stage: {
    viewBox: '0 0 500 300',
    elements: [
      {
        id: 'ground',
        type: 'line',
        role: 'none',
        props: {
          x1: 20,
          y1: 260,
          x2: 480,
          y2: 260,
          stroke: '#475569',
          strokeWidth: 2,
        },
      },
      {
        id: 'trajectory-path',
        type: 'path',
        role: 'trajectory',
        props: {
          d: 'M 30 260 Q 240 40 450 260',
          stroke: '#94a3b8',
          strokeDasharray: '4 4',
          fill: 'none',
        },
      },
      {
        id: 'ball',
        type: 'circle',
        role: 'projectile',
        props: {
          cx: { $expr: '30 + 70 * (time % 6)' },
          cy: { $expr: '260 - (120 * (time % 6) - 20 * (time % 6)^2)' },
          r: 10,
          fill: '#38bdf8',
        },
      },
      {
        id: 'time-label',
        type: 'text',
        role: 'none',
        props: {
          x: 40,
          y: 40,
          fill: '#f8fafc',
          fontSize: 14,
        },
        text: 't = {round(time % 6, 2)} s',
      },
    ],
  },
}

export const chemistryFixture: SimSpec = {
  version: '2.0',
  parentTopic: 'Gas Laws',
  title: 'Ideal Gas Particle Collisions',
  subtitle: 'Kinetic theory of particles in a sealed container',
  domain: 'chemistry',
  topicExplanation:
    'Gas pressure arises from the continuous collisions of rapidly moving particles against the container walls.',
  caption: 'PV = nRT — Average kinetic energy is proportional to temperature.',
  isSimulatable: true,
  reasonIfNotSimulatable: '',
  quote: 'Gas particles are in continuous, random, straight-line motion undergoing elastic collisions.',
  equations: ['PV = nRT', 'E_k = \\frac{3}{2} k_B T'],
  stage: {
    viewBox: '0 0 500 300',
    elements: [
      {
        id: 'chamber',
        type: 'rect',
        role: 'none',
        props: {
          x: 50,
          y: 40,
          width: 400,
          height: 220,
          stroke: '#64748b',
          strokeWidth: 3,
          fill: '#0f172a',
        },
      },
      {
        id: 'gas-particles',
        type: 'particles',
        role: 'none',
        props: {
          count: 15,
          speed: 80,
          radius: 5,
          color: '#ec4899',
          boundsX: 50,
          boundsY: 40,
          boundsWidth: 400,
          boundsHeight: 220,
        },
      },
      {
        id: 'pressure-gauge',
        type: 'text',
        role: 'none',
        props: {
          x: 60,
          y: 70,
          fill: '#a855f7',
          fontSize: 13,
        },
        text: 'P = 1.02 atm (Const T)',
      },
    ],
  },
}

export const mathFixture: SimSpec = {
  version: '2.0',
  parentTopic: 'Trigonometry',
  title: 'Unit Circle & Sine Wave Generator',
  subtitle: 'Mapping circular motion to harmonic oscillations',
  domain: 'math',
  topicExplanation:
    'As a point travels around the unit circle, its y-coordinate traces out the continuous sine function.',
  caption: 'y = sin(θ) where θ = ωt',
  isSimulatable: true,
  reasonIfNotSimulatable: '',
  quote: 'The sine of an angle in a unit circle corresponds directly to the vertical coordinate of the point.',
  equations: ['y = \\sin(\\theta)', '\\theta = \\omega t'],
  stage: {
    viewBox: '0 0 500 300',
    elements: [
      {
        id: 'circle-base',
        type: 'circle',
        role: 'none',
        props: {
          cx: 140,
          cy: 150,
          r: 80,
          stroke: '#64748b',
          strokeWidth: 2,
          fill: 'none',
        },
      },
      {
        id: 'rotating-radius',
        type: 'line',
        role: 'none',
        props: {
          x1: 140,
          y1: 150,
          x2: { $expr: '140 + 80 * cos(time * 2)' },
          y2: { $expr: '150 - 80 * sin(time * 2)' },
          stroke: '#fbbf24',
          strokeWidth: 2,
        },
      },
      {
        id: 'orbiting-point',
        type: 'circle',
        role: 'projectile',
        props: {
          cx: { $expr: '140 + 80 * cos(time * 2)' },
          cy: { $expr: '150 - 80 * sin(time * 2)' },
          r: 6,
          fill: '#f59e0b',
        },
      },
      {
        id: 'wave-trail',
        type: 'wave',
        role: 'none',
        props: {
          amplitude: 80,
          frequency: 2,
          phase: { $expr: 'time * 2' },
          startX: 260,
          endX: 470,
          y: 150,
          stroke: '#38bdf8',
        },
      },
    ],
  },
}

export const generalFixture: SimSpec = {
  version: '2.0',
  parentTopic: 'Systems & Processes',
  title: 'Conveyor Queue Buffer',
  subtitle: 'FIFO item ingestion and buffer throughput',
  domain: 'general',
  topicExplanation:
    'Items enter the pipeline at a constant rate and progress synchronously across stages.',
  caption: 'Throughput is bounded by the bottleneck stage latency.',
  isSimulatable: true,
  reasonIfNotSimulatable: '',
  quote: 'In a pipelined process, continuous flow minimizes idle time between stages.',
  equations: ['\\text{Throughput} = \\frac{N}{\\Delta t}'],
  stage: {
    viewBox: '0 0 500 300',
    elements: [
      {
        id: 'conveyor-belt',
        type: 'rect',
        role: 'none',
        props: {
          x: 40,
          y: 130,
          width: 420,
          height: 40,
          fill: '#334155',
          rx: 6,
        },
      },
      {
        id: 'payload-packet',
        type: 'rect',
        role: 'none',
        props: {
          x: { $expr: '40 + (time * 60) % 400' },
          y: 110,
          width: 30,
          height: 20,
          fill: '#10b981',
          rx: 3,
        },
      },
    ],
  },
}

export const nonSimulatableFixture: SimSpec = {
  version: '2.0',
  parentTopic: 'History of Science',
  title: 'Overview of Classical Discoveries',
  subtitle: 'Chronological timeline of milestones',
  domain: 'general',
  topicExplanation: 'Historical accounts of early experiments lack dynamic state parameters.',
  caption: 'Timeline only.',
  isSimulatable: false,
  reasonIfNotSimulatable: 'Static historical text with no animated physical or mathematical process.',
  quote: 'In the seventeenth century, natural philosophers recorded foundational observations.',
  equations: [],
}

export const templateProjectileFixture: SimSpec = {
  version: '2.0',
  parentTopic: 'Kinematics',
  title: 'Projectile from textbook values',
  subtitle: 'Bound at click from extracted v0, angle, and g',
  domain: 'physics',
  topicExplanation:
    'A projectile launched with an initial velocity follows a parabola under constant gravity.',
  caption: 'Solver uses x = v0 cos(θ) t, y = h0 + v0 sin(θ) t − ½ g t²',
  isSimulatable: true,
  reasonIfNotSimulatable: '',
  quote: 'A ball is thrown at 20 m/s at 45° from ground level.',
  equations: ['R = v_0^2 \\sin(2\\theta) / g'],
  templateId: 'projectile_2d',
  params: { v0: 20, angleDeg: 45, h0: 0, g: 9.81 },
  paramMeta: {
    v0: { unit: 'm/s', source: 'extracted' },
    angleDeg: { unit: 'deg', source: 'extracted' },
    h0: { unit: 'm', source: 'extracted' },
    g: { unit: 'm/s^2', source: 'default' },
  },
}

export const allFixtures: Record<string, SimSpec> = {
  physics: physicsFixture,
  chemistry: chemistryFixture,
  math: mathFixture,
  general: generalFixture,
  nonSimulatable: nonSimulatableFixture,
  templateProjectile: templateProjectileFixture,
}
