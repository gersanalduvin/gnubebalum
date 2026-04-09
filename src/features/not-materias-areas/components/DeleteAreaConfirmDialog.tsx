"use client"
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Alert } from '@mui/material'
import { useState } from 'react'
import { toast } from 'react-hot-toast'
import type { AreaAsignatura } from '../types'
import areasService from '../services/areasService'

interface Props {
  open: boolean
  area?: AreaAsignatura
  onClose: () => void
  onSuccess: () => void
}

const DeleteAreaConfirmDialog: React.FC<Props> = ({ open, area, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleDelete = async () => {
    if (!area?.id) return
    setLoading(true)
    setError(null)
    try {
      await areasService.remove(area.id)
      toast.success('Área eliminada exitosamente')
      onClose()
      onSuccess()
    } catch (err: any) {
      const message = err?.data?.message || 'No se pudo eliminar el registro'
      setError(message)
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>Confirmar eliminación</DialogTitle>
      <DialogContent>
        {error && <Alert severity="error" variant="filled" sx={{ mb: 2 }}>{error}</Alert>}
        ¿Desea eliminar el área "{area?.nombre}"?
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>Cancelar</Button>
        <Button color="error" variant="contained" onClick={handleDelete} disabled={loading}>Eliminar</Button>
      </DialogActions>
    </Dialog>
  )
}

export default DeleteAreaConfirmDialog
