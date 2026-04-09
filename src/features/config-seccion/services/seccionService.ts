import { httpClient } from '@/utils/httpClient'
import type {
  ConfigSeccion,
  CreateSeccionRequest,
  UpdateSeccionRequest,
  SeccionPaginatedResponse,
  SeccionSearchParams,
  ApiResponse
} from '../types'

class SeccionService {
  private readonly baseEndpoint = '/bk/v1/config-seccion'

  async getSecciones(params: SeccionSearchParams = {}): Promise<SeccionPaginatedResponse> {
    try {
      const queryParams = new URLSearchParams()

      if (params.per_page) {
        queryParams.append('per_page', params.per_page.toString())
      }

      if (params.search) {
        queryParams.append('search', params.search)
      }

      const url = queryParams.toString()
        ? `${this.baseEndpoint}?${queryParams.toString()}`
        : this.baseEndpoint

      const response = await httpClient.get<any>(url)
      return response as SeccionPaginatedResponse
    } catch (error: any) {
      console.error('Error al obtener secciones:', error)
      throw error
    }
  }

  async getAllSecciones(): Promise<ConfigSeccion[]> {
    try {
      const response = await httpClient.get<any>(`${this.baseEndpoint}/getall`)
      const apiResponse = response as ApiResponse<ConfigSeccion[]>
      return apiResponse?.data || []
    } catch (error: any) {
      console.error('Error al obtener todas las secciones:', error)
      throw error
    }
  }

  async getSeccionById(id: number): Promise<ConfigSeccion> {
    try {
      const response = await httpClient.get<any>(`${this.baseEndpoint}/${id}`)
      const apiResponse = response as ApiResponse<ConfigSeccion>
      return apiResponse?.data as ConfigSeccion
    } catch (error: any) {
      console.error('Error al obtener seccion:', error)
      throw error
    }
  }

  async createSeccion(data: CreateSeccionRequest): Promise<ApiResponse<ConfigSeccion>> {
    try {
      const response = await httpClient.post<ConfigSeccion>(this.baseEndpoint, data)
      const apiResponse = response as unknown as ApiResponse<ConfigSeccion>
      return {
        success: apiResponse?.success ?? true,
        data: apiResponse?.data || ({} as ConfigSeccion),
        message: apiResponse?.message || 'Sección creada exitosamente',
        errors: apiResponse?.errors
      }
    } catch (error: any) {
      return {
        success: false,
        data: {} as ConfigSeccion,
        message: error.data?.message || error.message || 'Error al crear la sección',
        errors: error.data?.errors
      }
    }
  }

  async updateSeccion(id: number, data: UpdateSeccionRequest): Promise<ApiResponse<ConfigSeccion>> {
    try {
      const response = await httpClient.put<ConfigSeccion>(`${this.baseEndpoint}/${id}`, data)
      const apiResponse = response as unknown as ApiResponse<ConfigSeccion>
      return {
        success: apiResponse?.success ?? true,
        data: apiResponse?.data || ({} as ConfigSeccion),
        message: apiResponse?.message || 'Sección actualizada exitosamente',
        errors: apiResponse?.errors
      }
    } catch (error: any) {
      return {
        success: false,
        data: {} as ConfigSeccion,
        message: error.data?.message || error.message || 'Error al actualizar la sección',
        errors: error.data?.errors
      }
    }
  }

  async deleteSeccion(id: number): Promise<void> {
    try {
      await httpClient.delete<void>(`${this.baseEndpoint}/${id}`)
    } catch (error: any) {
      console.error('Error al eliminar sección:', error)
      throw error
    }
  }
}

const seccionService = new SeccionService()
export default seccionService
