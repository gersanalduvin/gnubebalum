'use client'

import { Suspense } from 'react'
import { CircularProgress, Box } from '@mui/material'

import { PermissionGuard } from '@/components/PermissionGuard'
import CierreCajaPage from '@/features/reporte-cierre-caja/pages/CierreCajaPage'

const ReporteCierreCajaRoutePage = () => {
  return (
    <PermissionGuard permission="reporte_cierre_caja.ver">
      <Suspense
        fallback={
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
            <CircularProgress />
          </Box>
        }
      >
        <CierreCajaPage />
      </Suspense>
    </PermissionGuard>
  )
}

export default ReporteCierreCajaRoutePage

