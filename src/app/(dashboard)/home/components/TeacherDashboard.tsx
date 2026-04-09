'use client'

// React Imports
import { useEffect, useState } from 'react'

// MUI Imports
import Avatar from '@mui/material/Avatar'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'

// Service Imports
import gruposService from '@/features/config-grupos/services/gruposService'
import type { ConfigGrupos } from '@/features/config-grupos/types'

const TeacherDashboard = () => {
  const [grupos, setGrupos] = useState<ConfigGrupos[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchMyGroups = async () => {
      try {
        const response = await gruposService.getMyActiveGroups()
        if (response.success && Array.isArray(response.data)) {
          setGrupos(response.data)
        }
      } catch (error) {
        console.error('Error fetching teacher groups:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchMyGroups()
  }, [])
  return (
    <Grid container spacing={6}>
      <Grid item xs={12}>
        <Typography variant='h4'>Panel Docente</Typography>
        <Typography variant='body2' color='text.secondary'>Bienvenido a tu espacio de trabajo</Typography>
      </Grid>

      {/* Today's Schedule */}
      <Grid item xs={12} md={8}>
        <Card className='bs-full'>
          <CardContent>
            <Typography variant='h6' className='mb-4'>Clases de Hoy</Typography>
            <div className='flex flex-col gap-4 justify-center items-center py-12 text-center'>
              <Avatar className='bg-primary/5 text-primary w-20 h-20 mb-3'>
                <i className='ri-calendar-event-line text-4xl' />
              </Avatar>
              <Typography variant='h6'>Sin clases programadas</Typography>
              <Typography variant='body2' color='text.secondary' className='max-w-xs'>
                No tienes clases asignadas para el día de hoy. ¡Disfruta tu tiempo libre!
              </Typography>
            </div>
          </CardContent>
        </Card>
      </Grid>

      {/* Side Panel */}
      <Grid item xs={12} md={4}>
         <div className='flex flex-col gap-6'>
            {/* My Groups Stats */}
            <Card>
              <CardContent>
                <div className='flex items-center gap-3 mb-4'>
                  <Avatar className='bg-primary/10 text-primary'>
                    <i className='ri-group-line' />
                  </Avatar>
                  <div>
                     <Typography variant='h6'>Mis Grupos Guía</Typography>
                     <Typography variant='caption'>{grupos.length} Asignados</Typography>
                  </div>
                </div>
                
                {loading ? (
                  <div className='flex justify-center py-4'>
                    <CircularProgress size={24} />
                  </div>
                ) : grupos.length > 0 ? (
                  <div className='flex flex-col gap-3'>
                    {grupos.map((grupo) => (
                      <div key={grupo.id} className='flex items-center justify-between p-3 border rounded-lg hover:bg-action-hover transition-colors'>
                        <div className='flex flex-col'>
                          <Typography variant='subtitle2' className='font-medium'>
                            {grupo.grado?.nombre} - {grupo.seccion?.nombre}
                          </Typography>
                          <Typography variant='caption' color='text.secondary'>
                            {grupo.turno?.nombre}
                          </Typography>
                        </div>
                        <Chip 
                          label="Guía" 
                          size="small" 
                          color="primary" 
                          variant="outlined" 
                          className='h-6 text-xs'
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <Typography variant='body2' color='text.disabled' className='text-center py-4'>
                    No tienes grupos asignados como guía en este periodo
                  </Typography>
                )}
              </CardContent>
            </Card>

            {/* Pending Tasks */}
            <Card>
              <CardContent>
                <Typography variant='h6' className='mb-3'>Pendientes</Typography>
                <div className='flex flex-col items-center justify-center py-6 text-center border-2 border-dashed rounded-lg border-divider'>
                  <i className='ri-checkbox-circle-line text-3xl text-success mb-2' />
                  <Typography variant='body2'>¡Todo al día!</Typography>
                  <Typography variant='caption' color='text.disabled'>No hay tareas pendientes</Typography>
                </div>
                <Button fullWidth variant='contained' className='mt-4' disabled>Ir al Cuaderno</Button>
              </CardContent>
            </Card>
         </div>
      </Grid>
    </Grid>
  )
}

export default TeacherDashboard
