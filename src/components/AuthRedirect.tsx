'use client'

// Next Imports
import { redirect, usePathname } from 'next/navigation'

// Type Imports
import type { ChildrenType } from '@core/types'

const AuthRedirect = ({ children }: ChildrenType) => {
  // Hooks
  const pathname = usePathname()

  // Si ya estamos en login, no redirigir para evitar bucle infinito
  if (pathname === '/login') {
    return <>{children}</>
  }

  // Solo redirigir a login si no estamos ya ahí
  redirect('/login')

  return <>{children}</>
}

export default AuthRedirect
