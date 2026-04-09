'use client'

import { Backdrop, CircularProgress, Typography } from '@mui/material'
import React from 'react'

interface LoadingBackdropProps {
  open: boolean
  message?: string
}

const LoadingBackdrop: React.FC<LoadingBackdropProps> = ({ open, message = 'Cargando...' }) => {
  return (
    <Backdrop
      sx={{
        color: '#fff',
        zIndex: (theme) => theme.zIndex.drawer + 1000,
        flexDirection: 'column',
        gap: 2,
        backgroundColor: 'rgba(0, 0, 0, 0.7)'
      }}
      open={open}
    >
      <CircularProgress color="inherit" />
      {message && (
        <Typography variant="h6" component="div">
          {message}
        </Typography>
      )}
    </Backdrop>
  )
}

export default LoadingBackdrop
