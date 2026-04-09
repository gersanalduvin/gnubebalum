// Tipos para el módulo de Configuración de Formas de Pago

export interface ConfigFormaPago {
  id: number
  uuid: string
  nombre: string
  abreviatura: string
  es_efectivo: boolean
  moneda?: number // 0=Córdoba, 1=Dólar
  activo: boolean
  created_by: number
  updated_by: number | null
  deleted_by: number | null
  is_synced: boolean
  synced_at: string | null
  updated_locally_at: string | null
  version: number
  cambios: CambioAuditoria[]
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export interface CambioAuditoria {
  accion: string
  usuario_id: number
  usuario_email?: string
  fecha: string
  datos_nuevos: Record<string, any>
  datos_anteriores: Record<string, any> | null
}

export interface CreateFormaPagoRequest {
  nombre: string
  abreviatura: string
  es_efectivo?: boolean
  moneda?: number // 0=Córdoba, 1=Dólar
  activo?: boolean
}

export interface UpdateFormaPagoRequest {
  nombre?: string
  abreviatura?: string
  es_efectivo?: boolean
  moneda?: number // 0=Córdoba, 1=Dólar
  activo?: boolean
}

export interface FormaPagoPaginatedResponse {
  success: boolean
  data: {
    current_page: number
    data: ConfigFormaPago[]
    first_page_url: string
    from: number
    last_page: number
    last_page_url: string
    links: PaginationLink[]
    next_page_url: string | null
    path: string
    per_page: number
    prev_page_url: string | null
    to: number
    total: number
  }
  message: string
}

export interface PaginationLink {
  url: string | null
  label: string
  active: boolean
}

export interface ApiResponse<T> {
  success: boolean
  data: T
  message: string
  errors?: ValidationErrors
}

export interface PaginatedResponse<T> {
  current_page: number
  data: T[]
  per_page: number
  total: number
  last_page: number
  from: number
  to: number
  links: PaginationLink[]
}

// Tipos para filtros de tabla
export interface FormaPagoTableFilters {
  search: string
  activo?: boolean | null
}

// Tipos para estados de modales
export interface FormaPagoModalState {
  open: boolean
  mode: 'create' | 'edit'
  formaPago?: ConfigFormaPago
}

export interface DeleteConfirmState {
  open: boolean
  formaPago?: ConfigFormaPago
}

// Tipos para parámetros de búsqueda
export interface FormaPagoSearchParams {
  page?: number
  size?: number
  per_page?: number
  search?: string
  activo?: boolean
}

// Tipos para errores de validación
export interface ValidationErrors {
  [key: string]: string[]
}
