'use client'

// React Imports
import { Suspense } from 'react'

// MUI Imports
import { CircularProgress, Box } from '@mui/material'

// Component Imports
import { PermissionGuard } from '@/components/PermissionGuard'
import ReporteMatriculaPage from '@/features/reporte-matricula/pages/ReporteMatriculaPage'

const EstadisticaMatriculaPage = () => {
  return (
    <PermissionGuard permission="reportes.estadistica_matricula">
      <Suspense
        fallback={
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
            <CircularProgress />
          </Box>
        }
      >
        <ReporteMatriculaPage />
      </Suspense>
    </PermissionGuard>
  )
}

export default EstadisticaMatriculaPage