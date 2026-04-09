import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server'

import { getToken } from 'next-auth/jwt'

import { 
  isPublicRoute, 
  isAuthenticatedRoute, 
  getRoutePermissions,
  isProtectedRoute 
} from '@/configs/protectedRoutes'
import type { User } from '@/types/permissions'

// Cache para tokens con TTL
interface TokenCache {
  token: any
  timestamp: number
  ttl: number
}

const tokenCache = new Map<string, TokenCache>()
const CACHE_TTL = 30000 // 30 segundos

/**
 * Obtiene el token desde caché o desde NextAuth
 */
async function getCachedToken(request: NextRequest): Promise<any> {
  // Crear una clave única basada en cookies de sesión
  const sessionToken = request.cookies.get('next-auth.session-token')?.value || 
                      request.cookies.get('__Secure-next-auth.session-token')?.value
  
  if (!sessionToken) {
    return null
  }

  const cacheKey = `token_${sessionToken}`
  const cached = tokenCache.get(cacheKey)
  
  // Verificar si el cache es válido
  if (cached && (Date.now() - cached.timestamp) < cached.ttl) {
    return cached.token
  }

  // Obtener token fresco
  const token = await getToken({ 
    req: request, 
    secret: process.env.NEXTAUTH_SECRET 
  })

  // Guardar en cache
  if (token) {
    tokenCache.set(cacheKey, {
      token,
      timestamp: Date.now(),
      ttl: CACHE_TTL
    })
  }

  // Limpiar cache expirado periódicamente
  if (tokenCache.size > 100) {
    const now = Date.now()

    for (const [key, value] of tokenCache.entries()) {
      if ((now - value.timestamp) > value.ttl) {
        tokenCache.delete(key)
      }
    }
  }

  return token
}

/**
 * Verifica si un usuario tiene un permiso específico
 */
function hasPermission(user: User, permissionName: string): boolean {
  console.log('🔍 Checking permission:', {
    permissionName,
    userSuperadmin: user.superadmin,
    userPermissions: user.permissions?.map(p => p.name) || [],
    rolePermissions: user.role?.permissions?.map(p => p.name) || []
  })

  // Si es superadmin, tiene todos los permisos
  if (user.superadmin) {
    console.log('✅ User is superadmin, granting access')
    
return true
  }

  // Verificar permisos directos del usuario
  if (user.permissions && user.permissions.some(permission => permission.name === permissionName)) {
    console.log('✅ User has direct permission')
    
return true
  }

  // Verificar permisos del rol
  if (user.role && user.role.permissions && user.role.permissions.some(permission => permission.name === permissionName)) {
    console.log('✅ User has permission through role')
    
return true
  }

  console.log('❌ User does not have permission')
  
return false
}

/**
 * Verifica si un usuario tiene al menos uno de los permisos especificados
 */
function hasAnyPermission(user: User, permissions: string[]): boolean {
  if (user.superadmin) return true
  
return permissions.some(permission => hasPermission(user, permission))
}

/**
 * Verifica si un usuario tiene todos los permisos especificados
 */
function hasAllPermissions(user: User, permissions: string[]): boolean {
  if (user.superadmin) return true
  
return permissions.every(permission => hasPermission(user, permission))
}

/**
 * Middleware para validar permisos en las rutas
 */
export async function validatePermissions(
  request: NextRequest
): Promise<NextResponse | null> {
  const pathname = request.nextUrl.pathname
  
  // Remover el prefijo de idioma si existe
  const cleanPathname = pathname.replace(/^\/[a-z]{2}(?=\/|$)/, '') || '/'
  
  console.log('🔍 Validating permissions for:', cleanPathname)
  
  // Si es una ruta pública, permitir acceso
  if (isPublicRoute(cleanPathname)) {
    console.log('✅ Public route, allowing access')
    return null // Continuar con el siguiente middleware
  }

  try {
    // Obtener token de la sesión
    const token = await getCachedToken(request)
    
    if (!token) {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('callbackUrl', pathname)
      return NextResponse.redirect(loginUrl)
    }

    const user = token as unknown as User
    console.log('👤 User info:', { 
      id: user.id, 
      email: user.email, 
      superadmin: user.superadmin,
      permissions: user.permissions?.length || 0
    })

    // Si es una ruta que solo requiere autenticación, permitir acceso
    if (isAuthenticatedRoute(cleanPathname)) {
      console.log('✅ Authenticated route, allowing access')
      return null // Continuar
    }

    // Si es una ruta protegida, verificar permisos
    if (isProtectedRoute(cleanPathname)) {
      const routePermissions = getRoutePermissions(cleanPathname)
      
      console.log('🛡️ Protected route, checking permissions:', routePermissions)
      
      if (routePermissions) {
        const { permissions, requireAll } = routePermissions
        
        let hasAccess = false
        
        if (requireAll) {
          hasAccess = hasAllPermissions(user, permissions)
        } else {
          hasAccess = hasAnyPermission(user, permissions)
        }
        
        console.log('🔐 Permission check result:', {
          hasAccess,
          userSuperadmin: user.superadmin,
          requiredPermissions: permissions,
          requireAll
        })
        
        if (!hasAccess) {
          console.log('❌ Access denied, redirecting to unauthorized')

          // Redirigir a página de acceso denegado
          const unauthorizedUrl = new URL('/unauthorized', request.url)
          return NextResponse.redirect(unauthorizedUrl)
        }
      }
    }

    console.log('✅ Access granted')
    return null // Continuar con el siguiente middleware
  } catch (error) {
    console.error('💥 Error en validación de permisos:', error)
    
    // En caso de error, redirigir al login por seguridad
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(loginUrl)
  }
}

/**
 * Función helper para verificar permisos en el lado del servidor
 */
export async function checkServerPermissions(
  request: NextRequest,
  requiredPermissions: string[],
  requireAll = false
): Promise<{ hasAccess: boolean; user: User | null }> {
  try {
    const token = await getCachedToken(request)

    if (!token) {
      return { hasAccess: false, user: null }
    }

    const user = token as unknown as User
    
    let hasAccess = false
    
    if (requireAll) {
      hasAccess = hasAllPermissions(user, requiredPermissions)
    } else {
      hasAccess = hasAnyPermission(user, requiredPermissions)
    }

    return { hasAccess, user }
  } catch (error) {
    console.error('Error verificando permisos del servidor:', error)
    
return { hasAccess: false, user: null }
  }
}