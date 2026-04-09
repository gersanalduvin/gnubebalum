"use client"
import { useEffect, useMemo, useState } from 'react'
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Autocomplete, CircularProgress, Alert } from '@mui/material'
import { toast } from 'react-hot-toast'
import asignaturasService from '../services/asignaturasService'
import type { AreaAsignatura } from '../types'

interface Props {
  open: boolean
  valueId?: number | null
  onClose: () => void
  onSelect: (area: AreaAsignatura) => void
}

const AsignaturaAreaSelectModal: React.FC<Props> = ({ open, valueId, onClose, onSelect }) => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [areas, setAreas] = useState<AreaAsignatura[]>([])
  const [selected, setSelected] = useState<AreaAsignatura | null>(null)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const data = await asignaturasService.listAreas()
        setAreas(Array.isArray(data) ? data : [])
        if (valueId) {
          const found = data.find(a => a.id === valueId) || null
          setSelected(found)
        } else {
          setSelected(null)
        }
      } catch (e: any) {
        const msg = e?.data?.message || 'Error al cargar áreas de asignaturas'
        setError(msg)
        toast.error(msg)
        setAreas([])
        setSelected(null)
      } finally {
        setLoading(false)
      }
    }
    if (open) load()
  }, [open, valueId])

  const options = useMemo(() => areas, [areas])

  const handleConfirm = () => {
    if (selected) {
      onSelect(selected)
      onClose()
    } else {
      toast.error('Seleccione un área')
    }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Seleccionar Área de Asignatura</DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
        )}
        <Autocomplete
          loading={loading}
          options={options}
          value={selected}
          onChange={(_, v) => setSelected(v)}
          getOptionLabel={(o) => String(o?.nombre || '')}
          isOptionEqualToValue={(o, v) => o.id === v.id}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Buscar área"
              size="small"
              InputProps={{
                ...params.InputProps,
                endAdornment: (
                  <>
                    {loading ? <CircularProgress color="inherit" size={16} /> : null}
                    {params.InputProps.endAdornment}
                  </>
                )
              }}
            />
          )}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button variant="contained" onClick={handleConfirm}>Seleccionar</Button>
      </DialogActions>
    </Dialog>
  )
}

export default AsignaturaAreaSelectModal
