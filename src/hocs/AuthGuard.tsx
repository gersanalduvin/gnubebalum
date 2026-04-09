'use client'

import { useEffect } from 'react'

// Next Imports
import { useRouter } from 'next/navigation'

// Type Imports
import type { ChildrenType } from '@core/types'

// Hook Imports
import AuthRedirect from '@/components/AuthRedirect'
import { useAuth } from '@/hooks/useAuth'

export default function AuthGuard({ children }: ChildrenType) {
  const { isAuthenticated, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login')
    }
  }, [isLoading, isAuthenticated, router])

  if (isLoading) {
    // Optional: Render a loading spinner here
    return null 
  }

  return <>{isAuthenticated ? children : <AuthRedirect>{null}</AuthRedirect>}</>
}
