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

import type { ConfigFormaPago } from '../types'
import formaPagoService from '../services/formaPagoService'

interface DeleteConfirmDialogProps {
  open: boolean
  formaPago?: ConfigFormaPago
  onClose: () => void
  onSuccess: () => void
}

const DeleteConfirmDialog: React.FC<DeleteConfirmDialogProps> = ({
  open,
  formaPago,
  onClose,
  onSuccess
}) => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleDelete = async () => {
    if (!formaPago) return

    setLoading(true)
    setError(null)

    try {
      await formaPagoService.deleteFormaPago(formaPago.id)
      toast.success('Forma de pago eliminada exitosamente')
      onSuccess()
      onClose()
    } catch (error: any) {
      setError(error.message || 'Error al eliminar la forma de pago')
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
            ¿Está seguro que desea eliminar la siguiente forma de pago?
          </Typography>

          {formaPago && (
            <Box sx={{ 
              p: 2, 
              bgcolor: 'grey.50', 
              borderRadius: 1,
              border: '1px solid',
              borderColor: 'grey.200'
            }}>
              <Typography variant="subtitle2" color="primary" gutterBottom>
                Información de la Forma de Pago:
              </Typography>
              <Typography variant="body2">
                <strong>Nombre:</strong> {formaPago.nombre}
              </Typography>
              <Typography variant="body2">
                <strong>Abreviatura:</strong> {formaPago.abreviatura}
              </Typography>
              <Typography variant="body2">
                <strong>Estado:</strong> {formaPago.activo ? 'Activo' : 'Inactivo'}
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