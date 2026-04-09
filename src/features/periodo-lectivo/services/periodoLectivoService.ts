import { httpClient } from '@/utils/httpClient';
import type {
  ConfPeriodoLectivo,
  CreatePeriodoLectivoRequest,
  ApiResponse as PeriodoLectivoApiResponse,
  PeriodoLectivoPaginatedResponse,
  PeriodoLectivoSearchParams
} from '../types';

class PeriodoLectivoService {
  private readonly baseEndpoint = '/bk/v1/conf-periodo-lectivo';

  /**
   * Obtiene todos los períodos lectivos con paginación
   */
  async getPeriodosLectivos(
    params: PeriodoLectivoSearchParams = {},
    options?: { signal?: AbortSignal }
  ): Promise<PeriodoLectivoPaginatedResponse> {
    const searchParams = new URLSearchParams();

    if (params.page) searchParams.append('page', params.page.toString());
    if (params.per_page) searchParams.append('per_page', params.per_page.toString());
    if (params.search) searchParams.append('search', params.search);

    const queryString = searchParams.toString();
    const endpoint = queryString ? `${this.baseEndpoint}?${queryString}` : this.baseEndpoint;

    try {
      const apiResponse = await httpClient.get<PeriodoLectivoApiResponse<PeriodoLectivoPaginatedResponse>>(endpoint, {
        signal: options?.signal
      });

      // El httpClient devuelve el JSON del ApiResponse; desanidamos y retornamos la estructura paginada
      return (apiResponse?.data || { current_page: 1, data: [], total: 0, first_page_url: '', from: 0, last_page: 1, last_page_url: '', links: [], next_page_url: null, path: '', per_page: params.per_page || 10, prev_page_url: null, to: 0 }) as PeriodoLectivoPaginatedResponse;
    } catch (error: any) {
      // Si se canceló la petición, marcar como AbortError para que el componente lo ignore
      if (options?.signal?.aborted) {
        throw { name: 'AbortError' };
      }

      throw {
        message: error?.data?.message || error.message || 'Error al cargar los períodos lectivos',
        status: error.status || 500,
        isAuthError: error.status === 401
      };
    }
  }

  /**
   * Obtiene todos los períodos lectivos sin paginación
   */
  async getAllPeriodosLectivos(): Promise<PeriodoLectivoApiResponse<ConfPeriodoLectivo[]>> {
    try {
      const response = await httpClient.get<any>(`/bk/v1/config-grupos/opciones/periodos-lectivos`);
      return response as PeriodoLectivoApiResponse<ConfPeriodoLectivo[]>;
    } catch (error: any) {
      return {
        success: false,
        data: [],
        message: error.message || 'Error al obtener los períodos lectivos',
        errors: error.errors
      };
    }
  }

  /**
   * Obtiene un período lectivo por ID
   */
  async getPeriodoLectivoById(id: number): Promise<PeriodoLectivoApiResponse<ConfPeriodoLectivo>> {
    try {
      const response = await httpClient.get<any>(`${this.baseEndpoint}/${id}`);
      return response as PeriodoLectivoApiResponse<ConfPeriodoLectivo>;
    } catch (error: any) {
      return {
        success: false,
        data: {} as ConfPeriodoLectivo,
        message: error.message || 'Error al obtener el período lectivo',
        errors: error.errors
      };
    }
  }

  /**
   * Crea un nuevo período lectivo
   */
  async createPeriodoLectivo(data: CreatePeriodoLectivoRequest): Promise<PeriodoLectivoApiResponse<ConfPeriodoLectivo>> {
    try {
      const response = await httpClient.post<ConfPeriodoLectivo>(this.baseEndpoint, data);
      const apiResponse = response as unknown as PeriodoLectivoApiResponse<ConfPeriodoLectivo>;
      return {
        success: apiResponse?.success ?? true,
        data: apiResponse?.data || ({} as ConfPeriodoLectivo),
        message: apiResponse?.message || 'Período lectivo creado exitosamente',
        errors: apiResponse?.errors
      };
    } catch (error: any) {
      const errorData = error.data || {};
      return {
        success: false,
        data: {} as ConfPeriodoLectivo,
        message: errorData.message || 'Error al crear el período lectivo',
        errors: errorData.errors || {}
      };
    }
  }

  /**
   * Actualiza un período lectivo existente
   */
  async updatePeriodoLectivo(id: number, data: CreatePeriodoLectivoRequest): Promise<PeriodoLectivoApiResponse<ConfPeriodoLectivo>> {
    try {
      const response = await httpClient.put<ConfPeriodoLectivo>(`${this.baseEndpoint}/${id}`, data);
      const apiResponse = response as unknown as PeriodoLectivoApiResponse<ConfPeriodoLectivo>;
      return {
        success: apiResponse?.success ?? true,
        data: apiResponse?.data || ({} as ConfPeriodoLectivo),
        message: apiResponse?.message || 'Período lectivo actualizado exitosamente',
        errors: apiResponse?.errors
      };
    } catch (error: any) {
      const errorData = error.data || {};
      return {
        success: false,
        data: {} as ConfPeriodoLectivo,
        message: errorData.message || 'Error al actualizar el período lectivo',
        errors: errorData.errors || {}
      };
    }
  }

  /**
   * Elimina un período lectivo
   */
  async deletePeriodoLectivo(id: number): Promise<PeriodoLectivoApiResponse<null>> {
    try {
      const response = await httpClient.delete<null>(`${this.baseEndpoint}` + `/${id}`);
      const apiResponse = response as unknown as PeriodoLectivoApiResponse<null>;
      return {
        success: apiResponse?.success ?? true,
        data: null,
        message: apiResponse?.message || 'Período lectivo eliminado exitosamente',
        errors: apiResponse?.errors
      };
    } catch (error: any) {
      return {
        success: false,
        data: null,
        message: error.message || 'Error al eliminar el período lectivo',
        errors: error.errors
      };
    }
  }
}

export const periodoLectivoService = new PeriodoLectivoService();
export default periodoLectivoService;
