'use client'

import React, { memo } from 'react'

import { usePermissions } from '@/hooks/usePermissions'

interface PermissionGuardProps {
  children: React.ReactNode
  permission?: string
  permissions?: string[]
  requireAll?: boolean
  fallback?: React.ReactNode
  showForSuperAdmin?: boolean
}

/**
 * Componente que renderiza contenido basado en permisos del usuario
 * 
 * @param permission - Permiso único requerido
 * @param permissions - Array de permisos (se usa hasAnyPermission por defecto)
 * @param requireAll - Si es true, requiere todos los permisos en el array
 * @param fallback - Componente a mostrar si no tiene permisos
 * @param showForSuperAdmin - Si es true, siempre muestra para superadmin (por defecto true)
 */
export const PermissionGuard: React.FC<PermissionGuardProps> = memo(({
  children,
  permission,
  permissions,
  requireAll = false,
  fallback = null,
  showForSuperAdmin = true
}) => {
  const { 
    hasPermission, 
    hasAnyPermission, 
    hasAllPermissions, 
    isSuperAdmin,
    isLoading,
    isAuthenticated
  } = usePermissions()

  // Mostrar loading o nada mientras se carga la sesión
  if (isLoading) {
    return null
  }

  // Si no está autenticado, mostrar fallback
  if (!isAuthenticated) {
    return <>{fallback}</>
  }

  // Si es superadmin y showForSuperAdmin es true, mostrar siempre
  if (isSuperAdmin && showForSuperAdmin) {
    return <>{children}</>
  }

  // Verificar permiso único
  if (permission) {
    const hasAccess = hasPermission(permission)
    return hasAccess ? <>{children}</> : (fallback || null)
  }

  // Verificar array de permisos
  if (permissions && permissions.length > 0) {
    const hasAccess = requireAll 
      ? hasAllPermissions(permissions)
      : hasAnyPermission(permissions)
    return hasAccess ? <>{children}</> : (fallback || null)
  }

  // Si no se especifican permisos, permitir acceso
  return <>{children}</>
})

/**
 * Hook para usar PermissionGuard de forma condicional
 */
export const usePermissionGuard = () => {
  const permissions = usePermissions()

  const canRender = ({
    permission,
    permissions: perms,
    requireAll = false,
    showForSuperAdmin = true
  }: Omit<PermissionGuardProps, 'children' | 'fallback'>) => {
    if (permissions.isLoading) return false
    if (!permissions.isAuthenticated) return false
    if (permissions.isSuperAdmin && showForSuperAdmin) return true

    if (permission) {
      return permissions.hasPermission(permission)
    }

    if (perms && perms.length > 0) {
      return requireAll 
        ? permissions.hasAllPermissions(perms)
        : permissions.hasAnyPermission(perms)
    }

    
return true
  }

  return { canRender, ...permissions }
}