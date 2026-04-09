'use client'

import { Box, Card, CardContent, CircularProgress, Grid, Typography } from '@mui/material'
import React from 'react'

interface LessonPlanStatsProps {
  stats: {
    total_docentes: number
    planificaron: number
    no_planificaron: number
    porcentaje_cumplimiento: number
  } | null
  isLoading?: boolean
}

const LessonPlanStats: React.FC<LessonPlanStatsProps> = ({ stats, isLoading }) => {
  if (isLoading) {
      return <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}><CircularProgress /></Box>
  }

  if (!stats) return null;

  return (
    <Grid container spacing={4}>
      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent sx={{ textAlign: 'center' }}>
            <Typography color="textSecondary" gutterBottom>
              Total Clases
            </Typography>
            <Typography variant="h4">
              {stats.total_docentes}
            </Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent sx={{ textAlign: 'center' }}>
            <Typography color="textSecondary" gutterBottom>
              Planificaron
            </Typography>
            <Typography variant="h4" color="success.main">
              {stats.planificaron}
            </Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent sx={{ textAlign: 'center' }}>
             <Typography color="textSecondary" gutterBottom>
              Clases Pendientes
            </Typography>
            <Typography variant="h4" color="error.main">
              {stats.no_planificaron}
            </Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent sx={{ textAlign: 'center' }}>
             <Typography color="textSecondary" gutterBottom>
              Cumplimiento
            </Typography>
            <Typography variant="h4" color="primary.main">
              {stats.porcentaje_cumplimiento}%
            </Typography>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  )
}

export default LessonPlanStats
