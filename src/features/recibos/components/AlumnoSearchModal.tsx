'use client'

import { useDebounce } from '@/hooks/useDebounce'
import { PersonSearch as PersonSearchIcon, Search as SearchIcon } from '@mui/icons-material'
import { Box, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, InputAdornment, List, ListItemButton, ListItemText, TextField } from '@mui/material'
import { useEffect, useState } from 'react'
import { toast } from 'react-hot-toast'
import recibosService from '../services/recibosService'
import type { Alumno } from '../types'
import CrearAlumnoConPlanModal from './CrearAlumnoConPlanModal'

interface Props {
  open: boolean
  onClose: () => void
  onSelect: (alumno: Alumno) => void
}

const AlumnoSearchModal: React.FC<Props> = ({ open, onClose, onSelect }) => {
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<Alumno[]>([])
  const debouncedQuery = useDebounce(query, 500)
  const [createOpen, setCreateOpen] = useState(false)

  const normalizePendiente = (p: any) => ({
    id: Number(p.id),
    rubro_id: p.rubro_id != null ? Number(p.rubro_id) : undefined,
    aranceles_id: p.aranceles_id != null ? Number(p.aranceles_id) : undefined,
    producto_id: p.producto_id != null ? Number(p.producto_id) : undefined,
    importe_total: Number(p.importe_total || 0),
    saldo_actual: Number(p.saldo_actual || 0),
    estado: String(p.estado || ''),
    rubro: p.rubro ? { id: Number(p.rubro.id), codigo: p.rubro.codigo, nombre: p.rubro.nombre } : undefined
  })

  const normalizeAlumno = (a: any): Alumno => ({
    id: Number(a.id),
    primer_nombre: a.primer_nombre || '',
    segundo_nombre: a.segundo_nombre || '',
    primer_apellido: a.primer_apellido || '',
    segundo_apellido: a.segundo_apellido || '',
    email: a.email || '',
    codigo_mined: a.codigo_mined || '',
    codigo_unico: a.codigo_unico || '',
    tipo_usuario: a.tipo_usuario || 'alumno',
    arancelesPendientes: Array.isArray(a.arancelesPendientes)
      ? a.arancelesPendientes.map(normalizePendiente)
      : Array.isArray(a.aranceles_pendientes)
        ? a.aranceles_pendientes.map(normalizePendiente)
        : [],
    formato: a.grupos?.[0]?.grado?.formato || undefined,
    grado: a.grupos?.[0]?.grado?.nombre || 'N/A',
    seccion: a.grupos?.[0]?.grupo?.seccion?.nombre || 'N/A'
  })

  const handleSearch = async () => {
    setLoading(true)
    try {
      const response = await recibosService.searchAlumnos(query, 20)
      if ((response as any).success) {
        const raw = (response as any).data || []
        setResults(raw.map(normalizeAlumno))
      } else {
        toast.error((response as any).message || 'Error al buscar alumnos')
        setResults([])
      }
    } catch (error: any) {
      toast.error(error?.data?.message || 'Error al buscar alumnos')
      setResults([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (open) {
      setQuery('')
      setResults([])
    }
  }, [open])

  useEffect(() => {
    if (open) {
      handleSearch()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQuery, open])

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        Buscar Alumno
      </DialogTitle>
      <DialogContent dividers>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            label="Buscar"
            placeholder="Nombre, apellido, email, código"
            value={query}
            onChange={e => setQuery(e.target.value)}
            size="small"
            fullWidth
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              )
            }}
          />
          {/* Búsqueda con debounce, sin botón */}
          {loading && (
            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
              <CircularProgress size={24} />
            </Box>
          )}
          <List dense>
            {results.map((item, index) => (
              <ListItemButton
                key={item.id}
                onClick={() => { onSelect(item); onClose() }}
                divider
                sx={{
                  bgcolor: index % 2 === 0 ? 'rgba(0,0,0,0.04)' : 'transparent',
                  '&:hover': { bgcolor: 'action.selected' }
                }}
              >
                <ListItemText
                  primaryTypographyProps={{ fontSize: '1.1rem', fontWeight: 600, color: 'text.primary' }}
                  primary={`${item.primer_nombre} ${item.segundo_nombre || ''} ${item.primer_apellido} ${item.segundo_apellido || ''}`.replace(/\s+/g, ' ').trim()}
                  secondary={`${item.email || ''} ${item.codigo_mined || ''} ${item.codigo_unico || ''}`.trim()}
                />
              </ListItemButton>
            ))}
          </List>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setCreateOpen(true)} startIcon={<PersonSearchIcon />}>Crear alumno con plan</Button>
        <Button onClick={onClose}>Cerrar</Button>
      </DialogActions>
      <CrearAlumnoConPlanModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={(al) => { onSelect(al); setCreateOpen(false); onClose() }}
      />
    </Dialog>
  )
}

export default AlumnoSearchModal
