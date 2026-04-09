'use client'

import { Suspense } from 'react'
import { CircularProgress, Box } from '@mui/material'
import { PermissionGuard } from '@/components/PermissionGuard'
import OrganizarListasPage from '@/features/organizar-listas/pages/OrganizarListasPage'

const Page = () => {
  return (
    <PermissionGuard permission="organizar.lista">
      <Suspense fallback={<Box display="flex" justifyContent="center" alignItems="center" minHeight="400px"><CircularProgress /></Box>}>
        <OrganizarListasPage />
      </Suspense>
    </PermissionGuard>
  )
}

export default Page