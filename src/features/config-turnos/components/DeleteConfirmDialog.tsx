'use client'

import { useState } from 'react'

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
import { Warning as WarningIcon } from '@mui/icons-material'
import { toast } from 'react-hot-toast'

import turnosService from '../services/turnosService'
import type { ConfigTurnos } from '../types'

interface DeleteConfirmDialogProps {
  open: boolean
  turnos?: ConfigTurnos
  onClose: () => void
  onSuccess: () => void
}

const DeleteConfirmDialog: React.FC<DeleteConfirmDialogProps> = ({
  open,
  turnos,
  onClose,
  onSuccess
}) => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Manejar confirmación de eliminación
  const handleConfirm = async () => {
    if (!turnos) return

    setLoading(true)
    setError(null)

    try {
      await turnosService.deleteTurnos(turnos.id)
      toast.success('Turno eliminado exitosamente')
      onSuccess()
      onClose()
    } catch (error: any) {
      console.error('Error al eliminar turno:', error)
      const errorMessage = error.message || 'Error al eliminar el turno'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  // Manejar cierre del diálogo
  const handleClose = () => {
    if (!loading) {
      setError(null)
      onClose()
    }
  }

  if (!turnos) return null

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <WarningIcon color="warning" />
        Confirmar Eliminación
      </DialogTitle>

      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Typography variant="body1" sx={{ mb: 2 }}>
          ¿Estás seguro de que deseas eliminar el siguiente turno?
        </Typography>

        <Box sx={{ 
          p: 2, 
          bgcolor: 'grey.50', 
          borderRadius: 1,
          border: '1px solid',
          borderColor: 'grey.200'
        }}>
          <Typography variant="subtitle2" color="text.secondary">
            Turno a eliminar:
          </Typography>
          <Typography variant="body1" fontWeight="medium">
            {turnos.nombre}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Orden: {turnos.orden}
          </Typography>
        </Box>

        <Alert severity="warning" sx={{ mt: 2 }}>
          <Typography variant="body2">
            <strong>Advertencia:</strong> Esta acción no se puede deshacer. 
            El turno será eliminado permanentemente del sistema.
          </Typography>
        </Alert>
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button
          onClick={handleClose}
          disabled={loading}
          color="inherit"
        >
          Cancelar
        </Button>
        <Button
          onClick={handleConfirm}
          disabled={loading}
          color="error"
          variant="contained"
          startIcon={loading ? <CircularProgress size={20} /> : null}
        >
          {loading ? 'Eliminando...' : 'Eliminar'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default DeleteConfirmDialog