export type ValidationErrors = Record<string, string[]>

export interface Evidencia {
  id?: number
  evidencia: string
  indicador: null | { criterio?: string; [key: string]: any }
}

export interface CorteEntry {
  id?: number
  corte_id: number
  evidencias: Evidencia[]
}

export interface ParametroEntry {
  id?: number
  parametro: string
  valor: string
}

export interface HijaEntry {
  asignatura_hija_id: number
}

export interface NotAsignaturaGradoFormData {
  id?: number
  periodo_lectivo_id: number | ''
  grado_id: number | ''
  materia_id: number | ''
  escala_id: number | ''
  nota_aprobar: number | ''
  nota_maxima: number | ''
  incluir_en_promedio: boolean
  incluir_en_reporte_mined: boolean
  incluir_horario: boolean
  incluir_boletin: boolean
  mostrar_escala: boolean
  tipo_evaluacion: string
  es_para_educacion_iniciativa: boolean
  permitir_copia: boolean
  incluir_plan_clase: boolean
  cortes: CorteEntry[]
  parametros: ParametroEntry[]
  hijas: HijaEntry[]
}
