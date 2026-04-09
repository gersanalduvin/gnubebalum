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
  Box,
  Chip
} from '@mui/material'
import { toast } from 'react-hot-toast'

import type { ConfigRubro } from '../types'
import planPagoService from '../services/planPagoService'

interface RubroDeleteConfirmDialogProps {
  open: boolean
  rubro?: ConfigRubro
  onClose: () => void
  onSuccess: () => void
}

const RubroDeleteConfirmDialog: React.FC<RubroDeleteConfirmDialogProps> = ({
  open,
  rubro,
  onClose,
  onSuccess
}) => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleDelete = async () => {
    if (!rubro) return

    setLoading(true)
    setError(null)

    try {
      await planPagoService.deleteRubro(rubro.id)
      toast.success('Rubro eliminado exitosamente')
      onSuccess()
      onClose()
    } catch (error: any) {
      setError(error.message || 'Error al eliminar el rubro')
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
            ¿Está seguro que desea eliminar el siguiente rubro?
          </Typography>

          {rubro && (
            <Box sx={{ 
              p: 2, 
              bgcolor: 'grey.50', 
              borderRadius: 1,
              border: '1px solid',
              borderColor: 'grey.200'
            }}>
              <Typography variant="subtitle2" color="primary" gutterBottom>
                Información del Rubro:
              </Typography>
              <Typography variant="body2">
                <strong>Nombre:</strong> {rubro.nombre}
              </Typography>
              <Typography variant="body2" sx={{ mt: 1 }}>
                <strong>Código:</strong> {rubro.codigo}
              </Typography>
              {rubro.importe && (
                <Typography variant="body2" sx={{ mt: 1 }}>
                  <strong>Importe:</strong> {rubro.moneda ? '$' : 'C$'} {Number(rubro.importe || 0).toFixed(2)}
                </Typography>
              )}
            </Box>
          )}

          <Alert severity="warning" sx={{ mt: 2 }}>
            Esta acción no se puede deshacer. Si este rubro está siendo utilizado en planes de pago, no podrá ser eliminado.
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

export default RubroDeleteConfirmDialog