export type Corte = 'corte_1' | 'corte_2' | 'corte_3' | 'corte_4'

export type EstadoAsistencia =
  | 'presente'
  | 'ausencia_justificada'
  | 'ausencia_injustificada'
  | 'tarde_justificada'
  | 'tarde_injustificada'
  | 'permiso'
  | 'suspendido'

export interface AsistenciaEstado {
  corte: Corte
  estado: EstadoAsistencia
}

export type ValidationErrors = Record<string, string[]>

export interface PeriodoLectivo {
  id: number
  nombre: string
}

export type GrupoResumenPorTurno = Record<string, { id: number; nombre: string }[]>

export interface UsuarioGrupo {
  id: number
  nombre: string
  email: string
}

export interface ExcepcionInput {
  user_id: number
  estado: ExcepcionRegistro['estado']
  justificacion?: string
  hora_registro?: string
}

export interface ExcepcionRegistro {
  id: number
  user_id: number
  estado: EstadoAsistencia
  justificacion?: string
  hora_registro?: string
}

export interface ReporteUsuarioPorCorte {
  user_id: number
  nombre: string
  ausencias_justificadas: number
  ausencias_injustificadas: number
  tardes_justificadas: number
  tardes_injustificadas: number
  porcentaje_asistencia: number
  porcentaje_llegada_tarde: number
}

export interface ReporteTotalesPorCorte {
  presentes: number
  ausencias_justificadas: number
  ausencias_injustificadas: number
  tardes_justificadas: number
  tardes_injustificadas: number
  promedio_asistencia: number
  promedio_llegada_tarde: number
}

export interface ReportePorCorteRespuesta {
  usuarios: ReporteUsuarioPorCorte[]
  totales: ReporteTotalesPorCorte
}

export interface ReporteGeneralRespuesta {
  usuarios: any[]
  totales: any
}

export interface ReporteGeneralPorGrupoRow {
  grupo: string
  turno: string
  cortes: Record<Corte, { AJ: number; AI: number; LLT: number; LLTI: number; '%A': number; '%LLT': number }>
  promedio_asistencia: number
  promedio_llegada_tarde: number
}

export interface ReporteGeneralPorGrupoRespuesta {
  rows: ReporteGeneralPorGrupoRow[]
  promedio_total_por_corte: Record<Corte, { '%A': number; '%LLT': number }>
  promedio_general_asistencia: number
  promedio_general_llegada_tarde: number
}

export interface ReporteGeneralPorGradoRow {
  grado: string
  turno: string
  cortes: Record<Corte, { AJ: number; AI: number; LLT: number; LLTI: number; '%A': number; '%LLT': number }>
  promedio_asistencia: number
  promedio_llegada_tarde: number
}

export interface ReporteGeneralPorGradoRespuesta {
  rows: ReporteGeneralPorGradoRow[]
  promedio_total_por_corte: Record<Corte, { '%A': number; '%LLT': number }>
  promedio_general_asistencia: number
  promedio_general_llegada_tarde: number
}

// Nuevos Reportes de Asistencia
export interface ReporteGrupoAlumnoSemanalRow {
  user_id: number
  nombre: string
  dias: Record<string, string> // Y-m-d => estado (p, A, J, Permiso, Suspendido)
  totales: {
    presentes: number
    ausentes: number
    justificados: number
    tardanzas: number
    permisos: number
    suspendidos: number
  }
}

export interface ReporteSemanalGrupoAlumnoRespuesta {
  grupo: string
  fechas: string[] // Array de fechas Y-m-d
  fechas_con_asistencia: string[] // Fechas que realmente tienen un pivote tomado
  alumnos: ReporteGrupoAlumnoSemanalRow[]
  totales_por_dia: Record<string, any>
}

export interface ReporteSemanalGrupoRow {
  grupo_id: number
  grupo: string
  turno: string
  total_matriculados: number
  asistencia_por_dia: Record<string, number>
  porcentaje_semanal: number
}

export interface ReporteSemanalGrupoRespuesta {
  rango: {
    inicio: string
    fin: string
    dias_habiles: number
  }
  detalle_grupos: ReporteSemanalGrupoRow[]
}

export interface ReporteGlobalRangoRespuesta {
  periodo_lectivo_id: number
  reporte_semanal: {
    semana_etiqueta: string
    porcentaje: number
  }[]
}

export interface ReporteInasistenciasGrupoEstudiante {
  nombre: string
  codigo: string
  estado: string
}

export interface ReporteInasistenciasGrupoGrupo {
  grupo: string
  id: number
  dias: Record<string, ReporteInasistenciasGrupoEstudiante[]>
}

export interface ReporteInasistenciasGrupoSemana {
  etiqueta: string
  fechas: { fecha: string; dia_nombre: string; dia_mes: string }[]
  detalle_grupos: ReporteInasistenciasGrupoGrupo[]
  consolidado: Record<string, Record<string, number>>
}

export interface ReporteInasistenciasGrupoRespuesta {
  rango: {
    inicio: string
    fin: string
  }
  semanas: ReporteInasistenciasGrupoSemana[]
}
