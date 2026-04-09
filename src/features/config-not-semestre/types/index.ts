export interface Parcial {
  id?: number
  uuid?: string
  nombre: string
  abreviatura: string
  fecha_inicio_corte: string
  fecha_fin_corte: string
  fecha_inicio_publicacion_notas: string
  fecha_fin_publicacion_notas: string
  orden: number
}

export interface Semestre {
  id: number
  uuid?: string
  nombre: string
  abreviatura: string
  orden: number
  periodo_lectivo_id: number
  parciales: Parcial[]
}

export interface SemestresPaginatedData {
  current_page: number
  data: Semestre[]
  per_page: number
  total: number
}

export interface ConfPeriodoLectivoOption {
  id: number
  nombre: string
}

export interface ValidationErrors {
  [key: string]: string[]
}

export type SemestreModalMode = 'create' | 'edit'

export interface SemestreModalState {
  isOpen: boolean
  mode: SemestreModalMode
  semestre?: Semestre
}

export interface DeleteConfirmState {
  isOpen: boolean
  semestre?: Semestre
}

export interface SemestresTableFilters {
  page: number
  per_page: number
  semestre?: string
  periodo_lectivo_id?: number
}

export interface UpsertSemestrePayload {
  id?: number
  nombre: string
  abreviatura: string
  orden: number
  periodo_lectivo_id: number
  parciales: Parcial[]
}
