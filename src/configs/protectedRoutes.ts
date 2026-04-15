import type { RoutePermission } from '@/types/permissions'

/**
 * Configuración de rutas protegidas y sus permisos requeridos
 */
export const protectedRoutes: RoutePermission[] = [
  // Panel de administración - requiere acceso de admin
  {
    path: '/admin',
    permissions: ['admin.acceso'],
    requireAll: false
  },

  // Rutas de administración de usuarios
  {
    path: '/admin/users',
    permissions: ['usuarios.ver'],
    requireAll: false
  },
  {
    path: '/admin/users/create',
    permissions: ['usuarios.crear'],
    requireAll: false
  },
  {
    path: '/admin/users/edit',
    permissions: ['usuarios.editar'],
    requireAll: false
  },
  {
    path: '/admin/users/delete',
    permissions: ['usuarios.eliminar'],
    requireAll: false
  },

  // Rutas de roles y permisos
  {
    path: '/roles',
    permissions: ['roles.ver'],
    requireAll: false
  },
  {
    path: '/admin/roles',
    permissions: ['roles.ver'],
    requireAll: false
  },
  {
    path: '/admin/roles/create',
    permissions: ['roles.crear'],
    requireAll: false
  },
  {
    path: '/admin/roles/edit',
    permissions: ['roles.editar'],
    requireAll: false
  },

  // Rutas de configuración del sistema
  {
    path: '/admin/settings',
    permissions: ['sistema.configurar'],
    requireAll: false
  },
  {
    path: '/settings',
    permissions: ['sistema.configurar'],
    requireAll: false
  },

  // Gestión de usuarios
  {
    path: '/users',
    permissions: ['usuarios.ver', 'usuarios.gestionar'],
    requireAll: false
  },

  // Rutas de reportes
  {
    path: '/reports',
    permissions: ['reportes.ver'],
    requireAll: false
  },
  {
    path: '/reports/advanced',
    permissions: ['reportes.avanzados'],
    requireAll: false
  },

  // Reportes financieros - requiere permisos específicos
  {
    path: '/reports/financial',
    permissions: ['reportes.financieros', 'datos.sensibles'],
    requireAll: true // Requiere AMBOS permisos
  },

  // Gestión de contenido
  {
    path: '/content',
    permissions: ['contenido.gestionar', 'posts.editar'],
    requireAll: false
  },

  // API de usuarios - para rutas de API
  {
    path: '/bk/users',
    permissions: ['api.usuarios.acceso'],
    requireAll: false
  },

  // Configuración avanzada del sistema
  {
    path: '/system',
    permissions: ['admin.acceso', 'sistema.avanzado'],
    requireAll: true // Requiere ser admin Y tener permisos avanzados
  },

  // Ejemplo de ruta que requiere múltiples permisos
  {
    path: '/admin/critical-operations',
    permissions: ['sistema.administrar', 'operaciones.criticas'],
    requireAll: true // Requiere AMBOS permisos
  },

  // Rutas de Alumnos
  {
    path: '/usuarios/alumnos',
    permissions: ['usuarios.alumnos.ver'],
    requireAll: false
  },
  {
    path: '/usuarios/alumnos/create',
    permissions: ['usuarios.alumnos.crear'],
    requireAll: false
  },
  {
    path: '/usuarios/alumnos/edit',
    permissions: ['usuarios.alumnos.editar'],
    requireAll: false
  },

  // Rutas de Administrativos
  {
    path: '/usuarios/administrativos',
    permissions: ['usuarios.administrativos.ver'],
    requireAll: false
  },
  {
    path: '/usuarios/administrativos/create',
    permissions: ['usuarios.administrativos.crear'],
    requireAll: false
  },
  {
    path: '/usuarios/administrativos/edit',
    permissions: ['usuarios.administrativos.editar'],
    requireAll: false
  },

  // Rutas de Docentes
  {
    path: '/usuarios/docentes',
    permissions: ['usuarios.docentes.ver'],
    requireAll: false
  },
  {
    path: '/usuarios/docentes/create',
    permissions: ['usuarios.docentes.crear'],
    requireAll: false
  },
  {
    path: '/usuarios/docentes/edit',
    permissions: ['usuarios.docentes.editar'],
    requireAll: false
  },

  // Rutas de Familias
  {
    path: '/usuarios/familias',
    permissions: ['usuarios.familias.ver'],
    requireAll: false
  },
  {
    path: '/usuarios/familias/create',
    permissions: ['usuarios.familias.crear'],
    requireAll: false
  },
  {
    path: '/usuarios/familias/edit',
    permissions: ['usuarios.familias.editar'],
    requireAll: false
  },

  // Rutas de Configuración Académica
  {
    path: '/config/secciones',
    permissions: ['config_secciones.index'],
    requireAll: false
  },
  {
    path: '/config/modalidades',
    permissions: ['config_modalidades.index'],
    requireAll: false
  },
  {
    path: '/config/turnos',
    permissions: ['config_turnos.index'],
    requireAll: false
  },
  {
    path: '/config/grupos',
    permissions: ['config_grupos.index'],
    requireAll: false
  },
  {
    path: '/config/catalogo-cuentas',
    permissions: ['config_catalogo_cuentas.index'],
    requireAll: false
  },

  // Rutas de Caja - Parámetros
  {
    path: '/caja/parametros',
    permissions: ['config_parametros.show'],
    requireAll: false
  },
  
  // Rutas de Caja - Formas de Pago
  {
    path: '/caja/formas-pago',
    permissions: ['config_formas_pago.index'],
    requireAll: false
  }
  ,
  {
    path: '/caja/arqueo-moneda',
    permissions: ['config_arqueo_moneda.index'],
    requireAll: false
  }
  ,

  // Rutas de Caja - Aranceles
  {
    path: '/caja/aranceles',
    permissions: ['config_aranceles.index'],
    requireAll: false
  },

  // Rutas de Caja - Plan de Pagos
  {
    path: '/caja/plan-pagos',
    permissions: ['config_plan_pagos.index'],
    requireAll: false
  },

  // Rutas de Caja - Recibos
  {
    path: '/caja/recibos',
    permissions: ['recibos.index'],
    requireAll: false
  },
  {
    path: '/caja/buscar-recibos',
    permissions: ['buscar_recibo'],
    requireAll: false
  },
  {
    path: '/caja/arqueo-caja',
    permissions: ['arqueo_caja'],
    requireAll: false
  },

  // Rutas de Inventario
  {
    path: '/inventario/productos',
    permissions: ['inventario.productos.ver'],
    requireAll: false
  },
  {
    path: '/inventario/categorias',
    permissions: ['inventario.categorias.ver'],
    requireAll: false
  },
  {
    path: '/inventario-productos',
    permissions: ['inventario.productos.ver'],
    requireAll: false
  },
  {
    path: '/inventario-productos/[id]/movimientos',
    permissions: ['inventario.movimientos.index'],
    requireAll: false
  },

  // Rutas de Reportes
  {
    path: '/reportes/estadistica-matricula',
    permissions: ['reportes.estadistica_matricula'],
    requireAll: false
  }
  ,
  {
    path: '/reportes/alumnos-nuevo-ingreso',
    permissions: ['repote.nuevoingreso'],
    requireAll: false
  }
  ,
  {
    path: '/reportes/listas-por-grupo',
    permissions: ['ver_listas_grupo'],
    requireAll: false
  }
  ,
  {
    path: '/reportes/cierre-caja',
    permissions: ['reporte_cierre_caja.ver'],
    requireAll: false
  }
  ,
  {
    path: '/reportes/cuentas-x-cobrar',
    permissions: ['reporte_cuenta_x_cobrar.ver'],
    requireAll: false
  }
  ,
  {
    path: '/academico/organizar-listas',
    permissions: ['organizar.lista'],
    requireAll: false
  },

  // Rutas del Portal Administrativo de Notas
  {
    path: '/admin/notas',
    permissions: ['gestionar.notas.administrativo'],
    requireAll: false
  },
  {
    path: '/admin/notas/asignatura',
    permissions: ['gestionar.notas.administrativo'],
    requireAll: false
  }
]

/**
 * Rutas públicas que no requieren autenticación
 */
export const publicRoutes = [
  '/',
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/bk/auth',
  '/bk/login',
  '/favicon.ico',
  '/_next',
  '/images',
  '/icons',
  '/home',
  '/dashboard'
]

/**
 * Rutas que requieren autenticación pero no permisos específicos
 */
export const authenticatedRoutes = [
  // '/home', // Handled client-side to allow localStorage auth
  '/profile',
  '/dashboard',
  '/settings/profile',
  '/change-password'
]

/**
 * Función para verificar si una ruta es pública
 */
export const isPublicRoute = (pathname: string): boolean => {
  return publicRoutes.some(route => {
    if (route.endsWith('*')) {
      return pathname.startsWith(route.slice(0, -1))
    }

    
return pathname === route || pathname.startsWith(route + '/')
  })
}

/**
 * Función para verificar si una ruta requiere solo autenticación
 */
export const isAuthenticatedRoute = (pathname: string): boolean => {
  return authenticatedRoutes.some(route => {
    if (route.endsWith('*')) {
      return pathname.startsWith(route.slice(0, -1))
    }

    
return pathname === route || pathname.startsWith(route + '/')
  })
}

/**
 * Función para obtener los permisos requeridos para una ruta
 */
export const getRoutePermissions = (pathname: string): RoutePermission | null => {
  return protectedRoutes.find(route => {
    if (route.path.endsWith('*')) {
      return pathname.startsWith(route.path.slice(0, -1))
    }

    
return pathname === route.path || pathname.startsWith(route.path + '/')
  }) || null
}

/**
 * Función para verificar si una ruta está protegida
 */
export const isProtectedRoute = (pathname: string): boolean => {
  return !!getRoutePermissions(pathname)
}
