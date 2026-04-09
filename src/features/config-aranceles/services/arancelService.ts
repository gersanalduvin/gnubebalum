import { httpClient } from '@/utils/httpClient'
import type {
  ConfigArancel,
  CreateArancelRequest,
  UpdateArancelRequest,
  ArancelPaginatedResponse,
  ArancelSearchParams,
  ApiResponse,
  ValidationErrors,
  ArancelStats,
  CuentaContable
} from '../types'

class ArancelService {
  private readonly baseEndpoint = '/bk/v1/config-aranceles'

  // Obtener aranceles con paginación
  async getAranceles(params: ArancelSearchParams = {}): Promise<ArancelPaginatedResponse> {
    try {
      const queryParams = new URLSearchParams()
      
      if (params.page) {
        queryParams.append('page', params.page.toString())
      }
      
      if (params.per_page) {
        queryParams.append('per_page', params.per_page.toString())
      }
      
      if (params.search) {
        queryParams.append('q', params.search)
      }

      if (params.codigo) {
        queryParams.append('codigo', params.codigo)
      }

      if (params.nombre) {
        queryParams.append('nombre', params.nombre)
      }

      if (params.precio_min !== undefined) {
        queryParams.append('precio_min', params.precio_min.toString())
      }

      if (params.precio_max !== undefined) {
        queryParams.append('precio_max', params.precio_max.toString())
      }

      if (params.moneda !== undefined) {
        queryParams.append('moneda', params.moneda.toString())
      }

      if (params.activo !== undefined) {
        queryParams.append('activo', params.activo.toString())
      }

      const url = queryParams.toString() 
        ? `${this.baseEndpoint}?${queryParams.toString()}`
        : this.baseEndpoint

      const response = await httpClient.get<any>(url)
      return response as ArancelPaginatedResponse
    } catch (error: any) {
      console.error('Error al obtener aranceles:', error)
      throw this.handleError(error)
    }
  }

  // Obtener todos los aranceles sin paginación
  async getAllAranceles(): Promise<ConfigArancel[]> {
    try {
      const response = await httpClient.get<any>(`${this.baseEndpoint}/getall`)
      const apiResponse = response?.data as ApiResponse<ConfigArancel[]>
      return apiResponse?.data || []
    } catch (error: any) {
      console.error('Error al obtener todos los aranceles:', error)
      throw this.handleError(error)
    }
  }

  // Obtener aranceles activos
  async getArancelesActivos(): Promise<ConfigArancel[]> {
    try {
      const response = await httpClient.get<any>(`${this.baseEndpoint}/active`)
      const apiResponse = response?.data as ApiResponse<ConfigArancel[]>
      return apiResponse?.data || []
    } catch (error: any) {
      console.error('Error al obtener aranceles activos:', error)
      throw this.handleError(error)
    }
  }

  // Obtener aranceles por moneda
  async getArancelesByMoneda(moneda: boolean): Promise<ConfigArancel[]> {
    try {
      const response = await httpClient.get<any>(`${this.baseEndpoint}/by-moneda?moneda=${moneda}`)
      const apiResponse = response?.data as ApiResponse<ConfigArancel[]>
      return apiResponse?.data || []
    } catch (error: any) {
      console.error('Error al obtener aranceles por moneda:', error)
      throw this.handleError(error)
    }
  }

  // Obtener arancel por ID
  async getArancelById(id: number): Promise<ConfigArancel> {
    try {
      const response = await httpClient.get<any>(`${this.baseEndpoint}/${id}`)
      const apiResponse = response?.data as ApiResponse<ConfigArancel>
      return apiResponse?.data as ConfigArancel
    } catch (error: any) {
      console.error('Error al obtener arancel:', error)
      throw this.handleError(error)
    }
  }

  // Obtener arancel por UUID
  async getArancelByUuid(uuid: string): Promise<ConfigArancel> {
    try {
      const response = await httpClient.get<any>(`${this.baseEndpoint}/uuid/${uuid}`)
      const apiResponse = response?.data as ApiResponse<ConfigArancel>
      return apiResponse?.data as ConfigArancel
    } catch (error: any) {
      console.error('Error al obtener arancel por UUID:', error)
      throw this.handleError(error)
    }
  }

  // Obtener arancel por código
  async getArancelByCodigo(codigo: string): Promise<ConfigArancel> {
    try {
      const response = await httpClient.get<any>(`${this.baseEndpoint}/codigo/${codigo}`)
      const apiResponse = response?.data as ApiResponse<ConfigArancel>
      return apiResponse?.data as ConfigArancel
    } catch (error: any) {
      console.error('Error al obtener arancel por código:', error)
      throw this.handleError(error)
    }
  }

  // Crear nuevo arancel
  async createArancel(data: CreateArancelRequest): Promise<ApiResponse<ConfigArancel>> {
    try {
      const response = await httpClient.post<ConfigArancel>(this.baseEndpoint, data)
      return {
        success: true,
        data: response.data!,
        message: response.message || 'Arancel creado exitosamente',
        errors: response.errors
      }
    } catch (error: any) {
      // Según las reglas del proyecto, el error está en error.data, no en error.response.data
      const errorData = error.data || {}
      
      return {
        success: false,
        data: {} as ConfigArancel,
        message: errorData.message || error.message || 'Error al crear el arancel',
        errors: errorData.errors
      }
    }
  }

  // Actualizar arancel por ID
  async updateArancel(id: number, data: UpdateArancelRequest): Promise<ApiResponse<ConfigArancel>> {
    try {
      const response = await httpClient.put<ConfigArancel>(`${this.baseEndpoint}/${id}`, data)
      return {
        success: true,
        data: response.data!,
        message: response.message || 'Arancel actualizado exitosamente',
        errors: response.errors
      }
    } catch (error: any) {
      // Según las reglas del proyecto, el error está en error.data, no en error.response.data
      const errorData = error.data || {}
      
      return {
        success: false,
        data: {} as ConfigArancel,
        message: errorData.message || error.message || 'Error al actualizar el arancel',
        errors: errorData.errors
      }
    }
  }

  // Actualizar arancel por UUID
  async updateArancelByUuid(uuid: string, data: UpdateArancelRequest): Promise<ApiResponse<ConfigArancel>> {
    try {
      const response = await httpClient.put<ConfigArancel>(`${this.baseEndpoint}/uuid/${uuid}`, data)
      return {
        success: true,
        data: response.data!,
        message: response.message || 'Arancel actualizado exitosamente',
        errors: response.errors
      }
    } catch (error: any) {
      // Según las reglas del proyecto, el error está en error.data, no en error.response.data
      const errorData = error.data || {}
      
      return {
        success: false,
        data: {} as ConfigArancel,
        message: errorData.message || error.message || 'Error al actualizar el arancel',
        errors: errorData.errors
      }
    }
  }

  // Eliminar arancel por ID
  async deleteArancel(id: number): Promise<void> {
    try {
      await httpClient.delete<void>(`${this.baseEndpoint}/${id}`)
    } catch (error: any) {
      console.error('Error al eliminar arancel:', error)
      throw this.handleError(error)
    }
  }

  // Eliminar arancel por UUID
  async deleteArancelByUuid(uuid: string): Promise<void> {
    try {
      await httpClient.delete<void>(`${this.baseEndpoint}/uuid/${uuid}`)
    } catch (error: any) {
      console.error('Error al eliminar arancel por UUID:', error)
      throw this.handleError(error)
    }
  }

  // Buscar aranceles
  async searchAranceles(params: ArancelSearchParams): Promise<ArancelPaginatedResponse> {
    try {
      const queryParams = new URLSearchParams()
      
      if (params.search) {
        queryParams.append('q', params.search)
      }

      if (params.codigo) {
        queryParams.append('codigo', params.codigo)
      }

      if (params.nombre) {
        queryParams.append('nombre', params.nombre)
      }

      if (params.precio_min !== undefined) {
        queryParams.append('precio_min', params.precio_min.toString())
      }

      if (params.precio_max !== undefined) {
        queryParams.append('precio_max', params.precio_max.toString())
      }

      if (params.moneda !== undefined) {
        queryParams.append('moneda', params.moneda.toString())
      }

      if (params.activo !== undefined) {
        queryParams.append('activo', params.activo.toString())
      }

      if (params.page) {
        queryParams.append('page', params.page.toString())
      }

      if (params.per_page) {
        queryParams.append('per_page', params.per_page.toString())
      }

      const url = `${this.baseEndpoint}/search?${queryParams.toString()}`
      const response = await httpClient.get<any>(url)
      return response as ArancelPaginatedResponse
    } catch (error: any) {
      console.error('Error al buscar aranceles:', error)
      throw this.handleError(error)
    }
  }

  // Obtener estadísticas de aranceles
  async getArancelStats(): Promise<ArancelStats> {
    try {
      const response = await httpClient.get<any>(`${this.baseEndpoint}/stats`)
      const apiResponse = response?.data as ApiResponse<ArancelStats>
      return apiResponse?.data as ArancelStats
    } catch (error: any) {
      console.error('Error al obtener estadísticas de aranceles:', error)
      throw this.handleError(error)
    }
  }

  // Marcar como sincronizados
  async markAsSynced(uuids: string[]): Promise<void> {
    try {
      await httpClient.post<void>(`${this.baseEndpoint}/mark-synced`, { uuids })
    } catch (error: any) {
      console.error('Error al marcar como sincronizados:', error)
      throw this.handleError(error)
    }
  }

  // Obtener actualizados después de fecha
  async getUpdatedAfter(updatedAfter: string): Promise<ConfigArancel[]> {
    try {
      const response = await httpClient.get<any>(`${this.baseEndpoint}/updated-after?updated_after=${updatedAfter}`)
      const apiResponse = response?.data as ApiResponse<ConfigArancel[]>
      return apiResponse?.data || []
    } catch (error: any) {
      console.error('Error al obtener aranceles actualizados:', error)
      throw this.handleError(error)
    }
  }

  // Obtener no sincronizados
  async getNotSynced(): Promise<ConfigArancel[]> {
    try {
      const response = await httpClient.get<any>(`${this.baseEndpoint}/not-synced`)
      const apiResponse = response?.data as ApiResponse<ConfigArancel[]>
      return apiResponse?.data || []
    } catch (error: any) {
      console.error('Error al obtener aranceles no sincronizados:', error)
      throw this.handleError(error)
    }
  }

  // Obtener catálogo de cuentas para selects
  async getCatalogoCuentas(): Promise<CuentaContable[]> {
    try {
      const response = await httpClient.get<any>('/bk/v1/config-catalogo-cuentas/getall')
      return response?.data || []
    } catch (error: any) {
      console.error('Error al obtener catálogo de cuentas:', error)
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
const arancelService = new ArancelService()
export default arancelService
