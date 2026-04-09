import TabContext from '@mui/lab/TabContext'
import TabList from '@mui/lab/TabList'
import TabPanel from '@mui/lab/TabPanel'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Divider from '@mui/material/Divider'
import LinearProgress from '@mui/material/LinearProgress'
import Tab from '@mui/material/Tab'
import Typography from '@mui/material/Typography'
import { useEffect, useState } from 'react'

import { ParentAccessService } from '@/services/parentAccessService'

const StatCard = ({
  icon,
  value,
  label,
  color
}: {
  icon: string
  value: string | number
  label: string
  color: string
}) => (
  <Card
    variant='outlined'
    sx={{
      flex: '1 1 140px',
      transition: 'all 0.2s ease',
      '&:hover': { transform: 'translateY(-2px)', boxShadow: 2 }
    }}
  >
    <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 3, py: 3 }}>
      <Box
        sx={{
          width: 48,
          height: 48,
          borderRadius: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: `${color}.lighter`,
          color: `${color}.main`,
          flexShrink: 0
        }}
      >
        <i className={icon} style={{ fontSize: 24 }} />
      </Box>
      <Box>
        <Typography variant='h4' sx={{ fontWeight: 700, lineHeight: 1 }}>
          {value}
        </Typography>
        <Typography variant='caption' color='text.secondary' sx={{ display: 'block', fontSize: '0.7rem' }}>
          {label}
        </Typography>
      </Box>
    </CardContent>
  </Card>
)

const AttendanceTab = ({ studentId }: { studentId: number }) => {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [activeCorte, setActiveCorte] = useState<string>('corte_1')

  useEffect(() => {
    const fetchAttendance = async () => {
      try {
        const response = await ParentAccessService.getAttendance(studentId)
        setData(response)
      } catch (err: any) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    if (studentId) fetchAttendance()
  }, [studentId])

  const handleCorteChange = (event: React.SyntheticEvent, newValue: string) => {
    setActiveCorte(newValue)
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
        <CircularProgress />
      </Box>
    )
  }

  if (!data || !data.resumen) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <i className='ri-calendar-todo-line' style={{ fontSize: 48, opacity: 0.3 }} />
        <Typography color='text.secondary' sx={{ mt: 2 }}>
          No hay datos de asistencia disponibles
        </Typography>
      </Box>
    )
  }

  const detalles = data.detalles || {}
  const periodo = data.periodo || { nombre: 'Periodo lectivo' }
  const resumen = data.resumen

  const getStatusColor = (estado: string) => {
    switch (estado) {
      case 'ausencia_injustificada':
        return 'error'
      case 'ausencia_justificada':
        return 'warning'
      case 'tarde_injustificada':
        return 'error'
      case 'tarde_justificada':
        return 'warning'
      default:
        return 'default'
    }
  }

  const getStatusLabel = (estado: string) => {
    return estado.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {/* Attendance Header */}
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant='h5' sx={{ fontWeight: 700, mb: 1 }}>
            Control de Asistencia
          </Typography>
          <Typography variant='body2' color='text.secondary'>
            Mostrando resultados del <strong>{periodo.nombre}</strong>
          </Typography>
        </Box>
      </Box>

      <Box>
        <TabContext value={activeCorte}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 4 }}>
            <TabList onChange={handleCorteChange} aria-label='cortes de asistencia'>
              <Tab label='Corte 1' value='corte_1' />
              <Tab label='Corte 2' value='corte_2' />
              <Tab label='Corte 3' value='corte_3' />
              <Tab label='Corte 4' value='corte_4' />
            </TabList>
          </Box>
          {['corte_1', 'corte_2', 'corte_3', 'corte_4'].map(corteKey => {
            const stats = (resumen.cortes && resumen.cortes[corteKey]) || {
              porcentaje_asistencia: 0,
              asistencias: 0,
              ausencias_injustificadas: 0,
              ausencias_justificadas: 0,
              tardes_injustificadas: 0,
              tardes_justificadas: 0
            }

            const percentage = parseFloat(stats.porcentaje_asistencia)
            const isLowCorte = percentage < 60

            return (
              <TabPanel key={corteKey} value={corteKey} sx={{ px: 0, py: 0 }}>
                {/* Statistics per Corte */}
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 6, mb: 8 }}>
                  <Card
                    sx={{
                      background: isLowCorte
                        ? 'linear-gradient(135deg, var(--mui-palette-error-dark) 0%, var(--mui-palette-error-main) 100%)'
                        : 'linear-gradient(135deg, var(--mui-palette-success-dark) 0%, var(--mui-palette-success-main) 100%)',
                      color: 'white'
                    }}
                  >
                    <CardContent sx={{ py: 5, textAlign: 'center' }}>
                      <Typography variant='overline' sx={{ color: 'rgba(255,255,255,0.8)', letterSpacing: 2 }}>
                        Asistencia en {corteKey.replace('_', ' ').toUpperCase()}
                      </Typography>
                      <Typography variant='h2' sx={{ fontWeight: 800, my: 1 }}>
                        {Math.round(percentage)}%
                      </Typography>
                      <LinearProgress
                        variant='determinate'
                        value={percentage}
                        sx={{
                          height: 8,
                          borderRadius: 4,
                          maxWidth: 300,
                          mx: 'auto',
                          bgcolor: 'rgba(255,255,255,0.2)',
                          '& .MuiLinearProgress-bar': {
                            bgcolor: 'white',
                            borderRadius: 4
                          }
                        }}
                      />
                      <Typography variant='caption' sx={{ color: 'rgba(255,255,255,0.7)', mt: 1, display: 'block' }}>
                        {isLowCorte
                          ? '⚠️ Asistencia por debajo del mínimo requerido (60%)'
                          : '✅ Asistencia dentro del rango aceptable'}
                      </Typography>
                    </CardContent>
                  </Card>

                  <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                    <StatCard
                      icon='ri-checkbox-circle-line'
                      value={stats.asistencias}
                      label='Asistencias'
                      color='success'
                    />
                    <StatCard
                      icon='ri-close-circle-line'
                      value={stats.ausencias_injustificadas}
                      label='Aus. Injust.'
                      color='error'
                    />
                    <StatCard
                      icon='ri-error-warning-line'
                      value={stats.ausencias_justificadas}
                      label='Aus. Just.'
                      color='warning'
                    />
                    <StatCard
                      icon='ri-history-line'
                      value={stats.tardes_injustificadas}
                      label='Tar. Injust.'
                      color='error'
                    />
                    <StatCard
                      icon='ri-time-line'
                      value={stats.tardes_justificadas}
                      label='Tar. Just.'
                      color='warning'
                    />
                  </Box>
                </Box>

                <Typography variant='h6' sx={{ mb: 4, fontWeight: 700 }}>
                  Registro Detallado
                </Typography>

                {detalles[corteKey] && detalles[corteKey].length > 0 ? (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    {detalles[corteKey].map((registro: any) => (
                      <Card key={registro.id} variant='outlined' sx={{ borderRadius: 2 }}>
                        <CardContent
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            flexWrap: 'wrap',
                            gap: 2,
                            py: '12px !important'
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                            <Box sx={{ textAlign: 'center', minWidth: 80 }}>
                              <Typography variant='body2' sx={{ fontWeight: 700 }}>
                                {new Date(registro.fecha).toLocaleDateString('es-ES', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  year: 'numeric'
                                })}
                              </Typography>
                            </Box>
                            <Divider orientation='vertical' flexItem sx={{ height: 32 }} />
                            <Box>
                              <Chip
                                label={getStatusLabel(registro.estado)}
                                color={getStatusColor(registro.estado) as any}
                                size='small'
                                variant='tonal'
                                sx={{ fontWeight: 600 }}
                              />
                              {registro.hora_registro && (
                                <Typography
                                  variant='caption'
                                  sx={{ display: 'block', mt: 0.5, color: 'text.secondary' }}
                                >
                                  <i className='ri-time-line' style={{ verticalAlign: 'middle', marginRight: 4 }} />
                                  {registro.hora_registro.substring(0, 5)}
                                </Typography>
                              )}
                            </Box>
                          </Box>
                          {registro.justificacion && (
                            <Box sx={{ flex: '1 1 100%', mt: { xs: 2, sm: 0 }, sm: { flex: '1 1 auto' } }}>
                              <Typography
                                variant='body2'
                                sx={{
                                  color: 'text.secondary',
                                  fontStyle: 'italic',
                                  bgcolor: 'action.hover',
                                  p: 2,
                                  borderRadius: 1
                                }}
                              >
                                <strong>Justificanción:</strong> {registro.justificacion}
                              </Typography>
                            </Box>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </Box>
                ) : (
                  <Box sx={{ py: 10, textAlign: 'center', bgcolor: 'action.hover', borderRadius: 2 }}>
                    <Typography color='text.secondary'>
                      No hay ausencias ni tardanzas registradas en este corte.
                    </Typography>
                  </Box>
                )}
              </TabPanel>
            )
          })}
        </TabContext>
      </Box>
    </Box>
  )
}

export default AttendanceTab
