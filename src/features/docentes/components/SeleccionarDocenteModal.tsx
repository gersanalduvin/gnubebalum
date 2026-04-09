import DocentesService from '@/features/docentes/services/docentesService'
import type { Docente } from '@/features/docentes/types'
import { Search as SearchIcon } from '@mui/icons-material'
import {
    Box,
    Button,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    InputAdornment,
    List,
    ListItemButton,
    ListItemText,
    Radio,
    TextField,
    Typography
} from '@mui/material'
import { useEffect, useState } from 'react'

interface Props {
  open: boolean
  onClose: () => void
  onConfirm: (targetDocente: Docente) => void
  excludeDocenteId?: number
}

export default function SeleccionarDocenteModal({ open, onClose, onConfirm, excludeDocenteId }: Props) {
  const [loading, setLoading] = useState(false)
  const [docentes, setDocentes] = useState<Docente[]>([])
  const [filteredDocentes, setFilteredDocentes] = useState<Docente[]>([])
  const [search, setSearch] = useState('')
  const [selectedDocente, setSelectedDocente] = useState<Docente | null>(null)

  const [isConfirming, setIsConfirming] = useState(false)

  useEffect(() => {
    if (open) {
      loadDocentes()
      setSearch('')
      setSelectedDocente(null)
      setIsConfirming(false)
    }
  }, [open])

  useEffect(() => {
    if (!docentes.length) {
        setFilteredDocentes([])
        return
    }
    const lower = search.toLowerCase()
    setFilteredDocentes(
        docentes.filter(d => {
            const fullName = `${d.primer_nombre} ${d.segundo_nombre || ''} ${d.primer_apellido} ${d.segundo_apellido || ''}`.toLowerCase()
            return fullName.includes(lower) || d.email?.toLowerCase().includes(lower)
        })
    )
  }, [search, docentes])

  const loadDocentes = async () => {
    setLoading(true)
    try {
      const res = await DocentesService.getDocentes({ per_page: 1000, estado: 'activo' })
      let list = res.data || []
      if (excludeDocenteId) {
          list = list.filter(d => d.id !== excludeDocenteId)
      }
      setDocentes(list)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const handleConfirm = () => {
      if (selectedDocente) {
          setIsConfirming(true)
          onClose()
          setTimeout(() => {
              onConfirm(selectedDocente)
          }, 150)
      }
  }

  return (
    <Dialog 
        open={open} 
        onClose={onClose} 
        maxWidth="sm" 
        fullWidth
        disableRestoreFocus={isConfirming}
    >
      <DialogTitle>Seleccionar Docente a Asignar</DialogTitle>
      <DialogContent>
        <Box mb={2} mt={1}>
            <TextField
                autoFocus
                fullWidth
                size="small"
                placeholder="Buscar docente..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                InputProps={{
                    startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment>
                }}
            />
        </Box>
        
        {loading ? (
             <Box display="flex" justifyContent="center" p={4}><CircularProgress /></Box>
        ) : (
            <List sx={{ maxHeight: 300, overflow: 'auto', border: '1px solid #eee', borderRadius: 1 }}>
                {filteredDocentes.length > 0 ? filteredDocentes.map(d => (
                    <ListItemButton 
                        key={d.id} 
                        selected={selectedDocente?.id === d.id}
                        onClick={() => setSelectedDocente(d)}
                    >
                        <Radio checked={selectedDocente?.id === d.id} />
                        <ListItemText 
                            primary={`${d.primer_nombre} ${d.segundo_nombre || ''} ${d.primer_apellido} ${d.segundo_apellido || ''}`} 
                            secondary={d.email} 
                        />
                    </ListItemButton>
                )) : (
                    <Box p={2} textAlign="center"><Typography color="text.secondary">No se encontraron docentes.</Typography></Box>
                )}
            </List>
        )}

      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button onClick={handleConfirm} variant="contained" disabled={!selectedDocente}>
          Asignar
        </Button>
      </DialogActions>
    </Dialog>
  )
}
