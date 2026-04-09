import { httpClient } from '@/utils/httpClient'

// Tipos básicos (se pueden mover a types/scheduleTypes.ts si crece mucho)
export interface ConfigAula {
  id: number
  uuid: string
  nombre: string
  tipo: 'aula' | 'laboratorio' | 'cancha' | 'otro'
  capacidad: number
  activa: boolean
  creado_por_nombre?: string
}

export interface ConfigBloqueHorario {
  id: number
  uuid: string
  turno_id: number
  grado_id?: number | null
  nombre: string
  hora_inicio: string
  hora_fin: string
  es_periodo_libre: boolean
  orden: number
  dias_aplicables: number[] | null
}

export interface HorarioClase {
  id?: number
  uuid?: string
  periodo_lectivo_id: number
  dia_semana: number
  bloque_horario_id?: number | null
  grupo_id: number
  asignatura_grado_id?: number | null
  docente_id?: number | null
  aula_id?: number | null
  titulo_personalizado?: string | null
  hora_inicio_real?: string | null
  hora_fin_real?: string | null
  is_fijo: boolean
  es_simultanea: boolean

  // Relaciones cargadas por el backend
  grupo?: {
    id: number
    nombre: string
    grado?: {
      id: number
      nombre: string
      abreviatura?: string
    }
    seccion?: {
      id: number
      nombre: string
    }
  }
  asignatura_grado?: {
    id: number
    materia?: {
      id: number
      nombre: string
      abreviatura?: string
    }
  }
  docente?: {
    id: number
    name: string
    last_name: string
  }
  aula?: {
    id: number
    nombre: string
  }
}

export interface DocenteDisponibilidad {
  id?: number
  docente_id: number
  dia_semana: number
  bloque_horario_id?: number | null
  hora_inicio?: string | null
  hora_fin?: string | null
  disponible: boolean
  motivo?: string | null
  titulo?: string | null
}

// Respuestas API
interface ApiResponse<T = any> {
  success?: boolean // A veces el backend no envía el booleano explícito en GETs directos
  data?: T
  message?: string
  errors?: Record<string, string[]> // Laravel validation errors
}

export class ScheduleService {
  private static BASE_URL = '/bk/v1/schedule'

  static async getPeriodos(): Promise<any[]> {
     const res: any = await httpClient.get('/bk/v1/conf-periodo-lectivo/getall')
     // Handle pagination (data.data) or simple wrapper (data) or direct array
     return res?.data?.data || res?.data || (Array.isArray(res) ? res : [])
  }

  // --- turnos helper ---
  static async getTurnos(): Promise<any[]> {
     const res: any = await httpClient.get('/bk/v1/config-turnos/getall') 
     return res?.data || (Array.isArray(res) ? res : [])
  }

  static async getDocentes(): Promise<any[]> {
     // Use the non-paginated endpoint for selectors
     const res: any = await httpClient.get('/bk/v1/users/teachers')
     return res?.data || (Array.isArray(res) ? res : [])
  }

  // --- HELPERS PARA MANUAL ENTRY ---

  static async getGrupos(periodoId: number, turnoId?: number): Promise<any[]> {
    if (turnoId) {
      const res: any = await httpClient.get(`/bk/v1/config-grupos/filtered?periodo_id=${periodoId}&turno_id=${turnoId}`)
      return res?.data?.data || res?.data || []
    }
    const res: any = await httpClient.get(`/bk/v1/config-grupos/by-periodo-lectivo/${periodoId}`)
    return res?.data || (Array.isArray(res) ? res : [])
  }

  static async getAsignaturas(periodoId: number, gradoId: number): Promise<any[]> {
    const res: any = await httpClient.get(`/bk/v1/not-asignatura-grado/getall?periodo_lectivo_id=${periodoId}&grado_id=${gradoId}&has_hours=true`)
    return res?.data || (Array.isArray(res) ? res : [])
  }

  static async getGroupAssignments(grupoId: number): Promise<any[]> {
    const res: any = await httpClient.get(`${this.BASE_URL}/group-assignments/${grupoId}`)
    return res?.data || (Array.isArray(res) ? res : [])
  }

  // --- GENERACIÓN Y HORARIO ---

  static async generateSchedule(periodoId: number, turnoId: number, grupoId?: number, dailyConfig?: any, recessMinutes?: number, subjectDuration?: number): Promise<any> {
    const response = await httpClient.post(`${this.BASE_URL}/generate`, {
      periodo_lectivo_id: periodoId,
      turno_id: turnoId,
      grupo_id: grupoId,
      daily_config: dailyConfig,
      recess_minutes: recessMinutes,
      subject_duration: subjectDuration
    })
    return response // El httpClient ya maneja errores basicos
  }

  static async generateWithAISchedule(periodoId: number, turnoId: number, grupoId?: number, dailyConfig?: any, instructions?: string, recessMinutes?: number, subjectDuration?: number): Promise<any> {
    const response = await httpClient.post(`${this.BASE_URL}/smart-generate`, {
      periodo_lectivo_id: periodoId,
      turno_id: turnoId,
      grupo_id: grupoId,
      daily_config: dailyConfig,
      instructions: instructions,
      recess_minutes: recessMinutes,
      subject_duration: subjectDuration
    })
    return response
  }

  static async clearSchedule(periodoId: number, grupoId?: number): Promise<any> {
    const response = await httpClient.delete(`${this.BASE_URL}/clear`, {
      periodo_lectivo_id: periodoId,
      grupo_id: grupoId
    })
    return response as any
  }

  static async getSchedule(params: {
    periodo_lectivo_id: number
    grupo_id?: number
    docente_id?: number
    aula_id?: number
  }): Promise<HorarioClase[]> {
    // Convertir objeto params a query string
    const queryParams = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, value.toString())
      }
    })

    // httpClient.get devuelve T directamente si no es estructura {data: T}
    // Ajustar según lo que retorne el backend. El controller retorna response()->json($data) directo (array o collection)
    const result = await httpClient.get<HorarioClase[]>(`${this.BASE_URL}?${queryParams.toString()}`)
    return result
  }

  static async generatePdf(params: {
    periodo_lectivo_id: number
    type: string
    id?: number
    turno_id?: number
  }): Promise<void> {
    const queryParams = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, value.toString())
      }
    })

    // HttpClient devuelve { data: Blob } si detecta application/pdf
    const response: any = await httpClient.get(`${this.BASE_URL}/pdf-report?${queryParams.toString()}`, {
        responseType: 'blob'
    })
    
    if (response.data) {
        const url = window.URL.createObjectURL(response.data)
        window.open(url, '_blank')
        
        // Cleanup after a delay
        setTimeout(() => {
            window.URL.revokeObjectURL(url)
        }, 1000)
    }
  }

  // --- BLOQUES DE CLASE (HorarioClase) ---

  static async saveBlock(blockData: Partial<HorarioClase>): Promise<HorarioClase> {
    const response: any = await httpClient.post(`${this.BASE_URL}/block`, blockData)
    return response?.data || response
  }

  static async deleteBlock(id: number | string): Promise<void> {
    await httpClient.delete(`${this.BASE_URL}/block/${id}`)
  }

  static async bulkUpdateSchedule(blocks: { id: number; dia_semana: number; hora_inicio_real: string; hora_fin_real: string }[]): Promise<any> {
    const response = await httpClient.post(`${this.BASE_URL}/bulk-update`, { blocks })
    return response
  }

  // --- AULAS ---

  static async getAulas(params?: { activa?: boolean }): Promise<ConfigAula[]> {
    const queryParams = params?.activa ? `?activa=${params.activa}` : ''
    // Verifica si la API devuelve array directo o envuelto
    const result: any = await httpClient.get<ConfigAula[]>(`${this.BASE_URL}/aulas${queryParams}`)
    return result?.data || (Array.isArray(result) ? result : [])
  }

  static async saveAula(data: Partial<ConfigAula>): Promise<ConfigAula> {
    const response: any = await httpClient.post(`${this.BASE_URL}/aulas`, data)
    return response?.data || response
  }

  static async deleteAula(id: number): Promise<void> {
    await httpClient.delete(`${this.BASE_URL}/aulas/${id}`)
  }

  // --- BLOQUES DE TIEMPO (Configuración) ---

  static async getBloquesConfig(turnoId: number, gradoId?: number, strict: boolean = false): Promise<ConfigBloqueHorario[]> {
    const url = `${this.BASE_URL}/bloques?turno_id=${turnoId}${gradoId ? `&grado_id=${gradoId}` : ''}${strict ? '&strict=true' : ''}`
    const result: any = await httpClient.get<ConfigBloqueHorario[]>(url)
    return result?.data || (Array.isArray(result) ? result : [])
  }

  static async saveBloqueConfig(data: Partial<ConfigBloqueHorario>): Promise<ConfigBloqueHorario> {
    const response: any = await httpClient.post(`${this.BASE_URL}/bloques`, data)
    return response?.data || response
  }

  static async deleteBloqueConfig(id: number): Promise<void> {
    await httpClient.delete(`${this.BASE_URL}/bloques/${id}`)
  }

  // --- DISPONIBILIDAD DOCENTE ---

  static async getDisponibilidad(docenteId: number, turnoId?: number): Promise<DocenteDisponibilidad[]> {
    const query = new URLSearchParams({ docente_id: String(docenteId) })
    if (turnoId) query.append('turno_id', String(turnoId))
    const result: any = await httpClient.get<DocenteDisponibilidad[]>(`${this.BASE_URL}/disponibilidad?${query.toString()}`)
    return result?.data || (Array.isArray(result) ? result : [])
  }

  static async saveDisponibilidad(data: Partial<DocenteDisponibilidad>): Promise<DocenteDisponibilidad> {
    const response: any = await httpClient.post(`${this.BASE_URL}/disponibilidad`, data)
    return response?.data || response
  }

  static async deleteDisponibilidad(id: number): Promise<void> {
    await httpClient.delete(`${this.BASE_URL}/disponibilidad/${id}`)
  }

  static async getTeacherOccupation(docenteId: number, periodoId: number): Promise<HorarioClase[]> {
      const result: any = await httpClient.get<HorarioClase[]>(`${this.BASE_URL}/teacher-occupation?docente_id=${docenteId}&periodo_lectivo_id=${periodoId}`)
      return result?.data || (Array.isArray(result) ? result : [])
  }
}

export default ScheduleService
