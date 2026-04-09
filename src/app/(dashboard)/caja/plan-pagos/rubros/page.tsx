'use client'

// React Imports
import { Suspense } from 'react'

// MUI Imports
import { CircularProgress, Box } from '@mui/material'

// Component Imports
import { RubrosPage } from '@/features/config-plan-pagos'

const RubrosPageRoute = () => {
  return (
    <Suspense
      fallback={
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      }
    >
      <RubrosPage />
    </Suspense>
  )
}

export default RubrosPageRoute