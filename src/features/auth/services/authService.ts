// HTTP Client Import
import { httpClient } from '@/utils/httpClient'

// Types
interface ChangePasswordRequest {
  current_password: string
  new_password: string
  new_password_confirmation: string
}

interface ApiResponse<T = any> {
  success: boolean
  data: T
  message: string
  errors?: Record<string, string[]>
}

/**
 * Cambia la contraseña del usuario autenticado
 * @param data - Datos del formulario de cambio de contraseña
 * @returns Promise con la respuesta de la API
 */
export const changePassword = async (data: ChangePasswordRequest): Promise<ApiResponse> => {
  try {
    const response = await httpClient.put('/bk/v1/users/change-password', data)
    return response.data
  } catch (error: any) {
    // Re-throw the error to be handled by the component
    throw error
  }
}

// Exportación por defecto
const authService = {
  changePassword
}

export default authService
