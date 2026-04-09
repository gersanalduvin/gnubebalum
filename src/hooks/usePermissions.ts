'use client'

import { useCallback, useMemo, useEffect, useState } from 'react'
import type { User } from '@/types/permissions'

export const usePermissions = () => {
  const [user, setUser] = useState<User | null>(null)
  const [status, setStatus] = useState<'loading' | 'authenticated' | 'unauthenticated'>('loading')
  const [permissionsFromStorage, setPermissionsFromStorage] = useState<string[]>([])

  useEffect(() => {
    try {
      const userStr = typeof window !== 'undefined' ? localStorage.getItem('user') : null
      const permsStr = typeof window !== 'undefined' ? localStorage.getItem('permissions') : null
      setUser(userStr ? JSON.parse(userStr) : null)
      setPermissionsFromStorage(permsStr ? JSON.parse(permsStr) : [])
      setStatus(userStr ? 'authenticated' : 'unauthenticated')
    } catch {
      setUser(null)
      setPermissionsFromStorage([])
      setStatus('unauthenticated')
    }
  }, [])

  const hasPermission = useCallback((permission: string): boolean => {
    if (!user && permissionsFromStorage.length === 0) return false

    // Si es superadmin, tiene acceso a todo
    if (user && (user as any).superadmin) return true
    if (permissionsFromStorage.includes('todos')) return true

    // Verificar permisos específicos del usuario
    const userPermissions = (user as any)?.permissions || []
    const userPermissionNames: string[] = userPermissions.map((p: any) => (typeof p === 'string' ? p : p?.name)).filter(Boolean)
    if (userPermissionNames.includes(permission)) return true

    // Verificar permisos del rol
    const rolePermissions = user?.role?.permissions || []
    const rolePermissionNames: string[] = rolePermissions.map((p: any) => (typeof p === 'string' ? p : p?.name)).filter(Boolean)
    if (rolePermissionNames.includes(permission)) return true

    // Verificar permisos desde storage (array de strings)
    return permissionsFromStorage.includes(permission)
  }, [user, permissionsFromStorage])

  /**
   * Verifica si el usuario tiene al menos uno de los permisos especificados
   */
  const hasAnyPermission = useCallback((permissions: string[]): boolean => {
    if (status === 'loading') return false
    if (!user && permissionsFromStorage.length === 0) return false

    // Si es superadmin, tiene acceso a todo
    if (user && (user as any).superadmin) return true

    return permissions.some(permission => hasPermission(permission))
  }, [status, user, hasPermission, permissionsFromStorage])

  /**
   * Verifica si el usuario tiene todos los permisos especificados
   */
  const hasAllPermissions = useCallback((permissions: string[]): boolean => {
    if (status === 'loading') return false
    if (!user && permissionsFromStorage.length === 0) return false

    // Si es superadmin, tiene acceso a todo
    if (user && (user as any).superadmin) return true

    return permissions.every(permission => hasPermission(permission))
  }, [status, user, hasPermission, permissionsFromStorage])

  /**
   * Verifica si el usuario puede acceder a una ruta específica
   */
  const canAccessRoute = useCallback((routePermissions: string[], requireAll = false): boolean => {
    if (status === 'loading') return false
    if (!user && permissionsFromStorage.length === 0) return false

    // Si es superadmin, tiene acceso a todo
    if (user && (user as any).superadmin) return true

    if (routePermissions.length === 0) return true

    return requireAll 
      ? hasAllPermissions(routePermissions)
      : hasAnyPermission(routePermissions)
  }, [status, user, hasAllPermissions, hasAnyPermission, permissionsFromStorage])

  /**
   * Obtiene todos los permisos del usuario
   */
  const getUserPermissions = useCallback((): string[] => {
    if (!user) return []

    const permissions: string[] = []

    // Agregar permisos directos del usuario
    if ((user as any)?.permissions) {
      permissions.push(...((user as any).permissions).map((p: any) => (typeof p === 'string' ? p : p?.name)))
    }

    // Agregar permisos del rol
    if (user?.role?.permissions) {
      permissions.push(...(user.role.permissions as any[]).map((p: any) => (typeof p === 'string' ? p : p?.name)))
    }

    // Eliminar duplicados
    return [...new Set(permissions)]
  }, [user])

  return useMemo(() => ({
    user,
    isLoading: status === 'loading',
    isAuthenticated: !!user,
    isSuperAdmin: user?.superadmin || false,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    canAccessRoute,
    getUserPermissions
  }), [user, status, hasPermission, hasAnyPermission, hasAllPermissions, canAccessRoute, getUserPermissions])
}
