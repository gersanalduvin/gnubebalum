'use client'

import { useEffect } from 'react'

import { useRouter } from 'next/navigation'

// Autenticación basada en storage

const UnauthorizedPage = () => {
  const router = useRouter()
  const user = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user') || 'null') : null

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
    if (!token) {
      router.push('/login')
    }
  }, [router])

  // No hay estado de carga; se renderiza directamente

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        {/* Icono de acceso denegado */}
        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-6">
          <svg
            className="h-8 w-8 text-red-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
        </div>

        {/* Título */}
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Acceso Denegado
        </h1>

        {/* Código de error */}
        <p className="text-6xl font-bold text-red-500 mb-4">403</p>

        {/* Descripción */}
        <p className="text-gray-600 mb-6">
          No tienes los permisos necesarios para acceder a esta página.
          {user && (
            <span className="block mt-2 text-sm">
              Usuario: <strong>{user?.name}</strong>
            </span>
          )}
        </p>

        {/* Botones de acción */}
        <div className="space-y-3">
          <button
            onClick={() => router.back()}
            className="w-full px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors duration-200"
          >
            ← Volver Atrás
          </button>
          
          <button
            onClick={() => router.push('/home')}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200"
          >
            🏠 Ir al Inicio
          </button>

          <button
            onClick={() => router.push('/profile')}
            className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors duration-200"
          >
            👤 Mi Perfil
          </button>
        </div>

        {/* Información adicional */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            Si crees que esto es un error, contacta al administrador del sistema.
          </p>
        </div>
      </div>
    </div>
  )
}

export default UnauthorizedPage
