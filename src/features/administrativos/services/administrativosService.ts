import type { Role } from '@/features/roles/types'
import { httpClient } from '@/utils/httpClient'
import type {
  Administrativo,
  AdministrativoFormData,
  AdministrativosFilters,
  AdministrativosResponse,
  ApiResponse,
  ApiResponseWithValidation,
  ValidationErrors
} from '../types'

const API_BASE = '/bk/v1/usuarios/administrativos'

export class AdministrativosService {
  // Mapas de solicitudes en vuelo para evitar duplicados en desarrollo (StrictMode)
  private static inflightList: Map<string, Promise<AdministrativosResponse>> = new Map()
  private static inflightById: Map<number, Promise<Administrativo>> = new Map()
  private static inflightRoles: Promise<Role[]> | null = null
  // Cache ligero para evitar peticiones duplicadas secuenciales por re-montaje en dev
  private static listCache: Map<string, { data: AdministrativosResponse; ts: number }> = new Map()
  private static readonly CACHE_TTL_MS = 1500

  /** Normaliza el objeto de errores a formato { campo: string[] } */
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
  /** Variante que retorna undefined cuando no hay errores */
  private static normalizeValidationErrorsOptional(errors: any): ValidationErrors | undefined {
    const norm = this.normalizeValidationErrors(errors)
    return Object.keys(norm).length > 0 ? norm : undefined
  }
  /**
   * Listar administrativos con filtros y paginación
   */
  static async getAdministrativos(filters: AdministrativosFilters = {}): Promise<AdministrativosResponse> {
    try {
      const params = new URLSearchParams()

      if (filters.page) params.append('page', filters.page.toString())
      if (filters.per_page) params.append('per_page', filters.per_page.toString())
      if (filters.search) params.append('search', filters.search)
      if (filters.estado) params.append('estado', filters.estado)
      if (filters.sort_by) params.append('sort_by', filters.sort_by)
      if (filters.sort_order) params.append('sort_order', filters.sort_order)

      const queryString = params.toString()
      const endpoint = queryString ? `${API_BASE}?${queryString}` : API_BASE

      const key = endpoint

      // 1) Revisar cache reciente para evitar doble petición tras re-montaje
      const cached = this.listCache.get(key)
      if (cached && Date.now() - cached.ts < this.CACHE_TTL_MS) {
        return cached.data
      }

      // 2) Evitar peticiones simultáneas mientras una ya está en curso
      const existing = this.inflightList.get(key)
      if (existing) return await existing

      const request = (async () => {
        const response = await httpClient.get<any>(endpoint)
        return response.data
      })()
      this.inflightList.set(key, request)
      try {
        const data = await request
        // Guardar en cache con TTL corto para segundas llamadas inmediatas
        this.listCache.set(key, { data, ts: Date.now() })
        return data
      } finally {
        this.inflightList.delete(key)
      }
    } catch (error: any) {
      throw this.handleError(error)
    }
  }

  /**
   * Listar roles disponibles para Administrativos
   * Endpoint: /bk/v1/usuarios/administrativos/roles/list
   * Permiso requerido: usuarios.administrativos.ver
   */
  static async getAdministrativoRolesList(): Promise<Role[]> {
    try {
      if (this.inflightRoles) return await this.inflightRoles
      const endpoint = `${API_BASE}/roles/list`
      const request = (async () => {
        const response = await httpClient.get<Role[]>(endpoint)

        // La API puede devolver directamente un array o envolverlo en { data }
        const raw = (response as any).data ?? []
        const roles: Role[] = Array.isArray(raw) ? raw : (raw?.data ?? [])

        // Normalizar permisos a strings por consistencia
        return roles.map(role => ({
          ...role,
          permisos: Array.isArray(role.permisos)
            ? role.permisos.map(p => (typeof p === 'string' ? p : String(p)))
            : []
        }))
      })()
      this.inflightRoles = request
      try {
        const roles = await request
        return roles
      } finally {
        this.inflightRoles = null
      }
    } catch (error: any) {
      throw this.handleError(error)
    }
  }

  /** Crear administrativo */
  static async createAdministrativo(data: AdministrativoFormData): Promise<ApiResponseWithValidation<Administrativo>> {
    try {
      const response = await httpClient.post<Administrativo>(API_BASE, data)
      return {
        success: true,
        data: (response.data ?? {}) as Administrativo,
        message: response.message || 'Administrativo creado exitosamente'
      }
    } catch (error: any) {
      return {
        success: false,
        data: {} as Administrativo,
        message: error?.data?.message || error?.message || 'Error al crear el administrativo',
        errors: this.normalizeValidationErrorsOptional(error?.validationErrors || error?.data?.errors || {})
      }
    }
  }

  /** Obtener administrativo por ID */
  static async getAdministrativoById(id: number): Promise<Administrativo> {
    try {
      const existing = this.inflightById.get(id)
      if (existing) return await existing

      const request = (async () => {
        // httpClient.get returns a wrapper { data: <rawJson> }
        const response = await httpClient.get<any>(`${API_BASE}/${id}`)
        return response?.data || ({} as Administrativo)
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

  /** Actualizar administrativo */
  static async updateAdministrativo(id: number, data: Partial<AdministrativoFormData>): Promise<ApiResponseWithValidation<Administrativo>> {
    try {
      const response = await httpClient.put<Administrativo>(`${API_BASE}/${id}`, data)
      return {
        success: true,
        data: (response.data ?? {}) as Administrativo,
        message: response.message || 'Administrativo actualizado exitosamente'
      }
    } catch (error: any) {
      return {
        success: false,
        data: {} as Administrativo,
        message: error?.data?.message || error?.message || 'Error al actualizar el administrativo',
        errors: this.normalizeValidationErrorsOptional(error?.validationErrors || error?.data?.errors || {})
      }
    }
  }

  /** Eliminar administrativo */
  static async deleteAdministrativo(id: number): Promise<void> {
    try {
      await httpClient.delete(`${API_BASE}/${id}`)
    } catch (error: any) {
      throw this.handleError(error)
    }
  }

  /** Restaurar administrativo */
  static async restoreAdministrativo(id: number): Promise<Administrativo> {
    try {
      const response = await httpClient.post<Administrativo>(`${API_BASE}/${id}/restore`)
      return response.data || ({} as Administrativo)
    } catch (error: any) {
      throw this.handleError(error)
    }
  }

  /** Activar administrativo */
  static async activateAdministrativo(id: number): Promise<ApiResponse<Administrativo>> {
    try {
      const response = await httpClient.put<ApiResponse<Administrativo>>(`${API_BASE}/${id}/activate`, {})
      const body = response?.data
      return {
        success: body?.success ?? true,
        data: (body?.data ?? {}) as Administrativo,
        message: body?.message || 'Usuario activado correctamente',
        errors: this.normalizeValidationErrorsOptional(body?.errors)
      }
    } catch (error: any) {
      return {
        success: false,
        data: {} as Administrativo,
        message: error?.data?.message || error?.message || 'Error al activar el usuario',
        errors: this.normalizeValidationErrorsOptional(error?.validationErrors || error?.data?.errors || {})
      }
    }
  }

  /** Desactivar administrativo */
  static async deactivateAdministrativo(id: number): Promise<ApiResponse<Administrativo>> {
    try {
      const response = await httpClient.put<ApiResponse<Administrativo>>(`${API_BASE}/${id}/deactivate`, {})
      const body = response?.data
      return {
        success: body?.success ?? true,
        data: (body?.data ?? {}) as Administrativo,
        message: body?.message || 'Usuario desactivado correctamente',
        errors: this.normalizeValidationErrorsOptional(body?.errors)
      }
    } catch (error: any) {
      return {
        success: false,
        data: {} as Administrativo,
        message: error?.data?.message || error?.message || 'Error al desactivar el usuario',
        errors: this.normalizeValidationErrorsOptional(error?.validationErrors || error?.data?.errors || {})
      }
    }
  }

  /** Cambiar contraseña como administrador */
  static async changePasswordAdmin(
    id: number,
    payload: { new_password: string; new_password_confirmation?: string }
  ): Promise<ApiResponse<{}>> {
    try {
      // El httpClient envuelve la respuesta en { data }, extraer la respuesta real del backend
      const response = await httpClient.put<ApiResponse<{}>>(
        `${API_BASE}/${id}/change-password-admin`,
        payload
      )
      const body = response?.data
      const normalizedErrors = body?.errors
        ? this.normalizeValidationErrorsOptional(body.errors)
        : undefined
      return {
        success: body?.success ?? true,
        data: (body?.data ?? {}) as {},
        message: body?.message || 'Contraseña actualizada correctamente',
        errors: normalizedErrors
      }
    } catch (error: any) {
      // Preservar errores de validación del backend
      return {
        success: false,
        data: {},
        message: error?.data?.message || error?.message || 'Error al cambiar la contraseña',
        errors: this.normalizeValidationErrorsOptional(error?.validationErrors || error?.data?.errors || {})
      }
    }
  }

  /** Resetear contraseña y enviar por correo */
  static async resetPasswordAdmin(id: number): Promise<ApiResponse<null>> {
    try {
      // El httpClient envuelve la respuesta en { data }, extraer la respuesta real del backend
      const response = await httpClient.post<ApiResponse<null>>(`${API_BASE}/${id}/reset-password`)
      const body = response?.data
      const normalizedErrors = body?.errors
        ? this.normalizeValidationErrorsOptional(body.errors)
        : undefined
      return {
        success: body?.success ?? true,
        data: (body?.data ?? null) as null,
        message: body?.message || 'Contraseña reiniciada y correo encolado para envío',
        errors: normalizedErrors
      }
    } catch (error: any) {
      return {
        success: false,
        data: null,
        message: error?.data?.message || error?.message || 'Error al resetear la contraseña',
        errors: this.normalizeValidationErrorsOptional(error?.validationErrors || error?.data?.errors || {})
      }
    }
  }

  /** Subir foto de perfil */
  static async uploadPhoto(id: number, file: File): Promise<Administrativo> {
    try {
      const formData = new FormData()
      // Usar el nombre de campo correcto según documentación
      formData.append('foto_file', file)

      const response = await httpClient.post<Administrativo>(`${API_BASE}/${id}/upload-photo`, formData)
      return response?.data || ({} as Administrativo)
    } catch (error: any) {
      throw this.handleError(error)
    }
  }

  /** Eliminar foto de perfil */
  static async deletePhoto(id: number): Promise<Administrativo> {
    try {
      const response = await httpClient.delete<Administrativo>(`${API_BASE}/${id}/delete-photo`)
      return response?.data || ({} as Administrativo)
    } catch (error: any) {
      throw this.handleError(error)
    }
  }

  /** Validación y normalización de errores */
  static handleError(error: any): Error {
    // El httpClient expone los errores como { status, statusText, data }
    const data = error?.data
    if (data) {
      const message = data?.message || 'Error en la operación'
      const err = new Error(message)
        ; (err as any).errors = this.normalizeValidationErrorsOptional(error?.validationErrors || data?.errors || {})
      if (error?.status === 422 && data?.errors) {
        ; (err as any).isValidationError = true
      }
      return err
    }
    return new Error(error?.message || 'Error de red')
  }
}

export default AdministrativosService
