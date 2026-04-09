'use client'

// Third-party Imports
import { SessionProvider } from 'next-auth/react'
import type { SessionProviderProps } from 'next-auth/react'

export const NextAuthProvider = ({ children, ...rest }: SessionProviderProps) => {
  return (
    <SessionProvider 
      {...rest}
      refetchInterval={30 * 60} // Reducido de 15 a 30 minutos para menos peticiones
      refetchOnWindowFocus={false} // Ya estaba optimizado
      refetchWhenOffline={false} // Ya estaba optimizado
    >
      {children}
    </SessionProvider>
  )
}
