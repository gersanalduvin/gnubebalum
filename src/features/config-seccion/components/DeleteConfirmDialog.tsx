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
import { toast } from 'react-hot-toast'

import type { ConfigSeccion } from '../types'
import seccionService from '../services/seccionService'

interface DeleteConfirmDialogProps {
  open: boolean
  seccion?: ConfigSeccion
  onClose: () => void
  onSuccess: () => void
}

const DeleteConfirmDialog: React.FC<DeleteConfirmDialogProps> = ({
  open,
  seccion,
  onClose,
  onSuccess
}) => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleDelete = async () => {
    if (!seccion) return

    setLoading(true)
    setError(null)

    try {
      await seccionService.deleteSeccion(seccion.id)
      toast.success('Sección eliminada exitosamente')
      onSuccess()
      onClose()
    } catch (error: any) {
      console.error('Error al eliminar sección:', error)
      setError(error.message || 'Error al eliminar la sección')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    if (!loading) {
      setError(null)
      onClose()
    }
  }

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>
        <Typography variant="h6" component="div">
          Confirmar Eliminación
        </Typography>
      </DialogTitle>

      <DialogContent dividers>
        <Box sx={{ py: 1 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Typography variant="body1" sx={{ mb: 2 }}>
            ¿Está seguro que desea eliminar la siguiente sección?
          </Typography>

          {seccion && (
            <Box sx={{ 
              p: 2, 
              bgcolor: 'grey.50', 
              borderRadius: 1,
              border: '1px solid',
              borderColor: 'grey.200'
            }}>
              <Typography variant="subtitle2" color="primary" gutterBottom>
                Información de la Sección:
              </Typography>
              <Typography variant="body2">
                <strong>Nombre:</strong> {seccion.nombre}
              </Typography>
              <Typography variant="body2">
                <strong>Orden:</strong> {seccion.orden}
              </Typography>
            </Box>
          )}

          <Alert severity="warning" sx={{ mt: 2 }}>
            Esta acción no se puede deshacer.
          </Alert>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 3 }}>
        <Button 
          onClick={handleClose} 
          disabled={loading}
          variant="outlined"
        >
          Cancelar
        </Button>
        <Button 
          onClick={handleDelete} 
          disabled={loading}
          variant="contained"
          color="error"
          startIcon={loading ? <CircularProgress size={20} /> : null}
        >
          {loading ? 'Eliminando...' : 'Eliminar'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default DeleteConfirmDialog