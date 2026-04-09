export interface EscalaDetalle {
  id?: number
  uuid?: string
  nombre: string
  abreviatura: string
  rango_inicio: number
  rango_fin: number
  orden: number
}

export interface Escala {
  id: number
  uuid?: string
  nombre: string
  detalles: EscalaDetalle[]
}

export interface EscalasPaginatedData {
  current_page: number
  data: Escala[]
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

export interface EscalasListResponse extends ApiResponse<EscalasPaginatedData> {}

export interface CreateUpdateEscalaPayload {
  id?: number
  nombre: string
  detalles: EscalaDetalle[]
}

export type EscalasSearchParams = {
  page?: number
  per_page?: number
  notas?: string
}

export interface EscalasTableFilters {
  search: string
}

export type EscalaModalMode = 'create' | 'edit'

export interface EscalaModalState {
  open: boolean
  mode: EscalaModalMode
  escala?: Escala
}

export interface DetalleModalState {
  open: boolean
  detalle?: EscalaDetalle
}

export interface DeleteEscalaConfirmState {
  open: boolean
  escala?: Escala
}

export interface DeleteDetalleConfirmState {
  open: boolean
  detalle?: EscalaDetalle
}
