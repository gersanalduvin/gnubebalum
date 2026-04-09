import { httpClient } from '@/utils/httpClient'
import type { Docente, DocenteFormData, DocentesFilters, DocentesResponse, ApiResponse, ApiResponseWithValidation, ValidationErrors } from '../types'

const API_BASE = '/bk/v1/usuarios/docentes'

export class DocentesService {
  private static inflightList: Map<string, Promise<DocentesResponse>> = new Map()
  private static inflightById: Map<number, Promise<Docente>> = new Map()

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
  private static normalizeValidationErrorsOptional(errors: any): ValidationErrors | undefined {
    const norm = this.normalizeValidationErrors(errors)
    return Object.keys(norm).length > 0 ? norm : undefined
  }

  static async getDocentes(filters: DocentesFilters = {}): Promise<DocentesResponse> {
    try {
      const params = new URLSearchParams()
      if (filters.page) params.append('page', String(filters.page))
      if (filters.per_page) params.append('per_page', String(filters.per_page))
      if (filters.search) params.append('search', filters.search)
      if (filters.estado) params.append('estado', filters.estado)
      if (filters.sort_by) params.append('sort_by', filters.sort_by)
      if (filters.sort_order) params.append('sort_order', filters.sort_order)

      const endpoint = params.toString() ? `${API_BASE}?${params.toString()}` : API_BASE
      const existing = this.inflightList.get(endpoint)
      if (existing) return await existing

      const request = (async () => {
        const response = await httpClient.get<any>(endpoint)
        return response.data
      })()
      this.inflightList.set(endpoint, request)
      try {
        const data = await request
        return data
      } finally {
        this.inflightList.delete(endpoint)
      }
    } catch (error: any) {
      throw this.handleError(error)
    }
  }

  static async getDocenteById(id: number): Promise<Docente> {
    try {
      const existing = this.inflightById.get(id)
      if (existing) return await existing
      const request = (async () => {
        const response = await httpClient.get<any>(`${API_BASE}/${id}`)
        return response?.data || ({} as Docente)
      })()
      this.inflightById.set(id, request)
      try {
        const data = await request
        return data
      } finally {
        this.inflightById.delete(id)
      }
    } catch (error: any) {
      throw this.handleError(error)
    }
  }

  static async createDocente(data: DocenteFormData): Promise<ApiResponseWithValidation<Docente>> {
    try {
      const response = await httpClient.post<Docente>(API_BASE, data)
      return {
        success: true,
        data: (response.data ?? {}) as Docente,
        message: response.message || 'Docente creado exitosamente'
      }
    } catch (error: any) {
      return {
        success: false,
        data: {} as Docente,
        message: error?.data?.message || error?.message || 'Error al crear el docente',
        errors: this.normalizeValidationErrorsOptional(error?.validationErrors || error?.data?.errors || {})
      }
    }
  }

  static async updateDocente(id: number, data: Partial<DocenteFormData>): Promise<ApiResponseWithValidation<Docente>> {
    try {
      const response = await httpClient.put<Docente>(`${API_BASE}/${id}`, data)
      return {
        success: true,
        data: (response.data ?? {}) as Docente,
        message: response.message || 'Docente actualizado exitosamente'
      }
    } catch (error: any) {
      return {
        success: false,
        data: {} as Docente,
        message: error?.data?.message || error?.message || 'Error al actualizar el docente',
        errors: this.normalizeValidationErrorsOptional(error?.validationErrors || error?.data?.errors || {})
      }
    }
  }

  static async deleteDocente(id: number): Promise<void> {
    try {
      await httpClient.delete(`${API_BASE}/${id}`)
    } catch (error: any) {
      throw this.handleError(error)
    }
  }

  static async activateDocente(id: number): Promise<ApiResponse<Docente>> {
    try {
      const response = await httpClient.put<ApiResponse<Docente>>(`${API_BASE}/${id}/activate`, {})
      const body = response?.data
      return {
        success: body?.success ?? true,
        data: (body?.data ?? {}) as Docente,
        message: body?.message || 'Usuario activado correctamente',
        errors: this.normalizeValidationErrorsOptional(body?.errors)
      }
    } catch (error: any) {
      return {
        success: false,
        data: {} as Docente,
        message: error?.data?.message || error?.message || 'Error al activar el usuario',
        errors: this.normalizeValidationErrorsOptional(error?.validationErrors || error?.data?.errors || {})
      }
    }
  }

  static async deactivateDocente(id: number): Promise<ApiResponse<Docente>> {
    try {
      const response = await httpClient.put<ApiResponse<Docente>>(`${API_BASE}/${id}/deactivate`, {})
      const body = response?.data
      return {
        success: body?.success ?? true,
        data: (body?.data ?? {}) as Docente,
        message: body?.message || 'Usuario desactivado correctamente',
        errors: this.normalizeValidationErrorsOptional(body?.errors)
      }
    } catch (error: any) {
      return {
        success: false,
        data: {} as Docente,
        message: error?.data?.message || error?.message || 'Error al desactivar el usuario',
        errors: this.normalizeValidationErrorsOptional(error?.validationErrors || error?.data?.errors || {})
      }
    }
  }

  static async changePasswordAdmin(
    id: number,
    payload: { new_password: string; new_password_confirmation?: string }
  ): Promise<ApiResponse<{}>> {
    try {
      const response = await httpClient.put<ApiResponse<{}>>(`${API_BASE}/${id}/change-password-admin`, payload)
      const body = response?.data
      return {
        success: body?.success ?? true,
        data: (body?.data ?? {}) as {},
        message: body?.message || 'Contraseña actualizada correctamente',
        errors: this.normalizeValidationErrorsOptional(body?.errors)
      }
    } catch (error: any) {
      return {
        success: false,
        data: {},
        message: error?.data?.message || error?.message || 'Error al cambiar la contraseña',
        errors: this.normalizeValidationErrorsOptional(error?.validationErrors || error?.data?.errors || {})
      }
    }
  }

  static async uploadPhoto(id: number, file: File): Promise<Docente> {
    try {
      const formData = new FormData()
      formData.append('foto_file', file)
      const response = await httpClient.post<Docente>(`${API_BASE}/${id}/upload-photo`, formData)
      return response?.data || ({} as Docente)
    } catch (error: any) {
      throw this.handleError(error)
    }
  }

  static async deletePhoto(id: number): Promise<Docente> {
    try {
      const response = await httpClient.delete<Docente>(`${API_BASE}/${id}/delete-photo`)
      return response?.data || ({} as Docente)
    } catch (error: any) {
      throw this.handleError(error)
    }
  }

  static handleError(error: any): Error {
    const data = error?.data
    if (data) {
      const message = data?.message || 'Error en la operación'
      const err = new Error(message)
      ;(err as any).errors = this.normalizeValidationErrorsOptional(error?.validationErrors || data?.errors || {})
      if (error?.status === 422 && data?.errors) {
        ;(err as any).isValidationError = true
      }
      return err
    }
    return new Error(error?.message || 'Error de red')
  }
}

export default DocentesService
