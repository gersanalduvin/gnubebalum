import { httpClient } from '@/utils/httpClient'
import type {
  Alumno,
  ApiResponse,
  ApiResponseWithValidation,
  Familia,
  FamiliaFormData,
  FamiliasFilters,
  FamiliasResponse,
  ValidationErrors
} from '../types'

const API_BASE = '/bk/v1/usuarios/familias'

export class FamiliasService {
  private static inflightList: Map<string, Promise<FamiliasResponse>> = new Map()
  private static inflightById: Map<number, Promise<Familia>> = new Map()

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

  static async getFamilias(filters: FamiliasFilters = {}): Promise<FamiliasResponse> {
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

  static async getFamiliaById(id: number): Promise<Familia> {
    try {
      const existing = this.inflightById.get(id)
      if (existing) return await existing
      const request = (async () => {
        const response = await httpClient.get<any>(`${API_BASE}/${id}`)
        return response?.data || ({} as Familia)
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

  static async createFamilia(data: FamiliaFormData): Promise<ApiResponseWithValidation<Familia>> {
    try {
      const response = await httpClient.post<Familia>(API_BASE, data)
      return {
        success: true,
        data: (response.data ?? {}) as Familia,
        message: response.message || 'Familia creada exitosamente'
      }
    } catch (error: any) {
      return {
        success: false,
        data: {} as Familia,
        message: error?.data?.message || error?.message || 'Error al crear la familia',
        errors: this.normalizeValidationErrorsOptional(error?.validationErrors || error?.data?.errors || {})
      }
    }
  }

  static async updateFamilia(id: number, data: Partial<FamiliaFormData>): Promise<ApiResponseWithValidation<Familia>> {
    try {
      const response = await httpClient.put<Familia>(`${API_BASE}/${id}`, data)
      return {
        success: true,
        data: (response.data ?? {}) as Familia,
        message: response.message || 'Familia actualizada exitosamente'
      }
    } catch (error: any) {
      return {
        success: false,
        data: {} as Familia,
        message: error?.data?.message || error?.message || 'Error al actualizar la familia',
        errors: this.normalizeValidationErrorsOptional(error?.validationErrors || error?.data?.errors || {})
      }
    }
  }

  static async deleteFamilia(id: number): Promise<void> {
    try {
      await httpClient.delete(`${API_BASE}/${id}`)
    } catch (error: any) {
      throw this.handleError(error)
    }
  }

  static async activateFamilia(id: number): Promise<ApiResponse<Familia>> {
    try {
      const response = await httpClient.put<ApiResponse<Familia>>(`${API_BASE}/${id}/activate`, {})
      const body = response?.data
      return {
        success: body?.success ?? true,
        data: (body?.data ?? {}) as Familia,
        message: body?.message || 'Usuario activado correctamente',
        errors: this.normalizeValidationErrorsOptional(body?.errors)
      }
    } catch (error: any) {
      return {
        success: false,
        data: {} as Familia,
        message: error?.data?.message || error?.message || 'Error al activar el usuario',
        errors: this.normalizeValidationErrorsOptional(error?.validationErrors || error?.data?.errors || {})
      }
    }
  }

  static async deactivateFamilia(id: number): Promise<ApiResponse<Familia>> {
    try {
      const response = await httpClient.put<ApiResponse<Familia>>(`${API_BASE}/${id}/deactivate`, {})
      const body = response?.data
      return {
        success: body?.success ?? true,
        data: (body?.data ?? {}) as Familia,
        message: body?.message || 'Usuario desactivado correctamente',
        errors: this.normalizeValidationErrorsOptional(body?.errors)
      }
    } catch (error: any) {
      return {
        success: false,
        data: {} as Familia,
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

  static async uploadPhoto(id: number, file: File): Promise<Familia> {
    try {
      const formData = new FormData()
      formData.append('foto_file', file)
      const response = await httpClient.post<Familia>(`${API_BASE}/${id}/upload-photo`, formData)
      return response?.data || ({} as Familia)
    } catch (error: any) {
      throw this.handleError(error)
    }
  }

  static async deletePhoto(id: number): Promise<Familia> {
    try {
      const response = await httpClient.delete<Familia>(`${API_BASE}/${id}/delete-photo`)
      return response?.data || ({} as Familia)
    } catch (error: any) {
      throw this.handleError(error)
    }
  }

  static async getEstudiantes(id: number): Promise<Alumno[]> {
    try {
      const response = await httpClient.get<any>(`${API_BASE}/${id}/estudiantes`)
      const raw = response?.data ?? []
      return Array.isArray(raw) ? raw : (raw?.data ?? [])
    } catch (error: any) {
      throw this.handleError(error)
    }
  }

  static async vincularEstudiante(id: number, alumnoId: number): Promise<ApiResponse<{}>> {
    try {
      const payload = { familia_id: id, estudiante_id: alumnoId }
      const response = await httpClient.post<ApiResponse<{}>>(`${API_BASE}/vincular-estudiante`, payload)
      const body = response as any
      return {
        success: body?.success ?? true,
        data: (body?.data ?? {}) as {},
        message: body?.message || 'Estudiante vinculado exitosamente',
        errors: this.normalizeValidationErrorsOptional(body?.errors)
      }
    } catch (error: any) {
      return {
        success: false,
        data: {},
        message: error?.data?.message || error?.message || 'Error al vincular estudiante',
        errors: this.normalizeValidationErrorsOptional(error?.validationErrors || error?.data?.errors || {})
      }
    }
  }

  static async desvincularEstudiante(id: number, alumnoId: number): Promise<ApiResponse<{}>> {
    try {
      const response = await httpClient.delete<ApiResponse<{}>>(`${API_BASE}/${id}/desvincular-estudiante/${alumnoId}`)
      const body = response as any
      return {
        success: body?.success ?? true,
        data: (body?.data ?? {}) as {},
        message: body?.message || 'Estudiante desvinculado exitosamente',
        errors: this.normalizeValidationErrorsOptional(body?.errors)
      }
    } catch (error: any) {
      return {
        success: false,
        data: {},
        message: error?.data?.message || error?.message || 'Error al desvincular estudiante',
        errors: this.normalizeValidationErrorsOptional(error?.validationErrors || error?.data?.errors || {})
      }
    }
  }

  static async searchAlumnos(q: string = '', limit: number = 20): Promise<Alumno[]> {
    try {
      const params = new URLSearchParams()
      if (q) params.append('q', q)
      if (limit) params.append('limit', String(limit))
      const endpoint = `${API_BASE}/buscar-alumnos${params.toString() ? `?${params.toString()}` : ''}`
      const response = await httpClient.get<any>(endpoint)
      const body = response?.data
      const raw = Array.isArray(body) ? body : Array.isArray(body?.data) ? body.data : []
      return raw.map((a: any) => ({
        id: Number(a.id),
        primer_nombre: String(a.primer_nombre || ''),
        segundo_nombre: a.segundo_nombre || '',
        primer_apellido: String(a.primer_apellido || ''),
        segundo_apellido: a.segundo_apellido || '',
        email: a.email || ''
      }))
    } catch (error: any) {
      throw this.handleError(error)
    }
  }

  static async resetMasivoFamilias(periodoLectivoId?: string, familiaIds?: number[]): Promise<ApiResponse<any>> {
    try {
      const payload: any = {}
      if (periodoLectivoId) payload.periodo_lectivo_id = periodoLectivoId
      if (familiaIds && familiaIds.length > 0) payload.familia_ids = familiaIds

      const response = await httpClient.post<ApiResponse<any>>(`${API_BASE}/reset-masivo`, payload)
      const body = response as any
      return {
        success: body?.success ?? true,
        data: body?.data ?? {},
        message: body?.message || 'Proceso masivo iniciado',
        errors: this.normalizeValidationErrorsOptional(body?.errors)
      }
    } catch (error: any) {
      return {
        success: false,
        data: {},
        message: error?.data?.message || error?.message || 'Error en el reset masivo',
        errors: this.normalizeValidationErrorsOptional(error?.validationErrors || error?.data?.errors || {})
      }
    }
  }

  static async reporteCredencialesFamilias(periodoLectivoId?: string): Promise<ApiResponse<any>> {
    try {
      const params = new URLSearchParams()
      if (periodoLectivoId) params.append('periodo_lectivo_id', periodoLectivoId)
      const endpoint = `${API_BASE}/reporte-credenciales${params.toString() ? `?${params.toString()}` : ''}`
      const response = await httpClient.get<ApiResponse<any>>(endpoint)
      const body = response as any
      return {
        success: body?.success ?? true,
        data: body?.data ?? [],
        message: body?.message || 'Reporte obtenido exitosamente',
        errors: this.normalizeValidationErrorsOptional(body?.errors)
      }
    } catch (error: any) {
      return {
        success: false,
        data: [],
        message: error?.data?.message || error?.message || 'Error al obtener reporte',
        errors: this.normalizeValidationErrorsOptional(error?.validationErrors || error?.data?.errors || {})
      }
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

export default FamiliasService
