'use client'

import { useState } from 'react'
import { Box, Typography, Paper } from '@mui/material'
import { Settings as SettingsIcon } from '@mui/icons-material'

import ConfigParametrosForm from '../components/ConfigParametrosForm'
import CambiosModal from '../components/CambiosModal'
import type { CambioParametro } from '../types/index'

export default function ParametrosPage() {
  const [cambiosModalOpen, setCambiosModalOpen] = useState(false)
  const [cambiosData, setCambiosData] = useState<CambioParametro[]>([])

  const handleShowCambios = (cambios: CambioParametro[]) => {
    setCambiosData(cambios)
    setCambiosModalOpen(true)
  }

  const handleCloseCambios = () => {
    setCambiosModalOpen(false)
    setCambiosData([])
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Box display="flex" alignItems="center" gap={1} mb={1}>
          <SettingsIcon sx={{ color: 'primary.main' }} />
          <Typography variant="h4" component="h1" fontWeight="bold">
            Parámetros
          </Typography>
        </Box>
        <Typography variant="body1" color="text.secondary">
          Configuración de parámetros del sistema de caja
        </Typography>
      </Box>

      {/* Form Container */}
      <Paper elevation={2} sx={{ p: 3 }}>
        <ConfigParametrosForm onShowCambios={handleShowCambios} />
      </Paper>

      {/* Modal de Cambios */}
      <CambiosModal
        open={cambiosModalOpen}
        onClose={handleCloseCambios}
        cambios={cambiosData}
      />
    </Box>
  )
}