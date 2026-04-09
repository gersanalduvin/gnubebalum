'use client'

import { useEffect, useState } from 'react'

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
  TextField
} from '@mui/material'
import { toast } from 'react-hot-toast'

import { useDebounce } from '@/hooks/useDebounce'
import { FamiliasService } from '../services/familiasService'
import type { Alumno } from '../types'

interface Props {
  open: boolean
  onClose: () => void
  onSelect: (alumno: Alumno) => void
}

export default function AlumnoSearchModal({ open, onClose, onSelect }: Props) {
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<Alumno[]>([])
  const debouncedQuery = useDebounce(query, 500)

  const handleSearch = async () => {
    setLoading(true)
    try {
      const list = await FamiliasService.searchAlumnos(debouncedQuery || '', 20)
      setResults(Array.isArray(list) ? list : [])
    } catch (error: any) {
      const message = error?.data?.message || error?.message || 'Error al buscar alumnos'
      toast.error(message)
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
    <Dialog open={open} onClose={onClose} maxWidth='sm' fullWidth>
      <DialogTitle>Buscar Alumno</DialogTitle>
      <DialogContent dividers>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            label='Buscar'
            placeholder='Nombre, apellido, email, códigos'
            value={query}
            onChange={e => setQuery(e.target.value)}
            size='small'
            fullWidth
            InputProps={{
              startAdornment: (
                <InputAdornment position='start'>
                  <SearchIcon />
                </InputAdornment>
              )
            }}
          />
          {loading && (
            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
              <CircularProgress size={24} />
            </Box>
          )}
          <List dense>
            {results.map(item => (
              <ListItemButton
                key={item.id}
                onClick={() => {
                  onSelect(item)
                  onClose()
                }}
              >
                <ListItemText
                  primary={`${item.primer_nombre} ${item.segundo_nombre || ''} ${item.primer_apellido} ${item.segundo_apellido || ''}`
                    .replace(/\s+/g, ' ')
                    .trim()}
                  secondary={item.email || ''}
                />
              </ListItemButton>
            ))}
          </List>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cerrar</Button>
      </DialogActions>
    </Dialog>
  )
}
