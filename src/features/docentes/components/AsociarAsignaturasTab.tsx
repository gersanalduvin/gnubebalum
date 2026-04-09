
import { configGradoService } from '@/features/config-grados/services/configGradoService'
import { asignacionDocenteService } from '@/features/docentes/services/asignacionDocenteService'
import type { NotAsignaturaGradoDocente } from '@/features/docentes/types/asignaciones'
import { periodoLectivoService } from '@/features/periodo-lectivo/services/periodoLectivoService'
import {
  Add as AddIcon,
  Clear as ClearIcon,
  Print as PrintIcon
} from '@mui/icons-material'
import {
  Box,
  Button,
  Checkbox,
  CircularProgress,
  FormControl,
  Grid,
  IconButton,
  InputAdornment,
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
  TextField,
  Typography
} from '@mui/material'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'react-hot-toast'
import AsignarAsignaturaModal from './AsignarAsignaturaModal'
import SeleccionarDocenteModal from './SeleccionarDocenteModal'

interface Props {
  docenteId: number
}

export default function AsociarAsignaturasTab({ docenteId }: Props) {
  const [loading, setLoading] = useState(false)
  const [printing, setPrinting] = useState(false)
  const [asignaciones, setAsignaciones] = useState<NotAsignaturaGradoDocente[]>([])
  
  // Modals
  const [modalAsignarOpen, setModalAsignarOpen] = useState(false)
  const [modalPermisosOpen, setModalPermisosOpen] = useState(false)
  const [modalDocenteOpen, setModalDocenteOpen] = useState(false)
  const [selectedAsignacion, setSelectedAsignacion] = useState<NotAsignaturaGradoDocente | null>(null)

  // Filters
  const [periodos, setPeriodos] = useState<any[]>([])
  const [grados, setGrados] = useState<any[]>([])
  
  const [selectedPeriodo, setSelectedPeriodo] = useState<number | ''>('')
  const [selectedGrado, setSelectedGrado] = useState<number | ''>('')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedRows, setSelectedRows] = useState<number[]>([]) // IDs

  const loadPeriodos = async () => {
       try {
        const res = await periodoLectivoService.getAllPeriodosLectivos()
        if (res.success && Array.isArray(res.data)) setPeriodos(res.data)
    } catch (e) {
        console.error(e)
    }
  }

  const loadData = useCallback(async () => {
    if (!selectedPeriodo) {
        setGrados([])
        setAsignaciones([])
        return
    }

    setLoading(true)
    try {
      const [gArg, aArg] = await Promise.all([
          configGradoService.getAll(1, { per_page: 100 }), // You might want to pass selectedPeriodo if API supports it
          asignacionDocenteService.getByDocente(docenteId)
      ])
      
      if (gArg && Array.isArray(gArg.data)) setGrados(gArg.data)

      setAsignaciones(aArg)
    } catch (error) {
      console.error(error)
      toast.error('Error al cargar datos')
    } finally {
      setLoading(false)
    }
  }, [docenteId, selectedPeriodo])

  const fetchedPeriodos = useRef(false)

  useEffect(() => {
    if (fetchedPeriodos.current) return
    fetchedPeriodos.current = true
    loadPeriodos()
  }, []) // Mount only

  useEffect(() => {
    loadData()
  }, [loadData])



  const filteredAsignaciones = useMemo(() => {
      return asignaciones.filter(item => {
          // Filter by Period (using Grupo's period if available, or just keeping all if not strictly linked)
          // Ideally backend response has access to Period info. We assume Grupo has periodo_lectivo_id if we fetched it properly.
          // Note: The Current Interface NotAsignaturaGradoDocente -> grupo (ConfigGrupo) might not have periodo_lectivo_id explicitly typed but it's in the model.
          // We will filter if the property exists.
          
          if (selectedPeriodo && (item.grupo as any)?.periodo_lectivo_id) {
              if ((item.grupo as any).periodo_lectivo_id !== selectedPeriodo) return false
          }

          if (selectedGrado) {
              if ((item.grupo as any)?.grado_id !== selectedGrado) return false
          }

          if (searchTerm) {
              const term = searchTerm.toLowerCase()
              const subj = item.asignatura_grado?.asignatura?.nombre?.toLowerCase() || ''
              const grado = item.grupo?.grado?.nombre?.toLowerCase() || ''
              const grupo = item.grupo?.seccion?.nombre?.toLowerCase() || ''
              if (!subj.includes(term) && !grado.includes(term) && !grupo.includes(term)) return false
          }

          return true
      }).sort((a, b) => {
          const nameA = a.asignatura_grado?.asignatura?.nombre?.toLowerCase() || ''
          const nameB = b.asignatura_grado?.asignatura?.nombre?.toLowerCase() || ''
          return nameA.localeCompare(nameB)
      })
  }, [asignaciones, selectedPeriodo, selectedGrado, searchTerm])

  const handleAssignToDocente = async (targetDocente: any) => {
      const assignmentsToAssign = asignaciones.filter(a => selectedRows.includes(a.id))
      
      const groupedByGrupo: Record<number, number[]> = {}
          
      for (const asig of assignmentsToAssign) {
          if (asig.grupo_id) {
              if (!groupedByGrupo[asig.grupo_id]) groupedByGrupo[asig.grupo_id] = []
              groupedByGrupo[asig.grupo_id].push(asig.asignatura_grado_id)
          }
      }

      setLoading(true)
      try {
          const promises = Object.entries(groupedByGrupo).map(([grupoId, asigIds]) => {
              return asignacionDocenteService.createBulk({
                  user_id: targetDocente.id,
                  grupo_id: Number(grupoId),
                  asignatura_grado_ids: asigIds
              })
          })

          await Promise.all(promises)
          toast.success(`Asignaturas asignadas correctamente a ${targetDocente.primer_nombre} ${targetDocente.primer_apellido}`)
          setSelectedRows([])
          loadData()
      } catch (e) {
          console.error(e)
          toast.error('Error al asignar las asignaturas')
      } finally {
          setLoading(false)
      }
  }



  const formatFecha = (fecha: string | null) => {
      if (!fecha) return '-'
      return new Date(fecha).toLocaleDateString()
  }

  const handleToggleSelectAll = () => {
      if (selectedRows.length === filteredAsignaciones.length) {
          setSelectedRows([])
      } else {
          setSelectedRows(filteredAsignaciones.map(a => a.id))
      }
  }

  const handleToggleRow = (id: number) => {
      setSelectedRows(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])
  }

  const handlePrint = async () => {
    if (!selectedPeriodo) return
    setPrinting(true)
    try {
      const blob = await asignacionDocenteService.exportPdf(docenteId, Number(selectedPeriodo))
      const url = window.URL.createObjectURL(blob)
      window.open(url, '_blank')
      setTimeout(() => window.URL.revokeObjectURL(url), 1000)
    } catch (error) {
      console.error(error)
      toast.error('Error al generar el PDF')
    } finally {
      setPrinting(false)
    }
  }

  return (
    <Box p={3}>
      {/* Filters Header */}
      <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={12} sm={6}>
                <FormControl fullWidth size="small" sx={{ position: 'relative' }}>
                    <InputLabel>Período Lectivo</InputLabel>
                    <Select
                        value={selectedPeriodo}
                        label="Período Lectivo"
                        onChange={(e) => setSelectedPeriodo(e.target.value as number)}
                    >
                        {periodos.map((p: any) => (
                            <MenuItem key={p.id} value={p.id}>{p.nombre}</MenuItem>
                        ))}
                    </Select>
                    {selectedPeriodo !== '' && (
                        <IconButton
                            size="small"
                            onClick={(e) => {
                                e.stopPropagation()
                                setSelectedPeriodo('')
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
          <Grid item xs={12} sm={6}>
                <FormControl fullWidth size="small" sx={{ position: 'relative' }}>
                    <InputLabel>Grado</InputLabel>
                    <Select
                        value={selectedGrado}
                        label="Grado"
                        onChange={(e) => setSelectedGrado(e.target.value as any)}
                    >
                        {grados.map((g: any) => (
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
      </Grid>
      
      {/* Search and Action Bar */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2} gap={2}>
           <TextField
                size="small"
                placeholder="Buscar"
                fullWidth
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                    startAdornment: <InputAdornment position="start"></InputAdornment>
                }}
           />

               <Box display="flex" gap={1}>
                   {selectedRows.length > 0 && (
                       <Button 
                          variant="outlined" 
                          color="secondary"
                          onClick={() => setModalDocenteOpen(true)}
                          sx={{ whiteSpace: 'nowrap' }}
                       >
                          Asignar ({selectedRows.length})
                       </Button>
                   )}
                   {selectedPeriodo !== '' && (
                    <>
                        <Button 
                           variant="outlined" 
                           startIcon={printing ? <CircularProgress size={20} /> : <PrintIcon />} 
                           onClick={handlePrint}
                           disabled={printing}
                           sx={{ whiteSpace: 'nowrap' }}
                        >
                           Imprimir
                        </Button>
                        <Button 
                           variant="contained" 
                           startIcon={<AddIcon />} 
                           onClick={() => setModalAsignarOpen(true)}
                           sx={{ whiteSpace: 'nowrap' }}
                        >
                           Nuevo
                        </Button>
                    </>
                   )}
               </Box>
      </Box>

      {/* Select All Checkbox */}
      <Box display="flex" alignItems="center" mb={1}>
           <Checkbox 
                checked={filteredAsignaciones.length > 0 && selectedRows.length === filteredAsignaciones.length}
                indeterminate={selectedRows.length > 0 && selectedRows.length < filteredAsignaciones.length}
                onChange={handleToggleSelectAll}
           />
           <Typography variant="body2">Seleccionar todo / Deseleccionar todo</Typography>
      </Box>

      {loading ? (
        <Box display="flex" justifyContent="center" p={4}>
          <CircularProgress />
        </Box>
      ) : filteredAsignaciones.length === 0 ? (
        <Box textAlign="center" p={4} bgcolor="action.hover" borderRadius={2}>
            <Typography color="text.secondary">No se encontraron asignaciones.</Typography>
        </Box>
      ) : (
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox"></TableCell>
                <TableCell>Nombre</TableCell>
                <TableCell>Grupo</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredAsignaciones.map((asig) => (
                <TableRow key={asig.id} hover>
                   <TableCell padding="checkbox">
                        <Checkbox 
                            checked={selectedRows.includes(asig.id)} 
                            onChange={() => handleToggleRow(asig.id)}
                        />
                   </TableCell>
                  <TableCell>
                     {asig.asignatura_grado?.asignatura?.nombre ?? asig.asignatura_grado?.materia?.nombre ?? 'Sin Nombre'}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight="bold">
                        {asig.grupo?.grado?.nombre} {asig.grupo?.seccion?.nombre}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                        {asig.grupo?.turno?.nombre}
                    </Typography>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <AsignarAsignaturaModal
        open={modalAsignarOpen}
        onClose={() => setModalAsignarOpen(false)}
        onSuccess={loadData}
        userId={docenteId}
        defaultPeriodoId={typeof selectedPeriodo === 'number' ? selectedPeriodo : undefined}
      />

      <SeleccionarDocenteModal 
        open={modalDocenteOpen} 
        onClose={() => setModalDocenteOpen(false)}
        onConfirm={handleAssignToDocente}
        excludeDocenteId={docenteId}
      />
    </Box>
  )
}

