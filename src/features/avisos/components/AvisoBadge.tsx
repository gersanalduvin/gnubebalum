'use client'

import { useNotifications } from '@/contexts/NotificationsContext'
import { Chip } from '@mui/material'

export default function AvisoBadge() {
  const { unreadAvisosCount } = useNotifications() as any // We'll add this to context

  if (!unreadAvisosCount || unreadAvisosCount === 0) return null

  return <Chip label={unreadAvisosCount} color='error' size='small' />
}
