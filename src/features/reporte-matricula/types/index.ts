// Tipos para el módulo de Reporte de Matrícula

export interface PeriodoLectivo {
  id: number
  nombre: string
  fecha_inicio: string
  fecha_fin: string
  estado: 'ACTIVO' | 'INACTIVO'
}

// Modalidades disponibles para filtro de reporte
export interface Modalidad {
  id: number
  nombre: string
}

export interface EstadisticaPorGrupoTurno {
  grupo: string
  turno: string
  varones: number
  mujeres: number
  nuevos_ingresos: number
  reingresos: number
  traslados: number
  total: number
}

export interface EstadisticaPorGradoTurno {
  grado: string
  turno: string
  varones: number
  mujeres: number
  nuevos_ingresos: number
  reingresos: number
  traslados: number
  total: number
}

export interface EstadisticaPorDia {
  fecha: string
  estadisticas: EstadisticaPorGradoTurno[]
  varones: number
  mujeres: number
  nuevos_ingresos: number
  reingresos: number
  traslados: number
  total: number
}

export interface EstadisticaPorUsuario {
  usuario: string
  varones: number
  mujeres: number
  nuevos_ingresos: number
  reingresos: number
  traslados: number
  total: number
}

export interface TotalesGrupoTurno {
  varones: number
  mujeres: number
  nuevos_ingresos: number
  reingresos: number
  traslados: number
  total: number
}

export interface TotalesGradoTurno {
  varones: number
  mujeres: number
  nuevos_ingresos: number
  reingresos: number
  traslados: number
  total: number
}

export interface TotalesPorDia {
  varones: number
  mujeres: number
  nuevos_ingresos: number
  reingresos: number
  traslados: number
  total: number
}

export interface EstadisticasGrupoTurno {
  estadisticas: EstadisticaPorGrupoTurno[]
  totales: TotalesGrupoTurno
}

export interface EstadisticasGradoTurno {
  estadisticas: EstadisticaPorGradoTurno[]
  totales: TotalesGradoTurno
}

export interface EstadisticasPorDia {
  estadisticas: EstadisticaPorDia[]
  totales: TotalesPorDia
}

export interface EstadisticasPorUsuario {
  estadisticas: EstadisticaPorUsuario[]
  varones_general: number
  mujeres_general: number
  nuevos_ingresos_general: number
  reingresos_general: number
  traslados_general: number
  total_general: number
}

export interface EstadisticasMatricula {
  estadisticas_grupo_turno: EstadisticasGrupoTurno
  estadisticas_grado_turno: EstadisticasGradoTurno
  estadisticas_por_dia: EstadisticasPorDia
  estadisticas_por_usuario: EstadisticasPorUsuario
}

export interface ReporteMatriculaData {
  periodo_lectivo: PeriodoLectivo
  fecha_generacion: string
  estadisticas_grupo_turno: EstadisticasGrupoTurno
  estadisticas_grado_turno: EstadisticasGradoTurno
  estadisticas_por_dia: EstadisticasPorDia
  estadisticas_por_usuario: EstadisticasPorUsuario
}

export interface ReporteMatriculaResponse {
  success: boolean
  data: ReporteMatriculaData
  message: string
}

export interface PeriodosLectivosResponse {
  success: boolean
  data: PeriodoLectivo[]
  message: string
}

export interface ModalidadesResponse {
  success: boolean
  data: Modalidad[]
  message: string
}