"use client"
import { useState } from 'react'
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, CircularProgress } from '@mui/material'
import { toast } from 'react-hot-toast'
import type { Asignatura } from '../types'
import asignaturasService from '../services/asignaturasService'

interface Props {
  open: boolean
  asignatura: Asignatura | null
  onClose: () => void
  onSuccess: () => void
}

const DeleteAsignaturaConfirmDialog: React.FC<Props> = ({ open, asignatura, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false)
  const handleConfirm = async () => {
    if (!asignatura?.id) return onClose()
    try {
      setLoading(true)
      await asignaturasService.remove(asignatura.id)
      toast.success('Materia eliminada exitosamente')
      onClose()
      onSuccess()
    } catch (error: any) {
      toast.error(error?.data?.message || 'Error al eliminar la materia')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Confirmar eliminación</DialogTitle>
      <DialogContent>
        <Typography>¿Deseas eliminar la materia "{asignatura?.nombre}"?</Typography>
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

export default DeleteAsignaturaConfirmDialog
