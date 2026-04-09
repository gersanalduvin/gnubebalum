import { httpClient } from '@/utils/httpClient'

interface ApiResponse<T = any> {
  success: boolean
  data: T
  message: string
  errors?: Record<string, string[]>
}

interface ApiError {
  success: false
  message: string
  errors?: Record<string, string[]>
}

interface UserPhotoResponse {
  user: {
    id: number
    email: string
    foto_url: string | null
    foto_path: string | null
    foto_uploaded_at: string | null
  }
  foto_info?: {
    url: string
    file_name: string
    file_size: number
    mime_type: string
  }
}

export class UserPhotoService {
  /**
   * Subir foto de perfil para el usuario actual
   */
  static async uploadPhoto(userId: number, file: File): Promise<UserPhotoResponse> {
    try {
      const formData = new FormData()
      formData.append('foto_file', file) // Usar 'foto_file' según la documentación

      const response = await httpClient.post<ApiResponse<UserPhotoResponse>>(
        `/bk/v1/users/${userId}/upload-photo`,
        formData
        // No establecer Content-Type manualmente - el navegador lo hace automáticamente con el boundary correcto
      )
      
      return response.data?.data || {} as UserPhotoResponse
    } catch (error: any) {
      throw this.handleError(error)
    }
  }

  /**
   * Eliminar foto de perfil del usuario actual
   */
  static async deletePhoto(userId: number): Promise<UserPhotoResponse> {
    try {
      const response = await httpClient.delete<ApiResponse<UserPhotoResponse>>(
        `/bk/v1/users/${userId}/delete-photo`
      )
      
      return response.data?.data || {} as UserPhotoResponse
    } catch (error: any) {
      throw this.handleError(error)
    }
  }

  /**
   * Validar archivo antes de subir
   */
  static validateFile(file: File): { isValid: boolean; error?: string } {
    // Validar tipo de archivo
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      return {
        isValid: false,
        error: 'El archivo debe ser una imagen (JPEG, JPG, PNG o WEBP)'
      }
    }

    // Validar tamaño (5MB máximo)
    const maxSize = 5 * 1024 * 1024 // 5MB en bytes
    if (file.size > maxSize) {
      return {
        isValid: false,
        error: 'La imagen no puede ser mayor a 5MB'
      }
    }

    return { isValid: true }
  }

  private static handleError(error: any): ApiError {
    const errorData = error.data || {}
    
    return {
      success: false,
      message: errorData.message || error.message || 'Error interno del servidor',
      errors: errorData.errors
    }
  }
}

export default UserPhotoService
