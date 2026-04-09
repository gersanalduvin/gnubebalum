'use client'

import Link from 'next/link'

import { usePermissions } from '@/hooks/usePermissions'
import { PermissionGuard } from '@/components/PermissionGuard'
import { withPermissions } from '@/hocs/withPermissions'

/**
 * Ejemplo de Dashboard que utiliza el sistema de permisos
 * Este componente demuestra diferentes formas de implementar control de acceso
 */
function DashboardExample() {
  const { 
    hasPermission, 
    hasAnyPermission, 
    hasAllPermissions, 
    canAccessRoute,
    getUserPermissions 
  } = usePermissions()

  // Verificaciones de permisos usando el hook
  const canManageUsers = hasPermission('usuarios.gestionar')
  const canViewReports = hasPermission('reportes.ver')
  const canEditContent = hasAnyPermission(['contenido.editar', 'posts.editar'])
  const canAccessFinancials = hasAllPermissions(['reportes.financieros', 'datos.sensibles'])
  const canAccessAdminPanel = canAccessRoute(['admin.acceso'])

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Dashboard - Sistema de Permisos</h1>
      
      {/* Información del usuario y permisos */}
      <div className="bg-blue-50 p-4 rounded-lg mb-6">
        <h2 className="text-lg font-semibold mb-2">Información de Permisos</h2>
        <div className="text-sm text-gray-600">
          <p>Permisos actuales: {JSON.stringify(getUserPermissions(), null, 2)}</p>
        </div>
      </div>

      {/* Grid de tarjetas con diferentes controles de permisos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Tarjeta 1: Control con hook usePermissions */}
        {canManageUsers && (
          <div className="bg-white p-6 rounded-lg shadow-md border">
            <h3 className="text-xl font-semibold mb-4 text-green-600">👥 Gestión de Usuarios</h3>
            <p className="text-gray-600 mb-4">
              Tienes permisos para gestionar usuarios.
            </p>
            <div className="space-y-2">
              <button className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                Ver Usuarios
              </button>
              <button className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">
                Crear Usuario
              </button>
            </div>
          </div>
        )}

        {/* Tarjeta 2: Control con PermissionGuard */}
        <PermissionGuard 
          permission="reportes.ver"
          fallback={
            <div className="bg-gray-100 p-6 rounded-lg shadow-md border">
              <h3 className="text-xl font-semibold mb-4 text-gray-500">📊 Reportes</h3>
              <p className="text-gray-500">
                No tienes permisos para ver reportes.
              </p>
            </div>
          }
        >
          <div className="bg-white p-6 rounded-lg shadow-md border">
            <h3 className="text-xl font-semibold mb-4 text-purple-600">📊 Reportes</h3>
            <p className="text-gray-600 mb-4">
              Accede a los reportes del sistema.
            </p>
            <div className="space-y-2">
              <button className="w-full px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700">
                Ver Reportes Generales
              </button>
              
              {/* Botón anidado con permisos adicionales */}
              <PermissionGuard permission="reportes.financieros">
                <button className="w-full px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">
                  Reportes Financieros
                </button>
              </PermissionGuard>
            </div>
          </div>
        </PermissionGuard>

        {/* Tarjeta 3: Control con múltiples permisos (OR) */}
        <PermissionGuard 
          permissions={['contenido.editar', 'posts.editar', 'paginas.editar']}
          requireAll={false}
        >
          <div className="bg-white p-6 rounded-lg shadow-md border">
            <h3 className="text-xl font-semibold mb-4 text-orange-600">✏️ Editor de Contenido</h3>
            <p className="text-gray-600 mb-4">
              Puedes editar contenido del sitio.
            </p>
            <div className="space-y-2">
              <button className="w-full px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700">
                Editar Posts
              </button>
              <button className="w-full px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700">
                Editar Páginas
              </button>
            </div>
          </div>
        </PermissionGuard>

        {/* Tarjeta 4: Control con múltiples permisos (AND) */}
        <PermissionGuard 
          permissions={['admin.acceso', 'sistema.configurar']}
          requireAll={true}
          fallback={
            <div className="bg-gray-100 p-6 rounded-lg shadow-md border">
              <h3 className="text-xl font-semibold mb-4 text-gray-500">⚙️ Configuración</h3>
              <p className="text-gray-500">
                Requiere permisos de administrador y configuración del sistema.
              </p>
            </div>
          }
        >
          <div className="bg-white p-6 rounded-lg shadow-md border">
            <h3 className="text-xl font-semibold mb-4 text-red-600">⚙️ Configuración del Sistema</h3>
            <p className="text-gray-600 mb-4">
              Panel de configuración avanzada.
            </p>
            <button className="w-full px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">
              Configurar Sistema
            </button>
          </div>
        </PermissionGuard>

        {/* Tarjeta 5: Información condicional */}
        <div className="bg-white p-6 rounded-lg shadow-md border">
          <h3 className="text-xl font-semibold mb-4 text-indigo-600">ℹ️ Estado de Permisos</h3>
          <div className="space-y-2 text-sm">
            <div className={`p-2 rounded ${canManageUsers ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              Gestión de usuarios: {canManageUsers ? '✅ Permitido' : '❌ Denegado'}
            </div>
            <div className={`p-2 rounded ${canViewReports ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              Ver reportes: {canViewReports ? '✅ Permitido' : '❌ Denegado'}
            </div>
            <div className={`p-2 rounded ${canEditContent ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              Editar contenido: {canEditContent ? '✅ Permitido' : '❌ Denegado'}
            </div>
            <div className={`p-2 rounded ${canAccessFinancials ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              Datos financieros: {canAccessFinancials ? '✅ Permitido' : '❌ Denegado'}
            </div>
            <div className={`p-2 rounded ${canAccessAdminPanel ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              Panel admin: {canAccessAdminPanel ? '✅ Permitido' : '❌ Denegado'}
            </div>
          </div>
        </div>

        {/* Tarjeta 6: Navegación condicional */}
        <div className="bg-white p-6 rounded-lg shadow-md border">
          <h3 className="text-xl font-semibold mb-4 text-teal-600">🧭 Navegación</h3>
          <div className="space-y-2">
            {canAccessRoute(['admin.acceso']) && (
              <Link href="/admin" className="block w-full px-4 py-2 bg-teal-600 text-white rounded hover:bg-teal-700 text-center">
                Panel de Administración
              </Link>
            )}
            {canAccessRoute(['usuarios.gestionar']) && (
              <Link href="/users" className="block w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-center">
                Gestión de Usuarios
              </Link>
            )}
            {canAccessRoute(['reportes.ver']) && (
              <Link href="/reports" className="block w-full px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 text-center">
                Reportes
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Sección de debugging (solo en desarrollo) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-8 bg-gray-100 p-4 rounded-lg">
          <h3 className="text-lg font-semibold mb-2">🐛 Debug - Permisos del Usuario</h3>
          <pre className="text-xs bg-white p-2 rounded overflow-auto">
            {JSON.stringify(getUserPermissions(), null, 2)}
          </pre>
        </div>
      )}
    </div>
  )
}

// Proteger toda la página con permisos mínimos
// Solo usuarios autenticados pueden acceder al dashboard
export default withPermissions(DashboardExample, {
  permissions: [], // Sin permisos específicos, solo autenticación
  requireAll: false,
  redirectTo: '/login'
})

// Alternativa: Si quisieras que solo usuarios con ciertos permisos accedan:
// export default withPermissions(DashboardExample, {
//   permissions: ['dashboard.acceso'],
//   requireAll: false,
//   redirectTo: '/unauthorized'
// })