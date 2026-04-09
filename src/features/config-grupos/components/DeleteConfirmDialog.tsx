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

import gruposService from '../services/gruposService'
import type { ConfigGrupos } from '../types'

interface DeleteConfirmDialogProps {
  open: boolean
  grupos: ConfigGrupos | null
  onClose: () => void
  onSuccess: () => void
}

const DeleteConfirmDialog: React.FC<DeleteConfirmDialogProps> = ({
  open,
  grupos,
  onClose,
  onSuccess
}) => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleDelete = async () => {
    if (!grupos) return

    setLoading(true)
    setError(null)

    try {
      await gruposService.deleteGrupos(grupos.id)
      toast.success('Grupo eliminado exitosamente')
      onSuccess()
      onClose()
    } catch (error: any) {
      console.error('Error al eliminar grupo:', error)
      const errorMessage = error.message || 'Error al eliminar el grupo'
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

  if (!grupos) return null

  // Construir el nombre completo del grupo
  const grupoName = `${grupos.grado?.nombre || 'N/A'} - ${grupos.seccion?.nombre || 'N/A'} (${grupos.turno?.nombre || 'N/A'})`

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
          ¿Estás seguro de que deseas eliminar el siguiente grupo?
        </Typography>

        <Box sx={{ 
          p: 2, 
          bgcolor: 'grey.50', 
          borderRadius: 1,
          border: '1px solid',
          borderColor: 'grey.200'
        }}>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            Grupo a eliminar:
          </Typography>
          <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
            {grupoName}
          </Typography>
          {grupos.docente && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Docente Guía: {grupos.docente.name}
            </Typography>
          )}
        </Box>

        <Alert severity="warning" sx={{ mt: 2 }}>
          <Typography variant="body2">
            <strong>Advertencia:</strong> Esta acción no se puede deshacer. 
            El grupo será eliminado permanentemente del sistema.
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
          onClick={handleDelete}
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