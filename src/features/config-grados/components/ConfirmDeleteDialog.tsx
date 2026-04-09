'use client'

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box
} from '@mui/material'
import { Warning } from '@mui/icons-material'

interface ConfirmDeleteDialogProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  title?: string
  message?: string
  loading?: boolean
}

export default function ConfirmDeleteDialog({
  open,
  onClose,
  onConfirm,
  title = 'Confirmar eliminación',
  message = '¿Estás seguro de que deseas eliminar este elemento? Esta acción no se puede deshacer.',
  loading = false
}: ConfirmDeleteDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Warning color="warning" />
          {title}
        </Box>
      </DialogTitle>
      
      <DialogContent>
        <Typography variant="body1" color="text.secondary">
          {message}
        </Typography>
      </DialogContent>
      
      <DialogActions sx={{ p: 2, gap: 1 }}>
        <Button 
          onClick={onClose} 
          variant="outlined" 
          disabled={loading}
          size="small"
        >
          Cancelar
        </Button>
        <Button 
          onClick={onConfirm} 
          variant="contained" 
          color="error"
          disabled={loading}
          size="small"
        >
          {loading ? 'Eliminando...' : 'Eliminar'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}