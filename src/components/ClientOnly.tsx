'use client'

import type { ReactNode } from 'react'

import { useSafeClient } from '@/hooks/useSafeClient'

interface ClientOnlyProps {
  children: ReactNode
  fallback?: ReactNode
}

/**
 * Componente que renderiza sus hijos solo en el cliente,
 * evitando warnings de hidratación para código específico del navegador
 */
const ClientOnly = ({ children, fallback = null }: ClientOnlyProps) => {
  const isClient = useSafeClient()

  if (!isClient) {
    return <>{fallback}</>
  }

  return <>{children}</>
}

export default ClientOnly