'use client'
import { useCallback, useEffect, useMemo, useState } from 'react'

import Link from 'next/link'

import { useSearchParams } from 'next/navigation'

import {
    Add as AddIcon,
    Delete as DeleteIcon,
    DragIndicator as DragIndicatorIcon,
    Edit as EditIcon,
    FileDownload as FileDownloadIcon,
    History as HistoryIcon,
    PictureAsPdf as PictureAsPdfIcon,
    Refresh as RefreshIcon,
    Search as SearchIcon
} from '@mui/icons-material'
import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    CircularProgress,
    IconButton,
    InputAdornment,
    MenuItem,
    Paper,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    Tooltip,
    Typography
} from '@mui/material'
import { DragDropContext, Draggable, Droppable, DropResult } from '@hello-pangea/dnd'
import { toast } from 'react-hot-toast'

import { PermissionGuard } from '@/components/PermissionGuard'
import AuditoriaModal from '@/features/auditoria/components/AuditoriaModal'
import { useInitialLoad } from '@/hooks/useInitialLoad'
import { usePermissions } from '@/hooks/usePermissions'

import ConfirmDeleteDialog from '@/features/config-grados/components/ConfirmDeleteDialog'
import notAsignaturaGradoService from '../services/notAsignaturaGradoService'

interface Item {
  id: number
  periodo_lectivo?: { id: number; nombre: string }
  grado?: { id: number; nombre: string }
  materia?: { id: number; nombre: string; abreviatura?: string }
  escala?: { id: number; nombre: string }
  incluir_en_promedio?: boolean
  incluir_en_reporte_mined?: boolean
  orden?: number
}

interface Filters {
  periodo_lectivo_id?: string
  grado_id?: string
  materia?: string
}

const AsignaturaGradoPage: React.FC = () => {
  const { hasPermission } = usePermissions()
  const { executeOnce } = useInitialLoad()
  const searchParams = useSearchParams()

  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<Filters>({})
  const [perPage, setPerPage] = useState(15)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)

  const [pdfLoading, setPdfLoading] = useState(false)
  const [excelLoading, setExcelLoading] = useState(false)
  const [hasMounted, setHasMounted] = useState(false)
  const [reordering, setReordering] = useState(false)

  const [auditOpen, setAuditOpen] = useState(false)
  const [auditTarget, setAuditTarget] = useState<{ model: string; id: number } | null>(null)

  const [periodos, setPeriodos] = useState<any[]>([])
  const [grados, setGrados] = useState<any[]>([])

  const canCreate = hasPermission('not_asignatura_grado.create')
  const canUpdate = hasPermission('not_asignatura_grado.update')
  const canDelete = hasPermission('not_asignatura_grado.delete')

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<Item | null>(null)

  const buildParams = useMemo(() => {
    const params = new URLSearchParams()
    params.set('page', String(currentPage))
    params.set('per_page', String(perPage))
    if (filters.periodo_lectivo_id) params.set('periodo_lectivo_id', filters.periodo_lectivo_id)
    if (filters.grado_id) params.set('grado_id', filters.grado_id)
    if (filters.materia && filters.materia.trim()) params.set('materia', filters.materia.trim())
    return params
  }, [currentPage, perPage, filters])

  const canQuery = useMemo(() => Boolean(filters.periodo_lectivo_id && filters.grado_id), [filters])

  const loadCatalogs = useCallback(async () => {
    try {
      const data = await notAsignaturaGradoService.getPeriodosYGrados()
      setPeriodos(Array.isArray(data.periodos) ? data.periodos : [])
      setGrados(Array.isArray(data.grados) ? data.grados : [])
    } catch (error: any) {
      const message = error?.data?.message || 'Error al cargar catálogos'
      toast.error(message)
    }
  }, [])

  const loadItems = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await notAsignaturaGradoService.list(buildParams)
      const list = Array.isArray(data?.data) ? data.data : []
      setItems(list)
      setCurrentPage(data?.current_page || 1)
      setPerPage(data?.per_page || 15)
      setTotalItems(data?.total || 0)
      setTotalPages(Math.max(1, Math.ceil((data?.total || 0) / (data?.per_page || 15))))
    } catch (error: any) {
      const message = error?.data?.message || 'Error al cargar asignaturas por grado'
      setError(message)
      toast.error(message)
      setItems([])
      setTotalItems(0)
      setTotalPages(1)
    } finally {
      setLoading(false)
    }
  }, [buildParams])

  useEffect(() => {
    executeOnce(async () => {
      const periodoQS = searchParams?.get('periodo_lectivo_id')
      const gradoQS = searchParams?.get('grado_id')
      if (periodoQS || gradoQS) {
        setFilters(prev => ({
          ...prev,
          periodo_lectivo_id: periodoQS || prev.periodo_lectivo_id,
          grado_id: gradoQS || prev.grado_id
        }))
      }

      await loadCatalogs()
      setHasMounted(true)
    })
  }, [executeOnce, loadCatalogs, searchParams])

  useEffect(() => {
    if (!hasMounted) return
    if (!canQuery) {
      setItems([])
      setTotalItems(0)
      setTotalPages(1)
      setLoading(false)
      return
    }
    const t = setTimeout(() => {
      loadItems()
    }, 400)
    return () => clearTimeout(t)
  }, [filters, hasMounted, loadItems, canQuery])

  const handleRefresh = () => {
    if (!canQuery) return
    loadItems()
  }

  const handleExportPDF = async () => {
    setPdfLoading(true)
    try {
      if (!canQuery) return
      const resp = await notAsignaturaGradoService.exportPDF(buildParams)
      const url = window.URL.createObjectURL(resp)
      window.open(url, '_blank')
      setTimeout(() => window.URL.revokeObjectURL(url), 1000)
    } catch (error: any) {
      if (error?.status === 401) {
        toast.error('Sesión expirada. Por favor, inicie sesión nuevamente.')
        window.location.href = '/auth/login'
        return
      }
      toast.error('Error al generar el PDF. Intente nuevamente.')
    } finally {
      setPdfLoading(false)
    }
  }

  const handleExportExcel = async () => {
    setExcelLoading(true)
    try {
      if (!canQuery) return
      const blob = await notAsignaturaGradoService.exportExcel(buildParams)
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'Asignaturas_por_Grado.xlsx'
      a.click()
      setTimeout(() => window.URL.revokeObjectURL(url), 1000)
    } catch (error: any) {
      if (error?.status === 401) {
        toast.error('Sesión expirada. Por favor, inicie sesión nuevamente.')
        window.location.href = '/auth/login'
        return
      }
      const message = error?.data?.message || 'Error al exportar Excel'
      toast.error(message)
    } finally {
      setExcelLoading(false)
    }
  }

  const handleViewChanges = (id: number) => {
    setAuditTarget({ model: 'not_asignatura_grado', id })
    setAuditOpen(true)
  }

  const handleDelete = (item: Item) => {
    if (!canDelete) {
      toast.error('No tienes permisos para eliminar')
      return
    }
    setItemToDelete(item)
    setDeleteDialogOpen(true)
  }

  const cancelDelete = () => {
    setDeleteDialogOpen(false)
    setItemToDelete(null)
  }

  const confirmDelete = async () => {
    if (!itemToDelete) return
    setDeleteLoading(true)
    try {
      await notAsignaturaGradoService.remove(itemToDelete.id)
      toast.success('Registro eliminado')
      cancelDelete()
      loadItems()
    } catch (error: any) {
      const message = error?.data?.message || 'Error al eliminar'
      toast.error(message)
    } finally {
      setDeleteLoading(false)
    }
  }

  const onDragEnd = async (result: DropResult) => {
      const { destination, source } = result

      if (!destination || destination.index === source.index) {
          return
      }

      setReordering(true)
      const newItems = Array.from(items)
      const [reorderedItem] = newItems.splice(source.index, 1)
      newItems.splice(destination.index, 0, reorderedItem)

      // Optimistic update
      setItems(newItems)

      try {
          const payload = newItems.map((item, index) => ({
              id: item.id,
              orden: index + 1 // We could use index + factor if paginated reordering is needed
          }))

          await notAsignaturaGradoService.reorder(payload)
          toast.success('Orden de asignaturas actualizado')
      } catch (error: any) {
          const message = error?.data?.message || 'Error al actualizar el orden'
          toast.error(message)
          // Rollback on error?
          loadItems()
      } finally {
          setReordering(false)
      }
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant='h4' component='h1' gutterBottom>
          Asignaturas por Grado
        </Typography>
        <Typography variant='body1' color='text.secondary'>
          Configuración de asignaturas vinculadas a grado y periodo lectivo. Arrastre para reordenar.
        </Typography>
      </Box>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box
            sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}
          >
            <Stack direction='row' spacing={2} sx={{ flex: 1, alignItems: 'center' }}>
              <TextField
                select
                size='small'
                label='Periodo Lectivo'
                value={periodos.some(p => String(p.id) === filters.periodo_lectivo_id) ? filters.periodo_lectivo_id : ''}
                onChange={e => setFilters(prev => ({ ...prev, periodo_lectivo_id: e.target.value }))}
                sx={{ minWidth: 220 }}
              >
                <MenuItem value=''>Todos</MenuItem>
                {periodos.map(p => (
                  <MenuItem key={p.id} value={String(p.id)}>
                    {p.nombre || p.label || p.descripcion || p.id}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                select
                size='small'
                label='Grado'
                value={grados.some(g => String(g.id) === filters.grado_id) ? filters.grado_id : ''}
                onChange={e => setFilters(prev => ({ ...prev, grado_id: e.target.value }))}
                sx={{ minWidth: 220 }}
              >
                <MenuItem value=''>Todos</MenuItem>
                {grados.map(g => (
                  <MenuItem key={g.id} value={String(g.id)}>
                    {g.nombre || g.label || g.descripcion || g.id}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                size='small'
                placeholder='Buscar materia...'
                value={filters.materia || ''}
                onChange={e => setFilters(prev => ({ ...prev, materia: e.target.value }))}
                sx={{ minWidth: 300 }}
                disabled={!canQuery}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position='start'>
                      <SearchIcon />
                    </InputAdornment>
                  )
                }}
              />
            </Stack>

            <Stack direction='row' spacing={1}>
              <Tooltip title='Actualizar'>
                <span>
                  <IconButton onClick={handleRefresh} disabled={loading || !canQuery}>
                    <RefreshIcon />
                  </IconButton>
                </span>
              </Tooltip>

              <PermissionGuard permission='not_asignatura_grado.index'>
                <Tooltip title='Exportar PDF'>
                  <span>
                    <Button
                      variant='outlined'
                      startIcon={<PictureAsPdfIcon />}
                      onClick={handleExportPDF}
                      disabled={pdfLoading || !canQuery}
                    >
                      {pdfLoading ? <CircularProgress size={18} /> : 'PDF'}
                    </Button>
                  </span>
                </Tooltip>
                <Tooltip title='Exportar Excel'>
                  <span>
                    <Button
                      variant='outlined'
                      startIcon={<FileDownloadIcon />}
                      onClick={handleExportExcel}
                      disabled={excelLoading || !canQuery}
                    >
                      {excelLoading ? <CircularProgress size={18} /> : 'Excel'}
                    </Button>
                  </span>
                </Tooltip>
              </PermissionGuard>

              {canCreate && (
                <Link
                  href={`/academico/asignaturas-por-grado/create${
                    filters.periodo_lectivo_id && filters.grado_id
                      ? `?periodo_lectivo_id=${filters.periodo_lectivo_id}&grado_id=${filters.grado_id}`
                      : ''
                  }`}
                >
                  <Button
                    variant='contained'
                    startIcon={<AddIcon />}
                    disabled={loading || !filters.periodo_lectivo_id || !filters.grado_id}
                  >
                    Nuevo
                  </Button>
                </Link>
              )}
            </Stack>
          </Box>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          {error && (
            <Alert severity='error' sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : !canQuery ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant='h6' color='text.secondary' gutterBottom>
                Seleccione periodo lectivo y grado
              </Typography>
              <Typography variant='body2' color='text.secondary'>
                Los datos se cargarán una vez que ambos filtros estén seleccionados
              </Typography>
            </Box>
          ) : items.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant='h6' color='text.secondary' gutterBottom>
                No se encontraron registros
              </Typography>
              <Typography variant='body2' color='text.secondary'>
                Ajuste los filtros o cree un nuevo registro
              </Typography>
            </Box>
          ) : (
            <DragDropContext onDragEnd={onDragEnd}>
                <TableContainer component={Paper} variant='outlined'>
                <Table size='small'>
                    <TableHead>
                    <TableRow>
                        <TableCell width={50}></TableCell>
                        <TableCell>Materia</TableCell>
                        <TableCell>Escala</TableCell>
                        <TableCell>Incluir en promedio</TableCell>
                        <TableCell>Incluir en MINED</TableCell>
                        <TableCell align='center' width={260}>
                        Acciones
                        </TableCell>
                    </TableRow>
                    </TableHead>
                    <Droppable droppableId='subjects'>
                        {(provided) => (
                            <TableBody {...provided.droppableProps} ref={provided.innerRef}>
                            {items.map((item, index) => (
                                <Draggable 
                                    key={item.id} 
                                    draggableId={String(item.id)} 
                                    index={index}
                                    isDragDisabled={reordering || !canUpdate}
                                >
                                    {(provided, snapshot) => (
                                        <TableRow 
                                            ref={provided.innerRef}
                                            {...provided.draggableProps}
                                            hover
                                            style={{
                                                ...provided.draggableProps.style,
                                                backgroundColor: snapshot.isDragging ? 'rgba(0,0,0,0.05)' : 'inherit'
                                            }}
                                        >
                                            <TableCell {...provided.dragHandleProps}>
                                                <DragIndicatorIcon color='action' fontSize='small' />
                                            </TableCell>
                                            <TableCell>{item?.materia?.nombre || ''}</TableCell>
                                            <TableCell>{item?.escala?.nombre || ''}</TableCell>
                                            <TableCell>{item?.incluir_en_promedio ? 'Sí' : 'No'}</TableCell>
                                            <TableCell>{item?.incluir_en_reporte_mined ? 'Sí' : 'No'}</TableCell>
                                            <TableCell align='center'>
                                                <Stack direction='row' spacing={0.5} justifyContent='center'>
                                                <PermissionGuard permission='auditoria.ver'>
                                                    <Tooltip title='Auditoría'>
                                                    <IconButton size='small' onClick={() => handleViewChanges(item.id)} color='info'>
                                                        <HistoryIcon fontSize='small' />
                                                    </IconButton>
                                                    </Tooltip>
                                                </PermissionGuard>
                                                <Tooltip title='Editar'>
                                                    <Link href={`/academico/asignaturas-por-grado/edit/${item.id}`}>
                                                    <IconButton size='small' color='primary'>
                                                        <EditIcon fontSize='small' />
                                                    </IconButton>
                                                    </Link>
                                                </Tooltip>
                                                {canDelete && (
                                                    <Tooltip title='Eliminar'>
                                                    <IconButton size='small' onClick={() => handleDelete(item)} color='error'>
                                                        <DeleteIcon fontSize='small' />
                                                    </IconButton>
                                                    </Tooltip>
                                                )}
                                                </Stack>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </Draggable>
                            ))}
                            {provided.placeholder}
                            </TableBody>
                        )}
                    </Droppable>
                </Table>
                </TableContainer>
            </DragDropContext>
          )}
        </CardContent>
      </Card>

      <AuditoriaModal
        open={auditOpen}
        model={auditTarget?.model || ''}
        id={auditTarget?.id || 0}
        onClose={() => setAuditOpen(false)}
      />
      <ConfirmDeleteDialog
        open={deleteDialogOpen}
        onClose={cancelDelete}
        onConfirm={confirmDelete}
        title={'Confirmar eliminación'}
        message={`¿Estás seguro de eliminar la asignatura "${itemToDelete?.materia?.nombre || ''}" del grado "${itemToDelete?.grado?.nombre || ''}"? Esta acción no se puede deshacer.`}
        loading={deleteLoading}
      />
    </Box>
  )
}

export default AsignaturaGradoPage
