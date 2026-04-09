'use client'

// React Imports
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

// MUI Imports
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'

// Hook Imports
import { useAuth } from '@/hooks/useAuth'

const RootPage = () => {
  const { isAuthenticated, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated) {
        router.replace('/home')
      } else {
        router.replace('/login')
      }
    }
  }, [isAuthenticated, isLoading, router])

  return (
    <Box sx={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center' }}>
      <CircularProgress />
    </Box>
  )
}

export default RootPage
