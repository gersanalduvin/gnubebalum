import { httpClient } from '@/utils/httpClient'
import type {
  ConfigCatalogoCuenta,
  CreateCuentaRequest,
  UpdateCuentaRequest,
  CuentaPaginatedResponse,
  CuentaArbolResponse,
  CuentaEstadisticasResponse,
  CuentaSearchParams,
  ApiResponse,
  ValidationErrors,
  SyncCuentaRequest,
  SyncResponse,
  FiltroTipo
} from '../types/types_index'

class CatalogoCuentasService {
  private readonly baseEndpoint = '/bk/v1/config-catalogo-cuentas'

  // Obtener cuentas con paginación
  async getCuentas(params: CuentaSearchParams = {}): Promise<CuentaPaginatedResponse> {
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

      const response = await httpClient.get<CuentaPaginatedResponse>(url)
      return response
    } catch (error: any) {
      throw this.handleError(error)
    }
  }

  // Obtener todas las cuentas sin paginación
  async getAllCuentas(): Promise<ConfigCatalogoCuenta[]> {
    try {
      const response = await httpClient.get<ApiResponse<ConfigCatalogoCuenta[]>>(`${this.baseEndpoint}/getall`)
      return response?.data || []
    } catch (error: any) {
      throw this.handleError(error)
    }
  }

  // Obtener árbol de cuentas (endpoint principal para mostrar jerarquía)
  async getArbolCuentas(): Promise<ConfigCatalogoCuenta[]> {
    try {
      const response = await httpClient.get<CuentaArbolResponse>(`${this.baseEndpoint}/arbol`)
      return response?.data || []
    } catch (error: any) {
      throw this.handleError(error)
    }
  }

  // Obtener cuenta por ID
  async getCuentaById(id: number): Promise<ConfigCatalogoCuenta> {
    try {
      const response = await httpClient.get<ApiResponse<ConfigCatalogoCuenta>>(`${this.baseEndpoint}/${id}`)
      return response?.data
    } catch (error: any) {
      throw this.handleError(error)
    }
  }

  // Obtener cuenta por código
  async getCuentaByCodigo(codigo: string): Promise<ConfigCatalogoCuenta> {
    try {
      const response = await httpClient.get<ApiResponse<ConfigCatalogoCuenta>>(`${this.baseEndpoint}/codigo/${codigo}`)
      return response?.data
    } catch (error: any) {
      throw this.handleError(error)
    }
  }

  // Crear nueva cuenta
  async createCuenta(data: CreateCuentaRequest): Promise<ApiResponse<ConfigCatalogoCuenta>> {
    try {
      const response = await httpClient.post<ConfigCatalogoCuenta>(this.baseEndpoint, data)
      return response as ApiResponse<ConfigCatalogoCuenta>
    } catch (error: any) {
      // Manejo directo de errores que preserva las validaciones
      return {
        success: false,
        data: {} as ConfigCatalogoCuenta,
        message: error.data?.message || error.message || 'Error al crear la cuenta',
        errors: error.data?.errors
      }
    }
  }

  // Actualizar cuenta
  async updateCuenta(id: number, data: UpdateCuentaRequest): Promise<ApiResponse<ConfigCatalogoCuenta>> {
    try {
      const response = await httpClient.put<ConfigCatalogoCuenta>(`${this.baseEndpoint}/${id}`, data)
      return response as ApiResponse<ConfigCatalogoCuenta>
    } catch (error: any) {
      // Manejo directo de errores que preserva las validaciones
      return {
        success: false,
        data: {} as ConfigCatalogoCuenta,
        message: error.data?.message || error.message || 'Error al actualizar la cuenta',
        errors: error.data?.errors
      }
    }
  }

  // Eliminar cuenta
  async deleteCuenta(id: number): Promise<void> {
    try {
      await httpClient.delete<void>(`${this.baseEndpoint}/${id}`)
    } catch (error: any) {
      throw this.handleError(error)
    }
  }

  // Filtrar cuentas
  async filtrarCuentas(filtro: FiltroTipo, valor?: string): Promise<ConfigCatalogoCuenta[]> {
    try {
      const queryParams = new URLSearchParams()
      queryParams.append('filtro', filtro)

      if (valor) {
        queryParams.append('valor', valor)
      }

      const response = await httpClient.get<ApiResponse<ConfigCatalogoCuenta[]>>(`${this.baseEndpoint}/filtrar?${queryParams.toString()}`)
      return response?.data || []
    } catch (error: any) {
      throw this.handleError(error)
    }
  }

  // Obtener estadísticas
  async getEstadisticas(): Promise<CuentaEstadisticasResponse['data']> {
    try {
      const response = await httpClient.get<CuentaEstadisticasResponse>(`${this.baseEndpoint}/estadisticas`)
      return response?.data
    } catch (error: any) {
      throw this.handleError(error)
    }
  }

  // Sincronizar cuentas
  async syncCuentas(data: SyncCuentaRequest): Promise<SyncResponse> {
    try {
      const response = await httpClient.post<SyncResponse>(`${this.baseEndpoint}/sync`, data)
      return response.data as SyncResponse
    } catch (error: any) {
      throw this.handleError(error)
    }
  }

  // Obtener cuentas no sincronizadas
  async getCuentasNoSincronizadas(): Promise<ConfigCatalogoCuenta[]> {
    try {
      const response = await httpClient.get<ApiResponse<ConfigCatalogoCuenta[]>>(`${this.baseEndpoint}/no-sincronizadas`)
      return response?.data || []
    } catch (error: any) {
      throw this.handleError(error)
    }
  }

  // Obtener cuentas actualizadas después de una fecha
  async getCuentasActualizadasDespues(fecha: string): Promise<ConfigCatalogoCuenta[]> {
    try {
      const queryParams = new URLSearchParams()
      queryParams.append('fecha', fecha)

      const response = await httpClient.get<ApiResponse<ConfigCatalogoCuenta[]>>(`${this.baseEndpoint}/actualizadas-despues?${queryParams.toString()}`)
      return response?.data || []
    } catch (error: any) {
      throw this.handleError(error)
    }
  }

  // Marcar cuenta como sincronizada
  async marcarComoSincronizada(uuid: string): Promise<void> {
    try {
      await httpClient.post<void>(`${this.baseEndpoint}/marcar-sincronizada`, { uuid })
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
          ; (validationError as any).isValidationError = true
          ; (validationError as any).data = data
          ; (validationError as any).errors = data.errors as ValidationErrors
        return validationError
      }

      // Otros errores de la API
      if (data.message) {
        const apiError = new Error(data.message)
          ; (apiError as any).data = data
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
const catalogoCuentasService = new CatalogoCuentasService()
export default catalogoCuentasService
