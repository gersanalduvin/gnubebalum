'use client'
import { useState } from 'react'

import { Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, Typography } from '@mui/material'

import { toast } from 'react-hot-toast'

import configNotSemestreService from '../services/configNotSemestreService'
import type { Semestre } from '../types'

interface Props {
  open: boolean
  semestre?: Semestre
  onClose: () => void
  onSuccess: () => void
}

const DeleteConfirmDialog: React.FC<Props> = ({ open, semestre, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false)

  const handleDelete = async () => {
    if (!semestre?.id) return
    try {
      setLoading(true)
      await configNotSemestreService.removeSemestre(semestre.id)
      toast.success('Semestre eliminado exitosamente')
      onClose()
      onSuccess()
    } catch (error: any) {
      toast.error(error?.data?.message || 'Error al eliminar el semestre')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth disableAutoFocus={false} disableEnforceFocus={false} aria-labelledby='delete-semestre-title'>
      <DialogTitle id='delete-semestre-title'>Eliminar Semestre</DialogTitle>
      <DialogContent>
        <Typography>¿Está seguro que desea eliminar el semestre "{semestre?.nombre}"?</Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancelar
        </Button>
        <Button
          onClick={handleDelete}
          color='error'
          variant='contained'
          disabled={loading}
          startIcon={loading ? <CircularProgress size={16} /> : undefined}
        >
          Eliminar
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default DeleteConfirmDialog
