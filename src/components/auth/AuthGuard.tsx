// Auth Guard component for protecting routes
'use client'

import type { ReactNode } from 'react'
import { useEffect, useState } from 'react'

import { useRouter } from 'next/navigation'

import { CircularProgress } from '@mui/material'

 


interface AuthGuardProps {
  children: ReactNode
  fallback?: ReactNode
  redirectTo?: string
}

const AuthGuard = ({ children, fallback, redirectTo = '/login' }: AuthGuardProps) => {
  const [checking, setChecking] = useState(true)
  const [authenticated, setAuthenticated] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
    if (!token) {
      router.push(redirectTo)
      setAuthenticated(false)
      setChecking(false)
      return
    }
    setAuthenticated(true)
    setChecking(false)
  }, [router, redirectTo])


  if (checking) {
    return (
      fallback || (
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '100vh'
          }}
          suppressHydrationWarning
        >
          <CircularProgress />
        </div>
      )
    )
  }

  if (!authenticated) {
    return null // Will redirect
  }

  return <>{children}</>
}

export default AuthGuard
