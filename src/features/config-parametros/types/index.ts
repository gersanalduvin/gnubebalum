// Tipos para Config Parámetros

// Interfaz principal de ConfigParametros
export interface ConfigParametros {
  id: number
  uuid: string
  consecutivo_recibo_oficial: number
  consecutivo_recibo_interno: number
  tasa_cambio_dolar: string
  terminal_separada: boolean
  cambios: CambioParametro[]
  created_by: number
  updated_by: number | null
  deleted_by: number | null
  is_synced: boolean
  synced_at: string | null
  updated_locally_at: string | null
  version: number
  created_at: string
  updated_at: string
  deleted_at: string | null
}

// Interfaz para los cambios/bitácora
export interface CambioParametro {
  fecha: string
  accion: string
  datos_anteriores: any
  datos_nuevos: any
  usuario_email: string
}

// Datos para crear/actualizar parámetros
export interface ConfigParametrosData {
  consecutivo_recibo_oficial: number
  consecutivo_recibo_interno: number
  tasa_cambio_dolar: string
  terminal_separada: boolean
}

// Respuesta de la API para obtener parámetros
export interface ConfigParametrosResponse {
  success: boolean
  data: ConfigParametros | ConfigParametrosData
  message: string
}

// Respuesta de la API para actualizar/crear parámetros
export interface ConfigParametrosUpdateResponse {
  success: boolean
  data: ConfigParametros
  message: string
}

// Errores de validación
export interface ValidationErrors {
  [key: string]: string[]
}

// Respuesta de error de la API
export interface ConfigParametrosErrorResponse {
  success: false
  message: string
  errors?: ValidationErrors
}

// Valores por defecto cuando no hay parámetros
export interface ConfigParametrosDefaults {
  consecutivo_recibo_oficial: number
  consecutivo_recibo_interno: number
  tasa_cambio_dolar: string
  terminal_separada: boolean
}

// Props para el formulario de parámetros
export interface ConfigParametrosFormProps {
  parametros?: ConfigParametros | null
  onSuccess: () => void
}

// Props para el modal de cambios
export interface CambiosModalProps {
  open: boolean
  onClose: () => void
  cambios: CambioParametro[]
}

// Estado del formulario
export interface ConfigParametrosFormState {
  loading: boolean
  errors: ValidationErrors
  showCambios: boolean
}