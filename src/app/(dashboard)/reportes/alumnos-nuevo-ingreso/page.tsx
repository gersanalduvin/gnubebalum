'use client'

import { Suspense } from 'react'
import { CircularProgress, Box } from '@mui/material'

import { PermissionGuard } from '@/components/PermissionGuard'
import ReporteNuevoIngresoPage from '@/features/reporte-nuevo-ingreso/pages/ReporteNuevoIngresoPage'

const AlumnosNuevoIngresoPage = () => {
  return (
    <PermissionGuard permission="repote.nuevoingreso">
      <Suspense
        fallback={
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
            <CircularProgress />
          </Box>
        }
      >
        <ReporteNuevoIngresoPage />
      </Suspense>
    </PermissionGuard>
  )
}

export default AlumnosNuevoIngresoPage