'use client'

import React from 'react'

import { usePermissions } from '@/hooks/usePermissions'

/**
 * Componente de debug para mostrar los permisos del usuario actual
 * Solo debe usarse en desarrollo para diagnosticar problemas de permisos
 */
export const PermissionsDebug: React.FC = () => {
  const { 
    user, 
    isLoading, 
    isAuthenticated, 
    isSuperAdmin, 
    getUserPermissions,
    hasPermission
  } = usePermissions()

  if (isLoading) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 m-4">
        <h3 className="text-lg font-semibold text-yellow-800 mb-2">🔄 Cargando permisos...</h3>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 m-4">
        <h3 className="text-lg font-semibold text-red-800 mb-2">❌ Usuario no autenticado</h3>
      </div>
    )
  }

  const allPermissions = getUserPermissions()
  const configPermissions = allPermissions.filter(p => p.startsWith('config_'))

  // Verificar permisos específicos de configuración académica
  const specificPermissions = [
    'config_secciones.index',
    'config_modalidades.index', 
    'config_turnos.index',
    'config_grupos.index'
  ]

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 m-4 max-w-4xl">
      <h3 className="text-lg font-semibold text-blue-800 mb-4">🔍 Debug de Permisos</h3>
      
      {/* Información del usuario */}
      <div className="mb-4">
        <h4 className="font-semibold text-gray-700 mb-2">👤 Usuario:</h4>
        <div className="bg-white p-3 rounded border text-sm">
          <p><strong>ID:</strong> {user?.id}</p>
          <p><strong>Email:</strong> {user?.email}</p>
          <p><strong>Nombre:</strong> {user?.name}</p>
          <p><strong>Superadmin:</strong> {isSuperAdmin ? '✅ Sí' : '❌ No'}</p>
          <p><strong>Rol:</strong> {user?.role?.name || 'Sin rol'}</p>
        </div>
      </div>

      {/* Permisos de configuración */}
      <div className="mb-4">
        <h4 className="font-semibold text-gray-700 mb-2">⚙️ Permisos de Configuración Académica:</h4>
        <div className="bg-white p-3 rounded border">
          {specificPermissions.map(permission => (
            <div key={permission} className="flex items-center justify-between py-1">
              <span className="text-sm font-mono">{permission}</span>
              <span className={`text-sm font-semibold ${hasPermission(permission) ? 'text-green-600' : 'text-red-600'}`}>
                {hasPermission(permission) ? '✅ Permitido' : '❌ Denegado'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Todos los permisos de configuración */}
      <div className="mb-4">
        <h4 className="font-semibold text-gray-700 mb-2">📋 Todos los permisos de configuración ({configPermissions.length}):</h4>
        <div className="bg-white p-3 rounded border max-h-40 overflow-y-auto">
          {configPermissions.length > 0 ? (
            <ul className="text-sm font-mono space-y-1">
              {configPermissions.map(permission => (
                <li key={permission} className="text-green-600">✅ {permission}</li>
              ))}
            </ul>
          ) : (
            <p className="text-red-600 text-sm">❌ No tiene permisos de configuración</p>
          )}
        </div>
      </div>

      {/* Todos los permisos */}
      <div>
        <h4 className="font-semibold text-gray-700 mb-2">🔐 Todos los permisos ({allPermissions.length}):</h4>
        <div className="bg-white p-3 rounded border max-h-60 overflow-y-auto">
          {allPermissions.length > 0 ? (
            <div className="grid grid-cols-2 gap-2 text-sm font-mono">
              {allPermissions.map(permission => (
                <div key={permission} className="text-green-600">✅ {permission}</div>
              ))}
            </div>
          ) : (
            <p className="text-red-600 text-sm">❌ No tiene permisos asignados</p>
          )}
        </div>
      </div>
    </div>
  )
}