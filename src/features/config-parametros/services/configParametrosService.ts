import { httpClient } from '@/utils/httpClient'
import type { 
  ConfigParametros,
  ConfigParametrosData,
  ConfigParametrosResponse,
  ConfigParametrosUpdateResponse,
  ConfigParametrosErrorResponse
} from '../types/index'

const API_BASE = '/bk/v1/config-parametros'

class ConfigParametrosService {
  private readonly baseEndpoint = API_BASE

  /**
   * Obtener parámetros de configuración actuales
   * Requiere permiso: config_parametros.show
   */
  async getParametros(): Promise<ConfigParametros | ConfigParametrosData> {
    try {
      const response = await httpClient.get<ConfigParametrosResponse>(this.baseEndpoint)
      
      // La API siempre devuelve ApiResponse con success, data y message
      // Accedemos a response.data para obtener los parámetros
      return response.data || {} as ConfigParametros
    } catch (error: any) {
      this.handleError(error)
      throw error
    }
  }

  /**
   * Actualiza o crea parámetros de configuración
   * Requiere permiso: config_parametros.updateOrCreate
   */
  async updateOrCreateParametros(data: ConfigParametrosData): Promise<ConfigParametros> {
    try {
      const response = await httpClient.put<ConfigParametros>(this.baseEndpoint, data)
      
      // Siguiendo el patrón de otros módulos exitosos
      // El httpClient.put devuelve ApiResponse<T>, por lo que accedemos a response.data
      return response.data || {} as ConfigParametros
    } catch (error: any) {
      this.handleError(error)
      throw error
    }
  }

  /**
   * Validar datos antes de enviar
   */
  private validateParametrosData(data: ConfigParametrosData): string[] {
    const errors: string[] = []

    if (!data.consecutivo_recibo_oficial || data.consecutivo_recibo_oficial < 1) {
      errors.push('El consecutivo de recibo oficial debe ser mayor a 0')
    }

    if (!data.consecutivo_recibo_interno || data.consecutivo_recibo_interno < 1) {
      errors.push('El consecutivo de recibo interno debe ser mayor a 0')
    }

    if (!data.tasa_cambio_dolar) {
      errors.push('La tasa de cambio del dólar es requerida')
    } else {
      const tasa = parseFloat(data.tasa_cambio_dolar)
      if (isNaN(tasa) || tasa < 0.0001 || tasa > 9999.9999) {
        errors.push('La tasa de cambio debe estar entre 0.0001 y 9999.9999')
      }
    }

    if (typeof data.terminal_separada !== 'boolean') {
      errors.push('El campo terminal separada debe ser verdadero o falso')
    }

    return errors
  }

  /**
   * Validar y actualizar parámetros
   */
  async validateAndUpdate(data: ConfigParametrosData): Promise<ConfigParametros> {
    const validationErrors = this.validateParametrosData(data)
    
    if (validationErrors.length > 0) {
      throw new Error(validationErrors.join(', '))
    }

    return await this.updateOrCreateParametros(data)
  }

  /**
   * Manejo centralizado de errores
   */
  private handleError(error: any): void {
    if (error.status === 401) {
      // Token expirado o no válido
      console.error('Error de autenticación:', error.data?.message || 'No autorizado')
    } else if (error.status === 403) {
      // Sin permisos
      console.error('Sin permisos:', error.data?.message || 'Acceso denegado')
    } else if (error.status === 422) {
      // Errores de validación
      console.error('Errores de validación:', error.data?.errors || error.data?.message)
    } else if (error.status === 500) {
      // Error del servidor
      console.error('Error del servidor:', error.data?.message || 'Error interno del servidor')
    } else {
      // Otros errores
      console.error('Error:', error.data?.message || error.message || 'Error desconocido')
    }
  }

  /**
   * Procesar errores del backend para mostrar en la UI
   */
  processBackendErrors(error: any): { 
    message: string
    fieldErrors?: { [key: string]: string[] }
  } {
    const errorData = error.data || {}
    
    if (error.status === 422 && errorData.errors) {
      // Errores de validación de campos
      return {
        message: errorData.message || 'Errores de validación',
        fieldErrors: errorData.errors
      }
    } else if (error.status === 401) {
      return {
        message: 'Sesión expirada. Por favor, inicie sesión nuevamente.'
      }
    } else if (error.status === 403) {
      return {
        message: 'No tiene permisos para realizar esta acción.'
      }
    } else {
      return {
        message: errorData.message || 'Error al procesar la solicitud. Intente nuevamente.'
      }
    }
  }
}

// Exportar instancia del servicio
const configParametrosService = new ConfigParametrosService()
export default configParametrosService
export { ConfigParametrosService }
