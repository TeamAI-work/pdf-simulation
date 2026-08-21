import type { SimFile } from '../contract.js'
import { projectile_2d } from './projectile_2d.js'
import { free_fall } from './free_fall.js'
import { collision_1d } from './collision_1d.js'
import { pendulum } from './pendulum.js'
import { ramp_friction } from './ramp_friction.js'
import { buoyancy } from './buoyancy.js'
import { bounce_energy } from './bounce_energy.js'
import { force_ma } from './force_ma.js'
import { uniform_motion } from './uniform_motion.js'
import { accelerated_motion } from './accelerated_motion.js'
import { spring_shm } from './spring_shm.js'
import { circular_motion } from './circular_motion.js'
import { reflection_plane } from './reflection_plane.js'
import { snell_refraction } from './snell_refraction.js'
import { convex_lens } from './convex_lens.js'
import { ohm_circuit } from './ohm_circuit.js'
import { magnetic_wire } from './magnetic_wire.js'
import { sound_wave } from './sound_wave.js'
import { heat_conduction } from './heat_conduction.js'
import { shadow_light } from './shadow_light.js'
import { kinetic_particles } from './kinetic_particles.js'
import { states_of_matter } from './states_of_matter.js'
import { diffusion } from './diffusion.js'
import { gas_piston } from './gas_piston.js'
import { electron_shells } from './electron_shells.js'
import { ionic_bond } from './ionic_bond.js'
import { covalent_bond } from './covalent_bond.js'
import { collision_theory } from './collision_theory.js'
import { electrolysis } from './electrolysis.js'
import { number_line_walk } from './number_line_walk.js'
import { fraction_bar } from './fraction_bar.js'
import { linear_graph } from './linear_graph.js'
import { quadratic_parabola } from './quadratic_parabola.js'
import { unit_circle } from './unit_circle.js'
import { angle_of_elevation } from './angle_of_elevation.js'
import { pythagoras } from './pythagoras.js'
import { circle_unroll } from './circle_unroll.js'
import { similar_triangles } from './similar_triangles.js'
import { transform_2d } from './transform_2d.js'
import { volume_fill } from './volume_fill.js'
import { coordinate_plot } from './coordinate_plot.js'
import { st_vt_graph } from './st_vt_graph.js'
import { vi_graph } from './vi_graph.js'
import { inverse_graph } from './inverse_graph.js'
import { bar_chart } from './bar_chart.js'
import { histogram } from './histogram.js'
import { ap_graph } from './ap_graph.js'
import { angle_pair } from './angle_pair.js'
import { parallel_transversal } from './parallel_transversal.js'
import { triangle_angles } from './triangle_angles.js'
import { quadrilateral_live } from './quadrilateral_live.js'
import { circle_tangent } from './circle_tangent.js'
import { sector_segment } from './sector_segment.js'
import { section_formula } from './section_formula.js'
import { identity_tiles } from './identity_tiles.js'
import { ratio_bars } from './ratio_bars.js'
import { equation_balance } from './equation_balance.js'
import { square_grid } from './square_grid.js'
import { probability_spinner } from './probability_spinner.js'
import { clock_hands } from './clock_hands.js'
import { pressure_area } from './pressure_area.js'
import { liquid_pressure } from './liquid_pressure.js'
import { series_parallel } from './series_parallel.js'
import { heating_effect } from './heating_effect.js'
import { mirror_ray } from './mirror_ray.js'
import { prism } from './prism.js'
import { echo } from './echo.js'
import { work_fs } from './work_fs.js'
import { solenoid } from './solenoid.js'
import { separation_mix } from './separation_mix.js'
import { ph_strip } from './ph_strip.js'
import { state_change_curve } from './state_change_curve.js'
import { reactivity_swap } from './reactivity_swap.js'

export const SIM_REGISTRY = {
  projectile_2d,
  free_fall,
  collision_1d,
  pendulum,
  ramp_friction,
  buoyancy,
  bounce_energy,
  force_ma,
  uniform_motion,
  accelerated_motion,
  spring_shm,
  circular_motion,
  reflection_plane,
  snell_refraction,
  convex_lens,
  ohm_circuit,
  magnetic_wire,
  sound_wave,
  heat_conduction,
  shadow_light,
  kinetic_particles,
  states_of_matter,
  diffusion,
  gas_piston,
  electron_shells,
  ionic_bond,
  covalent_bond,
  collision_theory,
  electrolysis,
  number_line_walk,
  fraction_bar,
  linear_graph,
  quadratic_parabola,
  unit_circle,
  angle_of_elevation,
  pythagoras,
  circle_unroll,
  similar_triangles,
  transform_2d,
  volume_fill,
  coordinate_plot,
  st_vt_graph,
  vi_graph,
  inverse_graph,
  bar_chart,
  histogram,
  ap_graph,
  angle_pair,
  parallel_transversal,
  triangle_angles,
  quadrilateral_live,
  circle_tangent,
  sector_segment,
  section_formula,
  identity_tiles,
  ratio_bars,
  equation_balance,
  square_grid,
  probability_spinner,
  clock_hands,
  pressure_area,
  liquid_pressure,
  series_parallel,
  heating_effect,
  mirror_ray,
  prism,
  echo,
  work_fs,
  solenoid,
  separation_mix,
  ph_strip,
  state_change_curve,
  reactivity_swap,
} as const satisfies Record<string, SimFile>

export type TemplateId = keyof typeof SIM_REGISTRY

export const TEMPLATE_IDS = Object.keys(SIM_REGISTRY) as TemplateId[]

export function getSim(id: TemplateId): SimFile {
  return SIM_REGISTRY[id]
}

export function runSim(id: TemplateId, params: Record<string, number>) {
  return SIM_REGISTRY[id].run(params)
}
