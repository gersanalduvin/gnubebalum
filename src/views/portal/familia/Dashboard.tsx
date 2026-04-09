'use client'

// React Imports
import { useEffect, useState } from 'react'

// Next Imports
import Link from 'next/link'
import { useParams } from 'next/navigation'

// MUI Imports
import Alert from '@mui/material/Alert'
import Avatar from '@mui/material/Avatar'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Divider from '@mui/material/Divider'
import Grid from '@mui/material/Grid'
import { useTheme } from '@mui/material/styles'
import Typography from '@mui/material/Typography'

// Service Imports
import { DashboardData, ParentAccessService } from '@/services/parentAccessService'

// Config Imports
import { i18n } from '@/configs/i18n'

const Dashboard = () => {
  const theme = useTheme()
  const params = useParams()
  const locale = (params?.lang as string) || i18n.defaultLocale
  const lang = i18n.locales.includes(locale as any) ? locale : i18n.defaultLocale

  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const dashboardData = await ParentAccessService.getDashboard()
        setData(dashboardData)
      } catch (err: any) {
        console.error(err)
        setError('Error al cargar la información del dashboard.')
      } finally {
        setLoading(false)
      }
    }
    fetchDashboard()
  }, [])

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress size={60} thickness={4} />
      </Box>
    )
  }

  if (error)
    return (
      <Alert severity='error' sx={{ mb: 4 }}>
        {error}
      </Alert>
    )
  if (!data) return <Alert severity='warning'>No se encontró información del dashboard.</Alert>

  const { estudiantes, resumen, actividad } = data

  return (
    <Grid container spacing={6}>
      {/* Page Header */}
      <Grid item xs={12}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 4 }}>
          <Box>
            <Typography variant='h4' sx={{ fontWeight: 800, color: 'text.primary', mb: 1 }}>
              <i className='ri-parent-fill' style={{ marginRight: 12, color: theme.palette.primary.main }} />
              Dashboard Familiar
            </Typography>
            <Typography variant='body1' color='text.secondary'>
              Bienvenido al portal familiar. Aquí tienes un resumen del estado académico de tus hijos.
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant='outlined'
              component={Link}
              href='/agenda'
              startIcon={<i className='ri-calendar-todo-line' />}
            >
              Agenda
            </Button>
            <Button
              variant='contained'
              component={Link}
              href='/avisos'
              startIcon={<i className='ri-notification-3-line' />}
            >
              Comunicados
            </Button>
          </Box>
        </Box>
      </Grid>

      {/* Summary Statistics */}
      <Grid item xs={12} sm={6} md={3}>
        <SummaryCard
          title='Hijos'
          value={estudiantes.length}
          icon='ri-group-line'
          color='primary'
          subtitle='Registrados'
        />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <SummaryCard
          title='Avisos'
          value={resumen.avisos_pendientes}
          icon='ri-mail-unread-line'
          color='info'
          subtitle='Pendientes'
        />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <SummaryCard
          title='Eventos'
          value={resumen.eventos_hoy}
          icon='ri-calendar-event-line'
          color='warning'
          subtitle='Para hoy'
        />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <SummaryCard
          title='Deuda Total'
          value={`C$ ${resumen.total_pagos_vencidos.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          icon='ri-money-dollar-circle-line'
          color='error'
          subtitle='Pagos vencidos'
        />
      </Grid>

      {/* Students List Section */}
      <Grid item xs={12} md={8}>
        <Typography variant='h5' sx={{ mb: 4, fontWeight: 700 }}>
          Mis Estudiantes
        </Typography>
        {estudiantes.length === 0 ? (
          <Card sx={{ textAlign: 'center', py: 10 }}>
            <i
              className='ri-emotion-sad-line'
              style={{ fontSize: 64, opacity: 0.3, color: theme.palette.text.secondary }}
            />
            <Typography variant='h5' sx={{ mt: 2, fontWeight: 600 }}>
              No hay estudiantes asociados
            </Typography>
          </Card>
        ) : (
          <Grid container spacing={6}>
            {estudiantes.map(child => (
              <Grid item xs={12} sm={6} key={child.id}>
                <StudentCard child={child} lang={lang} />
              </Grid>
            ))}
          </Grid>
        )}
      </Grid>

      {/* Recent Activity Section */}
      <Grid item xs={12} md={4}>
        <Typography variant='h5' sx={{ mb: 4, fontWeight: 700 }}>
          Actividad Reciente
        </Typography>
        <Card sx={{ borderRadius: 3, boxShadow: theme.shadows[2] }}>
          <CardContent sx={{ p: 0 }}>
            {actividad.length === 0 ? (
              <Box sx={{ p: 6, textAlign: 'center' }}>
                <Typography color='text.secondary'>No hay actividad reciente</Typography>
              </Box>
            ) : (
              <Box sx={{ py: 2 }}>
                {actividad.map((item, index) => (
                  <Box key={item.id}>
                    <ActivityItem item={item} />
                    {index < actividad.length - 1 && <Divider sx={{ mx: 4 }} />}
                  </Box>
                ))}
              </Box>
            )}
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  )
}

// --- Internal Components ---

interface SummaryCardProps {
  title: string
  value: string | number
  icon: string
  color: 'primary' | 'info' | 'warning' | 'error' | 'success'
  subtitle: string
}

const SummaryCard = ({ title, value, icon, color, subtitle }: SummaryCardProps) => {
  const theme = useTheme()
  const colorMap = {
    primary: theme.palette.primary,
    info: theme.palette.info,
    warning: theme.palette.warning,
    error: theme.palette.error,
    success: theme.palette.success
  }
  const mainColor = colorMap[color].main

  return (
    <Card
      sx={{ height: '100%', position: 'relative', overflow: 'hidden', borderRadius: 3, boxShadow: theme.shadows[2] }}
    >
      <CardContent sx={{ p: 5 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Typography variant='overline' color='text.secondary' sx={{ fontWeight: 600, letterSpacing: 1 }}>
              {title}
            </Typography>
            <Typography variant='h4' sx={{ mt: 1, fontWeight: 800 }}>
              {value}
            </Typography>
          </Box>
          <Avatar
            variant='rounded'
            sx={{
              bgcolor: `${mainColor}15`,
              color: mainColor,
              width: 48,
              height: 48
            }}
          >
            <i className={icon} style={{ fontSize: 24 }} />
          </Avatar>
        </Box>
        <Typography
          variant='body2'
          color='text.secondary'
          sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 1 }}
        >
          <Box component='span' sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: mainColor }} />
          {subtitle}
        </Typography>
      </CardContent>
      {/* Subtle background decoration */}
      <Box
        sx={{
          position: 'absolute',
          right: -10,
          bottom: -10,
          fontSize: 80,
          opacity: 0.03,
          transform: 'rotate(-10deg)',
          pointerEvents: 'none'
        }}
      >
        <i className={icon} />
      </Box>
    </Card>
  )
}

const StudentCard = ({ child, lang }: { child: any; lang: string }) => {
  const theme = useTheme()

  return (
    <Card
      sx={{
        borderRadius: 3,
        overflow: 'hidden',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        '&:hover': {
          transform: 'translateY(-6px)',
          boxShadow: theme.shadows[6],
          '& .student-avatar': { border: `4px solid ${theme.palette.primary.main}` }
        }
      }}
    >
      <Box
        sx={{
          height: 80,
          background: `linear-gradient(135deg, ${theme.palette.secondary.light}10 0%, ${theme.palette.secondary.light}20 100%)`,
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'center',
          pb: 0,
          position: 'relative',
          borderBottom: '1px solid',
          borderColor: 'divider'
        }}
      >
        {/* Decorative elements */}
        <Box sx={{ position: 'absolute', top: 10, right: 10, opacity: 0.2, color: 'white' }}>
          <i className='ri-graduation-cap-fill' style={{ fontSize: 60 }} />
        </Box>
      </Box>

      <CardContent sx={{ textAlign: 'center', mt: -8, pt: 0, px: 5, pb: 5 }}>
        <Avatar
          src={child.foto_url}
          className='student-avatar'
          sx={{
            width: 90,
            height: 90,
            mx: 'auto',
            border: '4px solid white',
            boxShadow: theme.shadows[3],
            bgcolor: 'primary.main',
            fontSize: '2rem',
            transition: 'all 0.3s ease'
          }}
        >
          {child.nombre_completo?.charAt(0)}
        </Avatar>

        <Typography variant='h6' sx={{ mt: 3, fontWeight: 700, mb: 0.5, color: 'text.primary' }}>
          {child.nombre_completo}
        </Typography>
        <Typography variant='body2' sx={{ color: 'text.secondary', mb: 2, fontWeight: 500 }}>
          <i className='ri-presentation-line' style={{ marginRight: 6, verticalAlign: 'middle' }} />
          Guía:{' '}
          <Box component='span' sx={{ color: 'text.primary', fontWeight: 600 }}>
            {child.docente_guia_nombre || 'Sin asignar'}
          </Box>
        </Typography>

        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', mb: 5, flexWrap: 'wrap' }}>
          <Chip
            size='small'
            label={`${child.grado} ${child.seccion}`}
            variant='tonal'
            color='secondary'
            icon={<i className='ri-medal-2-line' />}
            sx={{ fontWeight: 600, bgcolor: 'action.selected' }}
          />
        </Box>

        <Button
          fullWidth
          variant='contained'
          component={Link}
          href={`/${lang}/portal/familia/hijo/${child.id}`}
          endIcon={<i className='ri-arrow-right-line' />}
          sx={{ borderRadius: 2, py: 2, fontWeight: 600 }}
        >
          Ver Detalle Académico
        </Button>
      </CardContent>
    </Card>
  )
}

const ActivityItem = ({ item }: { item: any }) => {
  const theme = useTheme()
  const isAviso = item.tipo === 'aviso'
  const icon = isAviso ? 'ri-notification-3-line' : 'ri-calendar-event-line'
  const color = isAviso ? theme.palette.primary.main : theme.palette.warning.main

  return (
    <Box sx={{ p: 4, display: 'flex', gap: 4, '&:hover': { bgcolor: 'action.hover' }, transition: 'background 0.2s' }}>
      <Box sx={{ mt: 1 }}>
        <Box
          sx={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: `${color}15`,
            color: color
          }}
        >
          <i className={icon} style={{ fontSize: 18 }} />
        </Box>
      </Box>
      <Box sx={{ flex: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
          <Typography variant='subtitle2' sx={{ fontWeight: 700, lineHeight: 1.2 }}>
            {item.titulo}
          </Typography>
          <Typography variant='caption' sx={{ color: 'text.disabled', whiteSpace: 'nowrap', ml: 2 }}>
            {new Date(item.fecha).toLocaleDateString([], { day: '2-digit', month: 'short' })}
          </Typography>
        </Box>
        <Typography variant='body2' color='text.secondary' className='line-clamp-2' sx={{ lineHeight: 1.4 }}>
          {item.descripcion}
        </Typography>
      </Box>
    </Box>
  )
}

export default Dashboard
