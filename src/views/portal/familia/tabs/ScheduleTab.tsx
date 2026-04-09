'use client'

import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Collapse from '@mui/material/Collapse'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'
import { useEffect, useState } from 'react'

import { ParentAccessService } from '@/services/parentAccessService'

const diasSemana = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']

const dayColors = [
  'primary', // Domingo
  'primary', // Lunes
  'info', // Martes
  'success', // Miércoles
  'warning', // Jueves
  'secondary', // Viernes
  'error' // Sábado
] as const

const ScheduleTab = ({ studentId }: { studentId: number }) => {
  const [schedule, setSchedule] = useState<any[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedDays, setExpandedDays] = useState<Record<number, boolean>>({})

  useEffect(() => {
    const fetchSchedule = async () => {
      try {
        const data = await ParentAccessService.getSchedule(studentId)
        setSchedule(data)
      } catch (err: any) {
        console.error(err)
        setError('Error al cargar el horario.')
      } finally {
        setLoading(false)
      }
    }
    if (studentId) fetchSchedule()
  }, [studentId])

  const toggleDay = (dayIndex: number) => {
    setExpandedDays(prev => ({ ...prev, [dayIndex]: !prev[dayIndex] }))
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
        <CircularProgress />
      </Box>
    )
  }

  if (error) return <Alert severity='error'>{error}</Alert>

  if (schedule.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <i className='ri-calendar-schedule-line' style={{ fontSize: 48, opacity: 0.3 }} />
        <Typography color='text.secondary' sx={{ mt: 2 }}>
          No hay horario registrado
        </Typography>
      </Box>
    )
  }

  // Group by day
  const scheduleByDay: Record<number, any[]> = {}
  schedule.forEach(block => {
    if (!scheduleByDay[block.dia_semana]) scheduleByDay[block.dia_semana] = []
    scheduleByDay[block.dia_semana].push(block)
  })
  Object.keys(scheduleByDay).forEach(day => {
    scheduleByDay[parseInt(day)].sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio))
  })

  const formatTime12H = (time: string) => {
    if (!time) return ''
    try {
      const [hours, minutes] = time.split(':').map(Number)
      const period = hours >= 12 ? 'PM' : 'AM'
      const h12 = hours % 12 || 12
      const mStr = minutes.toString().padStart(2, '0')
      return `${h12}:${mStr} ${period}`
    } catch (e) {
      return time
    }
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {[1, 2, 3, 4, 5].map(dayIndex => {
        if (!scheduleByDay[dayIndex]) return null

        const isExpanded = !!expandedDays[dayIndex]
        const today = new Date().getDay()
        const isToday = dayIndex === today

        return (
          <Card
            key={dayIndex}
            variant='outlined'
            sx={{
              overflow: 'hidden',
              borderRadius: 2,
              transition: 'all 0.2s ease',
              borderColor: isExpanded ? `${dayColors[dayIndex]}.main` : 'divider',
              ...(isToday && { borderColor: `${dayColors[dayIndex]}.main`, borderWidth: 2 })
            }}
          >
            {/* Day Header — Clickable Toggle */}
            <Box
              onClick={() => toggleDay(dayIndex)}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                px: 4,
                py: 2.5,
                cursor: 'pointer',
                bgcolor: isExpanded ? `${dayColors[dayIndex]}.lighter` : 'transparent',
                transition: 'all 0.2s ease',
                '&:hover': { bgcolor: `${dayColors[dayIndex]}.lighter` }
              }}
            >
              <Box
                sx={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: `${dayColors[dayIndex]}.main`,
                  color: 'white',
                  flexShrink: 0
                }}
              >
                <i className='ri-calendar-line' style={{ fontSize: 18 }} />
              </Box>

              <Typography variant='subtitle1' sx={{ fontWeight: 700, color: `${dayColors[dayIndex]}.main`, flex: 1 }}>
                {diasSemana[dayIndex]}
                {isToday && (
                  <Chip
                    label='Hoy'
                    size='small'
                    color={dayColors[dayIndex]}
                    sx={{ ml: 1, fontWeight: 600, height: 20, fontSize: '0.65rem' }}
                  />
                )}
              </Typography>

              <Chip
                label={`${scheduleByDay[dayIndex].length} clases`}
                size='small'
                variant='tonal'
                color={dayColors[dayIndex]}
              />

              <IconButton size='small' sx={{ color: `${dayColors[dayIndex]}.main` }}>
                <i className={isExpanded ? 'ri-arrow-up-s-line' : 'ri-arrow-down-s-line'} style={{ fontSize: 20 }} />
              </IconButton>
            </Box>

            {/* Collapsible Schedule Blocks */}
            <Collapse in={isExpanded}>
              <CardContent sx={{ p: 0 }}>
                {scheduleByDay[dayIndex].map((block, idx) => (
                  <Box
                    key={block.id}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 3,
                      px: 4,
                      py: 2.5,
                      borderTop: '1px solid',
                      borderColor: 'divider',
                      transition: 'background 0.15s',
                      '&:hover': { bgcolor: 'action.hover' }
                    }}
                  >
                    {/* Time */}
                    <Box sx={{ textAlign: 'center', minWidth: 80, flexShrink: 0 }}>
                      <Typography variant='subtitle2' sx={{ fontWeight: 700, color: `${dayColors[dayIndex]}.main` }}>
                        {formatTime12H(block.hora_inicio)}
                      </Typography>
                      <Typography variant='caption' color='text.disabled'>
                        {formatTime12H(block.hora_fin)}
                      </Typography>
                    </Box>

                    {/* Divider Line */}
                    <Box
                      sx={{
                        width: 3,
                        height: 36,
                        bgcolor: `${dayColors[dayIndex]}.main`,
                        borderRadius: 4,
                        flexShrink: 0
                      }}
                    />

                    {/* Subject Info */}
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant='subtitle2' sx={{ fontWeight: 600 }}>
                        {block.materia}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 2, mt: 0.5 }}>
                        {block.docente &&
                          block.docente !== 'Sin docente' &&
                          block.docente !== 'Sin docente especificado' && (
                            <Typography variant='caption' color='text.secondary'>
                              <i className='ri-user-line' style={{ fontSize: 12, marginRight: 4 }} />
                              {block.docente}
                            </Typography>
                          )}
                        {block.aula && (
                          <Typography variant='caption' color='text.secondary'>
                            <i className='ri-map-pin-line' style={{ fontSize: 12, marginRight: 4 }} />
                            {block.aula}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  </Box>
                ))}
              </CardContent>
            </Collapse>
          </Card>
        )
      })}
    </Box>
  )
}

export default ScheduleTab
