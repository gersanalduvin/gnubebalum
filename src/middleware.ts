// Next.js Middleware for Laravel Sanctum integration, i18n routing and permissions
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { validatePermissions } from '@/utils/permissionMiddleware'
import { i18n } from '@configs/i18n'

function getLocale(request: NextRequest): string {
  // Check if there is any supported locale in the pathname

  const pathname = request.nextUrl.pathname

  const pathnameIsMissingLocale = i18n.locales.every(
    (locale) => !pathname.startsWith(`/${locale}/`) && pathname !== `/${locale}`
  )

  // Redirect if there is no locale
  if (pathnameIsMissingLocale) {
    return i18n.defaultLocale
  }

  // Return the locale from the pathname
  const locale = i18n.locales.find(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  )

  return locale || i18n.defaultLocale
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  const searchParams = request.nextUrl.searchParams

  // Skip IDE webview requests and Vite client requests
  if (searchParams.has('ide_webview_request_time') || pathname.startsWith('/@vite')) {
    return NextResponse.next()
  }

  // Skip NextAuth routes to prevent i18n redirection issues
  if (pathname.startsWith('/api/auth/')) {
    return NextResponse.next()
  }

  // Skip permission validation for authentication APIs, proxy endpoints, and public routes
  const skipPermissionRoutes = [
    '/api/login',
    '/api/auth/',
    '/api/permissions/',
    '/login',
    '/home',
    '/unauthorized',
    '/favicon.ico',
    '/_next/',
    '/static/'
  ]
  
  const shouldSkipPermissions = skipPermissionRoutes.some(route => 
    pathname === route || pathname.startsWith(route)
  )
  
  if (shouldSkipPermissions) {
    return NextResponse.next()
  }

  // Validar permisos solo para rutas protegidas
  const permissionResponse = await validatePermissions(request)

  if (permissionResponse) {
    return permissionResponse
  }

  // Handle i18n routing for non-API routes (but skip IDE requests, root page, and auth routes)
  // Skip middleware for specific routes that should not have locale prefixes

  const skipLocaleRoutes = ['/api/', '/login', '/home', '/', '/favicon.ico', '/reportes/']

  const shouldSkipLocale = skipLocaleRoutes.some(route => 
    pathname === route || pathname.startsWith(route)
  )

  if (!shouldSkipLocale && !searchParams.has('ide_webview_request_time') && !pathname.startsWith('/api/auth/')) {
    const pathnameIsMissingLocale = i18n.locales.every(
      (locale) => !pathname.startsWith(`/${locale}/`) && pathname !== `/${locale}`
    )

    // Redirect if there is no locale
    if (pathnameIsMissingLocale) {
      const locale = getLocale(request)

      return NextResponse.redirect(
        new URL(`/${locale}${pathname.startsWith('/') ? '' : '/'}${pathname}`, request.url)
      )
    }
  }

  const response = NextResponse.next()

  // Add CORS headers for Laravel Sanctum (only for API routes)
  if (pathname.startsWith('/api/')) {
    response.headers.set('Access-Control-Allow-Credentials', 'true')

    // Extraer solo la URL base del NEXT_PUBLIC_API_URL (sin /bk o /api)
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081/bk'
    const baseUrl = apiUrl.replace('/bk', '').replace('/api', '')

    response.headers.set('Access-Control-Allow-Origin', baseUrl)
    response.headers.set('Access-Control-Allow-Methods', 'GET,DELETE,PATCH,POST,PUT')
    response.headers.set(
      'Access-Control-Allow-Headers',
      'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
    )

    // Handle preflight requests
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 200, headers: response.headers })
    }
  }

  return response
}


// Configure which paths the middleware should run on
export const config = {
  matcher: [

    // Skip all internal paths (_next), static files, and IDE/Vite requests
    '/((?!_next|favicon.ico|.*\.|@vite).*)',

    // Always run for API routes
    '/api/:path*',
  ],
}
