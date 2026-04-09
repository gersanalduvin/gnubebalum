'use client';

import { useNotifications } from '@/contexts/NotificationsContext';
import { Chip } from '@mui/material';

export default function MensajeriaBadge() {
  const { unreadCount } = useNotifications();

  if (unreadCount === 0) return null;

  return (
    <Chip 
      label={unreadCount} 
      color="error" 
      size="small" 
    />
  );
}
