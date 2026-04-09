import { httpClient } from '@/utils/httpClient';
import type {
  Role,
  CreateRoleRequest,
  UpdateRoleRequest,
  RolesResponse,
  AllRolesResponse,
  SingleRoleResponse,
  RoleTableFilters
} from '../types';

class RolesService {
  private readonly baseEndpoint = '/bk/v1/roles';

  /**
   * Obtiene todos los roles con paginación
   */
  async getRoles(filters: RoleTableFilters = {}, options?: { signal?: AbortSignal }): Promise<RolesResponse> {
    const params = new URLSearchParams();

    if (filters.page) params.append('page', filters.page.toString());
    if (filters.per_page) params.append('per_page', filters.per_page.toString());
    if (filters.search) params.append('search', filters.search);
    if (filters.activo !== undefined) params.append('activo', filters.activo.toString());

    const queryString = params.toString();
    const endpoint = queryString ? `${this.baseEndpoint}?${queryString}` : this.baseEndpoint;

    try {
      const response = await httpClient.get<any>(endpoint, {
        signal: options?.signal
      });

      const raw = response?.data;

      // Normalizar posibles formas de respuesta (paginada o arreglo plano)
      let roles: Role[] = [];
      const message: string = (raw?.message as string) || 'Roles obtenidos exitosamente';

      if (raw?.data?.data && Array.isArray(raw.data.data)) {
        roles = raw.data.data as Role[];
      } else if (Array.isArray(raw)) {
        roles = raw as Role[];
      } else if (Array.isArray(raw?.data)) {
        roles = raw.data as Role[];
      }

      // Transformar permisos de objetos a strings si es necesario
      roles = roles.map(role => ({
        ...role,
        permisos: Array.isArray(role.permisos)
          ? role.permisos.map(p => (typeof p === 'string' ? p : String(p)))
          : []
      }));

      // Construir respuesta paginada si no vino en ese formato
      const paginated: RolesResponse = raw?.data?.current_page
        ? (raw as RolesResponse)
        : {
            success: true,
            data: {
              current_page: 1,
              data: roles,
              first_page_url: '',
              from: roles.length ? 1 : 0,
              last_page: 1,
              last_page_url: '',
              links: [],
              next_page_url: null,
              path: this.baseEndpoint,
              per_page: roles.length || (filters.per_page || 15),
              prev_page_url: null,
              to: roles.length,
              total: roles.length
            },
            message
          };

      // Si vino paginado desde el backend, asegurar transformación de permisos
      if (paginated?.data?.data && Array.isArray(paginated.data.data)) {
        paginated.data.data = paginated.data.data.map(role => ({
          ...role,
          permisos: Array.isArray(role.permisos)
            ? role.permisos.map(p => (typeof p === 'string' ? p : String(p)))
            : []
        }));
      }

      return paginated;
    } catch (error: any) {
      // Si es un AbortError, lo relanzamos sin modificar
      if (error.name === 'AbortError') {
        throw error;
      }

      // Para otros errores, agregar contexto y información de status
      console.error('Error en getRoles:', error);
      throw {
        ...error,
        context: 'getRoles',
        endpoint,
        status: error.status || error.response?.status,
        isAuthError: error.status === 401 || error.isAuthError
      };
    }
  }

  /**
   * Obtiene todos los roles sin paginación
   */
  async getAllRoles(): Promise<AllRolesResponse> {
    const response = await httpClient.get<any>(`${this.baseEndpoint}/all`);

    const raw = response?.data;
    let roles: Role[] = [];
    const message = (raw?.message as string) || 'Roles obtenidos exitosamente';

    if (Array.isArray(raw)) {
      roles = raw as Role[];
    } else if (Array.isArray(raw?.data)) {
      roles = raw.data as Role[];
    }

    // Transformar permisos de objetos a strings si es necesario
    roles = roles.map(role => ({
      ...role,
      permisos: Array.isArray(role.permisos)
        ? role.permisos.map(p => (typeof p === 'string' ? p : String(p)))
        : []
    }));

    return {
      success: true,
      data: roles,
      message
    };
  }

  /**
   * Obtiene un rol específico por ID
   */
  async getRoleById(id: number): Promise<SingleRoleResponse> {
    const response = await httpClient.get<any>(`${this.baseEndpoint}/${id}`);

    const raw = response?.data;
    const role: Role = (raw?.data as Role) || (raw as Role);

    if (role?.permisos && Array.isArray(role.permisos)) {
      role.permisos = role.permisos.map(p => (typeof p === 'string' ? p : String(p)));
    }

    return {
      success: true,
      data: role,
      message: (raw?.message as string) || 'Rol obtenido exitosamente'
    };
  }

  /**
   * Crea un nuevo rol
   */
  async createRole(roleData: CreateRoleRequest): Promise<SingleRoleResponse> {
    const response = await httpClient.post<Role>(`${this.baseEndpoint}`, roleData);

    return {
      success: true,
      data: response.data as Role,
      message: response.message || 'Rol creado exitosamente'
    };
  }

  /**
   * Actualiza un rol existente
   */
  async updateRole(id: number, roleData: UpdateRoleRequest): Promise<SingleRoleResponse> {
    const response = await httpClient.put<Role>(`${this.baseEndpoint}/${id}`, roleData);

    return {
      success: true,
      data: response.data as Role,
      message: response.message || 'Rol actualizado exitosamente'
    };
  }

  /**
   * Elimina un rol (soft delete)
   */
  async deleteRole(id: number): Promise<{ success: boolean; message: string }> {
    const response = await httpClient.delete<null>(`${this.baseEndpoint}/${id}`);

    return {
      success: true,
      message: response.message || 'Rol eliminado exitosamente'
    };
  }

  /**
   * Obtiene todos los permisos disponibles agrupados desde la API del backend
   */
  async getAvailablePermissions(): Promise<{ success: boolean; data: any; error?: any }> {
    try {
      const response = await httpClient.get('/bk/v1/permissions/grouped');

      // Verificar si response.data contiene los permisos
      if (response.data && typeof response.data === 'object') {
        return {
          success: true,
          data: response.data
        };
      } else {
        return {
          success: false,
          data: null,
          error: 'No se encontraron permisos en la respuesta'
        };
      }
    } catch (error: any) {
      // El httpClient ya formatea los errores con status, statusText, etc.
      const errorInfo = {
        status: error.status || 0,
        statusText: error.statusText || 'Unknown Error',
        message: error.message || error.statusText || 'Network Error',
        data: error.data || null,
        originalError: error
      };

      return {
        success: false,
        data: null,
        error: errorInfo
      };
    }
  }



  /**
   * Valida si un rol puede ser eliminado
   * Método requerido por DeleteConfirmDialog
   */
  async validateRoleDeletion(id: number): Promise<{
    success: boolean;
    data: {
      canDelete: boolean;
      message?: string;
      relatedData?: {
        users_count?: number;
        dependencies?: string[];
      };
    };
  }> {
    try {
      // Por ahora implementamos una validación básica
      // En el futuro se puede conectar con un endpoint específico del backend
      
      // Validación básica: permitir eliminación para todos los roles excepto algunos críticos
      const canDelete = id !== 1; // Ejemplo: no permitir eliminar el rol con ID 1 (admin)
      
      return {
        success: true,
        data: {
          canDelete,
          message: canDelete ? 'El rol puede ser eliminado' : 'No se puede eliminar el rol de administrador',
          relatedData: {
            users_count: 0,
            dependencies: []
          }
        }
      };
    } catch (error: any) {
      return {
        success: false,
        data: {
          canDelete: false,
          message: error.message || 'Error al validar la eliminación del rol',
          relatedData: {
            users_count: 0,
            dependencies: []
          }
        }
      };
    }
  }
}

// Exportar una instancia singleton del servicio
export const rolesService = new RolesService();
export default rolesService;
