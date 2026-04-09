// Datos Personales
export interface DatosPersonales {
  cedula: string
  estado_civil: 'Soltero' | 'Casado' | 'Divorciado' | 'Viudo' | 'Unión libre' | ''
  nacionalidad: string
}

// Presentación
export interface Presentacion {
  presentacion: string
  telefono_profesional: string
  email_profesional: string
  linkedin_url: string
  sitio_web: string
}

// Experiencia Laboral
export interface ExperienciaLaboral {
  cargo: string
  empresa: string
  fecha_inicio: string
  fecha_fin: string | null
  actualmente: boolean
  descripcion: string
}

// Formación Académica
export interface FormacionAcademica {
  nivel: string
  titulo: string
  institucion: string
  anio_inicio: number
  anio_fin: number | null
  en_curso: boolean
  documento_path?: string
  documento_url?: string
}

// Referencias
export interface Referencia {
  nombre: string
  cargo: string
  empresa: string
  telefono: string
  email: string
}

// Perfil Profesional Completo
export interface UserProfessionalProfile {
  id: number
  user_id: number
  // Datos Personales
  cedula: string | null
  estado_civil: string | null
  nacionalidad: string | null
  // Presentación
  presentacion: string | null
  telefono_profesional: string | null
  email_profesional: string | null
  linkedin_url: string | null
  sitio_web: string | null
  // Arrays JSON
  experiencia_laboral: ExperienciaLaboral[]
  formacion_academica: FormacionAcademica[]
  habilidades_blandas: string[]
  referencias: Referencia[]
  // Auditoría
  created_by: number | null
  updated_by: number | null
  deleted_by: number | null
  created_at: string
  updated_at: string
  deleted_at: string | null
  // Relación con usuario
  user?: {
    id: number
    primer_nombre: string
    segundo_nombre: string
    primer_apellido: string
    segundo_apellido: string
    email: string
    fecha_nacimiento: string | null
    sexo: 'M' | 'F' | null
    pais_nacimiento: string | null
    ciudad_nacimiento: string | null
    departamento: string | null
    direccion_domicilio: string | null
    foto_url: string | null
  }
}

// Form Data para crear/actualizar perfil
export interface UserProfessionalProfileFormData {
  // Datos Personales
  cedula?: string
  estado_civil?: string
  nacionalidad?: string
  // Presentación
  presentacion?: string
  telefono_profesional?: string
  email_profesional?: string
  linkedin_url?: string
  sitio_web?: string
  // Arrays JSON
  experiencia_laboral?: ExperienciaLaboral[]
  formacion_academica?: FormacionAcademica[]
  habilidades_blandas?: string[]
  referencias?: Referencia[]
}

// Respuestas de API
export interface ProfessionalProfileResponse {
  success: boolean
  message: string
  data: UserProfessionalProfile | null
}

export interface DocumentUploadResponse {
  success: boolean
  message: string
  data: {
    url: string
    path: string
    file_name: string
    file_size: number
    mime_type: string
  }
}

export interface ValidationErrors {
  [key: string]: string[]
}

export interface ApiErrorResponse {
  success: false
  message: string
  errors?: ValidationErrors
}
