'use client'

// React Imports
import { useSafeLocalStorage, useSafeSystemPreference } from '@/hooks/useSafeClient'

// Component Imports
import Login from '@views/Login'

// Type Imports
import type { Mode } from '@core/types'

const LoginPage = () => {
  // Safe hooks for client-side data
  const [savedMode] = useSafeLocalStorage<Mode>('mode', 'light')
  const systemPreference = useSafeSystemPreference()
  
  // Determine mode with fallback chain
  const getMode = (): Mode => {
    if (savedMode && (savedMode === 'light' || savedMode === 'dark' || savedMode === 'system')) {
      return savedMode
    }

    return systemPreference || 'light'
  }

  return <Login />
}

export default LoginPage