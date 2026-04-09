import { httpClient } from '@/utils/httpClient'
import type {
  ConfigTurnos,
  CreateTurnosRequest,
  UpdateTurnosRequest,
  TurnosPaginatedResponse,
  TurnosSearchParams,
  ApiResponse
} from '../types'

class TurnosService {
  private readonly baseEndpoint = '/bk/v1/config-turnos'

  async getTurnos(params: TurnosSearchParams = {}): Promise<TurnosPaginatedResponse> {
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
      return response as TurnosPaginatedResponse
    } catch (error: any) {
      console.error('Error al obtener turnos:', error)
      throw error
    }
  }

  async getAllTurnos(): Promise<ConfigTurnos[]> {
    try {
      const response = await httpClient.get<any>(`${this.baseEndpoint}/getall`)
      const apiResponse = response as ApiResponse<ConfigTurnos[]>
      return apiResponse?.data || []
    } catch (error: any) {
      console.error('Error al obtener todos los turnos:', error)
      throw error
    }
  }

  async getTurnosById(id: number): Promise<ConfigTurnos> {
    try {
      const response = await httpClient.get<any>(`${this.baseEndpoint}/${id}`)
      const apiResponse = response as ApiResponse<ConfigTurnos>
      return apiResponse?.data as ConfigTurnos
    } catch (error: any) {
      console.error('Error al obtener turno:', error)
      throw error
    }
  }

  async createTurnos(data: CreateTurnosRequest): Promise<ApiResponse<ConfigTurnos>> {
    try {
      const response = await httpClient.post<ConfigTurnos>(this.baseEndpoint, data)
      const apiResponse = response as unknown as ApiResponse<ConfigTurnos>
      return {
        success: apiResponse?.success ?? true,
        data: apiResponse?.data || ({} as ConfigTurnos),
        message: apiResponse?.message || 'Turno creado exitosamente',
        errors: apiResponse?.errors
      }
    } catch (error: any) {
      return {
        success: false,
        data: {} as ConfigTurnos,
        message: error.data?.message || error.message || 'Error al crear el turno',
        errors: error.data?.errors
      }
    }
  }

  async updateTurnos(id: number, data: UpdateTurnosRequest): Promise<ApiResponse<ConfigTurnos>> {
    try {
      const response = await httpClient.put<ConfigTurnos>(`${this.baseEndpoint}/${id}`, data)
      const apiResponse = response as unknown as ApiResponse<ConfigTurnos>
      return {
        success: apiResponse?.success ?? true,
        data: apiResponse?.data || ({} as ConfigTurnos),
        message: apiResponse?.message || 'Turno actualizado exitosamente',
        errors: apiResponse?.errors
      }
    } catch (error: any) {
      return {
        success: false,
        data: {} as ConfigTurnos,
        message: error.data?.message || error.message || 'Error al actualizar el turno',
        errors: error.data?.errors
      }
    }
  }

  async deleteTurnos(id: number): Promise<void> {
    try {
      await httpClient.delete<void>(`${this.baseEndpoint}/${id}`)
    } catch (error: any) {
      console.error('Error al eliminar turno:', error)
      throw error
    }
  }
}

const turnosService = new TurnosService()
export default turnosService
