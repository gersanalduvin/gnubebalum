// Interfaces para el módulo de Alumnos basadas en la API documentation

// Interfaces para auditoría
export interface CambioAuditoria {
  accion: string
  usuario_id: number
  usuario_email?: string
  fecha: string
  datos_nuevos: Record<string, any>
  datos_anteriores: Record<string, any>
}

// Interfaces para Users Grupos (Registro Académico)
export interface UserGrupo {
  id: number
  user_id: number
  fecha_matricula: string
  periodo_lectivo_id: number
  grado_id: number
  grupo_id: number | null
  turno_id: number
  numero_recibo: string | null
  maestra_anterior: string | null
  tipo_ingreso: 'reingreso' | 'nuevo_ingreso' | 'traslado' | 'traslado'
  estado: 'activo' | 'no_activo' | 'retiro_anticipado'
  activar_estadistica: boolean
  corte_retiro: 'corte1' | 'corte2' | 'corte3' | 'corte4' | null
  corte_ingreso: 'corte1' | 'corte2' | 'corte3' | 'corte4' | null
  created_at: string
  updated_at: string
  deleted_at: string | null
  cambios?: CambioAuditoria[] | string
  
  // Relaciones
  periodo_lectivo?: PeriodoLectivo
  grado?: Grado
  grupo?: Grupo
  turno?: Turno
}

export interface PeriodoLectivo {
  id: number
  nombre: string
  fecha_inicio?: string
  fecha_fin?: string
  activo?: boolean
}

export interface Grado {
  id: number
  nombre: string
  nivel?: string
  orden?: number
  activo?: boolean
}

export interface Seccion {
  id: number
  nombre: string
  orden?: number
}

export interface Grupo {
  id: number
  nombre: string
  grado_id?: number
  turno_id?: number
  periodo_lectivo_id?: number
  seccion_id?: number
  capacidad_maxima?: number
  activo?: boolean
  grado?: Grado
  turno?: Turno
  seccion?: Seccion
}

export interface Turno {
  id: number
  nombre: string
  hora_inicio?: string
  hora_fin?: string
  activo?: boolean
}

export interface UserGrupoFormData {
  user_id: number
  fecha_matricula: string
  periodo_lectivo_id: number | null
  grado_id: number | null
  grupo_id: number | null
  turno_id: number | null
  numero_recibo: string
  maestra_anterior?: string
  tipo_ingreso: 'reingreso' | 'nuevo_ingreso' | 'traslado'
  estado: 'activo' | 'no_activo' | 'retiro_anticipado'
  activar_estadistica: boolean
  corte_retiro: 'corte1' | 'corte2' | 'corte3' | 'corte4' | null
  corte_ingreso: 'corte1' | 'corte2' | 'corte3' | 'corte4' | null
}

export interface UserGrupoFilters {
  user_id?: number
  page?: number
  per_page?: number
  periodo?: number
  grado?: number
  turno?: number
  estado?: string
}

export interface Alumno {
  id: number
  name: string
  email: string
  password?: string
  superadmin: boolean
  role_id: number | null
  tipo_usuario: 'alumno'
  
  // Campos de auditoría
  created_by: number | null
  updated_by: number | null
  deleted_by: number | null
  deleted_at: string | null
  cambios: CambioAuditoria[]
  created_at: string
  updated_at: string
  
  // Datos personales básicos
  codigo_mined: string | null
  codigo_unico: string | null
  primer_nombre: string
  segundo_nombre: string
  primer_apellido: string
  segundo_apellido: string
  fecha_nacimiento: string | null
  edad: string | null
  lugar_nacimiento: string | null
  sexo: 'M' | 'F' | null
  correo_notificaciones: string | null
  
  // Gestión de fotos
  foto: string | null
  foto_url: string | null
  foto_path: string | null
  foto_uploaded_at: string | null
  
  // Información de la madre
  nombre_madre: string | null
  fecha_nacimiento_madre: string | null
  edad_madre: string | null
  cedula_madre: string | null
  religion_madre: string | null
  estado_civil_madre: 'soltera' | 'casada' | 'divorciada' | 'viuda' | 'union_libre' | 'separada' | 'otro' | null
  telefono_madre: string | null
  telefono_claro_madre: string | null
  telefono_tigo_madre: string | null
  direccion_madre: string | null
  barrio_madre: string | null
  ocupacion_madre: string | null
  lugar_trabajo_madre: string | null
  telefono_trabajo_madre: string | null
  
  // Información del padre
  nombre_padre: string | null
  fecha_nacimiento_padre: string | null
  edad_padre: string | null
  cedula_padre: string | null
  religion_padre: string | null
  estado_civil_padre: 'soltero' | 'casado' | 'divorciado' | 'viudo' | 'union_libre' | 'separado' | 'otro' | null
  telefono_padre: string | null
  telefono_claro_padre: string | null
  telefono_tigo_padre: string | null
  direccion_padre: string | null
  barrio_padre: string | null
  ocupacion_padre: string | null
  lugar_trabajo_padre: string | null
  telefono_trabajo_padre: string | null
  
  // Información del responsable
  nombre_responsable: string | null
  cedula_responsable: string | null
  telefono_responsable: string | null
  direccion_responsable: string | null
  
  // Datos familiares
  cantidad_hijos: number | null
  lugar_en_familia: string | null
  personas_hogar: string | null
  encargado_alumno: string | null
  contacto_emergencia: string | null
  telefono_emergencia: string | null
  metodos_disciplina: string | null
  pasatiempos_familiares: string | null
  
  // Área médica/psicológica/social
  personalidad: string | null
  parto: 'natural' | 'cesarea' | null
  sufrimiento_fetal: boolean | null
  edad_gateo: number | null
  edad_caminar: number | null
  edad_hablar: number | null
  habilidades: string | null
  pasatiempos: string | null
  preocupaciones: string | null
  juegos_preferidos: string | null
  
  // Área social
  se_relaciona_familiares: boolean | null
  establece_relacion_coetaneos: boolean | null
  evita_contacto_personas: boolean | null
  especifique_evita_personas: string | null
  evita_lugares_situaciones: boolean | null
  especifique_evita_lugares: string | null
  respeta_figuras_autoridad: boolean | null
  
  // Área comunicativa
  atiende_cuando_llaman: boolean | null
  es_capaz_comunicarse: boolean | null
  comunica_palabras: boolean | null
  comunica_señas: boolean | null
  comunica_llanto: boolean | null
  dificultad_expresarse: boolean | null
  especifique_dificultad_expresarse: string | null
  dificultad_comprender: boolean | null
  especifique_dificultad_comprender: string | null
  atiende_orientaciones: boolean | null
  
  // Área psicológica
  estado_animo_general: 'alegre' | 'triste' | 'enojado' | 'indiferente' | null
  tiene_fobias: boolean | null
  generador_fobia: string | null
  tiene_agresividad: boolean | null
  tipo_agresividad: 'encubierta' | 'directa' | null
  
  // Área médica detallada
  patologias_detalle: string | null
  consume_farmacos: boolean | null
  farmacos_detalle: string | null
  tiene_alergias: boolean | null
  causas_alergia: string | null
  alteraciones_patron_sueño: boolean | null
  se_duerme_temprano: boolean | null
  se_duerme_tarde: boolean | null
  apnea_sueño: boolean | null
  pesadillas: boolean | null
  enuresis_secundaria: boolean | null
  alteraciones_apetito_detalle: boolean | null
  aversion_alimentos: string | null
  reflujo: boolean | null
  alimentos_favoritos: string | null
  alteracion_vision: boolean | null
  alteracion_audicion: boolean | null
  alteracion_tacto: boolean | null
  especifique_alteraciones_sentidos: string | null
  
  // Alteraciones físicas
  alteraciones_oseas: boolean | null
  alteraciones_musculares: boolean | null
  pie_plano: boolean | null
  
  // Datos especiales
  diagnostico_medico: string | null
  referido_escuela_especial: boolean | null
  trajo_epicrisis: boolean | null
  presenta_diagnostico_matricula: boolean | null
  
  // Información de retiro
  fecha_retiro: string | null
  retiro_notificado: boolean | null
  motivo_retiro: string | null
  informacion_retiro_adicional: string | null
  
  // Observaciones y firma
  observaciones: string | null
  nombre_persona_firma: string | null
  cedula_firma: string | null
}



export interface AlumnoFormData {
  id?: number
  primer_nombre: string
  segundo_nombre: string
  primer_apellido: string
  segundo_apellido: string
  email?: string
  tipo_usuario?: 'alumno'
  fecha_nacimiento?: string
  edad?: string
  lugar_nacimiento?: string
  sexo?: 'M' | 'F'
  codigo_mined?: string
  codigo_unico?: string
  correo_notificaciones?: string
  
  // Información de la madre
  nombre_madre?: string
  fecha_nacimiento_madre?: string
  edad_madre?: string
  cedula_madre?: string
  religion_madre?: string
  estado_civil_madre?: 'soltera' | 'casada' | 'divorciada' | 'viuda' | 'union_libre' | 'separada' | 'otro'
  telefono_madre?: string
  telefono_claro_madre?: string
  telefono_tigo_madre?: string
  direccion_madre?: string
  barrio_madre?: string
  ocupacion_madre?: string
  lugar_trabajo_madre?: string
  telefono_trabajo_madre?: string
  
  // Información del padre
  nombre_padre?: string
  fecha_nacimiento_padre?: string
  edad_padre?: string
  cedula_padre?: string
  religion_padre?: string
  estado_civil_padre?: 'soltero' | 'casado' | 'divorciado' | 'viudo' | 'union_libre' | 'separado' | 'otro'
  telefono_padre?: string
  telefono_claro_padre?: string
  telefono_tigo_padre?: string
  direccion_padre?: string
  barrio_padre?: string
  ocupacion_padre?: string
  lugar_trabajo_padre?: string
  telefono_trabajo_padre?: string
  
  // Información del responsable
  nombre_responsable?: string
  cedula_responsable?: string
  telefono_responsable?: string
  direccion_responsable?: string
  
  // Datos familiares
  cantidad_hijos?: number
  lugar_en_familia?: string
  personas_hogar?: string
  encargado_alumno?: string
  contacto_emergencia?: string
  telefono_emergencia?: string
  metodos_disciplina?: string
  pasatiempos_familiares?: string
  
  // Área médica/psicológica/social
  personalidad?: string
  parto?: 'natural' | 'cesarea'
  sufrimiento_fetal?: boolean
  edad_gateo?: number
  edad_caminar?: number
  edad_hablar?: number
  habilidades?: string
  pasatiempos?: string
  preocupaciones?: string
  juegos_preferidos?: string
  
  // Área social
  se_relaciona_familiares?: boolean
  establece_relacion_coetaneos?: boolean
  evita_contacto_personas?: boolean
  especifique_evita_personas?: string
  evita_lugares_situaciones?: boolean
  especifique_evita_lugares?: string
  respeta_figuras_autoridad?: boolean
  
  // Área comunicativa
  atiende_cuando_llaman?: boolean
  es_capaz_comunicarse?: boolean
  comunica_palabras?: boolean
  comunica_señas?: boolean
  comunica_llanto?: boolean
  dificultad_expresarse?: boolean
  especifique_dificultad_expresarse?: string
  dificultad_comprender?: boolean
  especifique_dificultad_comprender?: string
  atiende_orientaciones?: boolean
  
  // Área psicológica
  estado_animo_general?: 'alegre' | 'triste' | 'enojado' | 'indiferente'
  tiene_fobias?: boolean
  generador_fobia?: string
  tiene_agresividad?: boolean
  tipo_agresividad?: 'encubierta' | 'directa'
  
  // Área médica detallada
  patologias_detalle?: string
  consume_farmacos?: boolean
  farmacos_detalle?: string
  tiene_alergias?: boolean
  causas_alergia?: string
  alteraciones_patron_sueño?: boolean
  se_duerme_temprano?: boolean
  se_duerme_tarde?: boolean
  apnea_sueño?: boolean
  pesadillas?: boolean
  enuresis_secundaria?: boolean
  alteraciones_apetito_detalle?: boolean
  aversion_alimentos?: string
  reflujo?: boolean
  alimentos_favoritos?: string
  alteracion_vision?: boolean
  alteracion_audicion?: boolean
  alteracion_tacto?: boolean
  especifique_alteraciones_sentidos?: string
  
  // Alteraciones físicas
  alteraciones_oseas?: boolean
  alteraciones_musculares?: boolean
  pie_plano?: boolean
  
  // Datos especiales
  diagnostico_medico?: string
  referido_escuela_especial?: boolean
  trajo_epicrisis?: boolean
  presenta_diagnostico_matricula?: boolean
  
  // Información de retiro
  fecha_retiro?: string
  retiro_notificado?: boolean
  motivo_retiro?: string
  informacion_retiro_adicional?: string
  
  // Observaciones y firma
  observaciones?: string
  nombre_persona_firma?: string
  cedula_firma?: string
}

export interface AlumnoFilters {
  search?: string
  page?: number
  per_page?: number
  sort_by?: string
  sort_order?: 'asc' | 'desc'
  estado?: string
  grado_id?: number
  seccion_id?: number
  turno_id?: number
}

export interface AlumnoResponse {
  data: Alumno[]
  current_page: number
  last_page: number
  per_page: number
  total: number
}

export interface ApiResponse<T> {
  success: boolean
  message: string
  data: T
  errors?: ValidationErrors
}

export interface ValidationError {
  field: string
  message: string
}

// Tipo para errores de validación del backend (compatible con secciones)
export interface ValidationErrors {
  [key: string]: string[]
}

export interface ApiError {
  success: false
  message: string
  errors?: ValidationError[]
}

// Respuesta de la API con errores de validación
export interface ApiResponseWithValidation<T> {
  success: boolean
  data: T
  message: string
  errors?: ValidationErrors
}