// Tipos para el módulo de Configuración de Aranceles

export interface ConfigArancel {
  id: number
  uuid: string
  codigo: string
  nombre: string
  precio: number
  moneda: boolean // false = Córdoba, true = Dólar
  cuenta_debito_id: number | null
  cuenta_credito_id: number | null
  cuenta_debito?: CuentaContable
  cuenta_credito?: CuentaContable
  activo: boolean
  is_synced: boolean
  synced_at: string | null
  updated_locally_at: string | null
  version: number
  created_by: number
  updated_by: number | null
  deleted_by: number | null
  deleted_at: string | null
  cambios: CambioAuditoria[]
  productos?: {
    id: number
    codigo: string
    nombre: string
    precio_venta: number
    pivot: {
      cantidad: number
    }
  }[]
  created_at: string
  updated_at: string
}

export interface CuentaContable {
  id: number
  codigo: string
  nombre: string
  tipo?: string
  nivel?: number
  naturaleza?: string
}

export interface CambioAuditoria {
  accion: string
  usuario_id: number
  usuario_email?: string
  fecha: string
  datos_nuevos: Record<string, any>
  datos_anteriores: Record<string, any>
}

export interface CreateArancelRequest {
  codigo: string
  nombre: string
  precio: number
  moneda: boolean
  cuenta_debito_id?: number | null
  cuenta_credito_id?: number | null
  activo?: boolean
  productos?: {
    producto_id: number
    cantidad: number
  }[]
}

export interface UpdateArancelRequest {
  codigo?: string
  nombre?: string
  precio?: number
  moneda?: boolean
  cuenta_debito_id?: number | null
  cuenta_credito_id?: number | null
  activo?: boolean
  productos?: {
    producto_id: number
    cantidad: number
  }[]
}

export interface ArancelPaginatedResponse {
  success: boolean
  data: {
    current_page: number
    data: ConfigArancel[]
    per_page: number
    total: number
    last_page: number
    from: number
    to: number
    first_page_url: string
    last_page_url: string
    next_page_url: string | null
    prev_page_url: string | null
    path: string
    links: PaginationLink[]
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
export interface ArancelTableFilters {
  search: string
  moneda: string // '' = todos, '0' = Córdoba, '1' = Dólar
  activo: string // '' = todos, '1' = activos, '0' = inactivos
}

// Tipos para estados de modales
export interface ArancelModalState {
  open: boolean
  mode: 'create' | 'edit'
  arancel?: ConfigArancel
}

export interface DeleteConfirmState {
  open: boolean
  arancel?: ConfigArancel
}

// Tipos para parámetros de búsqueda
export interface ArancelSearchParams {
  page?: number
  per_page?: number
  search?: string
  codigo?: string
  nombre?: string
  precio_min?: number
  precio_max?: number
  moneda?: boolean
  activo?: boolean
}

// Tipos para errores de validación
export interface ValidationErrors {
  [key: string]: string[]
}

// Tipos para estadísticas
export interface ArancelStats {
  total: number
  activos: number
  inactivos: number
  por_moneda: {
    local: number
    extranjera: number
  }
  precio_promedio: number
  precio_minimo: number
  precio_maximo: number
}

// Opciones de moneda para el select
export interface MonedaOption {
  value: boolean
  label: string
  symbol: string
}

export const MONEDA_OPTIONS: MonedaOption[] = [
  { value: false, label: 'Córdoba', symbol: 'C$' },
  { value: true, label: 'Dólar', symbol: '$' }
]

// Función helper para obtener el símbolo de moneda
export const getMonedaSymbol = (moneda: boolean): string => {
  return moneda ? '$' : 'C$'
}

// Función helper para obtener el nombre de la moneda
export const getMonedaLabel = (moneda: boolean): string => {
  return moneda ? 'Dólar' : 'Córdoba'
}
