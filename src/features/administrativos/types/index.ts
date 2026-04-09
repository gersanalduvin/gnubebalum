// Tipos para el módulo de Administrativos, alineados con la API

export interface Administrativo {
  id: number
  name?: string
  email: string
  password?: string
  superadmin?: boolean
  role_id: number | null
  tipo_usuario: 'administrativo'

  // Datos generales
  primer_nombre: string
  segundo_nombre: string
  primer_apellido: string
  segundo_apellido: string
  sexo: 'M' | 'F' | null
  correo_notificaciones: string | null
  fecha_nacimiento?: string | null

  // Foto
  foto_url: string | null
  foto_path: string | null

  // Datos de la madre requeridos por el usuario
  direccion_madre: string | null
  telefono_claro_madre: string | null

  // Metadatos
  created_at?: string
  updated_at?: string
  deleted_at?: string | null
}

export interface AdministrativoFormData {
  id?: number
  primer_nombre: string
  segundo_nombre: string
  primer_apellido: string
  segundo_apellido: string
  email?: string
  tipo_usuario?: 'administrativo'
  sexo?: 'M' | 'F'
  role_id?: number | null
  correo_notificaciones?: string
  fecha_nacimiento?: string | null
  foto_url?: string | null
  foto_path?: string | null
  direccion_madre?: string
  telefono_claro_madre?: string
}

export interface AdministrativosFilters {
  search?: string
  page?: number
  per_page?: number
  sort_by?: string
  sort_order?: 'asc' | 'desc'
  estado?: string
}

export interface AdministrativosResponse {
  data: Administrativo[]
  current_page: number
  last_page: number
  per_page: number
  total: number
}

export interface ValidationErrors {
  [key: string]: string[]
}

export interface ApiResponse<T> {
  success: boolean
  message: string
  data: T
  errors?: ValidationErrors
}

export interface ApiResponseWithValidation<T> {
  success: boolean
  data: T
  message: string
  errors?: ValidationErrors
}