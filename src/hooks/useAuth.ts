// Custom hook for authentication with Laravel Sanctum
import { useCallback, useEffect, useState } from 'react'

import { useRouter } from 'next/navigation'

import { authAPI, clearSessionCache } from '@/utils/httpClient'

interface User {
  id: string | number
  email: string
  name?: string
  role?: string
  role_name?: string
  superadmin?: boolean
  role_id?: number
  foto_url?: string | null
  tipo_usuario?: string
}

interface AuthState {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  accessToken: string | null
}

export const useAuth = (): AuthState & {
  login: (credentials: { email: string; password: string }) => Promise<any>
  logout: () => Promise<void>
  refreshSession: () => Promise<void>
  checkAuth: () => Promise<{ authenticated: boolean; user: User | null }>
  makeAuthenticatedRequest: <T = any>(endpoint: string, options?: RequestInit) => Promise<T>
} => {
  const router = useRouter()
  const [authLoading, setAuthLoading] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [initialized, setInitialized] = useState(false)
  const isLoading = !initialized || authLoading
  const isAuthenticated = !!accessToken && !!user

  useEffect(() => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
      const userStr = typeof window !== 'undefined' ? localStorage.getItem('user') : null
      setAccessToken(token)
      setUser(userStr ? JSON.parse(userStr) : null)
    } catch {
      setAccessToken(null)
      setUser(null)
    } finally {
      setInitialized(true)
    }
  }, [])

  // Login function
  const login = useCallback(async (credentials: { email: string; password: string }) => {
    setAuthLoading(true)

    try {
      const response = await authAPI.login(credentials)
      
      // The response is wrapped in { data: ... } format
      if (response.data) {
        // Session will be updated automatically by NextAuth
        return response
      } else {
        throw new Error(response.message || 'Login failed')
      }
    } catch (error) {
      // Remove console.error as per project rules - no logs in production
      throw error
    } finally {
      setAuthLoading(false)
    }
  }, [])

  // Logout function that clears Laravel session
  const logout = useCallback(async () => {
    setAuthLoading(true)

    try {
      // Call Laravel logout endpoint
      await authAPI.logout()
    } catch (error) {
      // Remove console.error as per project rules - no logs in production
    } finally {
      // Clear session cache
      clearSessionCache()

      // Clear token from localStorage
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        localStorage.removeItem('permissions')
      }

      router.push('/login')
      setAuthLoading(false)
    }
  }, [router])

  // Check authentication status
  const checkAuth = useCallback(async () => {
    try {
      return await authAPI.checkAuth()
    } catch (error) {
      // Remove console.error as per project rules - no logs in production
      
return { authenticated: false, user: null }
    }
  }, [])

  // Refresh session data
  const refreshSession = useCallback(async () => {
    // No-op: sesión manejada por localStorage/token
    return
  }, [])

  // Make authenticated requests with automatic token handling
  const makeAuthenticatedRequest = useCallback(async <T = any>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> => {
    try {
      const method = options.method || 'GET'
      
      // Use the httpClient for consistent request handling
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${endpoint}`, {
        ...options,
        method,
        credentials: 'omit',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
          'Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001',
          'Origin': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001',
          ...(accessToken && { 'Authorization': `Bearer ${accessToken}` }),
          ...options.headers
        }
      })

      if (response.status === 401) {
        // Token expired or invalid, logout user
        await logout()
        throw new Error('Session expired')
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Request failed' }))

        throw errorData
      }

      return await response.json()
    } catch (error) {
      // Remove console.error as per project rules - no logs in production
      throw error
    }
  }, [accessToken, logout])

  // Sin auto-refresh: el token se gestiona por backend

  return {
    user,
    isLoading,
    isAuthenticated,
    accessToken,
    login,
    logout,
    refreshSession,
    checkAuth,
    makeAuthenticatedRequest
  }
}

// Hook for protected routes
export const useRequireAuth = (redirectTo: string = '/login') => {
  const { isAuthenticated, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push(redirectTo)
    }
  }, [isAuthenticated, isLoading, router, redirectTo])

  return { isAuthenticated, isLoading }
}
