import { httpClient } from '@/utils/httpClient'
import type {
  UserGrupo,
  UserGrupoFormData,
  UserGrupoFilters,
  ApiResponse,
  ApiError,
  ValidationErrors,
  ApiResponseWithValidation
} from '../types'

const API_BASE = '/bk/v1/users-grupos'

export interface UserGrupoResponse {
  current_page: number
  data: UserGrupo[]
  first_page_url: string
  from: number
  last_page: number
  last_page_url: string
  links: any[]
  next_page_url: string | null
  path: string
  per_page: number
  prev_page_url: string | null
  to: number
  total: number
}

export class UsersGruposService {
  /**
   * Obtener lista de users grupos con filtros y paginación
   */
  static async getUsersGrupos(filters: UserGrupoFilters = {}): Promise<UserGrupoResponse> {
    try {
      const params = new URLSearchParams()

      // user_id es requerido según la documentación
      if (filters.user_id) params.append('user_id', filters.user_id.toString())
      if (filters.page) params.append('page', filters.page.toString())
      if (filters.per_page) params.append('per_page', filters.per_page.toString())

      // Incluir relaciones
      params.append('with', 'periodo_lectivo,grado,grupo,turno')

      const queryString = params.toString()
      const endpoint = queryString ? `${API_BASE}?${queryString}` : API_BASE

      const response = await httpClient.get<any>(endpoint)

      // El httpClient devuelve { data: respuestaDelBackend }
      // El backend devuelve { success: true, data: paginatedData, message: string }
      return response.data || { data: [], total: 0, current_page: 1, per_page: 15 }
    } catch (error: any) {
      throw this.handleError(error)
    }
  }

  /**
   * Obtener todos los users grupos de un usuario sin paginación
   */
  static async getAllUserGrupos(userId: number): Promise<UserGrupo[]> {
    try {
      const response = await httpClient.get<any>(
        `${API_BASE}/getall?user_id=${userId}`
      )
      return response?.data || []
    } catch (error: any) {
      throw this.handleError(error)
    }
  }

  /**
   * Obtener un user grupo por ID
   */
  static async getUserGrupoById(id: number): Promise<UserGrupo> {
    try {
      const response = await httpClient.get<any>(
        `${API_BASE}/${id}`
      )
      if (!response?.data) {
        throw new Error('No se encontró el registro académico')
      }
      return response.data
    } catch (error: any) {
      throw this.handleError(error)
    }
  }

  /**
   * Crear un nuevo user grupo
   */
  static async createUserGrupo(data: UserGrupoFormData): Promise<ApiResponseWithValidation<UserGrupo>> {
    try {
      const response = await httpClient.post<UserGrupo>(
        API_BASE,
        data
      )
      return {
        success: true,
        data: response.data || {} as UserGrupo,
        message: response.message || 'Grupo asignado exitosamente'
      }
    } catch (error: any) {
      // Manejo directo de errores que preserva las validaciones
      return {
        success: false,
        data: {} as UserGrupo,
        message: error.data?.message || error.message || 'Error al crear el registro académico',
        errors: error.data?.errors
      }
    }
  }

  /**
   * Actualizar un user grupo existente
   */
  static async updateUserGrupo(id: number, data: Partial<UserGrupoFormData>): Promise<ApiResponseWithValidation<UserGrupo>> {
    try {
      const response = await httpClient.put<UserGrupo>(
        `${API_BASE}/${id}`,
        data
      )
      return {
        success: true,
        data: response.data || {} as UserGrupo,
        message: response.message || 'Grupo actualizado exitosamente'
      }
    } catch (error: any) {
      // Manejo directo de errores que preserva las validaciones
      return {
        success: false,
        data: {} as UserGrupo,
        message: error.data?.message || error.message || 'Error al actualizar el registro académico',
        errors: error.data?.errors
      }
    }
  }

  /**
   * Eliminar un user grupo (soft delete)
   */
  static async deleteUserGrupo(id: number): Promise<void> {
    try {
      await httpClient.delete<null>(`${API_BASE}/${id}`)
    } catch (error: any) {
      throw this.handleError(error)
    }
  }

  /**
   * Restaurar un user grupo eliminado
   */
  static async restoreUserGrupo(id: number): Promise<UserGrupo> {
    try {
      const response = await httpClient.put<UserGrupo>(
        `${API_BASE}/${id}/restore`
      )
      if (!response.data) {
        throw new Error('Error al restaurar el registro académico')
      }
      return response.data
    } catch (error: any) {
      throw this.handleError(error)
    }
  }

  /**
   * Obtener users grupos por usuario
   */
  static async getUserGruposByUser(userId: number): Promise<UserGrupo[]> {
    try {
      const response = await httpClient.get<any>(
        `${API_BASE}/getall?user_id=${userId}&with=periodo_lectivo,grado,grupo,turno`
      )
      return response?.data || []
    } catch (error: any) {
      throw this.handleError(error)
    }
  }

  /**
   * Obtener users grupos por período
   */
  static async getUserGruposByPeriodo(periodoId: number): Promise<UserGrupo[]> {
    try {
      const response = await httpClient.get<any>(
        `${API_BASE}/periodo/${periodoId}`
      )
      return response?.data || []
    } catch (error: any) {
      throw this.handleError(error)
    }
  }

  /**
   * Obtener users grupos por grado
   */
  static async getUserGruposByGrado(gradoId: number): Promise<UserGrupo[]> {
    try {
      const response = await httpClient.get<any>(
        `${API_BASE}/by-grado/${gradoId}`
      )
      return response?.data || []
    } catch (error: any) {
      throw this.handleError(error)
    }
  }

  /**
   * Obtener users grupos por turno
   */
  static async getUserGruposByTurno(turnoId: number): Promise<UserGrupo[]> {
    try {
      const response = await httpClient.get<any>(
        `${API_BASE}/by-turno/${turnoId}`
      )
      return response?.data || []
    } catch (error: any) {
      throw this.handleError(error)
    }
  }

  /**
   * Obtener lista de períodos lectivos
   */
  static async getPeriodosLectivos(): Promise<any[]> {
    try {
      const response = await httpClient.get<any>(
        `${API_BASE}/periodos-lectivos/list`
      )
      return response?.data || []
    } catch (error: any) {
      throw this.handleError(error)
    }
  }

  /**
   * Obtener lista de grados
   */
  static async getGrados(): Promise<any[]> {
    try {
      const response = await httpClient.get<any>(
        `${API_BASE}/grados/list`
      )
      return response?.data || []
    } catch (error: any) {
      throw this.handleError(error)
    }
  }

  /**
   * Obtener lista de turnos
   */
  static async getTurnos(): Promise<any[]> {
    try {
      const response = await httpClient.get<any>(
        `${API_BASE}/turnos/list`
      )
      return response?.data || []
    } catch (error: any) {
      throw this.handleError(error)
    }
  }

  /**
   * Obtener grupos filtrados por período, grado y turno
   */
  static async getGruposFiltered(periodoId: number, gradoId: number, turnoId: number): Promise<any[]> {
    try {
      const response = await httpClient.get<any>(
        `/bk/v1/config-grupos/filtered?periodo_id=${periodoId}&grado_id=${gradoId}&turno_id=${turnoId}`
      )
      return response?.data || []
    } catch (error: any) {
      throw this.handleError(error)
    }
  }

  /**
   * Enviar Ficha de Inscripción por correo electrónico (adjunta PDF)
   * POST /bk/v1/users-grupos/{id}/ficha-inscripcion-email
   * Permiso requerido: usuarios.alumnos.ver
   */
  static async sendFichaInscripcionEmail(id: number): Promise<void> {
    try {
      await httpClient.post<ApiResponse<null>>(`${API_BASE}/${id}/ficha-inscripcion-email`)
    } catch (error: any) {
      throw this.handleError(error)
    }
  }

  /**
   * Manejo centralizado de errores
   */
  private static handleError(error: any): ApiError {
    // El httpClient lanza errores con la estructura: { status, statusText, data }
    // La respuesta del backend está en error.data, NO en error.response.data
    const errorData = error.data || {}

    return {
      success: false,
      message: errorData.message || error.statusText || 'Error desconocido',
      errors: errorData.errors
    }
  }
}
