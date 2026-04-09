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

import type { ConfigPlanPago } from '../types'
import planPagoService from '../services/planPagoService'

interface DeleteConfirmDialogProps {
  open: boolean
  planPago?: ConfigPlanPago
  onClose: () => void
  onSuccess: () => void
}

const DeleteConfirmDialog: React.FC<DeleteConfirmDialogProps> = ({
  open,
  planPago,
  onClose,
  onSuccess
}) => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleDelete = async () => {
    if (!planPago) return

    setLoading(true)
    setError('')

    try {
      await planPagoService.deletePlanPago(planPago.id)
      toast.success('Plan de pago eliminado exitosamente')
      onSuccess()
      onClose()
    } catch (error: any) {
      const errorMessage = error?.data?.message || 'Error al eliminar el plan de pago'
      setError(errorMessage)
      toast.error(errorMessage)
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CR', {
      style: 'currency',
      currency: 'CRC'
    }).format(amount)
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
            ¿Está seguro que desea eliminar el siguiente plan de pago?
          </Typography>

          {planPago && (
            <Box sx={{ 
              p: 2, 
              bgcolor: 'grey.50', 
              borderRadius: 1,
              border: '1px solid',
              borderColor: 'grey.200'
            }}>
              <Typography variant="subtitle2" color="primary" gutterBottom>
                Información del Plan de Pago:
              </Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>
                <strong>ID:</strong> {planPago.id}
              </Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>
                <strong>Nombre:</strong> {planPago.nombre}
              </Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>
                <strong>Estado:</strong> {planPago.estado ? 'Activo' : 'Inactivo'}
              </Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>
                <strong>Período Lectivo ID:</strong> {planPago.periodo_lectivo_id}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                <strong>Estado:</strong>
                <Chip 
                  label={planPago.estado ? 'Activo' : 'Inactivo'} 
                  color={planPago.estado ? 'success' : 'default'}
                  size="small"
                />
              </Box>
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