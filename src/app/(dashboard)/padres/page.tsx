'use client'

import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'
import { useEffect, useState } from 'react'

import ChildCard from '@/features/padres/components/ChildCard'
import parentService, { type Student } from '@/features/padres/services/parentService'

const ParentsDashboard = () => {
  const [children, setChildren] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchChildren = async () => {
      try {
        const data = await parentService.getMyChildren()
        setChildren(data)
      } catch (err) {
        console.error(err)
        setError('Error al cargar la información de los hijos.')
      } finally {
        setLoading(false)
      }
    }

    fetchChildren()
  }, [])

  if (loading) {
    return (
      <Box className='flex justify-center items-center min-h-[50vh]'>
        <CircularProgress />
      </Box>
    )
  }

  if (error) {
    return <Alert severity='error'>{error}</Alert>
  }

  return (
    <Grid container spacing={6}>
      <Grid item xs={12}>
        <Typography variant='h4' className='mb-4'>
          Mis Hijos
        </Typography>
        <Typography variant='subtitle1' color='text.secondary' className='mb-6'>
            Seleccione un estudiante para ver su información detallada.
        </Typography>
      </Grid>

      {children.length === 0 ? (
        <Grid item xs={12}>
            <Alert severity='info'>No se encontraron estudiantes asociados a su cuenta.</Alert>
        </Grid>
      ) : (
        children.map(student => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={student.id}>
                <ChildCard student={student} />
            </Grid>
        ))
      )}
    </Grid>
  )
}

export default ParentsDashboard
