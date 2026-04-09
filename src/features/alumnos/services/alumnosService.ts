import { httpClient } from '@/utils/httpClient'
import type {
    Alumno,
    AlumnoFilters,
    AlumnoFormData,
    AlumnoResponse,
    ApiError,
    ApiResponse,
    ApiResponseWithValidation,
    ValidationErrors
} from '../types'

const API_BASE = '/bk/v1/usuarios/alumnos'

export class AlumnosService {
  /**
   * Obtener lista de alumnos con filtros y paginación
   */
  static async getAlumnos(filters: AlumnoFilters = {}): Promise<AlumnoResponse> {
    try {
      const params = new URLSearchParams()
      
      if (filters.page) params.append('page', filters.page.toString())
      if (filters.per_page) params.append('per_page', filters.per_page.toString())
      if (filters.search) params.append('search', filters.search)
      if (filters.estado) params.append('estado', filters.estado)
      if (filters.grado_id) params.append('grado_id', filters.grado_id.toString())
      if (filters.seccion_id) params.append('seccion_id', filters.seccion_id.toString())
      if (filters.turno_id) params.append('turno_id', filters.turno_id.toString())

      const queryString = params.toString()
      const endpoint = queryString ? `${API_BASE}?${queryString}` : API_BASE

      const response = await httpClient.get<any>(endpoint)
      
      // El httpClient devuelve { data: respuestaDelBackend }
      // El backend devuelve directamente la estructura de paginación
      return response.data
    } catch (error: any) {
      throw this.handleError(error)
    }
  }

  /**
   * Obtener un alumno por ID
   */
  static async getAlumnoById(id: number): Promise<Alumno> {
    try {
      const response = await httpClient.get<any>(
        `${API_BASE}/${id}`
      )
      
      return response?.data || ({} as Alumno)
    } catch (error: any) {
      throw this.handleError(error)
    }
  }

  /**
   * Crear un nuevo alumno
   */
  static async createAlumno(data: AlumnoFormData): Promise<ApiResponseWithValidation<Alumno>> {
    try {
      const payload = {
        ...data,
        tipo_usuario: 'alumno'
      }

      const response = await httpClient.post<Alumno>(
        API_BASE,
        payload
      )
      
      return {
        success: true,
        data: response.data || ({} as Alumno),
        message: response.message || 'Alumno creado exitosamente'
      }
    } catch (error: any) {
      return {
        success: false,
        data: {} as Alumno,
        message: error.data?.message || error.message || 'Error al crear el alumno',
        errors: error.data?.errors
      }
    }
  }

  /**
   * Verificar si un correo electrónico ya existe
   */
  static async checkEmailExists(email: string, excludeId?: number): Promise<{ exists: boolean }> {
    try {
      const params = new URLSearchParams({ email })
      if (excludeId) {
        params.append('exclude_id', excludeId.toString())
      }

      const response = await httpClient.get<any>(
        `${API_BASE}/check-email?${params.toString()}`
      )
      
      return response?.data || { exists: false }
    } catch (error: any) {
      throw this.handleError(error)
    }
  }

  /**
   * Actualizar un alumno existente
   */
  static async updateAlumno(id: number, data: Partial<AlumnoFormData>): Promise<ApiResponseWithValidation<Alumno>> {
    try {
      const response = await httpClient.put<Alumno>(
        `${API_BASE}/${id}`,
        data
      )
      
      return {
        success: true,
        data: response.data || ({} as Alumno),
        message: response.message || 'Alumno actualizado exitosamente'
      }
    } catch (error: any) {
      return {
        success: false,
        data: {} as Alumno,
        message: error.data?.message || error.message || 'Error al actualizar el alumno',
        errors: error.data?.errors
      }
    }
  }

  /**
   * Eliminar un alumno (soft delete)
   */
  static async deleteAlumno(id: number): Promise<void> {
    try {
      await httpClient.delete(`${API_BASE}/${id}`)
    } catch (error: any) {
      throw this.handleError(error)
    }
  }

  /**
   * Restaurar un alumno eliminado
   */
  static async restoreAlumno(id: number): Promise<Alumno> {
    try {
      const response = await httpClient.post<Alumno>(
        `${API_BASE}/${id}/restore`
      )
      
      return response?.data || ({} as Alumno)
    } catch (error: any) {
      throw this.handleError(error)
    }
  }

  /**
   * Activar alumno (estado activo)
   */
  static async activateAlumno(id: number): Promise<ApiResponse<Alumno>> {
    try {
      const response = await httpClient.put<ApiResponse<Alumno>>(`${API_BASE}/${id}/activate`, {})
      const body = response?.data
      return {
        success: body?.success ?? true,
        data: (body?.data ?? {}) as Alumno,
        message: body?.message || 'Usuario activado correctamente',
        errors: body?.errors as ValidationErrors | undefined
      }
    } catch (error: any) {
      return {
        success: false,
        data: {} as Alumno,
        message: error?.data?.message || error?.message || 'Error al activar el usuario',
        errors: (error?.data?.errors || undefined) as ValidationErrors | undefined
      }
    }
  }

  /**
   * Desactivar alumno (estado inactivo)
   */
  static async deactivateAlumno(id: number): Promise<ApiResponse<Alumno>> {
    try {
      const response = await httpClient.put<ApiResponse<Alumno>>(`${API_BASE}/${id}/deactivate`, {})
      const body = response?.data
      return {
        success: body?.success ?? true,
        data: (body?.data ?? {}) as Alumno,
        message: body?.message || 'Usuario desactivado correctamente',
        errors: body?.errors as ValidationErrors | undefined
      }
    } catch (error: any) {
      return {
        success: false,
        data: {} as Alumno,
        message: error?.data?.message || error?.message || 'Error al desactivar el usuario',
        errors: (error?.data?.errors || undefined) as ValidationErrors | undefined
      }
    }
  }

  /**
   * Subir foto de perfil para un alumno
   */
  static async uploadPhoto(id: number, file: File): Promise<Alumno> {
    try {
      const formData = new FormData()
      formData.append('foto_file', file)

      const response = await httpClient.post<Alumno>(
        `${API_BASE}/${id}/upload-photo`,
        formData
      )
      
      if (response.data) {
        return response.data
      }

      throw new Error(response.message || 'Error al subir la foto')
    } catch (error: any) {
      throw this.handleError(error)
    }
  }

  /**
   * Eliminar foto de perfil de un alumno
   */
  static async deletePhoto(id: number): Promise<Alumno> {
    try {
      const response = await httpClient.delete<Alumno>(
        `${API_BASE}/${id}/delete-photo`
      )
      
      return response?.data || ({} as Alumno)
    } catch (error: any) {
      throw this.handleError(error)
    }
  }

  /**
   * Obtener historial de cambios de un alumno
   */
  static async getAlumnoChanges(id: number): Promise<any[]> {
    try {
      const response = await httpClient.get<any>(
        `${API_BASE}/${id}/cambios`
      )
      
      return response?.data || []
    } catch (error: any) {
      throw this.handleError(error)
    }
  }

  /**
   * Exportar alumnos a Excel
   */
  static async exportToExcel(filters: AlumnoFilters = {}): Promise<Blob> {
    try {
      const params = new URLSearchParams()
      
      if (filters.search) params.append('search', filters.search)
      if (filters.estado) params.append('estado', filters.estado)
      if (filters.grado_id) params.append('grado_id', filters.grado_id.toString())
      if (filters.seccion_id) params.append('seccion_id', filters.seccion_id.toString())
      if (filters.turno_id) params.append('turno_id', filters.turno_id.toString())
      if (filters.sort_by) params.append('sort_by', filters.sort_by)
      if (filters.sort_order) params.append('sort_order', filters.sort_order)

      // Para httpClient, necesitamos hacer la petición de manera diferente para obtener un blob
      const url = `${API_BASE}/export?${params.toString()}`
      
      // Hacer la petición directamente con fetch ya que httpClient puede no manejar blobs correctamente
      const token = localStorage.getItem('token')
      const response = await fetch(`${process.env.NEXT_PUBLIC_LARAVEL_APP_URL}${url}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        }
      })

      if (!response.ok) {
        throw new Error('Error al exportar datos')
      }

      return await response.blob()
    } catch (error: any) {
      throw this.handleError(error)
    }
  }

  /**
   * Manejar errores de la API
   */
  private static handleError(error: any): ApiError {
    if (error.data) {
      return {
        success: false,
        message: error.data?.message || 'Error en la operación',
        errors: error.data?.errors || []
      }
    }
    
    return {
      success: false,
      message: error.message || 'Error de conexión con el servidor'
    }
  }

  /**
   * Exportar reporte personalizado de alumnos
   */
  static async exportCustomReport(data: { periodo_lectivo_id: number, fields: string[] }): Promise<Blob> {
    try {
      const token = localStorage.getItem('token')
      // Route registered in users.php prefix 'users' -> /bk/v1/users/students/export
      const url = '/bk/v1/users/students/export'
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_LARAVEL_APP_URL}${url}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        },
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || 'Error al exportar datos')
      }

      return await response.blob()
    } catch (error: any) {
       throw this.handleError(error)
    }
  }

  /**
   * Descargar PDF de Ficha de Retiro
   */
  static async downloadWithdrawalPdf(id: number): Promise<Blob> {
    try {
      const token = localStorage.getItem('token')
      const url = `${API_BASE}/${id}/ficha-retiro-pdf`
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_LARAVEL_APP_URL}${url}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/pdf'
        }
      })

      if (!response.ok) {
        throw new Error('Error al descargar la ficha de retiro')
      }

      return await response.blob()
    } catch (error: any) {
      throw this.handleError(error)
    }
  }
}

export default AlumnosService
