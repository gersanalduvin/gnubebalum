import React from 'react'

// MUI Imports
import Timeline from '@mui/lab/Timeline'
import TimelineConnector from '@mui/lab/TimelineConnector'
import TimelineContent from '@mui/lab/TimelineContent'
import TimelineDot from '@mui/lab/TimelineDot'
import TimelineItem from '@mui/lab/TimelineItem'
import TimelineOppositeContent from '@mui/lab/TimelineOppositeContent'
import TimelineSeparator from '@mui/lab/TimelineSeparator'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'

export interface DashboardActividad {
  id: string | number
  tipo: 'aviso' | 'evento'
  titulo: string
  fecha: string
  descripcion: string
}

interface Props {
  actividades: DashboardActividad[]
}

const ActivityTimeline: React.FC<Props> = ({ actividades }) => {
  return (
    <Card sx={{ height: '100%', borderRadius: '16px' }}>
      <CardContent>
        <Typography variant='h6' mb={2}>
          Actividad Reciente
        </Typography>
        {actividades.length > 0 ? (
          <Timeline sx={{ p: 0 }}>
            {actividades.map((event, index) => {
              const isLast = index === actividades.length - 1
              const isAviso = event.tipo === 'aviso'
              const color = isAviso ? 'primary' : 'warning'
              const icon = isAviso ? 'ri-notification-3-line' : 'ri-calendar-event-line'

              let timeDisplay = event.fecha
              try {
                const date = new Date(event.fecha)
                timeDisplay = date.toLocaleDateString()
              } catch (e) {
                // Keep original
              }

              return (
                <TimelineItem key={event.id}>
                  <TimelineOppositeContent color='text.secondary' variant='caption' sx={{ flex: 0.25, pl: 0, pt: 1.5 }}>
                    {timeDisplay}
                  </TimelineOppositeContent>
                  <TimelineSeparator>
                    <TimelineDot color={color as any}>
                      <i className={icon} style={{ fontSize: '1rem', color: 'white' }} />
                    </TimelineDot>
                    {!isLast && <TimelineConnector />}
                  </TimelineSeparator>
                  <TimelineContent sx={{ pr: 0 }}>
                    <Box mb={2}>
                      <Typography variant='subtitle2' fontWeight='bold' sx={{ lineHeight: 1.2 }}>
                        {event.titulo}
                      </Typography>
                      <Typography variant='body2' color='text.secondary' sx={{ fontSize: '0.8rem', mt: 0.5 }}>
                        {event.descripcion}
                      </Typography>
                    </Box>
                  </TimelineContent>
                </TimelineItem>
              )
            })}
          </Timeline>
        ) : (
          <Box p={4} textAlign='center'>
            <Typography variant='body2' color='text.secondary'>
              No hay actividad reciente
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  )
}

export default ActivityTimeline
