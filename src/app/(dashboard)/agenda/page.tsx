'use client'

import AgendaCalendar from '@/components/agenda/AgendaCalendar'
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'

const AgendaPage = () => {
  return (
    <Grid container spacing={6}>
      <Grid item xs={12}>
        <Typography variant='h4'>Agenda Escolar</Typography>
        <Typography variant='body2'>Calendario de actividades y eventos del colegio</Typography>
      </Grid>
      <Grid item xs={12}>
        <AgendaCalendar />
      </Grid>
    </Grid>
  )
}

export default AgendaPage
