import { httpClient } from '@/utils/httpClient'
import type {
  ApiResponse,
  CatalogoCuenta,
  ConfigPlanPago,
  ConfigRubro,
  CreatePlanPagoRequest,
  CreateRubroRequest,
  CursoLectivo,
  PlanPagoPaginatedResponse,
  PlanPagoSearchParams,
  UpdatePlanPagoRequest,
  UpdateRubroRequest
} from '../types'

class PlanPagoService {
  private readonly baseEndpoint = '/bk/v1/config-plan-pago'

  // Obtener planes de pago con paginación
  async getPlanesPago(params: PlanPagoSearchParams = {}): Promise<PlanPagoPaginatedResponse> {
    try {
      const queryParams = new URLSearchParams()

      if (params.per_page) {
        queryParams.append('per_page', params.per_page.toString())
      }

      if (params.page) {
        queryParams.append('page', params.page.toString())
      }

      if (params.search) {
        queryParams.append('search', params.search)
      }

      if (params.estado !== undefined) {
        queryParams.append('estado', params.estado.toString())
      }

      if (params.periodo_lectivo_id) {
        queryParams.append('periodo_lectivo_id', params.periodo_lectivo_id.toString())
      }

      const url = queryParams.toString()
        ? `${this.baseEndpoint}?${queryParams.toString()}`
        : this.baseEndpoint

      const response = await httpClient.get<any>(url)
      return response as PlanPagoPaginatedResponse
    } catch (error: any) {
      console.error('Error al obtener planes de pago:', error)
      throw this.handleError(error)
    }
  }

  // Obtener todos los planes de pago sin paginación
  async getAllPlanesPago(): Promise<ConfigPlanPago[]> {
    try {
      const response = await httpClient.get<any>(`${this.baseEndpoint}/getall`)
      
      // El httpClient envuelve la respuesta en { data }, extraer la respuesta real del backend
      const body = response?.data as unknown as ApiResponse<ConfigPlanPago[]>
      if (body && body.success) {
        return body.data
      } else {
        throw new Error(body?.message || 'Error al obtener todos los planes de pago')
      }
    } catch (error: any) {
      console.error('Error al obtener todos los planes de pago:', error)
      throw this.handleError(error)
    }
  }

  // Obtener plan de pago por ID
  async getPlanPagoById(id: number): Promise<ConfigPlanPago> {
    try {
      const response = await httpClient.get<any>(`${this.baseEndpoint}/${id}`)
      
      // El httpClient envuelve la respuesta en { data }, extraer la respuesta real del backend
      const body = response?.data as unknown as ApiResponse<ConfigPlanPago>
      if (body && body.success) {
        return body.data
      } else {
        throw new Error(body?.message || 'Error al obtener plan de pago')
      }
    } catch (error: any) {
      console.error('Error al obtener plan de pago:', error)
      throw this.handleError(error)
    }
  }

  // Crear plan de pago
  async createPlanPago(data: CreatePlanPagoRequest): Promise<ApiResponse<ConfigPlanPago>> {
    try {
      const response = await httpClient.post(`${this.baseEndpoint}`, data)
      
      // El httpClient devuelve directamente la respuesta del backend (ApiResponse)
      const body = response as unknown as ApiResponse<ConfigPlanPago>
      if (body && body.success) {
        return body
      } else {
        return body || { success: false, data: {} as ConfigPlanPago, message: 'Error al crear el plan de pago' }
      }
    } catch (error: any) {
      const errorData = error.data || {}
      return {
        success: false,
        data: {} as ConfigPlanPago,
        message: errorData.message || 'Error al crear el plan de pago',
        errors: errorData.errors
      }
    }
  }

  // Actualizar plan de pago
  async updatePlanPago(id: number, data: CreatePlanPagoRequest): Promise<ApiResponse<ConfigPlanPago>> {
    try {
      const response = await httpClient.put(`${this.baseEndpoint}/${id}`, data)
      
      // El httpClient devuelve directamente la respuesta del backend (ApiResponse)
      const body = response as unknown as ApiResponse<ConfigPlanPago>
      if (body && body.success) {
        return body
      } else {
        return body || { success: false, data: {} as ConfigPlanPago, message: 'Error al actualizar el plan de pago' }
      }
    } catch (error: any) {
      const errorData = error.data || {}
      return {
        success: false,
        data: {} as ConfigPlanPago,
        message: errorData.message || 'Error al actualizar el plan de pago',
        errors: errorData.errors
      }
    }
  }

  // Eliminar plan de pago
  async deletePlanPago(id: number): Promise<void> {
    try {
      await httpClient.delete(`${this.baseEndpoint}/${id}`)
    } catch (error: any) {
      console.error('Error al eliminar plan de pago:', error)
      throw this.handleError(error)
    }
  }

  // Buscar planes de pago
  async searchPlanesPago(term: string, perPage: number = 15): Promise<PlanPagoPaginatedResponse> {
    try {
      const queryParams = new URLSearchParams()
      queryParams.append('q', term)
      queryParams.append('per_page', perPage.toString())

      const response = await httpClient.get<any>(`${this.baseEndpoint}/search?${queryParams.toString()}`)
      return response as PlanPagoPaginatedResponse
    } catch (error: any) {
      console.error('Error al buscar planes de pago:', error)
      throw this.handleError(error)
    }
  }

  // Obtener planes inactivos
  async getInactivePlanesPago(): Promise<ConfigPlanPago[]> {
    try {
      const response = await httpClient.get<any>(`${this.baseEndpoint}/inactive`)
      
      // El httpClient envuelve la respuesta en { data }, extraer la respuesta real del backend
      const body = response?.data as unknown as ApiResponse<ConfigPlanPago[]>
      if (body && body.success) {
        return body.data
      } else {
        throw new Error(body?.message || 'Error al obtener planes inactivos')
      }
    } catch (error: any) {
      console.error('Error al obtener planes inactivos:', error)
      throw this.handleError(error)
    }
  }

  // Obtener planes por período lectivo
  async getPlanesByPeriodo(periodoLectivoId: number): Promise<ConfigPlanPago[]> {
    try {
      const response = await httpClient.get<any>(`${this.baseEndpoint}/periodo/${periodoLectivoId}`)
      
      // El httpClient devuelve directamente la respuesta del backend (ApiResponse)
      const body = response as unknown as ApiResponse<ConfigPlanPago[]>
      if (body && body.success) {
        return body.data
      } else {
        throw new Error(body?.message || 'Error al obtener planes por período')
      }
    } catch (error: any) {
      console.error('Error al obtener planes por período:', error)
      throw this.handleError(error)
    }
  }

  // Cambiar estado del plan
  async toggleStatusPlanPago(id: number): Promise<ConfigPlanPago> {
    try {
      const response = await httpClient.patch<any>(`${this.baseEndpoint}/${id}/toggle-status`)
      
      // El httpClient envuelve la respuesta en { data }, extraer la respuesta real del backend
      const body = response?.data as unknown as ApiResponse<ConfigPlanPago>
      if (body && body.success) {
        return body.data
      } else {
        throw new Error(body?.message || 'Error al cambiar estado del plan')
      }
    } catch (error: any) {
      console.error('Error al cambiar estado del plan:', error)
      throw this.handleError(error)
    }
  }

  // Activar plan de pago
  async activatePlanPago(id: number): Promise<ConfigPlanPago> {
    try {
      const response = await httpClient.patch<any>(`${this.baseEndpoint}/${id}/activate`)
      
      // El httpClient envuelve la respuesta en { data }, extraer la respuesta real del backend
      const body = response?.data as unknown as ApiResponse<ConfigPlanPago>
      if (body && body.success) {
        return body.data
      } else {
        throw new Error(body?.message || 'Error al activar el plan')
      }
    } catch (error: any) {
      console.error('Error al activar plan:', error)
      throw this.handleError(error)
    }
  }

  // Desactivar plan de pago
  async deactivatePlanPago(id: number): Promise<ConfigPlanPago> {
    try {
      const response = await httpClient.patch<any>(`${this.baseEndpoint}/${id}/deactivate`)
      
      // El httpClient envuelve la respuesta en { data }, extraer la respuesta real del backend
      const body = response?.data as unknown as ApiResponse<ConfigPlanPago>
      if (body && body.success) {
        return body.data
      } else {
        throw new Error(body?.message || 'Error al desactivar el plan')
      }
    } catch (error: any) {
      console.error('Error al desactivar plan:', error)
      throw this.handleError(error)
    }
  }

  // Obtener períodos lectivos
  async getPeriodosLectivos(): Promise<CursoLectivo[]> {
    try {
      const response = await httpClient.get<any>('/bk/v1/config-plan-pago/periodos-lectivos/all')
      
      // El httpClient devuelve directamente la respuesta del backend (ApiResponse)
      const body = response as unknown as ApiResponse<CursoLectivo[]>
      if (body && body.success) {
        return body.data
      } else {
        throw new Error(body?.message || 'Error al obtener períodos lectivos')
      }
    } catch (error: any) {
      console.error('Error al obtener períodos lectivos:', error)
      throw this.handleError(error)
    }
  }

  // Obtener catálogo de cuentas
  async getCatalogoCuentas(): Promise<CatalogoCuenta[]> {
    try {
      const response = await httpClient.get<ApiResponse<CatalogoCuenta[]>>('/bk/v1/config-plan-pago/catalogo-cuentas/all')
      
      // El httpClient devuelve directamente la respuesta del backend como ApiResponse<T>
      if (response && response.success) {
        return response.data
      } else {
        throw new Error(response?.message || 'Error al obtener catálogo de cuentas')
      }
    } catch (error: any) {
      throw this.handleError(error)
    }
  }

  // Métodos para Detalles de Planes de Pago (ConfigPlanPagoDetalle)
  async getDetallesByPlanPago(planPagoId: number): Promise<any[]> {
    try {
      const response = await httpClient.get<any>(`/bk/v1/config-plan-pago-detalle/plan-pago/${planPagoId}`)
      
      // El httpClient devuelve directamente la respuesta del backend (ApiResponse)
      const body = response as unknown as ApiResponse<any[]>
      if (body && body.success) {
        return body.data
      } else {
        throw new Error(body?.message || 'Error al obtener detalles del plan de pago')
      }
    } catch (error: any) {
      console.error('Error al obtener detalles:', error)
      throw this.handleError(error)
    }
  }

  // Crear detalle
  async createDetalle(data: any): Promise<any> {
    try {
      const response = await httpClient.post<any>('/bk/v1/config-plan-pago-detalle', data)
      
      // El httpClient devuelve directamente la respuesta del backend (ApiResponse)
      const body = response as unknown as ApiResponse<any>
      if (body && body.success) {
        return body.data
      } else {
        throw new Error(body?.message || 'Error al crear detalle')
      }
    } catch (error: any) {
      console.error('Error al crear detalle:', error)
      throw this.handleError(error)
    }
  }

  // Actualizar detalle
  async updateDetalle(id: number, data: any): Promise<any> {
    try {
      const response = await httpClient.put<any>(`/bk/v1/config-plan-pago-detalle/${id}`, data)
      
      // El httpClient devuelve directamente la respuesta del backend (ApiResponse)
      const body = response as unknown as ApiResponse<any>
      if (body && body.success) {
        return body.data
      } else {
        throw new Error(body?.message || 'Error al actualizar detalle')
      }
    } catch (error: any) {
      console.error('Error al actualizar detalle:', error)
      throw this.handleError(error)
    }
  }

  async deleteDetalle(id: number): Promise<void> {
    try {
      await httpClient.delete(`/bk/v1/config-plan-pago-detalle/${id}`)
    } catch (error: any) {
      console.error('Error al eliminar detalle:', error)
      throw this.handleError(error)
    }
  }

  // Métodos para Rubros (manteniendo compatibilidad)
  async getRubrosByPlanPago(planPagoId: number): Promise<ConfigRubro[]> {
    try {
      // Redirigir a detalles por ahora
      const detalles = await this.getDetallesByPlanPago(planPagoId)
      return detalles as ConfigRubro[]
    } catch (error: any) {
      console.error('Error al obtener rubros:', error)
      throw this.handleError(error)
    }
  }

  async createRubro(data: CreateRubroRequest): Promise<ApiResponse<ConfigRubro>> {
    try {
      const response = await httpClient.post('/bk/v1/config-plan-pago-detalle', data)
      
      // El httpClient devuelve directamente la respuesta del backend (ApiResponse)
      const body = response as unknown as ApiResponse<ConfigRubro>
      if (body && body.success) {
        return body
      } else {
        return body || { success: false, data: {} as ConfigRubro, message: 'Error al crear el rubro' }
      }
    } catch (error: any) {
      const errorData = error.data || {}
      return {
        success: false,
        data: {} as ConfigRubro,
        message: errorData.message || 'Error al crear el rubro',
        errors: errorData.errors
      }
    }
  }

  async updateRubro(id: number, data: CreateRubroRequest): Promise<ApiResponse<ConfigRubro>> {
    try {
      const response = await httpClient.put(`/bk/v1/config-plan-pago-detalle/${id}`, data)
      
      // El httpClient devuelve directamente la respuesta del backend (ApiResponse)
      const body = response as unknown as ApiResponse<ConfigRubro>
      if (body && body.success) {
        return body
      } else {
        return body || { success: false, data: {} as ConfigRubro, message: 'Error al actualizar el rubro' }
      }
    } catch (error: any) {
      const errorData = error.data || {}
      return {
        success: false,
        data: {} as ConfigRubro,
        message: errorData.message || 'Error al actualizar el rubro',
        errors: errorData.errors
      }
    }
  }

  async deleteRubro(id: number): Promise<void> {
    try {
      await this.deleteDetalle(id)
    } catch (error: any) {
      console.error('Error al eliminar rubro:', error)
      throw this.handleError(error)
    }
  }

  // Obtener detalles del plan de pago (para rubros)
  async getPlanPagoDetalle(planPagoId: number): Promise<ConfigPlanPago> {
    try {
      const response = await httpClient.get<any>(`${this.baseEndpoint}/${planPagoId}/detalle`)
      
      // El httpClient devuelve directamente la respuesta del backend (ApiResponse)
      const body = response as unknown as ApiResponse<ConfigPlanPago>
      if (body && body.success) {
        return body.data
      } else {
        throw new Error(body?.message || 'Error al obtener detalle del plan de pago')
      }
    } catch (error: any) {
      console.error('Error al obtener detalle del plan:', error)
      throw this.handleError(error)
    }
  }

  // Obtener información completa del plan de pago con detalles
  async getPlanPagoConDetalles(planPagoId: number): Promise<{plan_pago: ConfigPlanPago, detalles: any}> {
    try {
      const response = await httpClient.get<any>(`/bk/v1/config-plan-pago-detalle/plan-pago/${planPagoId}`)
      
      // El httpClient devuelve directamente la respuesta del backend (ApiResponse)
      const body = response as unknown as ApiResponse<{plan_pago: ConfigPlanPago, detalles: any}>
      if (body && body.success) {
        return body.data
      } else {
        throw new Error(body?.message || 'Error al obtener información completa del plan de pago')
      }
    } catch (error: any) {
      console.error('Error al obtener información completa del plan de pago:', error)
      throw this.handleError(error)
    }
  }

  // Manejo de errores
  private handleError(error: any): Error {
    const errorData = error.data || {}

    if (error.status === 401) {
      return new Error('No autorizado. Por favor, inicie sesión nuevamente.')
    }

    if (error.status === 403) {
      return new Error('No tiene permisos para realizar esta acción.')
    }

    if (error.status === 404) {
      return new Error('Recurso no encontrado.')
    }

    if (error.status === 422 && errorData.errors) {
      const validationError = new Error('Errores de validación')
        ; (validationError as any).validationErrors = errorData.errors
      return validationError
    }

    return new Error(errorData.message || 'Error interno del servidor')
  }
}

// Exportar instancia única del servicio
const planPagoService = new PlanPagoService()
export default planPagoService
