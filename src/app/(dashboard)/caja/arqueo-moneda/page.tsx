'use client'

import { Suspense } from 'react'
import { CircularProgress, Box } from '@mui/material'
import { PermissionGuard } from '@/components/PermissionGuard'
import ConfigArqueoMonedaPage from '@/features/config-arqueo-moneda/pages/ConfigArqueoMonedaPage'

export default function Page() {
  return (
    <PermissionGuard permission="config_arqueo_moneda.index">
      <Suspense fallback={<Box display="flex" justifyContent="center" alignItems="center" minHeight="400px"><CircularProgress /></Box>}>
        <ConfigArqueoMonedaPage />
      </Suspense>
    </PermissionGuard>
  )
}

