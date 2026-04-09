'use client'
import { useCallback, useEffect, useMemo, useState } from 'react'

import {
  Add as AddIcon,
  Delete as DeleteIcon,
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
import { toast } from 'react-hot-toast'

import { PermissionGuard } from '@/components/PermissionGuard'
import AuditoriaModal from '@/features/auditoria/components/AuditoriaModal'
import { useInitialLoad } from '@/hooks/useInitialLoad'
import { usePermissions } from '@/hooks/usePermissions'

import AsignaturaModal from '../components/AsignaturaModal'
import DeleteAsignaturaConfirmDialog from '../components/DeleteAsignaturaConfirmDialog'
import asignaturasService from '../services/asignaturasService'
import type { Asignatura, AsignaturasTableFilters } from '../types'

const AsignaturasPage: React.FC = () => {
  const { hasPermission } = usePermissions()
  const { executeOnce } = useInitialLoad()

  const [items, setItems] = useState<Asignatura[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const [perPage, setPerPage] = useState(15)

  const [filters, setFilters] = useState<AsignaturasTableFilters>({ search: '' })

  const [modalState, setModalState] = useState<{ open: boolean; mode: 'create' | 'edit'; asignatura?: Asignatura }>({
    open: false,
    mode: 'create'
  })
  const [deleteState, setDeleteState] = useState<{ open: boolean; asignatura?: Asignatura }>({ open: false })

  const [auditOpen, setAuditOpen] = useState(false)
  const [auditTarget, setAuditTarget] = useState<{ model: string; id: number } | null>(null)

  const [pdfLoading, setPdfLoading] = useState(false)
  const [excelLoading, setExcelLoading] = useState(false)
  const [hasMounted, setHasMounted] = useState(false)

  const canCreate = hasPermission('not_materias.create')
  const canEdit = hasPermission('not_materias.update')
  const canDelete = hasPermission('not_materias.delete')

  const buildParams = useMemo(() => {
    const params = new URLSearchParams()
    params.set('page', String(currentPage))
    params.set('per_page', String(perPage))
    if (filters.search.trim()) params.set('nombre', filters.search.trim())
    return params
  }, [currentPage, perPage, filters])

  const loadItems = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await asignaturasService.list(buildParams)
      setItems(Array.isArray(data.data) ? data.data : [])
      setCurrentPage(data.current_page || 1)
      setPerPage(data.per_page || 15)
      setTotalItems(data.total || 0)
      setTotalPages(Math.max(1, Math.ceil((data.total || 0) / (data.per_page || 15))))
    } catch (error: any) {
      const message = error?.data?.message || 'Error al cargar asignaturas'
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
      await loadItems()
      setHasMounted(true)
    })
  }, [executeOnce, loadItems])

  useEffect(() => {
    if (!hasMounted) return
    if (!filters.search.trim()) return
    const t = setTimeout(() => {
      loadItems()
    }, 500)
    return () => clearTimeout(t)
  }, [filters.search, hasMounted, loadItems])

  useEffect(() => {
    if (!hasMounted) return
    if (currentPage !== 1 || perPage !== 15) {
      loadItems()
    }
  }, [currentPage, perPage, hasMounted, loadItems])

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value
    setFilters(prev => ({ ...prev, search: value }))
    setCurrentPage(1)
  }

  const handleRefresh = () => {
    loadItems()
  }

  const handleCreate = () => {
    if (!canCreate) {
      toast.error('No tienes permisos para crear asignaturas')
      return
    }
    setModalState({ open: true, mode: 'create' })
  }

  const handleEdit = (item: Asignatura) => {
    if (!canEdit) {
      toast.error('No tienes permisos para editar asignaturas')
      return
    }
    setModalState({ open: true, mode: 'edit', asignatura: item })
  }

  const handleDelete = (item: Asignatura) => {
    if (!canDelete) {
      toast.error('No tienes permisos para eliminar asignaturas')
      return
    }
    setDeleteState({ open: true, asignatura: item })
  }

  const handleViewChanges = (model: string, id: number) => {
    setAuditTarget({ model, id })
    setAuditOpen(true)
  }

  const handleExportPDF = async () => {
    setPdfLoading(true)
    try {
      const resp = await asignaturasService.exportPDF(
        new URLSearchParams(filters.search ? { nombre: filters.search } : ({} as any))
      )
      const blob = new Blob([resp.data], { type: 'application/pdf' })
      const url = window.URL.createObjectURL(blob)
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
      const blob = await asignaturasService.exportExcel(
        new URLSearchParams(filters.search ? { nombre: filters.search } : ({} as any))
      )
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'Asignaturas.xlsx'
      a.click()
      setTimeout(() => window.URL.revokeObjectURL(url), 1000)
    } catch (error: any) {
      if (error?.status === 401) {
        toast.error('Sesión expirada. Por favor, inicie sesión nuevamente.')
        window.location.href = '/auth/login'
        return
      }
      toast.error('Error al exportar a Excel. Intente nuevamente.')
    } finally {
      setExcelLoading(false)
    }
  }

  const handleCloseModal = () => setModalState({ open: false, mode: 'create' })
  const handleCloseDeleteModal = () => setDeleteState({ open: false })

  const handleSuccess = () => loadItems()

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant='h4' component='h1' gutterBottom>
          Asignaturas
        </Typography>
        <Typography variant='body1' color='text.secondary'>
          Gestión de asignaturas
        </Typography>
      </Box>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box
            sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}
          >
            <Stack direction='row' spacing={2} sx={{ flex: 1 }}>
              <TextField
                size='small'
                placeholder='Buscar por nombre...'
                value={filters.search}
                onChange={handleSearch}
                sx={{ minWidth: 300 }}
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
                  <IconButton onClick={handleRefresh} disabled={loading}>
                    <RefreshIcon />
                  </IconButton>
                </span>
              </Tooltip>
              <PermissionGuard permission='not_materias.index'>
                <Tooltip title='Exportar PDF'>
                  <span>
                    <Button
                      variant='outlined'
                      startIcon={<PictureAsPdfIcon />}
                      onClick={handleExportPDF}
                      disabled={pdfLoading}
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
                      disabled={excelLoading}
                    >
                      {excelLoading ? <CircularProgress size={18} /> : 'Excel'}
                    </Button>
                  </span>
                </Tooltip>
              </PermissionGuard>
              {canCreate && (
                <Button variant='contained' startIcon={<AddIcon />} onClick={handleCreate} disabled={loading}>
                  Nueva Asignatura
                </Button>
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
          ) : items.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant='h6' color='text.secondary' gutterBottom>
                No se encontraron asignaturas
              </Typography>
              <Typography variant='body2' color='text.secondary'>
                {filters.search ? 'Intenta con otros términos de búsqueda' : 'Crea tu primera asignatura'}
              </Typography>
            </Box>
          ) : (
            <TableContainer component={Paper} variant='outlined'>
              <Table size='small'>
                <TableHead>
                  <TableRow>
                    <TableCell>Nombre</TableCell>
                    <TableCell>Abreviatura</TableCell>
                    <TableCell align='center' width={180}>
                      Acciones
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {items.map(item => (
                    <TableRow key={item.id} hover>
                      <TableCell>{item.nombre}</TableCell>
                      <TableCell>{item.abreviatura}</TableCell>
                      <TableCell align='center'>
                        <Stack direction='row' spacing={0.5} justifyContent='center'>
                          <PermissionGuard permission='auditoria.ver'>
                            <Tooltip title='Auditoría'>
                              <IconButton
                                size='small'
                                onClick={() => handleViewChanges('not_materias', item.id)}
                                color='info'
                              >
                                <HistoryIcon fontSize='small' />
                              </IconButton>
                            </Tooltip>
                          </PermissionGuard>
                          {canEdit && (
                            <Tooltip title='Editar'>
                              <IconButton size='small' onClick={() => handleEdit(item)} color='primary'>
                                <EditIcon fontSize='small' />
                              </IconButton>
                            </Tooltip>
                          )}
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
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      <AsignaturaModal
        open={modalState.open}
        mode={modalState.mode}
        asignatura={modalState.asignatura}
        onClose={handleCloseModal}
        onSuccess={handleSuccess}
      />

      <DeleteAsignaturaConfirmDialog
        open={deleteState.open}
        asignatura={deleteState.asignatura || null}
        onClose={handleCloseDeleteModal}
        onSuccess={handleSuccess}
      />

      <AuditoriaModal
        open={auditOpen}
        model={auditTarget?.model || ''}
        id={auditTarget?.id || 0}
        onClose={() => setAuditOpen(false)}
      />
    </Box>
  )
}

export default AsignaturasPage
