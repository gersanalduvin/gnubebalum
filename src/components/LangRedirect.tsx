'use client'

// React Imports
import { useEffect } from 'react'

import { useRouter } from 'next/navigation'

// Hook Imports
import { useAuth } from '@/hooks/useAuth'

const LangRedirect = () => {
  const router = useRouter()
  const { user, isLoading } = useAuth()

  useEffect(() => {
    if (!isLoading) {
      if (user) {
        // Usuario autenticado, redirigir al home
        router.replace('/home')
      } else {
        // Usuario no autenticado, redirigir al login
        router.replace('/login')
      }
    }
  }, [user, isLoading, router])

  // Mostrar loading mientras se determina la redirección
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p>Cargando...</p>
      </div>
    </div>
  )
}

export default LangRedirect