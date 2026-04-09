'use client'

import React from 'react'

import { useRouter } from 'next/navigation'

import { usePermissions } from '@/hooks/usePermissions'

interface WithPermissionsOptions {
  permissions?: string[]
  requireAll?: boolean
  redirectTo?: string
  fallback?: React.ComponentType
  showForSuperAdmin?: boolean
}

/**
 * HOC que protege componentes basándose en permisos
 */
export function withPermissions<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  options: WithPermissionsOptions = {}
) {
  const {
    permissions = [],
    requireAll = false,
    redirectTo = '/unauthorized',
    fallback: FallbackComponent,
    showForSuperAdmin = true
  } = options

  const WithPermissionsComponent = (props: P) => {
    const router = useRouter()

    const {
      canAccessRoute,
      isSuperAdmin,
      isLoading,
      isAuthenticated
    } = usePermissions()

    // Mostrar loading mientras se verifica la sesión
    if (isLoading) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
        </div>
      )
    }

    // Si no está autenticado, redirigir al login
    if (!isAuthenticated) {
      router.push('/login')
      
return null
    }

    // Si es superadmin y showForSuperAdmin es true, permitir acceso
    if (isSuperAdmin && showForSuperAdmin) {
      return <WrappedComponent {...props} />
    }

    // Verificar permisos
    const hasAccess = canAccessRoute(permissions, requireAll)

    if (!hasAccess) {
      if (FallbackComponent) {
        return <FallbackComponent />
      }
      
      // Redirigir a página de no autorizado
      router.push(redirectTo)
      
return null
    }

    return <WrappedComponent {...props} />
  }

  WithPermissionsComponent.displayName = `withPermissions(${WrappedComponent.displayName || WrappedComponent.name})`

  return WithPermissionsComponent
}

/**
 * Componente de página no autorizada por defecto
 */
export const UnauthorizedPage: React.FC = () => {
  const router = useRouter()

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-400 mb-4">403</h1>
        <h2 className="text-2xl font-semibold text-gray-700 mb-4">
          Acceso Denegado
        </h2>
        <p className="text-gray-600 mb-8">
          No tienes permisos para acceder a esta página.
        </p>
        <div className="space-x-4">
          <button
            onClick={() => router.back()}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
          >
            Volver
          </button>
          <button
            onClick={() => router.push('/home')}
            className="px-4 py-2 bg-primary text-white rounded hover:bg-primary-dark transition-colors"
          >
            Ir al Inicio
          </button>
        </div>
      </div>
    </div>
  )
}