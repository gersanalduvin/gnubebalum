import { httpClient } from '@/utils/httpClient'
import type { ApiError, ApiResponse, ApiResponseWithValidation } from '../types'
import type {
  AnularRecargoRequest,
  AnularRecargoResponse,
  AplicarBecaRequest,
  AplicarDescuentoRequest,
  AplicarPagoRequest,
  AplicarPagoResponse,
  AplicarPlanPagoRequest,
  AplicarPlanPagoResponse,
  EstadisticasAranceles,
  ExonerarArancelesRequest,
  ExonerarArancelesResponse,
  PeriodoLectivo,
  PlanPago,
  UserArancel,
  UserArancelFilters,
  UserArancelFormData,
  UserArancelResponse
} from '../types/aranceles'

const API_BASE = '/bk/v1/users-aranceles'

export class UserArancelesService {
  /**
   * Obtener lista de aranceles con filtros y paginación
   */
  static async getUserAranceles(filters: UserArancelFilters = {}): Promise<UserArancelResponse> {
    try {
      const params = new URLSearchParams()

      if (filters.page) params.append('page', filters.page.toString())
      if (filters.per_page) params.append('per_page', filters.per_page.toString())
      if (filters.user_id) params.append('user_id', filters.user_id.toString())
      if (filters.estado) params.append('estado', filters.estado)
      if (filters.rubro_id) params.append('rubro_id', filters.rubro_id.toString())

      const queryString = params.toString()
      const endpoint = queryString ? `${API_BASE}?${queryString}` : API_BASE

      const response = await httpClient.get<any>(endpoint)

      return response.data
    } catch (error: any) {
      throw this.handleError(error)
    }
  }

  /**
   * Obtener todos los aranceles sin paginación
   */
  static async getAllUserAranceles(): Promise<UserArancel[]> {
    try {
      const response = await httpClient.get<any>(`${API_BASE}/getall`)

      return response?.data || []
    } catch (error: any) {
      throw this.handleError(error)
    }
  }

  /**
   * Obtener aranceles por usuario específico
   */
  static async getUserArancelesByUserId(userId: number): Promise<UserArancel[]> {
    try {
      const response = await httpClient.get<any>(`${API_BASE}/usuario/${userId}`)

      return response?.data || []
    } catch (error: any) {
      throw this.handleError(error)
    }
  }

  /**
   * Obtener aranceles pendientes por usuario específico
   */
  static async getUserArancelesPendientesByUserId(userId: number): Promise<UserArancel[]> {
    try {
      const response = await httpClient.get<any>(`${API_BASE}/usuario/${userId}/pendientes`)

      return response?.data || []
    } catch (error: any) {
      throw this.handleError(error)
    }
  }

  /**
   * Obtener un arancel por ID
   */
  static async getUserArancelById(id: number): Promise<UserArancel> {
    try {
      const response = await httpClient.get<any>(`${API_BASE}/${id}`)

      return response?.data || {} as UserArancel
    } catch (error: any) {
      throw this.handleError(error)
    }
  }

  /**
   * Crear un nuevo arancel
   */
  static async createUserArancel(data: UserArancelFormData): Promise<ApiResponseWithValidation<UserArancel>> {
    try {
      const response = await httpClient.post<UserArancel>(
        API_BASE,
        data
      )

      return {
        success: true,
        data: response.data || {} as UserArancel,
        message: response.message || 'Arancel creado exitosamente'
      }
    } catch (error: any) {
      return {
        success: false,
        data: {} as UserArancel,
        message: error.data?.message || error.message || 'Error al crear el arancel',
        errors: error.data?.errors
      }
    }
  }

  /**
   * Actualizar un arancel existente
   */
  static async updateUserArancel(id: number, data: Partial<UserArancelFormData>): Promise<ApiResponseWithValidation<UserArancel>> {
    try {
      const response = await httpClient.put<UserArancel>(
        `${API_BASE}/${id}`,
        data
      )

      return {
        success: true,
        data: response.data || {} as UserArancel,
        message: response.message || 'Arancel actualizado exitosamente'
      }
    } catch (error: any) {
      return {
        success: false,
        data: {} as UserArancel,
        message: error.data?.message || error.message || 'Error al actualizar el arancel',
        errors: error.data?.errors
      }
    }
  }

  /**
   * Eliminar un arancel (soft delete)
   */
  static async deleteUserArancel(id: number): Promise<void> {
    try {
      await httpClient.delete(`${API_BASE}/${id}`)
    } catch (error: any) {
      throw this.handleError(error)
    }
  }

  /**
   * Anular recargos de aranceles
   */
  static async anularRecargo(data: AnularRecargoRequest): Promise<AnularRecargoResponse> {
    try {
      const response = await httpClient.patch<AnularRecargoResponse>(
        `${API_BASE}/anular-recargo`,
        data
      )

      return response?.data || {} as AnularRecargoResponse
    } catch (error: any) {
      throw this.handleError(error)
    }
  }

  /**
   * Exonerar aranceles
   */
  static async exonerarAranceles(data: ExonerarArancelesRequest): Promise<ExonerarArancelesResponse> {
    try {
      const response = await httpClient.patch<ExonerarArancelesResponse>(
        `${API_BASE}/exonerar`,
        data
      )

      return response?.data || {} as ExonerarArancelesResponse
    } catch (error: any) {
      throw this.handleError(error)
    }
  }

  /**
   * Aplicar becas a aranceles
   */
  static async aplicarBeca(data: AplicarBecaRequest): Promise<ApiResponse<any>> {
    try {
      const response = await httpClient.patch<any>(
        `${API_BASE}/aplicar-beca`,
        data
      )

      return {
        success: true,
        data: response.data || null,
        message: response.message || 'Beca aplicada exitosamente'
      }
    } catch (error: any) {
      throw this.handleError(error)
    }
  }

  /**
   * Aplicar descuentos a aranceles
   */
  static async aplicarDescuento(data: AplicarDescuentoRequest): Promise<ApiResponse<any>> {
    try {
      const response = await httpClient.patch<any>(
        `${API_BASE}/aplicar-descuento`,
        data
      )

      return {
        success: true,
        data: response.data || null,
        message: response.message || 'Descuento aplicado exitosamente'
      }
    } catch (error: any) {
      throw this.handleError(error)
    }
  }

  /**
   * Aplicar plan de pago a un usuario
   */
  static async aplicarPlanPago(data: AplicarPlanPagoRequest): Promise<ApiResponseWithValidation<AplicarPlanPagoResponse>> {
    try {
      const response = await httpClient.post<AplicarPlanPagoResponse>(
        `${API_BASE}/aplicar-plan-pago`,
        data
      )

      return {
        success: true,
        data: response?.data || {} as AplicarPlanPagoResponse,
        message: response?.message || 'Plan de pago aplicado exitosamente'
      }
    } catch (error: any) {
      return {
        success: false,
        data: {} as AplicarPlanPagoResponse,
        message: error.data?.message || error.message || 'Error al aplicar el plan de pago',
        errors: error.data?.errors || {}
      }
    }
  }

  /**
   * Aplicar pago a aranceles
   */
  static async aplicarPago(data: AplicarPagoRequest): Promise<ApiResponseWithValidation<AplicarPagoResponse>> {
    try {
      const response = await httpClient.patch<AplicarPagoResponse>(
        `${API_BASE}/aplicar-pago`,
        data
      )

      return {
        success: true,
        data: response?.data || {} as AplicarPagoResponse,
        message: response?.message || 'Pagos aplicados exitosamente'
      }
    } catch (error: any) {
      return {
        success: false,
        data: {} as AplicarPagoResponse,
        message: error.data?.message || error.message || 'Error al aplicar los pagos',
        errors: error.data?.errors || {}
      }
    }
  }

  /**
   * Revertir pago de arancel
   */
  static async revertirArancel(id: number): Promise<ApiResponse<any>> {
    try {
      const response = await httpClient.patch<any>(`${API_BASE}/${id}/revertir`)

      return {
        success: true,
        data: response.data || null,
        message: response.message || 'Pago revertido exitosamente'
      }
    } catch (error: any) {
      throw this.handleError(error)
    }
  }

  /**
   * Obtener aranceles con recargo
   */
  static async getArancelesConRecargo(): Promise<UserArancel[]> {
    try {
      const response = await httpClient.get<any>(`${API_BASE}/reportes/con-recargo`)

      return response?.data || []
    } catch (error: any) {
      throw this.handleError(error)
    }
  }

  /**
   * Obtener aranceles con saldo pendiente
   */
  static async getArancelesConSaldoPendiente(): Promise<UserArancel[]> {
    try {
      const response = await httpClient.get<any>(`${API_BASE}/reportes/con-saldo-pendiente`)

      return response?.data || []
    } catch (error: any) {
      throw this.handleError(error)
    }
  }

  /**
   * Obtener estadísticas de aranceles
   */
  static async getEstadisticasAranceles(): Promise<EstadisticasAranceles> {
    try {
      const response = await httpClient.get<any>(`${API_BASE}/reportes/estadisticas`)

      return response?.data || {} as EstadisticasAranceles
    } catch (error: any) {
      throw this.handleError(error)
    }
  }

  /**
   * Obtener períodos lectivos
   */
  static async getPeriodosLectivos(): Promise<PeriodoLectivo[]> {
    try {
      const response = await httpClient.get<any>(`${API_BASE}/periodos-lectivos`)

      return response?.data || []
    } catch (error: any) {
      throw this.handleError(error)
    }
  }

  /**
   * Obtener planes de pago por período lectivo
   */
  static async getPlanesPagoPorPeriodo(periodoId: number): Promise<PlanPago[]> {
    try {
      const response = await httpClient.get<any>(`${API_BASE}/planes-pago/periodo/${periodoId}`)

      return response?.data || []
    } catch (error: any) {
      throw this.handleError(error)
    }
  }

  /**
   * Obtener historial de recibos de un usuario
   */
  static async getUserRecibos(userId: number, filters: { fecha_inicio?: string; fecha_fin?: string } = {}): Promise<any> {
    try {
      const params = new URLSearchParams()
      params.append('user_id', userId.toString())
      params.append('estado_not', 'anulado')
      if (filters.fecha_inicio) params.append('fecha_inicio', filters.fecha_inicio)
      if (filters.fecha_fin) params.append('fecha_fin', filters.fecha_fin)

      const response = await httpClient.get<any>(`/bk/v1/recibos?${params.toString()}`)

      return response.data
    } catch (error: any) {
      throw this.handleError(error)
    }
  }

  /**
   * Exportar aranceles a PDF
   */
  static async exportPdf(userId: number, filters: { estado?: string } = {}): Promise<Blob> {
    try {
      const params = new URLSearchParams()
      if (filters.estado) params.append('estado', filters.estado)
      const response = await httpClient.get<any>(`${API_BASE}/usuario/${userId}/reporte-pdf?${params.toString()}`, { headers: { Accept: 'application/pdf' } })
      return response.data
    } catch (error: any) {
      throw this.handleError(error)
    }
  }

  /**
   * Exportar historial de recibos a PDF
   */
  static async exportHistorialPdf(userId: number, filters: { fecha_inicio?: string; fecha_fin?: string } = {}): Promise<Blob> {
    try {
      const params = new URLSearchParams()
      if (filters.fecha_inicio) params.append('fecha_inicio', filters.fecha_inicio)
      if (filters.fecha_fin) params.append('fecha_fin', filters.fecha_fin)
      const response = await httpClient.get<any>(`/bk/v1/recibos/usuario/${userId}/historial-pdf?${params.toString()}`, { headers: { Accept: 'application/pdf' } })
      return response.data
    } catch (error: any) {
      throw this.handleError(error)
    }
  }

  /**
   * Exportar recibo individual a PDF
   */
  static async exportReciboPdf(reciboId: number): Promise<Blob> {
    try {
      const response = await httpClient.get<any>(`/bk/v1/recibos/${reciboId}/pdf`, { headers: { Accept: 'application/pdf' } })
      return response.data
    } catch (error: any) {
      throw this.handleError(error)
    }
  }

  /**
   * Manejo centralizado de errores
   */
  private static handleError(error: any): ApiError {
    return {
      success: false,
      message: error.data?.message || error.message || 'Error en la operación',
      errors: error.data?.errors || []
    }
  }
}

export default UserArancelesService
