'use client'

// React Imports
import { Suspense } from 'react'

// MUI Imports
import { CircularProgress, Box } from '@mui/material'

// Component Imports
import { ConfigPlanPagosPage } from '@/features/config-plan-pagos'

const PlanPagosPage = () => {
  return (
    <Suspense
      fallback={
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      }
    >
      <ConfigPlanPagosPage />
    </Suspense>
  )
}

export default PlanPagosPage