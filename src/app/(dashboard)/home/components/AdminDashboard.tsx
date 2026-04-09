'use client'

// MUI Imports
import Avatar from '@mui/material/Avatar'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Divider from '@mui/material/Divider'
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'

const AdminDashboard = () => {
  return (
    <Grid container spacing={6}>
      <Grid item xs={12}>
        <Typography variant='h4' className='mb-4'>
          Panel Administrativo
        </Typography>
      </Grid>
      
      {/* Metrics Cards */}
      <Grid item xs={12} sm={6} md={3}>
        <Card className='bg-primary text-white shadow-lg'>
          <CardContent className='flex flex-col gap-2'>
            <div className='flex justify-between items-center'>
              <Avatar className='bg-white/20 text-white rounded'>
                <i className='ri-user-line text-2xl' />
              </Avatar>
              <Typography variant='h4' className='text-white'>0</Typography>
            </div>
            <Typography variant='body2' className='text-white/80'>Alumnos Activos</Typography>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} sm={6} md={3}>
        <Card className='shadow-sm hover:shadow-md transition-shadow'>
          <CardContent className='flex flex-col gap-2'>
             <div className='flex justify-between items-center'>
              <Avatar className='bg-info/10 text-info rounded'>
                <i className='ri-briefcase-line text-2xl' />
              </Avatar>
              <Typography variant='h4' color='text.primary'>0</Typography>
            </div>
            <Typography variant='body2' color='text.secondary'>Docentes</Typography>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} sm={6} md={3}>
        <Card className='shadow-sm hover:shadow-md transition-shadow'>
          <CardContent className='flex flex-col gap-2'>
             <div className='flex justify-between items-center'>
              <Avatar className='bg-warning/10 text-warning rounded'>
                <i className='ri-group-line text-2xl' />
              </Avatar>
              <Typography variant='h4' color='text.primary'>0</Typography>
            </div>
            <Typography variant='body2' color='text.secondary'>Grupos Activos</Typography>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} sm={6} md={3}>
        <Card className='shadow-sm hover:shadow-md transition-shadow'>
          <CardContent className='flex flex-col gap-2'>
             <div className='flex justify-between items-center'>
              <Avatar className='bg-success/10 text-success rounded'>
                <i className='ri-money-dollar-circle-line text-2xl' />
              </Avatar>
              <Typography variant='h4' color='text.primary'>$0.00</Typography>
            </div>
            <Typography variant='body2' color='text.secondary'>Ingresos del Mes</Typography>
          </CardContent>
        </Card>
      </Grid>

      {/* Quick Actions & Recent Activity */}
      <Grid item xs={12} md={8}>
        <Card className='bs-full'>
          <CardContent>
             <div className='flex justify-between items-center mb-4'>
                <Typography variant='h6'>Actividad Reciente</Typography>
                <Button size='small' variant='text' disabled>Ver todo</Button>
             </div>
             <div className='flex flex-col gap-4 justify-center items-center py-8 text-center'>
                <Avatar className='bg-actionHover text-textSecondary w-16 h-16 mb-2'>
                  <i className='ri-file-list-3-line text-3xl' />
                </Avatar>
                <Typography variant='body1' color='text.secondary'>
                   No hay actividad reciente para mostrar
                </Typography>
             </div>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={4}>
         <Card className='bs-full'>
            <CardContent>
              <Typography variant='h6' className='mb-4'>Accesos Rápidos</Typography>
              <div className='flex flex-col gap-3'>
                <Button variant='outlined' fullWidth startIcon={<i className='ri-user-add-line' />} disabled>
                  Inscribir Alumno
                </Button>
                <Button variant='outlined' fullWidth startIcon={<i className='ri-bill-line' />} disabled>
                  Registrar Pago
                </Button>
                <Button variant='outlined' fullWidth startIcon={<i className='ri-megaphone-line' />} disabled>
                  Enviar Circular
                </Button>
                <Divider className='my-2' />
                <Button variant='contained' fullWidth disabled>
                  Ver Reporte General
                </Button>
              </div>
            </CardContent>
         </Card>
      </Grid>
    </Grid>
  )
}

export default AdminDashboard
