'use client'

import { useState } from 'react'

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Alert,
  CircularProgress
} from '@mui/material'
import { Warning as WarningIcon } from '@mui/icons-material'
import { toast } from 'react-hot-toast'

import type { ConfigArancel } from '../types'
import { getMonedaSymbol } from '../types'
import arancelService from '../services/arancelService'

interface DeleteConfirmDialogProps {
  open: boolean
  arancel?: ConfigArancel
  onClose: () => void
  onSuccess: () => void
}

const DeleteConfirmDialog: React.FC<DeleteConfirmDialogProps> = ({
  open,
  arancel,
  onClose,
  onSuccess
}) => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleDelete = async () => {
    if (!arancel) return

    setLoading(true)
    setError(null)

    try {
      await arancelService.deleteArancel(arancel.id)
      toast.success('Arancel eliminado exitosamente')
      onSuccess()
      onClose()
    } catch (error: any) {
      const errorMessage = error.message || 'Error al eliminar el arancel'
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

  if (!arancel) return null

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <WarningIcon color="warning" />
          <Typography variant="h6" component="div">
            Confirmar Eliminación
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        <Box sx={{ py: 2 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          <Typography variant="body1" sx={{ mb: 3 }}>
            ¿Está seguro que desea eliminar el siguiente arancel?
          </Typography>

          <Box 
            sx={{ 
              p: 2, 
              bgcolor: 'grey.50', 
              borderRadius: 1,
              border: '1px solid',
              borderColor: 'grey.200'
            }}
          >
            <Typography variant="body2" color="text.secondary" gutterBottom>
              <strong>Código:</strong> {arancel.codigo}
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              <strong>Nombre:</strong> {arancel.nombre}
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              <strong>Precio:</strong> {getMonedaSymbol(arancel.moneda)}{typeof arancel.precio === 'number' ? arancel.precio.toFixed(2) : parseFloat(arancel.precio || '0').toFixed(2)}
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              <strong>Moneda:</strong> {arancel.moneda ? 'Dólar' : 'Córdoba'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              <strong>Estado:</strong> {arancel.activo ? 'Activo' : 'Inactivo'}
            </Typography>
          </Box>

          <Alert severity="warning" sx={{ mt: 3 }}>
            <Typography variant="body2">
              <strong>Advertencia:</strong> Esta acción no se puede deshacer. 
              El arancel será eliminado permanentemente del sistema.
            </Typography>
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
          startIcon={loading && <CircularProgress size={20} />}
        >
          {loading ? 'Eliminando...' : 'Eliminar'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default DeleteConfirmDialog