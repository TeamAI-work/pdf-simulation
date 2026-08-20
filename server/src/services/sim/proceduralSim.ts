// server/src/services/sim/proceduralSim.ts

import type { Candidate } from './candidateSchema.js'
import type { SimSpec } from '@pdf-sim/shared'

export interface ConceptContext {
  title?: string
  subtitle?: string
  parentTopic?: string
  domain?: string
  topicExplanation?: string
  equations?: string[]
  quote?: string
}

/**
 * Creates distinct, high-quality, concept-tailored animated SVG SimSpecs for STEM concepts
 * based on the title, domain, equations, and textbook context.
 */
export function generateProceduralSimSpec(
  promptOrTopic: string,
  context: ConceptContext = {}
): Candidate {
  const title = context.title || promptOrTopic.substring(0, 60)
  const fullText = `${promptOrTopic} ${context.title || ''} ${context.subtitle || ''} ${context.parentTopic || ''} ${context.topicExplanation || ''} ${(context.equations || []).join(' ')}`.toLowerCase()
  const domain = (context.domain as any) || (fullText.includes('math') || fullText.includes('calculus') || fullText.includes('trig') ? 'math' : fullText.includes('chem') ? 'chemistry' : fullText.includes('bio') ? 'biology' : 'physics')
  const quote = context.quote || promptOrTopic.substring(0, 200)

  // 1. Chemistry: Atomic Shells / Bohr Model / Electron Orbitals
  if (fullText.includes('atom') || fullText.includes('electron') || fullText.includes('orbital') || fullText.includes('bohr') || fullText.includes('nucleus') || fullText.includes('covalent') || domain === 'chemistry') {
    return {
      version: '2.0',
      importance: 9,
      quote,
      title: context.title || 'Atomic Orbitals & Electron Shell Dynamics',
      subtitle: context.subtitle || 'Quantized electron orbits around the atomic nucleus',
      parentTopic: context.parentTopic || 'Atomic Physics & Chemistry',
      domain: 'chemistry',
      topicExplanation: context.topicExplanation || 'Electrons occupy quantized orbital energy levels around the nucleus with defined radial probabilities.',
      caption: 'Electrons orbit the central nucleus in concentric principal quantum shells at relativistic frequencies.',
      isSimulatable: true,
      reasonIfNotSimulatable: '',
      equations: context.equations && context.equations.length > 0 ? context.equations : [
        'r_n = \\frac{4\\pi\\varepsilon_0 \\hbar^2}{m e^2} n^2',
        'E_n = -\\frac{13.6\\text{ eV}}{n^2}'
      ],
      stage: {
        viewBox: '0 0 500 300',
        elements: [
          {
            id: 'nucleus',
            type: 'circle',
            role: 'none',
            props: {
              cx: 250,
              cy: 150,
              r: 16,
              fill: '#ef4444',
              stroke: '#b91c1c',
              strokeWidth: 2,
            },
          },
          {
            id: 'nucleus-label',
            type: 'text',
            role: 'none',
            props: {
              x: 242,
              y: 154,
              text: '+Z',
              fill: '#ffffff',
              fontSize: 12,
            },
          },
          {
            id: 'orbit-shell-1',
            type: 'circle',
            role: 'none',
            props: {
              cx: 250,
              cy: 150,
              r: 55,
              fill: 'none',
              stroke: '#38bdf8',
              strokeWidth: 1.5,
              strokeDasharray: '4 4',
            },
          },
          {
            id: 'electron-1a',
            type: 'circle',
            role: 'projectile',
            props: {
              cx: { $expr: '250 + 55 * cos(time * 3)' },
              cy: { $expr: '150 + 55 * sin(time * 3)' },
              r: 5,
              fill: '#38bdf8',
            },
          },
          {
            id: 'electron-1b',
            type: 'circle',
            role: 'projectile',
            props: {
              cx: { $expr: '250 + 55 * cos(time * 3 + 3.1415)' },
              cy: { $expr: '150 + 55 * sin(time * 3 + 3.1415)' },
              r: 5,
              fill: '#38bdf8',
            },
          },
          {
            id: 'orbit-shell-2',
            type: 'circle',
            role: 'none',
            props: {
              cx: 250,
              cy: 150,
              r: 105,
              fill: 'none',
              stroke: '#818cf8',
              strokeWidth: 1.5,
              strokeDasharray: '6 6',
            },
          },
          {
            id: 'electron-2a',
            type: 'circle',
            role: 'projectile',
            props: {
              cx: { $expr: '250 + 105 * cos(-time * 1.8)' },
              cy: { $expr: '150 + 105 * sin(-time * 1.8)' },
              r: 5,
              fill: '#818cf8',
            },
          },
          {
            id: 'electron-2b',
            type: 'circle',
            role: 'projectile',
            props: {
              cx: { $expr: '250 + 105 * cos(-time * 1.8 + 2.09)' },
              cy: { $expr: '150 + 105 * sin(-time * 1.8 + 2.09)' },
              r: 5,
              fill: '#818cf8',
            },
          },
          {
            id: 'electron-2c',
            type: 'circle',
            role: 'projectile',
            props: {
              cx: { $expr: '250 + 105 * cos(-time * 1.8 + 4.18)' },
              cy: { $expr: '150 + 105 * sin(-time * 1.8 + 4.18)' },
              r: 5,
              fill: '#818cf8',
            },
          },
        ],
      },
    }
  }

  // 2. Uniform Circular Motion & Centripetal Acceleration
  if (fullText.includes('circular') || fullText.includes('centripetal') || fullText.includes('orbit') || fullText.includes('angular') || fullText.includes('rotation')) {
    return {
      version: '2.0',
      importance: 9,
      quote,
      title: context.title || 'Uniform Circular Motion & Centripetal Vectors',
      subtitle: context.subtitle || 'Radial acceleration vector perpendicular to tangential velocity',
      parentTopic: context.parentTopic || 'Rotational Kinematics',
      domain: 'physics',
      topicExplanation: context.topicExplanation || 'In uniform circular motion, acceleration is strictly radial and points toward the center of curvature while tangential velocity continuously alters direction.',
      caption: 'The green centripetal acceleration vector points toward the center while the red tangential velocity vector touches the path.',
      isSimulatable: true,
      reasonIfNotSimulatable: '',
      equations: context.equations && context.equations.length > 0 ? context.equations : [
        'a_c = \\frac{v^2}{r} = \\omega^2 r',
        '\\vec{v} = \\vec{\\omega} \\times \\vec{r}',
        'F_c = m \\frac{v^2}{r}'
      ],
      stage: {
        viewBox: '0 0 500 300',
        elements: [
          {
            id: 'center-pivot',
            type: 'circle',
            role: 'none',
            props: {
              cx: 250,
              cy: 150,
              r: 6,
              fill: '#475569',
            },
          },
          {
            id: 'orbit-guide',
            type: 'circle',
            role: 'none',
            props: {
              cx: 250,
              cy: 150,
              r: 90,
              fill: 'none',
              stroke: '#cbd5e1',
              strokeWidth: 2,
            },
          },
          {
            id: 'radius-tether',
            type: 'line',
            role: 'none',
            props: {
              x1: 250,
              y1: 150,
              x2: { $expr: '250 + 90 * cos(time * 2.2)' },
              y2: { $expr: '150 + 90 * sin(time * 2.2)' },
              stroke: '#94a3b8',
              strokeWidth: 1.5,
              strokeDasharray: '3 3',
            },
          },
          {
            id: 'orbiting-mass',
            type: 'circle',
            role: 'projectile',
            props: {
              cx: { $expr: '250 + 90 * cos(time * 2.2)' },
              cy: { $expr: '150 + 90 * sin(time * 2.2)' },
              r: 10,
              fill: '#0284c7',
              stroke: '#0369a1',
              strokeWidth: 2,
            },
          },
          {
            id: 'velocity-tangent-arrow',
            type: 'arrow',
            role: 'none',
            props: {
              x1: { $expr: '250 + 90 * cos(time * 2.2)' },
              y1: { $expr: '150 + 90 * sin(time * 2.2)' },
              x2: { $expr: '250 + 90 * cos(time * 2.2) - 45 * sin(time * 2.2)' },
              y2: { $expr: '150 + 90 * sin(time * 2.2) + 45 * cos(time * 2.2)' },
              stroke: '#ef4444',
              strokeWidth: 2,
            },
          },
          {
            id: 'accel-centripetal-arrow',
            type: 'arrow',
            role: 'none',
            props: {
              x1: { $expr: '250 + 90 * cos(time * 2.2)' },
              y1: { $expr: '150 + 90 * sin(time * 2.2)' },
              x2: { $expr: '250 + 90 * cos(time * 2.2) - 50 * cos(time * 2.2)' },
              y2: { $expr: '150 + 90 * sin(time * 2.2) - 50 * sin(time * 2.2)' },
              stroke: '#16a34a',
              strokeWidth: 2,
            },
          },
        ],
      },
    }
  }

  // 3. Magnetic Field / Electromagnetism
  if (fullText.includes('magnetic') || fullText.includes('wire') || fullText.includes('current') || fullText.includes('induction') || fullText.includes('lorentz') || fullText.includes('flux') || fullText.includes('solenoid')) {
    return {
      version: '2.0',
      importance: 9,
      quote,
      title: context.title || 'Electromagnetic Induction & Concentric Field Lines',
      subtitle: context.subtitle || 'Magnetic field geometry surrounding straight current conductor',
      parentTopic: context.parentTopic || 'Electromagnetism',
      domain: 'physics',
      topicExplanation: context.topicExplanation || 'Electric current produces concentric closed magnetic field circles whose strength diminishes inversely with distance from the conductor.',
      caption: 'Dynamic magnetic field lines expand outward as charges travel through the conductor.',
      isSimulatable: true,
      reasonIfNotSimulatable: '',
      equations: context.equations && context.equations.length > 0 ? context.equations : [
        'B = \\frac{\\mu_0 I}{2\\pi r}',
        '\\mathcal{E} = -\\frac{d\\Phi_B}{dt}',
        '\\vec{F} = q(\\vec{v} \\times \\vec{B})'
      ],
      stage: {
        viewBox: '0 0 500 300',
        elements: [
          {
            id: 'wire-conductor',
            type: 'line',
            role: 'none',
            props: {
              x1: 250,
              y1: 15,
              x2: 250,
              y2: 285,
              stroke: '#ef4444',
              strokeWidth: 6,
            },
          },
          {
            id: 'field-ring-1',
            type: 'circle',
            role: 'none',
            props: {
              cx: 250,
              cy: 150,
              r: { $expr: '35 + mod(time * 25, 60)' },
              fill: 'none',
              stroke: '#0284c7',
              strokeWidth: 2,
              strokeDasharray: '4 4',
            },
          },
          {
            id: 'field-ring-2',
            type: 'circle',
            role: 'none',
            props: {
              cx: 250,
              cy: 150,
              r: { $expr: '65 + mod(time * 25, 60)' },
              fill: 'none',
              stroke: '#38bdf8',
              strokeWidth: 1.5,
              strokeDasharray: '5 5',
            },
          },
          {
            id: 'field-ring-3',
            type: 'circle',
            role: 'none',
            props: {
              cx: 250,
              cy: 150,
              r: { $expr: '95 + mod(time * 25, 60)' },
              fill: 'none',
              stroke: '#94a3b8',
              strokeWidth: 1,
              strokeDasharray: '6 6',
            },
          },
          {
            id: 'charge-electron-1',
            type: 'circle',
            role: 'projectile',
            props: {
              cx: 250,
              cy: { $expr: '20 + mod(time * 80, 260)' },
              r: 5,
              fill: '#fbbf24',
            },
          },
          {
            id: 'charge-electron-2',
            type: 'circle',
            role: 'projectile',
            props: {
              cx: 250,
              cy: { $expr: '20 + mod((time + 1.5) * 80, 260)' },
              r: 5,
              fill: '#fbbf24',
            },
          },
        ],
      },
    }
  }

  // 4. Unit Circle & Trigonometry / Wave Mathematics
  if (fullText.includes('unit circle') || fullText.includes('trig') || fullText.includes('sine') || fullText.includes('cosine') || fullText.includes('wave') || domain === 'math') {
    return {
      version: '2.0',
      importance: 9,
      quote,
      title: context.title || 'Unit Circle & Harmonic Wave Graph Projection',
      subtitle: context.subtitle || 'Projection of rotating angle onto trigonometric functions',
      parentTopic: context.parentTopic || 'Trigonometry & Harmonic Analysis',
      domain: 'math',
      topicExplanation: context.topicExplanation || 'As an angle sweeps around the unit circle at uniform angular velocity, its vertical coordinate projects directly to generate a periodic sine function.',
      caption: 'The point on the unit circle projects its vertical displacement directly onto the evolving continuous sinusoidal wave.',
      isSimulatable: true,
      reasonIfNotSimulatable: '',
      equations: context.equations && context.equations.length > 0 ? context.equations : [
        'y(t) = A \\sin(\\omega t + \\phi)',
        '\\cos^2\\theta + \\sin^2\\theta = 1',
        '\\omega = 2\\pi f'
      ],
      stage: {
        viewBox: '0 0 500 300',
        elements: [
          {
            id: 'unit-circle-boundary',
            type: 'circle',
            role: 'none',
            props: {
              cx: 130,
              cy: 150,
              r: 75,
              fill: 'none',
              stroke: '#cbd5e1',
              strokeWidth: 2,
            },
          },
          {
            id: 'circle-axis-x',
            type: 'line',
            role: 'none',
            props: {
              x1: 40,
              y1: 150,
              x2: 220,
              y2: 150,
              stroke: '#94a3b8',
              strokeWidth: 1,
            },
          },
          {
            id: 'rotating-radius',
            type: 'line',
            role: 'none',
            props: {
              x1: 130,
              y1: 150,
              x2: { $expr: '130 + 75 * cos(time * 2.5)' },
              y2: { $expr: '150 - 75 * sin(time * 2.5)' },
              stroke: '#2563eb',
              strokeWidth: 2.5,
            },
          },
          {
            id: 'rotating-point',
            type: 'circle',
            role: 'none',
            props: {
              cx: { $expr: '130 + 75 * cos(time * 2.5)' },
              cy: { $expr: '150 - 75 * sin(time * 2.5)' },
              r: 6,
              fill: '#ef4444',
            },
          },
          {
            id: 'projection-connector',
            type: 'line',
            role: 'none',
            props: {
              x1: { $expr: '130 + 75 * cos(time * 2.5)' },
              y1: { $expr: '150 - 75 * sin(time * 2.5)' },
              x2: 250,
              y2: { $expr: '150 - 75 * sin(time * 2.5)' },
              stroke: '#fbbf24',
              strokeWidth: 1.5,
              strokeDasharray: '3 3',
            },
          },
          {
            id: 'sine-wave-tracer',
            type: 'wave',
            role: 'none',
            props: {
              x: 250,
              y: 150,
              width: 230,
              amplitude: 75,
              frequency: 2.5,
              stroke: '#0284c7',
              strokeWidth: 2,
            },
          },
        ],
      },
    }
  }

  // 5. Pendulum & Simple Harmonic Oscillators
  if (fullText.includes('pendulum') || fullText.includes('harmonic') || fullText.includes('oscillation') || fullText.includes('shm') || fullText.includes('spring') || fullText.includes('hooke')) {
    return {
      version: '2.0',
      importance: 9,
      quote,
      title: context.title || 'Simple Harmonic Motion of an Oscillator',
      subtitle: context.subtitle || 'Continuous kinetic and potential energy exchange',
      parentTopic: context.parentTopic || 'Oscillations & Dynamics',
      domain: 'physics',
      topicExplanation: context.topicExplanation || 'A restoring force directly proportional to displacement causes continuous sinusoidal oscillation between extreme displacement and maximum velocity states.',
      caption: 'The oscillating bob swings along an arc while kinetic energy reaches maximum at the central equilibrium point.',
      isSimulatable: true,
      reasonIfNotSimulatable: '',
      equations: context.equations && context.equations.length > 0 ? context.equations : [
        'x(t) = A \\cos(\\omega t + \\phi)',
        'T = 2\\pi \\sqrt{\\frac{m}{k}}',
        'E = \\frac{1}{2} k A^2'
      ],
      stage: {
        viewBox: '0 0 500 300',
        elements: [
          {
            id: 'pivot-mount',
            type: 'circle',
            role: 'none',
            props: {
              cx: 250,
              cy: 35,
              r: 6,
              fill: '#475569',
            },
          },
          {
            id: 'pendulum-rod',
            type: 'line',
            role: 'none',
            props: {
              x1: 250,
              y1: 35,
              x2: { $expr: '250 + 160 * sin(0.75 * cos(time * 3))' },
              y2: { $expr: '35 + 160 * cos(0.75 * cos(time * 3))' },
              stroke: '#64748b',
              strokeWidth: 2,
            },
          },
          {
            id: 'pendulum-bob',
            type: 'circle',
            role: 'projectile',
            props: {
              cx: { $expr: '250 + 160 * sin(0.75 * cos(time * 3))' },
              cy: { $expr: '35 + 160 * cos(0.75 * cos(time * 3))' },
              r: 15,
              fill: '#0284c7',
              stroke: '#0369a1',
              strokeWidth: 2,
            },
          },
          {
            id: 'velocity-arrow',
            type: 'arrow',
            role: 'none',
            props: {
              x1: { $expr: '250 + 160 * sin(0.75 * cos(time * 3))' },
              y1: { $expr: '35 + 160 * cos(0.75 * cos(time * 3))' },
              x2: { $expr: '250 + 160 * sin(0.75 * cos(time * 3)) - 50 * sin(time * 3)' },
              y2: { $expr: '35 + 160 * cos(0.75 * cos(time * 3))' },
              stroke: '#16a34a',
              strokeWidth: 2,
            },
          },
        ],
      },
    }
  }

  // 6. Optics & Refraction (Snell's Law / Lenses)
  if (fullText.includes('optic') || fullText.includes('refract') || fullText.includes('light') || fullText.includes('snell') || fullText.includes('prism') || fullText.includes('reflection') || fullText.includes('lens')) {
    return {
      version: '2.0',
      importance: 9,
      quote,
      title: context.title || 'Light Refraction & Interface Boundary Dynamics',
      subtitle: context.subtitle || 'Phase velocity transition across refractive media',
      parentTopic: context.parentTopic || 'Geometrical & Wave Optics',
      domain: 'physics',
      topicExplanation: context.topicExplanation || 'When an optical ray crosses a boundary between media with differing refractive indices, its direction changes according to Snell\'s law of refraction.',
      caption: 'Dynamic ray of light refracts at the interface according to n₁ sin(θ₁) = n₂ sin(θ₂).',
      isSimulatable: true,
      reasonIfNotSimulatable: '',
      equations: context.equations && context.equations.length > 0 ? context.equations : [
        'n_1 \\sin(\\theta_1) = n_2 \\sin(\\theta_2)',
        'v = \\frac{c}{n}',
        '\\theta_c = \\arcsin\\left(\\frac{n_2}{n_1}\\right)'
      ],
      stage: {
        viewBox: '0 0 500 300',
        elements: [
          {
            id: 'medium-bottom-box',
            type: 'rect',
            role: 'none',
            props: {
              x: 20,
              y: 150,
              width: 460,
              height: 130,
              fill: '#e0f2fe',
              stroke: 'none',
            },
          },
          {
            id: 'interface-boundary',
            type: 'line',
            role: 'none',
            props: {
              x1: 20,
              y1: 150,
              x2: 480,
              y2: 150,
              stroke: '#0284c7',
              strokeWidth: 2,
            },
          },
          {
            id: 'surface-normal',
            type: 'line',
            role: 'none',
            props: {
              x1: 250,
              y1: 30,
              x2: 250,
              y2: 270,
              stroke: '#94a3b8',
              strokeWidth: 1,
              strokeDasharray: '4 4',
            },
          },
          {
            id: 'incident-ray',
            type: 'line',
            role: 'none',
            props: {
              x1: { $expr: '80 + 35 * sin(time)' },
              y1: 30,
              x2: 250,
              y2: 150,
              stroke: '#ea580c',
              strokeWidth: 2.5,
            },
          },
          {
            id: 'refracted-ray',
            type: 'line',
            role: 'none',
            props: {
              x1: 250,
              y1: 150,
              x2: { $expr: '350 + 22 * sin(time)' },
              y2: 270,
              stroke: '#2563eb',
              strokeWidth: 2.5,
            },
          },
        ],
      },
    }
  }

  // 7. Dynamic Kinematic Parabolic Motion (Concept Specific)
  return {
    version: '2.0',
    importance: 9,
    quote,
    title: context.title || title,
    subtitle: context.subtitle || '2D vector trajectory and dynamic time evolution',
    parentTopic: context.parentTopic || 'Kinematics & Dynamics',
    domain: domain || 'physics',
    topicExplanation: context.topicExplanation || `Interactive simulation visualizing the dynamic properties of ${title}.`,
    caption: `Watch the time evolution and continuous vector state updates of ${title}.`,
    isSimulatable: true,
    reasonIfNotSimulatable: '',
    equations: context.equations && context.equations.length > 0 ? context.equations : [
      'x(t) = x_0 + v_{0x} t',
      'y(t) = y_0 + v_{0y} t - \\frac{1}{2} g t^2',
      '\\vec{v}(t) = \\vec{v}_0 + \\vec{a} t'
    ],
    stage: {
      viewBox: '0 0 500 300',
      elements: [
        {
          id: 'ground-platform',
          type: 'line',
          role: 'none',
          props: {
            x1: 20,
            y1: 260,
            x2: 480,
            y2: 260,
            stroke: '#64748b',
            strokeWidth: 2,
          },
        },
        {
          id: 'dynamic-particle',
          type: 'circle',
          role: 'projectile',
          props: {
            cx: { $expr: '30 + mod(time, 3.5) * 120' },
            cy: { $expr: '260 - (130 * mod(time, 3.5) - 37 * mod(time, 3.5)^2)' },
            r: 9,
            fill: '#0284c7',
            stroke: '#0369a1',
            strokeWidth: 2,
          },
        },
        {
          id: 'tangent-vector-arrow',
          type: 'arrow',
          role: 'none',
          props: {
            x1: { $expr: '30 + mod(time, 3.5) * 120' },
            y1: { $expr: '260 - (130 * mod(time, 3.5) - 37 * mod(time, 3.5)^2)' },
            x2: { $expr: '30 + mod(time, 3.5) * 120 + 35' },
            y2: { $expr: '260 - (130 * mod(time, 3.5) - 37 * mod(time, 3.5)^2) - (130 - 74 * mod(time, 3.5)) * 0.25' },
            stroke: '#16a34a',
            strokeWidth: 2,
          },
        },
        {
          id: 'concept-title-label',
          type: 'text',
          role: 'none',
          props: {
            x: 35,
            y: 40,
            text: title.substring(0, 45),
            fill: '#0284c7',
            fontSize: 13,
          },
        },
      ],
    },
  }
}
