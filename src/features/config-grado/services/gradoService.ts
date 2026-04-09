import { httpClient } from '@/utils/httpClient';
import type {
  ConfigGrado,
  CreateGradoRequest,
  UpdateGradoRequest,
  ApiResponse,
  GradoPaginatedResponse,
  GradoSearchParams,
  ModalidadOption
} from '../types';

class GradoService {
  private readonly baseEndpoint = '/bk/v1/config-grado';

  /**
   * Obtiene todos los grados con paginación
   */
  async getGrados(
    params: GradoSearchParams = {},
    options?: { signal?: AbortSignal }
  ): Promise<GradoPaginatedResponse> {
    const searchParams = new URLSearchParams();

    if (params.page) searchParams.append('page', params.page.toString());
    if (params.per_page) searchParams.append('per_page', params.per_page.toString());
    if (params.search) searchParams.append('search', params.search);

    const queryString = searchParams.toString();
    const endpoint = queryString ? `${this.baseEndpoint}?${queryString}` : this.baseEndpoint;

    try {
      // El httpClient envuelve respuestas JSON como { data }
      const response = await httpClient.get<any>(endpoint, {
        signal: options?.signal
      });

      // La API devuelve { success, data: GradoPaginatedResponse }
      // Extraemos la estructura paginada de response.data
      const paginated = response?.data as GradoPaginatedResponse
      return paginated
    } catch (error: any) {
      if (error.name === 'AbortError') {
        throw error;
      }

      // Manejo directo de errores que preserva las validaciones

      throw {
        message: error.message || 'Error al cargar los grados',
        status: error.status || 500,
        isAuthError: error.status === 401
      };
    }
  }

  /**
   * Obtiene todos los grados sin paginación
   */
  async getAllGrados(): Promise<ApiResponse<ConfigGrado[]>> {
    try {
      const response = await httpClient.get<any>(`${this.baseEndpoint}/getall`);
      return response?.data as ApiResponse<ConfigGrado[]>;
    } catch (error: any) {
      // Manejo directo de errores que preserva las validaciones

      throw {
        message: error.message || 'Error al cargar todos los grados',
        status: error.status || 500,
        isAuthError: error.status === 401
      };
    }
  }

  /**
   * Obtiene un grado por ID
   */
  async getGradoById(id: number): Promise<ApiResponse<ConfigGrado>> {
    try {
      const response = await httpClient.get<any>(`${this.baseEndpoint}/${id}`);
      return response?.data as ApiResponse<ConfigGrado>;
    } catch (error: any) {
      // Manejo directo de errores que preserva las validaciones

      throw {
        message: error.message || 'Error al cargar el grado',
        status: error.status || 500,
        isAuthError: error.status === 401
      };
    }
  }

  /**
   * Crea un nuevo grado
   */
  async createGrado(data: CreateGradoRequest): Promise<ApiResponse<ConfigGrado>> {
    try {
      const response = await httpClient.post<any>(this.baseEndpoint, data);
      return response?.data as ApiResponse<ConfigGrado>;
    } catch (error: any) {
      // Si hay errores de validación, los incluimos en la respuesta
      if (error.status === 422 && error.data?.errors) {
        throw {
          message: error.data.message || 'Errores de validación',
          status: 422,
          errors: error.data.errors,
          isValidationError: true
        };
      }

      throw {
        message: error.message || 'Error al crear el grado',
        status: error.status || 500,
        isAuthError: error.status === 401
      };
    }
  }

  /**
   * Actualiza un grado existente
   */
  async updateGrado(id: number, data: CreateGradoRequest): Promise<ApiResponse<ConfigGrado>> {
    try {
      const response = await httpClient.put<any>(`${this.baseEndpoint}/${id}`, data);
      return response?.data as ApiResponse<ConfigGrado>;
    } catch (error: any) {
      // Si hay errores de validación, los incluimos en la respuesta
      if (error.status === 422 && error.data?.errors) {
        throw {
          message: error.data.message || 'Errores de validación',
          status: 422,
          errors: error.data.errors,
          isValidationError: true
        };
      }

      throw {
        message: error.message || 'Error al actualizar el grado',
        status: error.status || 500,
        isAuthError: error.status === 401
      };
    }
  }

  /**
   * Elimina un grado
   */
  async deleteGrado(id: number): Promise<ApiResponse<null>> {
    try {
      const response = await httpClient.delete<any>(`${this.baseEndpoint}/${id}`);
      return response?.data as ApiResponse<null>;
    } catch (error: any) {
      throw {
        message: error.message || 'Error al eliminar el grado',
        status: error.status || 500,
        isAuthError: error.status === 401
      };
    }
  }

  /**
   * Obtiene lista de modalidades para selects
   */
  async getModalidades(): Promise<ModalidadOption[]> {
    try {
      const response = await httpClient.get<any>(`${this.baseEndpoint}/opciones/modalidades`)
      // El httpClient devuelve el JSON del backend directamente: { success, data }
      // Debemos extraer el arreglo en response.data
      return response?.data || []
    } catch (error: any) {
      throw {
        message: error.data?.message || error.message || 'Error al cargar modalidades',
        status: error.status || 500,
        isAuthError: error.status === 401,
        errors: error.data?.errors
      }
    }
  }
}

export const gradoService = new GradoService();
export default gradoService;
