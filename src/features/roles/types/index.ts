// Tipos para el módulo de roles

export interface Role {
  id: number;
  nombre: string;
  permisos: string[];
  created_by: number;
  updated_by?: number;
  created_at: string;
  updated_at: string;
  cambios?: RoleChange[];
}

export interface RoleChange {
  campo: string;
  valor_anterior: any;
  nuevo_valor: any;
  usuario_id: number;
  fecha: string;
}

export interface CreateRoleRequest {
  nombre: string;
  permisos: string[];
}

export interface UpdateRoleRequest {
  nombre?: string;
  permisos?: string[];
}

export interface RolesResponse {
  success: boolean;
  data: {
    current_page: number;
    data: Role[];
    first_page_url: string;
    from: number;
    last_page: number;
    last_page_url: string;
    links: any[];
    next_page_url: string | null;
    path: string;
    per_page: number;
    prev_page_url: string | null;
    to: number;
    total: number;
  };
  message: string;
}

export interface AllRolesResponse {
  success: boolean;
  data: Role[];
  message: string;
}

export interface SingleRoleResponse {
  success: boolean;
  data: Role;
  message: string;
}

export interface ApiErrorResponse {
  success: false;
  message: string;
  errors?: Record<string, string[]>;
}

// Permisos disponibles en el sistema - Sincronizado con el backend
export const AVAILABLE_PERMISSIONS = {
  // Categoría: Configuración
  ROLES: {
    VER: 'roles.ver',
    CREAR: 'roles.crear',
    EDITAR: 'roles.editar',
    ELIMINAR: 'roles.eliminar',
    ASIGNAR: 'roles.asignar'
  },
  USUARIOS: {
    VER: 'usuarios.ver',
    CREAR: 'usuarios.crear',
    EDITAR: 'usuarios.editar',
    ELIMINAR: 'usuarios.eliminar',
    ACTIVAR: 'usuarios.activar',
    DESACTIVAR: 'usuarios.desactivar'
  },
  PERMISOS: {
    VER: 'permisos.ver',
    ASIGNAR: 'permisos.asignar'
  },

  // Categoría: Gestión
  PRODUCTOS: {
    VER: 'productos.ver',
    CREAR: 'productos.crear',
    EDITAR: 'productos.editar',
    ELIMINAR: 'productos.eliminar',
    PUBLICAR: 'productos.publicar'
  },
  CATEGORIAS: {
    VER: 'categorias.ver',
    CREAR: 'categorias.crear',
    EDITAR: 'categorias.editar',
    ELIMINAR: 'categorias.eliminar'
  },

  // Categoría: Reportes
  VENTAS: {
    VER: 'ventas.ver',
    EXPORTAR: 'ventas.exportar'
  },
  USUARIOS_REPORTES: {
    VER: 'usuarios_reportes.ver',
    EXPORTAR: 'usuarios_reportes.exportar'
  }
} as const;

// Tipo para los permisos disponibles
export type Permission = typeof AVAILABLE_PERMISSIONS[keyof typeof AVAILABLE_PERMISSIONS][keyof typeof AVAILABLE_PERMISSIONS[keyof typeof AVAILABLE_PERMISSIONS]];

// Opciones para la tabla de roles
export interface RoleTableFilters {
  page?: number;
  per_page?: number;
  search?: string;
  activo?: boolean;
}

// Estado del modal de roles
export interface RoleModalState {
  isOpen: boolean;
  mode: 'create' | 'edit';
  role?: Role;
}

// Estado del diálogo de confirmación
export interface DeleteConfirmState {
  isOpen: boolean;
  role?: Role;
}