'use client'

import { Suspense } from 'react'
import { CircularProgress, Box } from '@mui/material'

import { PermissionGuard } from '@/components/PermissionGuard'
import ListasGrupoPage from '@/features/listas-grupo/pages/ListasGrupoPage'

const ListasPorGrupoPage = () => {
  return (
    <PermissionGuard permission="ver_listas_grupo">
      <Suspense
        fallback={
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
            <CircularProgress />
          </Box>
        }
      >
        <ListasGrupoPage />
      </Suspense>
    </PermissionGuard>
  )
}

export default ListasPorGrupoPage

