'use client'

import { Warning as WarningIcon } from '@mui/icons-material'
import {
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Typography
} from '@mui/material'
import React from 'react'

interface ConfirmDialogProps {
  open: boolean
  title?: string
  message?: string
  confirmText?: string
  cancelText?: string
  onClose: () => void
  onConfirm: () => void
  color?: 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'
  loading?: boolean
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  title = 'Confirmar Acción',
  message = '¿Estás seguro de que deseas realizar esta acción?',
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  onClose,
  onConfirm,
  color = 'primary',
  loading = false
}) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <WarningIcon color={color === 'error' ? 'error' : 'warning'} />
        {title}
      </DialogTitle>
      <DialogContent>
        <Typography variant="body1">{message}</Typography>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} color="inherit" disabled={loading}>
          {cancelText}
        </Button>
        <Button 
          onClick={onConfirm} 
          color={color} 
          variant="contained" 
          autoFocus 
          disabled={loading}
        >
          {loading ? 'Procesando...' : confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default ConfirmDialog
