"use client"
import { useState } from 'react'
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, CircularProgress } from '@mui/material'
import { toast } from 'react-hot-toast'
import type { Escala } from '../types'
import configNotEscalaService from '../services/configNotEscalaService'

interface Props {
  open: boolean
  escala: Escala | null
  onClose: () => void
  onSuccess: () => void
}

const DeleteEscalaConfirmDialog: React.FC<Props> = ({ open, escala, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false)
  const handleConfirm = async () => {
    if (!escala?.id) return onClose()
    try {
      setLoading(true)
      await configNotEscalaService.removeEscala(escala.id)
      toast.success('Escala eliminada exitosamente')
      onClose()
      onSuccess()
    } catch (error: any) {
      toast.error(error?.data?.message || 'Error al eliminar la escala')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Confirmar eliminación</DialogTitle>
      <DialogContent>
        <Typography>¿Deseas eliminar la escala "{escala?.nombre}"?</Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button color="error" variant="contained" onClick={handleConfirm} disabled={loading}>
          {loading ? <CircularProgress size={18} /> : 'Eliminar'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default DeleteEscalaConfirmDialog
