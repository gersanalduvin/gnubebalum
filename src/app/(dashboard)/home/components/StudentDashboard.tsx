'use client'

// MUI Imports
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'

const StudentDashboard = () => {
  return (
    <Grid container spacing={6}>
       {/* Welcome Banner */}
      <Grid item xs={12}>
        <Card className='bg-primary text-white overflow-hidden relative'>
           <div className='absolute top-0 right-0 p-8 opacity-20'>
              <i className='ri-graduation-cap-line text-9xl' />
           </div>
           <CardContent className='p-8'>
              <Typography variant='h4' className='text-white mb-2'>¡Hola de nuevo!</Typography>
              <Typography variant='body1' className='text-white/80 max-w-lg'>
                 Bienvenido a tu panel estudiantil. Revisa tu agenda y tus notas aquí.
              </Typography>
              <Button variant='contained' className='bg-white text-primary mt-4 hover:bg-gray-100' disabled>
                 Ver mi agenda
              </Button>
           </CardContent>
        </Card>
      </Grid>

      {/* Schedule */}
      <Grid item xs={12} md={8}>
         <Card className='h-full'>
            <CardContent className='h-full flex flex-col'>
               <Typography variant='h6' className='mb-4'>Horario de Hoy</Typography>
               <div className='flex-1 flex flex-col items-center justify-center text-center p-8 border-2 border-dashed rounded bg-gray-50/50'>
                  <i className='ri-calendar-2-line text-4xl text-gray-300 mb-2' />
                  <Typography variant='subtitle1' color='text.secondary'>No hay clases registradas</Typography>
               </div>
            </CardContent>
         </Card>
      </Grid>

      {/* Stats/Grades */}
      <Grid item xs={12} md={4}>
         <Card className='h-full'>
            <CardContent className='h-full flex flex-col'>
               <Typography variant='h6' className='mb-4'>Mis Avances</Typography>
               <div className='flex-1 flex flex-col items-center justify-center gap-4 text-center'>
                   <div className='w-24 h-24 rounded-full border-4 border-gray-100 flex items-center justify-center'>
                      <Typography variant='h4' color='text.disabled'>--</Typography>
                   </div>
                   <Typography variant='body2' color='text.secondary'>
                      Aún no hay calificaciones registradas para mostrar.
                   </Typography>
               </div>
               <Button fullWidth variant='outlined' className='mt-8' disabled>Ver Boletín Completo</Button>
            </CardContent>
         </Card>
      </Grid>
    </Grid>
  )
}

export default StudentDashboard
