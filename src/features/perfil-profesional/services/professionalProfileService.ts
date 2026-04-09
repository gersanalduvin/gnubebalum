import { httpClient } from '@/utils/httpClient'
import type {
    ApiErrorResponse,
    DocumentUploadResponse,
    UserProfessionalProfile,
    UserProfessionalProfileFormData,
    ValidationErrors
} from '../types'

const API_BASE = '/bk/v1/perfil-profesional'

export class ProfessionalProfileService {
  private static normalizeValidationErrors(errors: any): ValidationErrors {
    const normalized: ValidationErrors = {}
    if (!errors || typeof errors !== 'object') return normalized
    Object.entries(errors).forEach(([field, messages]) => {
      if (Array.isArray(messages)) {
        normalized[field] = messages.map(m => String(m))
      } else if (messages != null) {
        normalized[field] = [String(messages)]
      }
    })
    return normalized
  }

  /**
   * Obtener perfil profesional del usuario autenticado
   */
  static async getMyProfile(): Promise<UserProfessionalProfile | null> {
    try {
      const response = await httpClient.get<any>(`${API_BASE}/mi-perfil`)
      return response.data?.data || null
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null
      }
      throw this.handleError(error)
    }
  }

  /**
   * Obtener perfil profesional de un usuario específico (admin)
   */
  static async getProfileByUserId(userId: number): Promise<UserProfessionalProfile | null> {
    try {
      const response = await httpClient.get<any>(`${API_BASE}/usuario/${userId}`)
      return response.data?.data || null
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null
      }
      throw this.handleError(error)
    }
  }

  /**
   * Actualizar perfil profesional propio
   */
  static async updateMyProfile(data: UserProfessionalProfileFormData): Promise<UserProfessionalProfile> {
    try {
      const response = await httpClient.put<any>(`${API_BASE}/mi-perfil`, data)
      return response.data?.data
    } catch (error: any) {
      throw this.handleError(error)
    }
  }

  /**
   * Actualizar perfil profesional de otro usuario (admin)
   */
  static async updateProfile(userId: number, data: UserProfessionalProfileFormData): Promise<UserProfessionalProfile> {
    try {
      const response = await httpClient.put<any>(`${API_BASE}/usuario/${userId}`, data)
      return response.data?.data
    } catch (error: any) {
      throw this.handleError(error)
    }
  }

  /**
   * Subir documento de formación académica (propio)
   */
  static async uploadMyFormacionDocument(formacionIndex: number, file: File): Promise<DocumentUploadResponse['data']> {
    try {
      const formData = new FormData()
      formData.append('documento', file)

      const response = await httpClient.post<any>(
        `${API_BASE}/mi-perfil/formacion/${formacionIndex}/documento`,
        formData
      )
      return response.data?.data
    } catch (error: any) {
      throw this.handleError(error)
    }
  }

  /**
   * Eliminar documento de formación académica (propio)
   */
  static async deleteMyFormacionDocument(formacionIndex: number): Promise<void> {
    try {
      await httpClient.delete(`${API_BASE}/mi-perfil/formacion/${formacionIndex}/documento`)
    } catch (error: any) {
      throw this.handleError(error)
    }
  }

  /**
   * Subir documento de formación académica (admin)
   */
  static async uploadFormacionDocument(userId: number, formacionIndex: number, file: File): Promise<DocumentUploadResponse['data']> {
    try {
      const formData = new FormData()
      formData.append('documento', file)

      const response = await httpClient.post<any>(
        `${API_BASE}/usuario/${userId}/formacion/${formacionIndex}/documento`,
        formData
      )
      return response.data?.data
    } catch (error: any) {
      throw this.handleError(error)
    }
  }

  /**
   * Eliminar documento de formación académica (admin)
   */
  static async deleteFormacionDocument(userId: number, formacionIndex: number): Promise<void> {
    try {
      await httpClient.delete(`${API_BASE}/usuario/${userId}/formacion/${formacionIndex}/documento`)
    } catch (error: any) {
      throw this.handleError(error)
    }
  }

  /**
   * Manejar errores de API
   */
  private static handleError(error: any): Error {
    if (error.response?.data) {
      const errorData = error.response.data as ApiErrorResponse
      const message = errorData.message || 'Error al procesar la solicitud'
      const errors = this.normalizeValidationErrors(errorData.errors)

      const err = new Error(message) as any
      err.validationErrors = errors
      err.statusCode = error.response.status
      return err
    }
    return error
  }
}
