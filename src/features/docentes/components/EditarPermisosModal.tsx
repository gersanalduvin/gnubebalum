import { asignacionDocenteService } from '@/features/docentes/services/asignacionDocenteService'
import type { NotAsignaturaGradoDocente } from '@/features/docentes/types/asignaciones'
import {
    Button,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Grid,
    TextField
} from '@mui/material'
import { useEffect, useState } from 'react'
import { toast } from 'react-hot-toast'

interface Props {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  asignacion: NotAsignaturaGradoDocente | null
}

export default function EditarPermisosModal({ open, onClose, onSuccess, asignacion }: Props) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    permiso_fecha_corte1: '',
    permiso_fecha_corte2: '',
    permiso_fecha_corte3: '',
    permiso_fecha_corte4: ''
  })

  useEffect(() => {
    if (asignacion) {
      setFormData({
        permiso_fecha_corte1: asignacion.permiso_fecha_corte1 ? asignacion.permiso_fecha_corte1.split(' ')[0] : '',
        permiso_fecha_corte2: asignacion.permiso_fecha_corte2 ? asignacion.permiso_fecha_corte2.split(' ')[0] : '',
        permiso_fecha_corte3: asignacion.permiso_fecha_corte3 ? asignacion.permiso_fecha_corte3.split(' ')[0] : '',
        permiso_fecha_corte4: asignacion.permiso_fecha_corte4 ? asignacion.permiso_fecha_corte4.split(' ')[0] : ''
      })
    }
  }, [asignacion])

  const handleSave = async () => {
    if (!asignacion) return
    setLoading(true)
    try {
      const payload = {
        permiso_fecha_corte1: formData.permiso_fecha_corte1 || null,
        permiso_fecha_corte2: formData.permiso_fecha_corte2 || null,
        permiso_fecha_corte3: formData.permiso_fecha_corte3 || null,
        permiso_fecha_corte4: formData.permiso_fecha_corte4 || null
      }
      await asignacionDocenteService.updatePermisos(asignacion.id, payload, asignacion.user_id)
      toast.success('Permisos actualizados correctamente')
      onSuccess()
      onClose()
    } catch (error: any) {
      toast.error('Error al actualizar permisos')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Editar Permisos por Corte</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12} sm={6}>
            <TextField
              type="date"
              label="Fecha Límite Corte 1"
              fullWidth
              InputLabelProps={{ shrink: true }}
              value={formData.permiso_fecha_corte1}
              onChange={(e) => setFormData({ ...formData, permiso_fecha_corte1: e.target.value })}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              type="date"
              label="Fecha Límite Corte 2"
              fullWidth
              InputLabelProps={{ shrink: true }}
              value={formData.permiso_fecha_corte2}
              onChange={(e) => setFormData({ ...formData, permiso_fecha_corte2: e.target.value })}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              type="date"
              label="Fecha Límite Corte 3"
              fullWidth
              InputLabelProps={{ shrink: true }}
              value={formData.permiso_fecha_corte3}
              onChange={(e) => setFormData({ ...formData, permiso_fecha_corte3: e.target.value })}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              type="date"
              label="Fecha Límite Corte 4"
              fullWidth
              InputLabelProps={{ shrink: true }}
              value={formData.permiso_fecha_corte4}
              onChange={(e) => setFormData({ ...formData, permiso_fecha_corte4: e.target.value })}
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>Cancelar</Button>
        <Button onClick={handleSave} variant="contained" disabled={loading}>
          {loading ? <CircularProgress size={24} /> : 'Guardar'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
