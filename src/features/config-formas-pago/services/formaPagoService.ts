import { httpClient } from '@/utils/httpClient'
import type {
  ConfigFormaPago,
  CreateFormaPagoRequest,
  UpdateFormaPagoRequest,
  FormaPagoPaginatedResponse,
  FormaPagoSearchParams,
  ApiResponse,
  ValidationErrors
} from '../types'

class FormaPagoService {
  private readonly baseEndpoint = '/bk/v1/config-formas-pago'

  // Obtener formas de pago con paginación
  async getFormasPago(params: FormaPagoSearchParams = {}): Promise<FormaPagoPaginatedResponse> {
    try {
      const queryParams = new URLSearchParams()
      
      if (params.per_page) {
        queryParams.append('per_page', params.per_page.toString())
      }
      
      if (params.search) {
        queryParams.append('search', params.search)
      }

      if (params.activo !== undefined && params.activo !== null) {
        queryParams.append('activo', params.activo.toString())
      }

      const url = queryParams.toString() 
        ? `${this.baseEndpoint}?${queryParams.toString()}`
        : this.baseEndpoint

      const response = await httpClient.get<FormaPagoPaginatedResponse>(url)
      return response
    } catch (error: any) {
      throw this.handleError(error)
    }
  }

  // Obtener todas las formas de pago sin paginación
  async getAllFormasPago(): Promise<ConfigFormaPago[]> {
    try {
      const response = await httpClient.get<any>(`${this.baseEndpoint}/getall`)
      const apiResponse = response.data as ApiResponse<ConfigFormaPago[]>
      return apiResponse?.data || []
    } catch (error: any) {
      throw this.handleError(error)
    }
  }

  // Obtener forma de pago por ID
  async getFormaPagoById(id: number): Promise<ConfigFormaPago> {
    try {
      const response = await httpClient.get<any>(`${this.baseEndpoint}/${id}`)
      const apiResponse = response.data as ApiResponse<ConfigFormaPago>
      return apiResponse?.data as ConfigFormaPago
    } catch (error: any) {
      throw this.handleError(error)
    }
  }

  // Crear nueva forma de pago
  async createFormaPago(data: CreateFormaPagoRequest): Promise<ApiResponse<ConfigFormaPago>> {
    try {
      const response = await httpClient.post<ConfigFormaPago>(this.baseEndpoint, data)
      return {
        success: true,
        data: response.data!,
        message: response.message || 'Forma de pago creada exitosamente',
        errors: response.errors
      }
    } catch (error: any) {
      // Según las reglas del proyecto, el error está en error.data, no en error.response.data
      const errorData = error.data || {}
      
      return {
        success: false,
        data: {} as ConfigFormaPago,
        message: errorData.message || error.message || 'Error al crear la forma de pago',
        errors: errorData.errors
      }
    }
  }

  // Actualizar forma de pago
  async updateFormaPago(id: number, data: UpdateFormaPagoRequest): Promise<ApiResponse<ConfigFormaPago>> {
    try {
      const response = await httpClient.put<ConfigFormaPago>(`${this.baseEndpoint}/${id}`, data)
      return {
        success: true,
        data: response.data!,
        message: response.message || 'Forma de pago actualizada exitosamente',
        errors: response.errors
      }
    } catch (error: any) {
      // Según las reglas del proyecto, el error está en error.data, no en error.response.data
      const errorData = error.data || {}
      
      return {
        success: false,
        data: {} as ConfigFormaPago,
        message: errorData.message || error.message || 'Error al actualizar la forma de pago',
        errors: errorData.errors
      }
    }
  }

  // Eliminar forma de pago
  async deleteFormaPago(id: number): Promise<void> {
    try {
      await httpClient.delete<void>(`${this.baseEndpoint}/${id}`)
    } catch (error: any) {
      throw this.handleError(error)
    }
  }

  // Manejo centralizado de errores
  private handleError(error: any): Error {
    if (error.response?.data) {
      const { data } = error.response
      
      // Error de validación
      if (error.response.status === 422 && data.errors) {
        const validationError = new Error(data.message || 'Error de validación')
        ;(validationError as any).isValidationError = true
        ;(validationError as any).data = data
        ;(validationError as any).errors = data.errors as ValidationErrors
        return validationError
      }
      
      // Otros errores de la API
      if (data.message) {
        const apiError = new Error(data.message)
        ;(apiError as any).data = data
        return apiError
      }
    }
    
    // Error de red o desconocido
    if (error.message) {
      return new Error(error.message)
    }
    
    return new Error('Error desconocido al procesar la solicitud')
  }
}

// Exportar instancia singleton
const formaPagoService = new FormaPagoService()
export default formaPagoService
