'use client'

import { mensajeriaService } from '@/features/mensajeria/services/mensajeriaService'
import { useAuth } from '@/hooks/useAuth'
import { createEcho } from '@/lib/echo'
import { httpClient } from '@/utils/httpClient'
import { usePathname } from 'next/navigation'
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'

interface NotificationsContextType {
  unreadCount: number
  unreadAvisosCount: number
  contadores: any
  refreshContadores: () => Promise<void>
  echo: any
}

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined)

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { user, accessToken } = useAuth()
  const [unreadCount, setUnreadCount] = useState(0)
  const [unreadAvisosCount, setUnreadAvisosCount] = useState(0)
  const [contadores, setContadores] = useState<any>(null)
  const [echo, setEcho] = useState<any>(null)
  const isFetching = useRef(false)
  const pathname = usePathname()
  const pathnameRef = useRef(pathname)

  const fetchContadores = useCallback(async () => {
    // No obtener contadores si no hay usuario, si ya se está obteniendo, o si estamos en login
    if (!user || isFetching.current || pathnameRef.current === '/login') return

    isFetching.current = true
    try {
      const [msgData, avisosReq] = await Promise.all([
        mensajeriaService.getContadores(),
        httpClient
          .get<{ success: boolean; data: { unread_count: number } }>(`/bk/v1/avisos/unread/count?t=${Date.now()}`)
          .catch(() => ({ success: false, data: { unread_count: 0 } }))
      ])

      if (msgData) {
        setUnreadCount(msgData.no_leidos || 0)
        setContadores(msgData)
      }

      if (avisosReq?.data?.unread_count !== undefined) {
        setUnreadAvisosCount(avisosReq.data.unread_count)
      }
    } catch (error: any) {
      // console.error('Error fetching contadores:', error)
    } finally {
      isFetching.current = false
    }
  }, [user?.id, accessToken]) // Removido pathname de las dependencias

  useEffect(() => {
    pathnameRef.current = pathname
    if (user && pathname !== '/login') {
      fetchContadores()
    }
  }, [user?.id, fetchContadores, pathname])

  useEffect(() => {
    if (user && accessToken && !echo) {
      const newEcho = createEcho(accessToken)
      setEcho(newEcho)

      const channel = newEcho.private(`App.Models.User.${user.id}`)

      const onEvent = (type: string) => (e: any) => {
        fetchContadores()
      }

      channel
        .listen('.MensajeEnviado', onEvent('MensajeEnviado'))
        .listen('.MensajeLeido', onEvent('MensajeLeido'))
        .listen('.AvisoCreado', onEvent('AvisoCreado'))
        .listen('.AvisoLeido', onEvent('AvisoLeido'))

      return () => {
        console.log('🔌 Limpiando suscripción Echo...')
        newEcho.leave(`App.Models.User.${user.id}`)
        // No seteamos echo a null aquí para evitar el bucle infinito de re-sincronización
        // La instancia se limpiará cuando el usuario cambie o se desloguee (visto en el dependency array)
      }
    }
  }, [user?.id, accessToken]) // Removido echo y fetchContadores para romper el bucle

  return (
    <NotificationsContext.Provider
      value={{
        unreadCount,
        unreadAvisosCount,
        contadores,
        refreshContadores: fetchContadores,
        echo
      }}
    >
      {children}
    </NotificationsContext.Provider>
  )
}

export function useNotifications() {
  const context = useContext(NotificationsContext)
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationsProvider')
  }
  return context
}
