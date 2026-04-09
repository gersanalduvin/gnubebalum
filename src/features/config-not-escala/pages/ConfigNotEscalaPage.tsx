'use client'
import { Fragment, useCallback, useEffect, useMemo, useState } from 'react'

import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  ExpandLess as ExpandLessIcon,
  ExpandMore as ExpandMoreIcon,
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
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
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

import DeleteEscalaConfirmDialog from '../components/DeleteEscalaConfirmDialog'
import EscalaModal from '../components/EscalaModal'
import configNotEscalaService from '../services/configNotEscalaService'
import type { Escala, EscalasTableFilters } from '../types'

const ConfigNotEscalaPage: React.FC = () => {
  const { hasPermission } = usePermissions()
  const { executeOnce } = useInitialLoad()

  const [escalas, setEscalas] = useState<Escala[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const [perPage, setPerPage] = useState(15)

  const [filters, setFilters] = useState<EscalasTableFilters>({ search: '' })

  const [modalState, setModalState] = useState<{ open: boolean; mode: 'create' | 'edit'; escala?: Escala }>({
    open: false,
    mode: 'create'
  })
  const [deleteState, setDeleteState] = useState<{ open: boolean; escala?: Escala }>({ open: false })

  const [expandedRows, setExpandedRows] = useState<Record<number, boolean>>({})

  const [auditOpen, setAuditOpen] = useState(false)
  const [auditTarget, setAuditTarget] = useState<{ model: string; id: number } | null>(null)

  const [pdfLoading, setPdfLoading] = useState(false)
  const [excelLoading, setExcelLoading] = useState(false)
  const [hasMounted, setHasMounted] = useState(false)

  const canCreate = hasPermission('config_not_escala.create')
  const canEdit = hasPermission('config_not_escala.update')
  const canDelete = hasPermission('config_not_escala.delete')

  const buildParams = useMemo(() => {
    const params = new URLSearchParams()
    params.set('page', String(currentPage))
    params.set('per_page', String(perPage))
    if (filters.search.trim()) params.set('notas', filters.search.trim())
    return params
  }, [currentPage, perPage, filters])

  const loadEscalas = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await configNotEscalaService.list(buildParams)
      setEscalas(Array.isArray(data.data) ? data.data : [])
      setCurrentPage(data.current_page || 1)
      setPerPage(data.per_page || 15)
      setTotalItems(data.total || 0)
      setTotalPages(Math.max(1, Math.ceil((data.total || 0) / (data.per_page || 15))))
    } catch (error: any) {
      const message = error?.data?.message || 'Error al cargar escalas'
      setError(message)
      toast.error(message)
      setEscalas([])
      setTotalItems(0)
      setTotalPages(1)
    } finally {
      setLoading(false)
    }
  }, [buildParams])

  useEffect(() => {
    executeOnce(async () => {
      await loadEscalas()
      setHasMounted(true)
    })
  }, [executeOnce, loadEscalas])

  useEffect(() => {
    if (!hasMounted) return
    if (!filters.search.trim()) return
    const t = setTimeout(() => {
      loadEscalas()
    }, 500)
    return () => clearTimeout(t)
  }, [filters.search, hasMounted, loadEscalas])

  useEffect(() => {
    if (!hasMounted) return
    if (currentPage !== 1 || perPage !== 15) {
      loadEscalas()
    }
  }, [currentPage, perPage, hasMounted, loadEscalas])

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value
    setFilters(prev => ({ ...prev, search: value }))
    setCurrentPage(1)
  }

  const handleRefresh = () => {
    loadEscalas()
  }

  const handleCreate = () => {
    if (!canCreate) {
      toast.error('No tienes permisos para crear escalas')
      return
    }
    setModalState({ open: true, mode: 'create' })
  }

  const handleEdit = (escala: Escala) => {
    if (!canEdit) {
      toast.error('No tienes permisos para editar escalas')
      return
    }
    setModalState({ open: true, mode: 'edit', escala })
  }

  const handleDelete = (escala: Escala) => {
    if (!canDelete) {
      toast.error('No tienes permisos para eliminar escalas')
      return
    }
    setDeleteState({ open: true, escala })
  }

  const handleViewChanges = (model: string, id: number) => {
    setAuditTarget({ model, id })
    setAuditOpen(true)
  }

  const toggleRow = (id: number) => {
    setExpandedRows(prev => ({ ...prev, [id]: !prev[id] }))
  }

  const handleExportPDF = async () => {
    setPdfLoading(true)
    try {
      const resp = await configNotEscalaService.exportPDF(
        new URLSearchParams(filters.search ? { notas: filters.search } : ({} as any))
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
      const blob = await configNotEscalaService.exportExcel(
        new URLSearchParams(filters.search ? { notas: filters.search } : ({} as any))
      )
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'Escalas.xlsx'
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

  const handleSuccess = () => loadEscalas()

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant='h4' component='h1' gutterBottom>
          Escalas de Notas
        </Typography>
        <Typography variant='body1' color='text.secondary'>
          Gestión de escalas y sus detalles
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
                placeholder='Buscar por notas...'
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
              <PermissionGuard permission='config_not_escala.index'>
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
                  Nueva Escala
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
          ) : escalas.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant='h6' color='text.secondary' gutterBottom>
                No se encontraron escalas
              </Typography>
              <Typography variant='body2' color='text.secondary'>
                {filters.search ? 'Intenta con otros términos de búsqueda' : 'Crea tu primera escala'}
              </Typography>
            </Box>
          ) : (
            <TableContainer component={Paper} variant='outlined'>
              <Table size='small'>
                <TableHead>
                  <TableRow>
                    <TableCell width={60}></TableCell>
                    <TableCell>Nombre</TableCell>
                    <TableCell align='center' width={180}>
                      Acciones
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {escalas.map(escala => (
                    <Fragment key={escala.id}>
                      <TableRow hover>
                        <TableCell>
                          <IconButton size='small' onClick={() => toggleRow(escala.id)}>
                            {expandedRows[escala.id] ? (
                              <ExpandLessIcon fontSize='small' />
                            ) : (
                              <ExpandMoreIcon fontSize='small' />
                            )}
                          </IconButton>
                        </TableCell>
                        <TableCell>{escala.nombre}</TableCell>
                        <TableCell align='center'>
                          <Stack direction='row' spacing={0.5} justifyContent='center'>
                            <PermissionGuard permission='auditoria.ver'>
                              <Tooltip title='Auditoría'>
                                <IconButton
                                  size='small'
                                  onClick={() => handleViewChanges('config_not_escala', escala.id)}
                                  color='info'
                                >
                                  <HistoryIcon fontSize='small' />
                                </IconButton>
                              </Tooltip>
                            </PermissionGuard>
                            {canEdit && (
                              <Tooltip title='Editar'>
                                <IconButton size='small' onClick={() => handleEdit(escala)} color='primary'>
                                  <EditIcon fontSize='small' />
                                </IconButton>
                              </Tooltip>
                            )}
                            {canDelete && (
                              <Tooltip title='Eliminar'>
                                <IconButton size='small' onClick={() => handleDelete(escala)} color='error'>
                                  <DeleteIcon fontSize='small' />
                                </IconButton>
                              </Tooltip>
                            )}
                          </Stack>
                        </TableCell>
                      </TableRow>
                      {expandedRows[escala.id] && (
                        <TableRow>
                          <TableCell colSpan={3} sx={{ backgroundColor: 'action.hover' }}>
                            <Dialog
                              open
                              fullWidth
                              onClose={() => setExpandedRows(prev => ({ ...prev, [escala.id]: false }))}
                            >
                              <DialogTitle>Detalles de "{escala.nombre}"</DialogTitle>
                              <DialogContent>
                                <Table size='small'>
                                  <TableHead>
                                    <TableRow>
                                      <TableCell>Nombre</TableCell>
                                      <TableCell>Abrev.</TableCell>
                                      <TableCell>Rango</TableCell>
                                      <TableCell>Orden</TableCell>
                                      <TableCell align='center' width={160}>
                                        Acciones
                                      </TableCell>
                                    </TableRow>
                                  </TableHead>
                                  <TableBody>
                                    {Array.isArray(escala.detalles) &&
                                      escala.detalles.map((d, idx) => (
                                        <TableRow key={d.id ?? idx}>
                                          <TableCell>{d.nombre}</TableCell>
                                          <TableCell>{d.abreviatura}</TableCell>
                                          <TableCell>
                                            {d.rango_inicio} - {d.rango_fin}
                                          </TableCell>
                                          <TableCell>{d.orden}</TableCell>
                                          <TableCell align='center'>
                                            <Stack direction='row' spacing={0.5} justifyContent='center'>
                                              {d.id && (
                                                <PermissionGuard permission='auditoria.ver'>
                                                  <Tooltip title='Auditoría'>
                                                    <IconButton
                                                      size='small'
                                                      onClick={() =>
                                                        handleViewChanges('config_not_escala_detalle', d.id!)
                                                      }
                                                      color='info'
                                                    >
                                                      <HistoryIcon fontSize='small' />
                                                    </IconButton>
                                                  </Tooltip>
                                                </PermissionGuard>
                                              )}
                                            </Stack>
                                          </TableCell>
                                        </TableRow>
                                      ))}
                                  </TableBody>
                                </Table>
                              </DialogContent>
                              <DialogActions>
                                <Button onClick={() => setExpandedRows(prev => ({ ...prev, [escala.id]: false }))}>
                                  Cerrar
                                </Button>
                              </DialogActions>
                            </Dialog>
                          </TableCell>
                        </TableRow>
                      )}
                    </Fragment>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      <EscalaModal
        open={modalState.open}
        mode={modalState.mode}
        escala={modalState.escala}
        onClose={handleCloseModal}
        onSuccess={handleSuccess}
      />

      <DeleteEscalaConfirmDialog
        open={deleteState.open}
        escala={deleteState.escala || null}
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

export default ConfigNotEscalaPage
