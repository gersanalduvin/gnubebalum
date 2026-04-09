'use client'

import React, { useState, memo } from 'react'

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Alert,
  CircularProgress,
  Box
} from '@mui/material'

import periodoLectivoService from '../services/periodoLectivoService'
import type { ConfPeriodoLectivo } from '../types'

interface DeleteConfirmDialogProps {
  open: boolean
  periodoLectivo?: ConfPeriodoLectivo
  onClose: () => void
  onSuccess: () => void
}

const DeleteConfirmDialog = ({ open, periodoLectivo, onClose, onSuccess }: DeleteConfirmDialogProps) => {
  // Estados
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Handlers
  const handleDelete = async () => {
    if (!periodoLectivo) return

    try {
      setLoading(true)
      setError(null)
      await periodoLectivoService.deletePeriodoLectivo(periodoLectivo.id)
      onSuccess()
      onClose() // Cerrar el modal después de eliminar exitosamente
    } catch (error: any) {
      setError(error.message || 'Error al eliminar el período lectivo')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    if (!loading) {
      onClose()
    }
  }

  if (!periodoLectivo) return null

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth='sm'
      fullWidth
    >
      <DialogTitle>
        <Box className='flex items-center gap-2'>
          <i className='ri-delete-bin-line text-error' />
          <Typography variant='h6'>
            Confirmar Eliminación
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Box className='space-y-4'>
          {error && (
            <Alert severity='error' className='mb-4'>
              {error}
            </Alert>
          )}

          <Typography variant='body1'>
            ¿Está seguro que desea eliminar el período lectivo?
          </Typography>

          <Box className='bg-gray-50 p-4 rounded-lg'>
            <Typography variant='subtitle2' className='font-semibold mb-2'>
              Información del período:
            </Typography>
            <Typography variant='body2' className='mb-1'>
              <strong>Nombre:</strong> {periodoLectivo.nombre}
            </Typography>
          </Box>

          <Alert severity='warning'>
            <Typography variant='body2'>
              Esta acción no se puede deshacer. El período lectivo será eliminado permanentemente.
            </Typography>
          </Alert>
        </Box>
      </DialogContent>

      <DialogActions className='p-4'>
        <Button
          onClick={handleClose}
          disabled={loading}
          variant='outlined'
          color='inherit'
        >
          Cancelar
        </Button>
        <Button
          onClick={handleDelete}
          disabled={loading}
          variant='contained'
          color='error'
          startIcon={loading ? <CircularProgress size={20} /> : <i className='ri-delete-bin-line' />}
        >
          {loading ? 'Eliminando...' : 'Eliminar'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default memo(DeleteConfirmDialog)