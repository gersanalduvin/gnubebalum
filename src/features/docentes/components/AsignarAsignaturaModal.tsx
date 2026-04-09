
import { asignacionDocenteService } from '@/features/docentes/services/asignacionDocenteService'
import { Clear as ClearIcon } from '@mui/icons-material'
import {
    Box,
    Button,
    Checkbox,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControl,
    Grid,
    IconButton,
    InputLabel,
    MenuItem,
    Paper,
    Select,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography
} from '@mui/material'
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'react-hot-toast'

interface Props {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  userId: number
  defaultPeriodoId?: number
}

interface CandidateAsignatura {
  id: number // asignatura_grado_id
  nombre: string // asignatura name
  grado: string // grado name
  grado_id: number
  grupo: string // grupo name
  grupo_id: number
  uniqueKey: string // composite key for selection
}

export default function AsignarAsignaturaModal({ open, onClose, onSuccess, userId, defaultPeriodoId }: Props) {
  const [loading, setLoading] = useState(false)
  const [loadingResources, setLoadingResources] = useState(false)
  
  // Filters
  const [selectedAsignatura, setSelectedAsignatura] = useState<string>('')
  const [selectedGrado, setSelectedGrado] = useState<number | ''>('')
  const [selectedGrupo, setSelectedGrupo] = useState<number | ''>('')
  
  // Data
  const [allCandidates, setAllCandidates] = useState<CandidateAsignatura[]>([])
  const [selectedCandidates, setSelectedCandidates] = useState<string[]>([]) // keys

  useEffect(() => {
    if (open) {
      // Reset filters and selection on open
      setSelectedAsignatura('')
      setSelectedGrado('')
      setSelectedGrupo('')
      setAllCandidates([])
      setSelectedCandidates([])
    }
  }, [open])

  useEffect(() => {
    if (open && defaultPeriodoId) {
        fetchCandidates()
    }
  }, [defaultPeriodoId, open])

  const fetchCandidates = async () => {
    if (!defaultPeriodoId) return
    setLoadingResources(true)
    setAllCandidates([])
    try {
        // Fetch ALL unassigned for the period
        const unassigned = await asignacionDocenteService.getUnassignedGlobal({
            periodo_lectivo_id: defaultPeriodoId
        })
        
        const newCandidates: CandidateAsignatura[] = unassigned.map((row: any) => ({
             id: row.id, // Subject ID (asignatura_grado_id)
             nombre: row.nombre,
             grado: row.grado,
             grado_id: row.grado_id || (row.grupo as any)?.grado_id, // Ensure we get grade ID
             grupo: row.grupo,
             grupo_id: row.grupo_id,
             uniqueKey: row.uniqueKey
        }))
        
        setAllCandidates(newCandidates)

    } catch (error) {
        console.error(error)
        toast.error('Error al cargar asignaturas candidatas')
    } finally {
        setLoadingResources(false)
    }
  }

  // Derived lists for Filters from ALL candidates (to populate dropdowns)
  const uniqueAsignaturas = useMemo(() => {
      // Filter list to apply dependent filtering or just global unique? User said "dynamically from the list". 
      // Usually independent filters are easier, but dependent (like selecting Grade filters Subjects) is nicer.
      // Let's make them dependent on *other* filters.
      // E.g. If Grade is selected, show only Subjects in that Grade.
      
      let filtered = allCandidates
      if (selectedGrado) filtered = filtered.filter(c => c.grado_id === selectedGrado)
      if (selectedGrupo) filtered = filtered.filter(c => c.grupo_id === selectedGrupo)
      
      const names = Array.from(new Set(filtered.map(c => c.nombre))).sort()
      return names
  }, [allCandidates, selectedGrado, selectedGrupo])

  const uniqueGrados = useMemo(() => {
      let filtered = allCandidates
      if (selectedAsignatura) filtered = filtered.filter(c => c.nombre === selectedAsignatura)
      // Groups don't usually filter Grades (parent), but if selectedGrupo is set, implied Grade is fixed.
      
      const map = new Map()
      filtered.forEach(c => {
          if (c.grado && c.grado_id) {
              map.set(c.grado_id, c.grado)
          }
      })
      
      return Array.from(map.entries()).map(([id, nombre]) => ({ id, nombre })).sort((a,b) => a.nombre.localeCompare(b.nombre))
  }, [allCandidates, selectedAsignatura])

  const uniqueGrupos = useMemo(() => {
     let filtered = allCandidates
     if (selectedAsignatura) filtered = filtered.filter(c => c.nombre === selectedAsignatura)
     if (selectedGrado) filtered = filtered.filter(c => c.grado_id === selectedGrado)
     
     const map = new Map()
     filtered.forEach(c => {
         if (c.grupo && c.grupo_id) {
             map.set(c.grupo_id, { id: c.grupo_id, nombre: c.grupo, grado: c.grado }) // uniqueKey?
         }
     })
     
     // c.grupo might be just the name e.g. "A" or "Unique Group Name"? 
     // looking at mapped data: `grupo: row.grupo`. Backend `getUnassignedGlobal` (repo line 90) maps `grupo_id`.
     // But previous code assumed `availableGrupos` from `gruposService` returns object with `grado` and `seccion`.
     // Checking `CandidateAsignatura`: `grupo: string`.
     // The `row.grupo` from backend usually returns the group *name* or info.
     // Let's assume `c.grupo` is the display string.
     
     return Array.from(map.entries()).map(([id, val]) => ({ id, ...val })).sort((a:any ,b:any) => a.nombre.localeCompare(b.nombre))
  }, [allCandidates, selectedAsignatura, selectedGrado])

  // Filtered Candidates for Table Display
  const displayedCandidates = useMemo(() => {
      return allCandidates.filter(c => {
          if (selectedAsignatura && c.nombre !== selectedAsignatura) return false
          if (selectedGrado && c.grado_id !== selectedGrado) return false
          if (selectedGrupo && c.grupo_id !== selectedGrupo) return false
          return true
      })
  }, [allCandidates, selectedAsignatura, selectedGrado, selectedGrupo])

  const handleToggleSelect = (key: string) => {
      setSelectedCandidates(prev => 
          prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
      )
  }

  const handleToggleAll = () => {
      // Toggle all DISPLAYED candidates
      const allDisplayedKeys = displayedCandidates.map(c => c.uniqueKey)
      const allSelected = allDisplayedKeys.every(k => selectedCandidates.includes(k))
      
      if (allSelected) {
          // Deselect displayed
          setSelectedCandidates(prev => prev.filter(k => !allDisplayedKeys.includes(k)))
      } else {
          // Select all displayed (merge unique)
          const newSelected = new Set([...selectedCandidates, ...allDisplayedKeys])
          setSelectedCandidates(Array.from(newSelected))
      }
  }

  const handleSave = async () => {
      if (selectedCandidates.length === 0) return
      setLoading(true)
      try {
          // Group select items by GrupoId
          const groupedByGrupo: Record<number, number[]> = {}
          
          for (const key of selectedCandidates) {
              const candidate = allCandidates.find(c => c.uniqueKey === key)
              if (candidate) {
                  if (!groupedByGrupo[candidate.grupo_id]) groupedByGrupo[candidate.grupo_id] = []
                  groupedByGrupo[candidate.grupo_id].push(candidate.id)
              }
          }

          const promises = Object.entries(groupedByGrupo).map(([grupoId, asigIds]) => {
              return asignacionDocenteService.createBulk({
                  user_id: userId,
                  grupo_id: Number(grupoId),
                  asignatura_grado_ids: asigIds
              })
          })

          await Promise.all(promises)

          toast.success('Asignaciones completadas')
          onSuccess()
          onClose()
      } catch (error: any) {
          toast.error('Error al guardar asignaciones')
          console.error(error)
      } finally {
          setLoading(false)
      }
  }

  // Update available groups when selectedGrado changes logic is inside fetchCandidates mostly, 
  // but ui needs to react. 
  // We can just rely on fetchCandidates re-running.

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Nuevo</DialogTitle>

      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 1, mb: 2 }}>
            <Grid item xs={12} sm={4}>
                <FormControl fullWidth size="small" sx={{ position: 'relative' }}>
                    <InputLabel>Asignatura</InputLabel>
                    <Select
                        value={selectedAsignatura}
                        label="Asignatura"
                        onChange={(e) => setSelectedAsignatura(e.target.value as string)}
                    >
                        {uniqueAsignaturas.map((name) => (
                            <MenuItem key={name} value={name}>{name}</MenuItem>
                        ))}
                    </Select>
                    {selectedAsignatura !== '' && (
                        <IconButton
                            size="small"
                            onClick={(e) => {
                                e.stopPropagation()
                                setSelectedAsignatura('')
                            }}
                            sx={{
                                position: 'absolute',
                                right: 30,
                                top: '50%',
                                transform: 'translateY(-50%)',
                                zIndex: 1
                            }}
                        >
                            <ClearIcon fontSize="small" />
                        </IconButton>
                    )}
                </FormControl>
            </Grid>
            <Grid item xs={12} sm={4}>
                <FormControl fullWidth size="small" sx={{ position: 'relative' }}>
                    <InputLabel>Grado</InputLabel>
                    <Select
                        value={selectedGrado}
                        label="Grado"
                        onChange={(e) => setSelectedGrado(e.target.value as any)}
                    >
                        {uniqueGrados.map((g) => (
                            <MenuItem key={g.id} value={g.id}>{g.nombre}</MenuItem>
                        ))}
                    </Select>
                    {selectedGrado !== '' && (
                        <IconButton
                            size="small"
                            onClick={(e) => {
                                e.stopPropagation()
                                setSelectedGrado('')
                            }}
                            sx={{
                                position: 'absolute',
                                right: 30,
                                top: '50%',
                                transform: 'translateY(-50%)',
                                zIndex: 1
                            }}
                        >
                            <ClearIcon fontSize="small" />
                        </IconButton>
                    )}
                </FormControl>
            </Grid>
            <Grid item xs={12} sm={4}>
                 <FormControl fullWidth size="small" sx={{ position: 'relative' }}>
                    <InputLabel>Grupo</InputLabel>
                    <Select 
                        value={selectedGrupo} 
                        label="Grupo" 
                        onChange={(e) => setSelectedGrupo(e.target.value as any)}
                    >
                         {uniqueGrupos.map((g) => (
                             <MenuItem key={g.id} value={g.id}>
                                {g.nombre}
                             </MenuItem>
                         ))}
                    </Select>
                    {selectedGrupo !== '' && (
                        <IconButton
                            size="small"
                            onClick={(e) => {
                                e.stopPropagation()
                                setSelectedGrupo('')
                            }}
                            sx={{
                                position: 'absolute',
                                right: 30,
                                top: '50%',
                                transform: 'translateY(-50%)',
                                zIndex: 1
                            }}
                        >
                            <ClearIcon fontSize="small" />
                        </IconButton>
                    )}
                </FormControl>
            </Grid>
        </Grid>

        <Box display="flex" alignItems="center" mb={1}>
             <Checkbox 
                checked={displayedCandidates.length > 0 && displayedCandidates.every(c => selectedCandidates.includes(c.uniqueKey))}
                indeterminate={
                    selectedCandidates.length > 0 && 
                    !displayedCandidates.every(c => selectedCandidates.includes(c.uniqueKey)) &&
                    displayedCandidates.some(c => selectedCandidates.includes(c.uniqueKey))
                }
                onChange={handleToggleAll}
             />
             <Typography variant="body2">Seleccionar todo / Deseleccionar todo</Typography>
        </Box>
        
        {loadingResources ? (
             <Box display="flex" justifyContent="center" p={4}><CircularProgress /></Box>
        ) : (
            <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
                <Table stickyHeader size="small">
                    <TableHead>
                        <TableRow>
                            <TableCell padding="checkbox"></TableCell>
                            <TableCell>Materia</TableCell>
                            <TableCell>Grado</TableCell>
                            <TableCell>Grupo</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {displayedCandidates.length > 0 ? displayedCandidates.map((c) => (
                             <TableRow 
                                key={c.uniqueKey} 
                                hover 
                                role="checkbox" 
                                selected={selectedCandidates.includes(c.uniqueKey)}
                                onClick={() => handleToggleSelect(c.uniqueKey)}
                                sx={{ cursor: 'pointer' }}
                            >
                                <TableCell padding="checkbox">
                                    <Checkbox checked={selectedCandidates.includes(c.uniqueKey)} />
                                </TableCell>
                                <TableCell>{c.nombre}</TableCell>
                                <TableCell>{c.grado}</TableCell>
                                <TableCell>{c.grupo}</TableCell>
                             </TableRow>
                        )) : (
                            <TableRow>
                                <TableCell colSpan={4} align="center">
                                    {defaultPeriodoId ? 'No hay asignaturas disponibles para los filtros seleccionados' : 'Seleccione un período lectivo.'}
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
        )}

      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="inherit" disabled={loading}>Cancelar</Button>
        <Button 
            onClick={handleSave} 
            variant="contained" 
            disabled={loading || selectedCandidates.length === 0}
        >
           {loading ? <CircularProgress size={24} color="inherit" /> : 'Guardar Asociaciones'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
