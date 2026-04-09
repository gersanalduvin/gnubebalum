import { httpClient } from '@/utils/httpClient'
import type {
    ApiResponse,
    ConfigGrupos,
    CreateGruposRequest,
    Docente,
    Grado,
    GruposPaginatedResponse,
    GruposSearchParams,
    Seccion,
    Turno,
    UpdateGruposRequest
} from '../types'

class GruposService {
  private readonly baseEndpoint = '/bk/v1/config-grupos'

  // Obtener grupos paginados
  async getGrupos(params: GruposSearchParams = {}): Promise<GruposPaginatedResponse> {
    try {
      const queryParams = new URLSearchParams()
      queryParams.append('per_page', String(params.per_page || 15))
      queryParams.append('page', String(params.page || 1))
      if (params.search) queryParams.append('search', params.search)
      if (params.periodo_lectivo_id) queryParams.append('periodo_lectivo_id', String(params.periodo_lectivo_id))
      if (params.grado_id) queryParams.append('grado_id', String(params.grado_id))
      if (params.seccion_id) queryParams.append('seccion_id', String(params.seccion_id))
      if (params.turno_id) queryParams.append('turno_id', String(params.turno_id))

      const url = `${this.baseEndpoint}?${queryParams.toString()}`
      const response = await httpClient.get<any>(url)
      // Retornar directamente la respuesta paginada del backend (httpClient devuelve el JSON)
      return response as GruposPaginatedResponse
    } catch (error: any) {
      console.error('Error al obtener grupos:', error)
      throw new Error(error.response?.data?.message || 'Error al obtener los grupos')
    }
  }

  // Obtener todos los grupos sin paginación
  async getAllGrupos(): Promise<ApiResponse<ConfigGrupos[]>> {
    try {
      const response = await httpClient.get<any>(`${this.baseEndpoint}/getall`)
      // El httpClient ahora devuelve directamente la respuesta del backend
      return response as ApiResponse<ConfigGrupos[]>
    } catch (error: any) {
      return this.handleError(error)
    }
  }

  // Obtener grupo por ID
  async getGruposById(id: number): Promise<ApiResponse<ConfigGrupos>> {
    try {
      const response = await httpClient.get<any>(`${this.baseEndpoint}/${id}`)
      // El httpClient ahora devuelve directamente la respuesta del backend
      return response as ApiResponse<ConfigGrupos>
    } catch (error: any) {
      return this.handleError(error)
    }
  }

  // Crear nuevo grupo
  async createGrupos(data: CreateGruposRequest): Promise<ApiResponse<ConfigGrupos>> {
    try {
      const response = await httpClient.post<any>(this.baseEndpoint, data)
      // El httpClient ahora devuelve directamente la respuesta del backend
      return response as ApiResponse<ConfigGrupos>
    } catch (error: any) {
      // El httpClient lanza errores con estructura { status, statusText, data }
      // donde data contiene la respuesta del backend
      const errorData = error.data || {}
      return {
        success: false,
        data: {} as ConfigGrupos,
        message: errorData.message || error.message || 'Error al crear el grupo',
        errors: errorData.errors || undefined
      }
    }
  }

  // Actualizar grupo
  async updateGrupos(id: number, data: UpdateGruposRequest): Promise<ApiResponse<ConfigGrupos>> {
    try {
      const response = await httpClient.put<any>(`${this.baseEndpoint}/${id}`, data)
      // El httpClient ahora devuelve directamente la respuesta del backend
      return response as ApiResponse<ConfigGrupos>
    } catch (error: any) {
      // El httpClient lanza errores con estructura { status, statusText, data }
      // donde data contiene la respuesta del backend
      const errorData = error.data || {}
      return {
        success: false,
        data: {} as ConfigGrupos,
        message: errorData.message || error.message || 'Error al actualizar el grupo',
        errors: errorData.errors || undefined
      }
    }
  }

  // Eliminar grupo
  async deleteGrupos(id: number): Promise<ApiResponse<null>> {
    try {
      const response = await httpClient.delete<any>(`${this.baseEndpoint}/${id}`)
      // El httpClient ahora devuelve directamente la respuesta del backend
      return response as ApiResponse<null>
    } catch (error: any) {
      return this.handleError(error)
    }
  }

  // Obtener grupos por periodo lectivo
  async getGruposByPeriodoLectivo(periodoLectivoId: number): Promise<ApiResponse<ConfigGrupos[]>> {
    try {
      const response = await httpClient.get<any>(`${this.baseEndpoint}/by-periodo-lectivo/${periodoLectivoId}`)
      // El httpClient ahora devuelve directamente la respuesta del backend
      return response as ApiResponse<ConfigGrupos[]>
    } catch (error: any) {
      return this.handleError(error)
    }
  }

  // Obtener mis grupos activos (Docente Guía + Periodo Nota Activo)
  async getMyActiveGroups(): Promise<ApiResponse<ConfigGrupos[]>> {
    try {
      const response = await httpClient.get<any>(`${this.baseEndpoint}/my-active-groups`)
      return response as ApiResponse<ConfigGrupos[]>
    } catch (error: any) {
      return this.handleError(error)
    }
  }

  // Obtener grados para select
  async getGrados(): Promise<ApiResponse<Grado[]>> {
    try {
      const response = await httpClient.get<any>(`${this.baseEndpoint}/opciones/grados`)
      // El httpClient ahora devuelve directamente la respuesta del backend
      return response as ApiResponse<Grado[]>
    } catch (error: any) {
      return this.handleError(error)
    }
  }

  // Obtener secciones para select
  async getSecciones(): Promise<ApiResponse<Seccion[]>> {
    try {
      const response = await httpClient.get<any>(`${this.baseEndpoint}/opciones/secciones`)
      // El httpClient ahora devuelve directamente la respuesta del backend
      return response as ApiResponse<Seccion[]>
    } catch (error: any) {
      return this.handleError(error)
    }
  }

  // Obtener turnos para select
  async getTurnos(): Promise<ApiResponse<Turno[]>> {
    try {
      const response = await httpClient.get<any>(`${this.baseEndpoint}/opciones/turnos`)
      // El httpClient ahora devuelve directamente la respuesta del backend
      return response as ApiResponse<Turno[]>
    } catch (error: any) {
      return this.handleError(error)
    }
  }

  // Obtener docentes para select
  async getDocentes(): Promise<ApiResponse<Docente[]>> {
    try {
      const response = await httpClient.get<any>(`${this.baseEndpoint}/opciones/docentes-guia`)
      // El httpClient ahora devuelve directamente la respuesta del backend
      return response as ApiResponse<Docente[]>
    } catch (error: any) {
      return this.handleError(error)
    }
  }

  // Método centralizado para manejo de errores
  private handleError(error: any): ApiResponse<any> {
    // El httpClient lanza errores con estructura { status, statusText, data }
    // donde data contiene la respuesta del backend
    const errorData = error.data || {}
    
    return {
      success: false,
      data: undefined,
      message: errorData.message || error.message || 'Error al procesar la solicitud',
      errors: errorData.errors || undefined
    }
  }
}

// Exportar instancia singleton
const gruposService = new GruposService()
export default gruposService
