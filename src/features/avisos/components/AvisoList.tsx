'use client'

import { useAuth } from '@/hooks/useAuth'
import {
  Close as IconCancel,
  Delete as IconDelete,
  Download as IconDownload,
  Edit as IconEdit,
  Link as IconLink,
  Visibility as IconRead,
  CheckCircle as IconReadDone,
  AccessTime as IconTime
} from '@mui/icons-material'
import {
  Avatar,
  Box,
  Card,
  CardContent,
  CardHeader,
  Chip,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Link,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Skeleton,
  Stack,
  Typography
} from '@mui/material'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import { useCallback, useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { deleteAviso, getAvisos, getAvisoStatistics, markAvisoAsRead, type Aviso } from '../services/avisoService'

interface AvisoListProps {
  type: 'recientes' | 'enviados'
  onEdit?: (aviso: Aviso) => void
}

export default function AvisoList({ type, onEdit }: AvisoListProps) {
  const [avisos, setAvisos] = useState<Aviso[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { user: currentUser, isLoading: authLoading } = useAuth()

  const [statsDialogOpen, setStatsDialogOpen] = useState(false)
  const [statsData, setStatsData] = useState<any[]>([])
  const [isLoadingStats, setIsLoadingStats] = useState(false)

  const handleOpenStats = async (id: number) => {
    setStatsDialogOpen(true)
    setIsLoadingStats(true)
    try {
      const data = await getAvisoStatistics(id)
      setStatsData(data)
    } catch (error) {
      toast.error('Error al cargar estadísticas')
    } finally {
      setIsLoadingStats(false)
    }
  }

  const fetchAvisos = useCallback(async () => {
    if (authLoading) return // Wait for auth to be fully loaded

    setIsLoading(true)
    try {
      let data = await getAvisos()
      if (type === 'enviados' && currentUser?.id) {
        data = data.filter((a: Aviso) => a.user_id === currentUser.id)
      }
      setAvisos(data)
    } catch (error) {
      console.error('Error fetching avisos:', error)
      toast.error('No se pudieron cargar los avisos')
    } finally {
      setIsLoading(false)
    }
  }, [type, currentUser?.id, authLoading])

  useEffect(() => {
    if (!authLoading) {
      fetchAvisos()
    }
  }, [fetchAvisos, authLoading])

  const handleDelete = async (id: number) => {
    if (!window.confirm('¿Está seguro de eliminar este aviso?')) return
    try {
      await deleteAviso(id)
      toast.success('Aviso eliminado')
      fetchAvisos()
    } catch (error) {
      toast.error('No se pudo eliminar el aviso')
    }
  }

  const handleMarkAsRead = async (id: number) => {
    try {
      await markAvisoAsRead(id)
      setAvisos(prev => prev.map(a => (a.id === id ? { ...a, leido_por_mi: true } : a)))
      // Opcional: toast silencioso o ningún toast para no ser intrusivo
      // toast.success('Aviso marcado como leído')
    } catch (error) {
      toast.error('Error al marcar como leído')
    }
  }

  if (isLoading) {
    return (
      <Stack spacing={3} sx={{ p: { xs: 2, md: 3 } }}>
        {[1, 2, 3].map(i => (
          <Skeleton key={i} variant='rectangular' height={180} sx={{ borderRadius: 3 }} />
        ))}
      </Stack>
    )
  }

  if (avisos.length === 0) {
    return (
      <Box sx={{ p: 8, textAlign: 'center' }}>
        <Typography color='text.secondary' variant='h6' sx={{ fontWeight: 400 }}>
          No hay avisos para mostrar en esta sección
        </Typography>
      </Box>
    )
  }

  return (
    <Stack spacing={3} sx={{ p: { xs: 2, md: 3 } }}>
      {avisos.map(aviso => (
        <Card
          key={aviso.id}
          elevation={0}
          sx={{
            borderRadius: 3,
            border: '1px solid',
            borderColor: 'divider',
            transition: 'all 0.2s ease-in-out',
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: '0 8px 24px -4px rgba(0,0,0,0.08)',
              borderColor: 'primary.light'
            }
          }}
        >
          <CardHeader
            sx={{ pb: 1 }}
            avatar={
              <Avatar
                sx={{
                  bgcolor: 'primary.light',
                  color: 'primary.dark',
                  width: 48,
                  height: 48,
                  fontWeight: 600
                }}
              >
                {aviso.user?.primer_nombre?.[0] || 'A'}
              </Avatar>
            }
            title={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
                <Typography variant='h6' sx={{ fontWeight: 700, fontSize: '1.1rem', color: 'text.primary' }}>
                  {aviso.titulo}
                </Typography>
              </Box>
            }
            subheader={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant='body2' sx={{ fontWeight: 500, color: 'text.secondary' }}>
                  {aviso.user?.nombre_completo || 'Administración'}
                </Typography>
                <Box sx={{ width: 4, height: 4, borderRadius: '50%', bgcolor: 'divider' }} />
                <Typography
                  variant='caption'
                  color='text.disabled'
                  sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
                >
                  <IconTime sx={{ fontSize: 14 }} />
                  {aviso.created_at && formatDistanceToNow(new Date(aviso.created_at), { addSuffix: true, locale: es })}
                </Typography>
              </Box>
            }
            action={
              ((currentUser as any)?.roles?.some((r: any) => r.name === 'SuperAdmin') ||
                ['administrativo', 'superuser'].includes((currentUser as any)?.tipo_usuario || '') ||
                currentUser?.id === aviso.user_id) && (
                <Stack direction='row'>
                  {currentUser?.id === aviso.user_id && (
                    <IconButton
                      size='small'
                      color='info'
                      onClick={() => aviso.id && handleOpenStats(aviso.id)}
                      sx={{ opacity: 0.7, '&:hover': { opacity: 1 } }}
                      title='Ver Estadísticas'
                    >
                      <IconRead fontSize='small' />
                    </IconButton>
                  )}
                  {onEdit && (
                    <IconButton
                      size='small'
                      color='primary'
                      onClick={() => onEdit(aviso)}
                      sx={{ opacity: 0.7, '&:hover': { opacity: 1 } }}
                      title='Editar'
                    >
                      <IconEdit fontSize='small' />
                    </IconButton>
                  )}
                  <IconButton
                    size='small'
                    color='error'
                    onClick={() => aviso.id && handleDelete(aviso.id)}
                    sx={{ opacity: 0.7, '&:hover': { opacity: 1 } }}
                    title='Eliminar'
                  >
                    <IconDelete fontSize='small' />
                  </IconButton>
                </Stack>
              )
            }
          />
          <CardContent sx={{ pt: 1, pb: '16px !important' }}>
            <Box sx={{ mb: 2, ml: { xs: 0, sm: 7.5 } }}>
              <Typography
                variant='body1'
                sx={{ whiteSpace: 'pre-wrap', color: 'text.secondary', lineHeight: 1.6, fontSize: '0.95rem' }}
              >
                {aviso.contenido}
              </Typography>
            </Box>

            {/* Enlaces JSON */}
            {aviso.links && aviso.links.length > 0 && (
              <Box sx={{ mt: 2, ml: { xs: 0, sm: 7.5 }, display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
                {aviso.links.map((link: any, idx: number) => (
                  <Link
                    key={idx}
                    href={link.url}
                    target='_blank'
                    rel='noopener noreferrer'
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 0.5,
                      textDecoration: 'none',
                      typography: 'body2',
                      fontWeight: 600,
                      color: 'primary.main',
                      p: 0.75,
                      px: 1.5,
                      borderRadius: 2,
                      bgcolor: 'primary.lighter',
                      '&:hover': { bgcolor: 'primary.light', color: 'primary.dark' }
                    }}
                  >
                    <IconLink sx={{ fontSize: 18 }} />
                    {link.label || 'Ver enlace'}
                  </Link>
                ))}
              </Box>
            )}

            {/* Adjuntos JSON */}
            {aviso.adjuntos && aviso.adjuntos.length > 0 && (
              <Box sx={{ mt: 3, pt: 2, borderTop: '1px dashed', borderColor: 'divider', ml: { xs: 0, sm: 7.5 } }}>
                <Typography
                  variant='caption'
                  color='text.disabled'
                  sx={{ display: 'block', mb: 1.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}
                >
                  Documentos Adjuntos
                </Typography>
                <Stack direction='row' spacing={1.5} flexWrap='wrap'>
                  {aviso.adjuntos.map((adj: any, idx: number) => (
                    <Chip
                      key={idx}
                      label={adj.nombre || adj.nombre_original}
                      component='a'
                      href={adj.url}
                      target='_blank'
                      clickable
                      icon={<IconDownload sx={{ fontSize: '16px !important', color: 'inherit' }} />}
                      size='small'
                      variant='outlined'
                      sx={{
                        mb: 1,
                        borderRadius: 2,
                        fontWeight: 500,
                        borderColor: 'divider',
                        bgcolor: 'background.paper',
                        transition: 'all 0.2s',
                        '&:hover': { borderColor: 'primary.main', color: 'primary.main', bgcolor: 'primary.lighter' }
                      }}
                    />
                  ))}
                </Stack>
              </Box>
            )}
            {/* Badge de "Leído" que se mantiene visible pero discreto (oculto para el autor) */}
            {aviso.leido_por_mi && currentUser?.id !== aviso.user_id && (
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3, ml: { xs: 0, sm: 7.5 } }}>
                <Chip
                  size='small'
                  icon={<IconReadDone sx={{ fontSize: '16px !important' }} />}
                  label='Leído'
                  color='success'
                  variant='outlined'
                  sx={{ fontWeight: 500 }}
                />
              </Box>
            )}
          </CardContent>

          {/* Observer Element para Auto-lectura (no se activa si soy el autor) */}
          {!aviso.leido_por_mi && currentUser?.id !== aviso.user_id && (
            <Box
              sx={{ height: '1px', width: '100%' }}
              ref={(node: HTMLElement | null) => {
                if (node) {
                  const observer = new IntersectionObserver(
                    entries => {
                      if (entries[0].isIntersecting) {
                        aviso.id && handleMarkAsRead(aviso.id)
                        observer.disconnect()
                      }
                    },
                    { threshold: 1.0 }
                  )
                  observer.observe(node)
                }
              }}
            />
          )}
        </Card>
      ))}

      {/* Statistics Dialog */}
      <Dialog open={statsDialogOpen} onClose={() => setStatsDialogOpen(false)} maxWidth='sm' fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography component='div' variant='h6' sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <IconRead sx={{ color: 'primary.main' }} /> Estadísticas de Lectura
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {statsData.length > 0 && (
              <Chip
                label={`${statsData.length} leídos`}
                size='small'
                color='primary'
                variant='outlined'
                sx={{ fontWeight: 'bold' }}
              />
            )}
            <IconButton onClick={() => setStatsDialogOpen(false)}>
              <IconCancel />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {isLoadingStats ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <Typography>Cargando estadísticas...</Typography>
            </Box>
          ) : statsData.length === 0 ? (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <Typography color='text.secondary'>Aún no hay visualizaciones registradas.</Typography>
            </Box>
          ) : (
            <List>
              {statsData.map((stat: any) => (
                <ListItem key={stat.id} sx={{ px: 0, borderBottom: '1px solid', borderColor: 'divider' }}>
                  <ListItemAvatar>
                    <Avatar
                      sx={{
                        width: 32,
                        height: 32,
                        bgcolor: 'primary.lighter',
                        color: 'primary.main',
                        fontSize: '0.9rem'
                      }}
                    >
                      {stat.primer_nombre?.[0] || 'U'}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    secondaryTypographyProps={{ component: 'div' }}
                    primary={`${stat.primer_nombre || ''} ${stat.primer_apellido || ''}`}
                    secondary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5, color: 'text.secondary' }}>
                        <IconTime sx={{ fontSize: 14 }} />
                        <Typography variant='caption' component='span'>
                          Leído {formatDistanceToNow(new Date(stat.read_at), { addSuffix: true, locale: es })}
                        </Typography>
                      </Box>
                    }
                  />
                </ListItem>
              ))}
            </List>
          )}
        </DialogContent>
      </Dialog>
    </Stack>
  )
}
