import { httpClient } from '@/utils/httpClient'
import type {
  ConfigModalidad,
  CreateModalidadRequest,
  UpdateModalidadRequest,
  ModalidadPaginatedResponse,
  ModalidadSearchParams,
  ApiResponse,
  ValidationErrors
} from '../types'

class ModalidadService {
  private readonly baseEndpoint = '/bk/v1/config-modalidad'

  // Obtener modalidades con paginación
  async getModalidades(params: ModalidadSearchParams = {}): Promise<ModalidadPaginatedResponse> {
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
      // El httpClient.get devuelve el cuerpo JSON directamente (ApiResponse)
      return response as ModalidadPaginatedResponse
    } catch (error: any) {
      console.error('Error al obtener modalidades:', error)
      throw this.handleError(error)
    }
  }

  // Obtener todas las modalidades sin paginación
  async getAllModalidades(): Promise<ConfigModalidad[]> {
    try {
      const response = await httpClient.get<any>(`${this.baseEndpoint}/getall`)
      const apiResponse = response as ApiResponse<ConfigModalidad[]>
      return apiResponse?.data || []
    } catch (error: any) {
      console.error('Error al obtener todas las modalidades:', error)
      throw this.handleError(error)
    }
  }

  // Obtener modalidad por ID
  async getModalidadById(id: number): Promise<ConfigModalidad> {
    try {
      const response = await httpClient.get<any>(`${this.baseEndpoint}/${id}`)
      const apiResponse = response as ApiResponse<ConfigModalidad>
      return apiResponse?.data as ConfigModalidad
    } catch (error: any) {
      console.error('Error al obtener modalidad:', error)
      throw this.handleError(error)
    }
  }

  // Crear nueva modalidad
  async createModalidad(data: CreateModalidadRequest): Promise<ApiResponse<ConfigModalidad>> {
    try {
      const response = await httpClient.post<ConfigModalidad>(this.baseEndpoint, data)
      const apiResponse = response as unknown as ApiResponse<ConfigModalidad>
      return {
        success: apiResponse?.success ?? true,
        data: apiResponse?.data || ({} as ConfigModalidad),
        message: apiResponse?.message || 'Modalidad creada exitosamente',
        errors: apiResponse?.errors
      }
    } catch (error: any) {
      // Manejo directo de errores que preserva las validaciones
      return {
        success: false,
        data: {} as ConfigModalidad,
        message: error.data?.message || error.message || 'Error al crear la modalidad',
        errors: error.data?.errors
      }
    }
  }

  // Actualizar modalidad
  async updateModalidad(id: number, data: UpdateModalidadRequest): Promise<ApiResponse<ConfigModalidad>> {
    try {
      const response = await httpClient.put<ConfigModalidad>(`${this.baseEndpoint}/${id}`, data)
      const apiResponse = response as unknown as ApiResponse<ConfigModalidad>
      return {
        success: apiResponse?.success ?? true,
        data: apiResponse?.data || ({} as ConfigModalidad),
        message: apiResponse?.message || 'Modalidad actualizada exitosamente',
        errors: apiResponse?.errors
      }
    } catch (error: any) {
      return {
        success: false,
        data: {} as ConfigModalidad,
        message: error.data?.message || error.message || 'Error al actualizar la modalidad',
        errors: error.data?.errors
      }
    }
  }

  // Eliminar modalidad
  async deleteModalidad(id: number): Promise<void> {
    try {
      await httpClient.delete<void>(`${this.baseEndpoint}/${id}`)
    } catch (error: any) {
      console.error('Error al eliminar modalidad:', error)
      throw this.handleError(error)
    }
  }

  // Manejo centralizado de errores
  private handleError(error: any): ApiResponse<any> {
    if (error.response?.data) {
      const { data } = error.response
      
      // Error de validación
      if (error.response.status === 422 && data.errors) {
        return {
          success: false,
          data: null,
          message: data.message || 'Error de validación',
          errors: data.errors as ValidationErrors
        }
      }
      
      // Otros errores de la API
      if (data.message) {
        return {
          success: false,
          data: null,
          message: data.message
        }
      }
    }
    
    // Error de red o desconocido
    return {
      success: false,
      data: null,
      message: error.message || 'Error desconocido al procesar la solicitud'
    }
  }
}

// Exportar instancia singleton
const modalidadService = new ModalidadService()
export default modalidadService
