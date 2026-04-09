'use client'

import { Suspense } from 'react'
import { CircularProgress, Box } from '@mui/material'

import { PermissionGuard } from '@/components/PermissionGuard'
import ReporteCuentaXCobrarPage from '@/features/reporte-cuenta-x-cobrar/pages/ReporteCuentaXCobrarPage'

const ReporteCuentaXCobrarRoutePage = () => {
  return (
    <PermissionGuard permission="reporte_cuenta_x_cobrar.ver">
      <Suspense
        fallback={
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
            <CircularProgress />
          </Box>
        }
      >
        <ReporteCuentaXCobrarPage />
      </Suspense>
    </PermissionGuard>
  )
}

export default ReporteCuentaXCobrarRoutePage

