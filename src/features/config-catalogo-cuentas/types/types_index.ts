// Tipos para el módulo de Configuración de Catálogo de Cuentas

export interface ConfigCatalogoCuenta {
  id: number
  uuid: string
  codigo: string
  nombre: string
  tipo: 'activo' | 'pasivo' | 'patrimonio' | 'ingreso' | 'gasto'
  nivel: number
  padre_id: number | null
  es_grupo: boolean
  permite_movimiento: boolean
  naturaleza: 'deudora' | 'acreedora'
  descripcion: string | null
  estado: 'activo' | 'inactivo'
  moneda_usd: boolean
  is_synced: boolean
  synced_at: string | null
  version: number
  created_by: number
  updated_by: number | null
  deleted_by: number | null
  deleted_at: string | null
  cambios: CambioAuditoria[]
  created_at: string
  updated_at: string
  padre?: {
    id: number
    codigo: string
    nombre: string
  } | null
  hijos?: ConfigCatalogoCuenta[]
}

export interface CambioAuditoria {
  accion: string
  usuario_id: number
  usuario_email?: string
  fecha: string
  datos_nuevos: Record<string, any>
  datos_anteriores: Record<string, any>
}

export interface CreateCuentaRequest {
  codigo: string
  nombre: string
  tipo: 'activo' | 'pasivo' | 'patrimonio' | 'ingreso' | 'gasto'
  padre_id?: number | null
  es_grupo: boolean
  permite_movimiento: boolean
  naturaleza: 'deudora' | 'acreedora'
  descripcion?: string
  estado: 'activo' | 'inactivo'
  moneda_usd: boolean
  uuid?: string
  version?: number
}

export interface UpdateCuentaRequest {
  codigo?: string
  nombre?: string
  tipo?: 'activo' | 'pasivo' | 'patrimonio' | 'ingreso' | 'gasto'
  padre_id?: number | null
  es_grupo?: boolean
  permite_movimiento?: boolean
  naturaleza?: 'deudora' | 'acreedora'
  descripcion?: string
  estado?: 'activo' | 'inactivo'
  moneda_usd?: boolean
}

export interface CuentaPaginatedResponse {
  success: boolean
  data: {
    current_page: number
    data: ConfigCatalogoCuenta[]
    per_page: number
    total: number
    last_page: number
    from: number
    to: number
  }
  message: string
}

export interface CuentaArbolResponse {
  success: boolean
  data: ConfigCatalogoCuenta[]
  message: string
}

export interface CuentaEstadisticasResponse {
  success: boolean
  data: {
    total: number
    activos: number
    inactivos: number
    grupos: number
    movimiento: number
    por_tipo: {
      activo: number
      pasivo: number
      patrimonio: number
      ingreso: number
      gasto: number
    }
    por_naturaleza: {
      deudora: number
      acreedora: number
    }
    por_moneda: {
      cordobas: number
      dolares: number
    }
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
export interface CuentaTableFilters {
  search: string
  tipo?: string
  naturaleza?: string
  moneda?: string
  estado?: string
}

// Tipos para estados de modales
export interface CuentaModalState {
  open: boolean
  mode: 'create' | 'edit'
  cuenta?: ConfigCatalogoCuenta
}

export interface DeleteConfirmState {
  open: boolean
  cuenta?: ConfigCatalogoCuenta
}

// Tipos para parámetros de búsqueda
export interface CuentaSearchParams {
  page?: number
  size?: number
  per_page?: number
  search?: string
  filtro?: string
  valor?: string
}

// Tipos para errores de validación
export interface ValidationErrors {
  [key: string]: string[]
}

// Tipos para filtros específicos de la API
export type FiltroTipo = 'tipo' | 'nivel' | 'naturaleza' | 'moneda' | 'grupo' | 'movimiento' | 'hijas' | 'raiz' | 'arbol' | 'buscar'

// Tipos para sincronización
export interface SyncCuentaRequest {
  cuentas: ConfigCatalogoCuenta[]
}

export interface SyncResponse {
  success: boolean
  data: {
    created: number
    updated: number
    errors: any[]
  }
  message: string
}

// Opciones para selects
export const TIPOS_CUENTA = [
  { value: 'activo', label: 'Activo' },
  { value: 'pasivo', label: 'Pasivo' },
  { value: 'patrimonio', label: 'Patrimonio' },
  { value: 'ingreso', label: 'Ingreso' },
  { value: 'gasto', label: 'Gasto' }
] as const

export const NATURALEZAS_CUENTA = [
  { value: 'deudora', label: 'Deudora' },
  { value: 'acreedora', label: 'Acreedora' }
] as const

export const ESTADOS_CUENTA = [
  { value: 'activo', label: 'Activo' },
  { value: 'inactivo', label: 'Inactivo' }
] as const

export const MONEDAS_CUENTA = [
  { value: false, label: 'Córdobas' },
  { value: true, label: 'Dólares' }
] as const

// Tipos legacy para compatibilidad (mantener por ahora)
export interface CuentaCatalogo extends ConfigCatalogoCuenta {}

export interface CatalogoPaginatedData {
  current_page: number
  data: CuentaCatalogo[]
  per_page: number
  total: number
}

export interface CatalogoPaginatedResponse {
  data?: CatalogoPaginatedData
  message?: string
}

export interface CatalogoSearchParams extends CuentaSearchParams {}