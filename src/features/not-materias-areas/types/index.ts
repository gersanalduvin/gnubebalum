export interface AreaAsignatura {
  id: number
  nombre: string
  orden: number
}

export interface AreasPaginatedData {
  current_page: number
  data: AreaAsignatura[]
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

export interface AreasListResponse extends ApiResponse<AreasPaginatedData> {}

export interface CreateAreaPayload {
  nombre: string
  orden: number
}

export interface UpdateAreaPayload extends CreateAreaPayload {
  id: number
}

export type AreasSearchParams = {
  page?: number
  per_page?: number
  nombre?: string
}

export interface AreasTableFilters {
  search: string
}

export type AreaModalMode = 'create' | 'edit'

export interface AreaModalState {
  open: boolean
  mode: AreaModalMode
  area?: AreaAsignatura
}

export interface DeleteAreaConfirmState {
  open: boolean
  area?: AreaAsignatura
}
