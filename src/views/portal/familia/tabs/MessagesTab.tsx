'use client'

import Alert from '@mui/material/Alert'
import Avatar from '@mui/material/Avatar'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Typography from '@mui/material/Typography'
import { useEffect, useState } from 'react'

import { ParentAccessService } from '@/services/parentAccessService'

const MessagesTab = ({ studentId }: { studentId: number }) => {
  const [messages, setMessages] = useState<any[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const response = await ParentAccessService.getMessages(studentId)
        const data = response.data || response
        setMessages(Array.isArray(data) ? data : [])
      } catch (err: any) {
        console.error(err)
        setError('Error al cargar mensajes.')
      } finally {
        setLoading(false)
      }
    }
    if (studentId) fetchMessages()
  }, [studentId])

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
        <CircularProgress />
      </Box>
    )
  }

  if (error) return <Alert severity="error">{error}</Alert>

  if (messages.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <i className='ri-mail-open-line' style={{ fontSize: 48, opacity: 0.3 }} />
        <Typography color='text.secondary' sx={{ mt: 2 }}>No hay mensajes recientes</Typography>
      </Box>
    )
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (hours < 1) return 'Hace un momento'
    if (hours < 24) return `Hace ${hours}h`
    if (days < 7) return `Hace ${days}d`
    return date.toLocaleDateString()
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Typography variant='subtitle2' color='text.secondary'>
          {messages.length} mensaje{messages.length !== 1 ? 's' : ''}
        </Typography>
      </Box>

      {messages.map((msg: any, index) => (
        <Card
          key={msg.id}
          variant='outlined'
          sx={{
            overflow: 'hidden',
            borderRadius: 2,
            transition: 'all 0.2s ease',
            cursor: 'pointer',
            '&:hover': {
              borderColor: 'primary.main',
              boxShadow: 1,
              transform: 'translateX(4px)',
            }
          }}
        >
          <Box sx={{ display: 'flex', gap: 3, p: 3, alignItems: 'flex-start' }}>
            <Avatar
              alt={msg.remitente?.name}
              sx={{
                bgcolor: 'primary.main',
                width: 44,
                height: 44,
                fontSize: '1rem',
                flexShrink: 0,
              }}
            >
              {msg.remitente?.name?.charAt(0) || 'S'}
            </Avatar>

            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 1 }}>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant='subtitle2' sx={{ fontWeight: 600, lineHeight: 1.3 }}>
                    {msg.asunto}
                  </Typography>
                  <Typography variant='caption' color='text.secondary'>
                    {msg.remitente?.name || 'Sistema'}
                  </Typography>
                </Box>
                <Chip
                  label={formatDate(msg.created_at)}
                  size='small'
                  variant='outlined'
                  sx={{ flexShrink: 0, fontSize: '0.7rem' }}
                />
              </Box>

              <Typography
                variant='body2'
                color='text.secondary'
                sx={{
                  mt: 1,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                }}
              >
                {msg.contenido}
              </Typography>
            </Box>
          </Box>
        </Card>
      ))}
    </Box>
  )
}

export default MessagesTab
