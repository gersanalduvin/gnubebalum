export interface Asignatura {
  id: number
  uuid?: string
  nombre: string
  abreviatura: string
  materia_id: number
  orden?: number
}

export interface AreaAsignatura {
  id: number
  nombre: string
}

export interface AsignaturasPaginatedData {
  current_page: number
  data: Asignatura[]
  per_page: number
  total: number
}

export interface ValidationErrors {
  [key: string]: string[]
}

export interface ApiResponse<T> {
  success: boolean
  data: T
  message: string
  errors?: ValidationErrors
}

export interface AsignaturasListResponse extends ApiResponse<AsignaturasPaginatedData> {}

export interface CreateAsignaturaPayload {
  nombre: string
  abreviatura: string
  materia_id: number
}

export interface UpdateAsignaturaPayload extends CreateAsignaturaPayload {
  id: number
}

export type AsignaturasSearchParams = {
  page?: number
  per_page?: number
  nombre?: string
}

export interface AsignaturasTableFilters {
  search: string
}

export type AsignaturaModalMode = 'create' | 'edit'

export interface AsignaturaModalState {
  open: boolean
  mode: AsignaturaModalMode
  asignatura?: Asignatura
}

export interface DeleteAsignaturaConfirmState {
  open: boolean
  asignatura?: Asignatura
}
