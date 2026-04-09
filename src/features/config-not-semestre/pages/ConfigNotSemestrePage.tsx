'use client'

import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'

import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  FormControl,
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
  TablePagination,
  TableRow,
  TextField,
  Tooltip,
  Typography
} from '@mui/material'

import ManageHistoryIcon from '@mui/icons-material/ManageHistory'

import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf'

import FileDownloadIcon from '@mui/icons-material/FileDownload'

import { toast } from 'react-hot-toast'

import { usePermissions } from '@/hooks/usePermissions'

import { PermissionGuard } from '@/components/PermissionGuard'
import AuditoriaModal from '@/features/auditoria/components/AuditoriaModal'
import DeleteConfirmDialog from '../components/DeleteConfirmDialog'
import SemestreModal from '../components/SemestreModal'
import configNotSemestreService from '../services/configNotSemestreService'
import type {
  ConfPeriodoLectivoOption,
  DeleteConfirmState,
  Semestre,
  SemestreModalState,
  SemestresTableFilters
} from '../types'

import tableStyles from '@core/styles/table.module.css'

const ConfigNotSemestrePage: React.FC = () => {
  const [periodosLectivos, setPeriodosLectivos] = useState<ConfPeriodoLectivoOption[]>([])
  const [selectedPeriodoId, setSelectedPeriodoId] = useState<number | ''>('')
  const [semestres, setSemestres] = useState<Semestre[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [totalCount, setTotalCount] = useState(0)
  const [searchValue, setSearchValue] = useState('')
  const [pdfLoading, setPdfLoading] = useState(false)
  const [excelLoading, setExcelLoading] = useState(false)

  const [filters, setFilters] = useState<SemestresTableFilters>({
    page: 1,
    per_page: 10,
    semestre: '',
    periodo_lectivo_id: undefined
  })

  const [modalState, setModalState] = useState<SemestreModalState>({
    isOpen: false,
    mode: 'create'
  })

  const [deleteConfirmState, setDeleteConfirmState] = useState<DeleteConfirmState>({
    isOpen: false
  })

  const [auditOpen, setAuditOpen] = useState(false)
  const [auditTarget, setAuditTarget] = useState<{ model: string; id: number } | null>(null)

  const abortControllerRef = useRef<AbortController | null>(null)
  const isInitialLoad = useRef(true)
  const [lastFetchKey, setLastFetchKey] = useState<string>('')
  const hasRequestedInitialSemestresRef = useRef(false)

  const { hasPermission, isAuthenticated, isSuperAdmin } = usePermissions()

  const loadPeriodosLectivos = useCallback(async () => {
    try {
      const list = await configNotSemestreService.getPeriodosLectivos()
      setPeriodosLectivos(list)
      if (list.length > 0) {
        setSelectedPeriodoId(prev => (prev === '' ? list[0].id : prev))
      }
    } catch (error: any) {
      setError(error?.data?.message || 'Error al cargar períodos lectivos')
    }
  }, [])

  const loadSemestres = useCallback(
    async (filtersToUse: SemestresTableFilters) => {
      const fetchKey = JSON.stringify(filtersToUse)
      if (fetchKey === lastFetchKey && !isInitialLoad.current) return
      try {
        setLoading(true)
        setError(null)
        setLastFetchKey(fetchKey)

        if (abortControllerRef.current && !abortControllerRef.current.signal.aborted) {
          abortControllerRef.current.abort()
        }
        abortControllerRef.current = new AbortController()

        const params = new URLSearchParams()
        if (filtersToUse.page) params.set('page', String(filtersToUse.page))
        if (filtersToUse.per_page) params.set('per_page', String(filtersToUse.per_page))
        if (filtersToUse.semestre) params.set('semestre', filtersToUse.semestre)
        if (filtersToUse.periodo_lectivo_id) params.set('periodo_lectivo_id', String(filtersToUse.periodo_lectivo_id))

        const response = await configNotSemestreService.list(params)
        setSemestres(response.data || [])
        setTotalCount(response.total || 0)
      } catch (error: any) {
        if (error.name !== 'AbortError') {
          let errorMessage = 'Error al cargar los semestres'
          if (error.status === 401 || error.isAuthError) {
            errorMessage = 'Sesión expirada. Por favor, inicia sesión nuevamente.'
            setTimeout(() => {
              window.location.href = '/auth/login'
            }, 2000)
          } else if (error.status === 403) {
            errorMessage = 'No tienes permisos para acceder a esta información.'
          } else if (error.status === 500) {
            errorMessage = 'Error interno del servidor. Contacta al administrador.'
          } else if (error.message) {
            errorMessage = error.message
          }
          setError(errorMessage)
          setSemestres([])
          setTotalCount(0)
        }
      } finally {
        setLoading(false)
        isInitialLoad.current = false
      }
    },
    [lastFetchKey]
  )

  useEffect(() => {
    if (!isAuthenticated) return
    if (!isSuperAdmin && !hasPermission('config_not_semestre.index')) return
    loadPeriodosLectivos()
  }, [isAuthenticated, isSuperAdmin, hasPermission, loadPeriodosLectivos])

  useEffect(() => {
    if (!isAuthenticated) return
    if (!isSuperAdmin && !hasPermission('config_not_semestre.index')) return
    if (!selectedPeriodoId) return
    if (isInitialLoad.current && hasRequestedInitialSemestresRef.current) return
    if (isInitialLoad.current) {
      hasRequestedInitialSemestresRef.current = true
    }
    const timeoutId = setTimeout(
      () => {
        loadSemestres({ ...filters, periodo_lectivo_id: Number(selectedPeriodoId) })
      },
      isInitialLoad.current ? 0 : 120
    )
    return () => clearTimeout(timeoutId)
  }, [filters, selectedPeriodoId, loadSemestres, hasPermission, isAuthenticated, isSuperAdmin])

  useEffect(() => {
    return () => {
      if (abortControllerRef.current && !abortControllerRef.current.signal.aborted) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  const handlePageChange = useCallback((_: unknown, newPage: number) => {
    setFilters(prev => ({ ...prev, page: newPage + 1 }))
  }, [])

  const handleRowsPerPageChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const newPerPage = parseInt(event.target.value, 10)
    setFilters(prev => ({ ...prev, per_page: newPerPage, page: 1 }))
  }, [])

  const handleSearchChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value
    setSearchValue(value)
    const timeoutId = setTimeout(() => {
      setFilters(prev => ({ ...prev, semestre: value, page: 1 }))
    }, 500)
    return () => clearTimeout(timeoutId)
  }, [])

  const handlePeriodoChange = useCallback((event: any) => {
    const value = Number(event.target.value)
    setSelectedPeriodoId(value)
    setLastFetchKey('')
    setFilters(prev => ({ ...prev, periodo_lectivo_id: value, page: 1 }))
  }, [])

  const handleOpenCreateModal = useCallback(() => {
    if (typeof document !== 'undefined') (document.activeElement as HTMLElement | null)?.blur()
    setModalState({ isOpen: true, mode: 'create' })
  }, [])

  const handleOpenEditModal = useCallback((semestre: Semestre) => {
    if (typeof document !== 'undefined') (document.activeElement as HTMLElement | null)?.blur()
    setModalState({ isOpen: true, mode: 'edit', semestre })
  }, [])

  const handleCloseModal = useCallback(() => {
    setModalState({ isOpen: false, mode: 'create' })
  }, [])

  const handleOpenDeleteConfirm = useCallback((semestre: Semestre) => {
    if (typeof document !== 'undefined') (document.activeElement as HTMLElement | null)?.blur()
    setDeleteConfirmState({ isOpen: true, semestre })
  }, [])

  const handleCloseDeleteConfirm = useCallback(() => {
    setDeleteConfirmState({ isOpen: false })
  }, [])

  const handleDataChange = useCallback(() => {
    setLastFetchKey('')
    loadSemestres({ ...filters, periodo_lectivo_id: selectedPeriodoId || undefined })
  }, [loadSemestres, filters, selectedPeriodoId])

  const handleExportPDF = useCallback(async () => {
    setPdfLoading(true)
    try {
      const params = new URLSearchParams()
      if (selectedPeriodoId) params.set('periodo_lectivo_id', String(selectedPeriodoId))
      if (filters.semestre) params.set('semestre', filters.semestre || '')
      const response = await configNotSemestreService.exportPDF(params)
      const blob = new Blob([response.data], { type: 'application/pdf' })
      const url = window.URL.createObjectURL(blob)
      window.open(url, '_blank')
      setTimeout(() => {
        window.URL.revokeObjectURL(url)
      }, 1000)
    } catch (error: any) {
      if (error?.status === 401) {
        window.location.href = '/auth/login'
        return
      }
      const message = error?.data?.message || 'Error al exportar PDF'
      toast.error(message)
    } finally {
      setPdfLoading(false)
    }
  }, [selectedPeriodoId, filters.semestre])

  const handleExportExcel = useCallback(async () => {
    setExcelLoading(true)
    try {
      const params = new URLSearchParams()
      if (selectedPeriodoId) params.set('periodo_lectivo_id', String(selectedPeriodoId))
      if (filters.semestre) params.set('semestre', filters.semestre || '')
      const blob = await configNotSemestreService.exportExcel(params)
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'CortesLectivos.xlsx'
      a.click()
      setTimeout(() => window.URL.revokeObjectURL(url), 1000)
    } catch (error: any) {
      if (error?.status === 401) {
        window.location.href = '/auth/login'
        return
      }
      const message = error?.data?.message || 'Error al exportar Excel'
      toast.error(message)
    } finally {
      setExcelLoading(false)
    }
  }, [selectedPeriodoId, filters.semestre])

  const tableData = useMemo(() => semestres, [semestres])

  return (
    <div className='flex flex-col gap-6'>
      <div className='flex justify-between items-center'>
        <div>
          <Typography variant='h4' component='h1' className='font-semibold text-textPrimary'>
            Cortes Lectivos
          </Typography>
          <Typography variant='body2' className='text-textSecondary mt-1'>
            Gestión de semestres y parciales por período lectivo
          </Typography>
        </div>

        <div className='flex gap-2'>
          <PermissionGuard permission='config_not_semestre.create'>
            <Button variant='contained' color='primary' onClick={handleOpenCreateModal} className='min-w-[160px]'>
              Nuevo Semestre
            </Button>
          </PermissionGuard>
          <Button variant='outlined' startIcon={<PictureAsPdfIcon />} onClick={handleExportPDF} disabled={pdfLoading}>
            {pdfLoading ? <CircularProgress size={20} /> : 'Exportar PDF'}
          </Button>
          <Button
            variant='outlined'
            startIcon={<FileDownloadIcon />}
            onClick={handleExportExcel}
            disabled={excelLoading}
          >
            {excelLoading ? <CircularProgress size={20} /> : 'Exportar Excel'}
          </Button>
        </div>
      </div>

      <Card>
        <CardContent>
          <Box className='flex gap-4 items-center'>
            <FormControl size='small' className='min-w-[240px]'>
              <InputLabel id='periodo-select-label'>Período Lectivo</InputLabel>
              <Select
                labelId='periodo-select-label'
                label='Período Lectivo'
                value={selectedPeriodoId === '' ? '' : selectedPeriodoId}
                onChange={handlePeriodoChange}
              >
                {periodosLectivos.map(pl => (
                  <MenuItem key={pl.id} value={pl.id}>
                    {pl.nombre}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              placeholder='Buscar semestres...'
              value={searchValue}
              onChange={handleSearchChange}
              variant='outlined'
              size='small'
              className='flex-1 max-w-md'
              InputProps={{
                startAdornment: (
                  <InputAdornment position='start'>
                    <i className='ri-search-line text-textSecondary' />
                  </InputAdornment>
                )
              }}
            />
          </Box>
        </CardContent>
      </Card>

      <Card>
        <CardContent className='p-0'>
          {error && (
            <Alert severity='error' className='m-6 mb-0'>
              {error}
            </Alert>
          )}

          <TableContainer component={Paper} className='shadow-none'>
            <Table className={tableStyles.table}>
              <TableHead>
                <TableRow>
                  <TableCell>Nombre</TableCell>
                  <TableCell>Abreviatura</TableCell>
                  <TableCell>Orden</TableCell>
                  <TableCell align='center'>Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={4} align='center' className='py-8'>
                      <CircularProgress size={40} />
                    </TableCell>
                  </TableRow>
                ) : Array.isArray(tableData) && tableData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} align='center' className='py-8'>
                      <Typography variant='body2' className='text-textSecondary'>
                        No se encontraron semestres
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : Array.isArray(tableData) ? (
                  tableData.map(sem => (
                    <TableRow key={sem.id} hover>
                      <TableCell>
                        <Typography variant='body2' className='font-medium'>
                          {sem.nombre}
                        </Typography>
                      </TableCell>
                      <TableCell>{sem.abreviatura}</TableCell>
                      <TableCell>{sem.orden}</TableCell>
                      <TableCell align='center'>
                        <div className='flex justify-center gap-2'>
                          <PermissionGuard permission='auditoria.ver'>
                            <Tooltip title='Auditoría'>
                              <IconButton
                                size='small'
                                onClick={() => {
                                  setAuditTarget({ model: 'config_not_semestre', id: sem.id })
                                  setAuditOpen(true)
                                }}
                                className='text-info-main hover:bg-info-lightOpacity'
                              >
                                <ManageHistoryIcon fontSize='small' />
                              </IconButton>
                            </Tooltip>
                          </PermissionGuard>

                          <PermissionGuard permission='config_not_semestre.create'>
                            <Tooltip title='Editar'>
                              <IconButton
                                size='small'
                                onClick={() => handleOpenEditModal(sem)}
                                className='text-textSecondary hover:text-primary'
                              >
                                <i className='ri-edit-line text-[22px]' />
                              </IconButton>
                            </Tooltip>
                          </PermissionGuard>

                          <PermissionGuard permission='config_not_semestre.delete'>
                            <Tooltip title='Eliminar'>
                              <IconButton
                                size='small'
                                onClick={() => handleOpenDeleteConfirm(sem)}
                                className='text-textSecondary hover:text-error'
                              >
                                <i className='ri-delete-bin-line text-[22px]' />
                              </IconButton>
                            </Tooltip>
                          </PermissionGuard>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} align='center' className='py-8'>
                      <Typography variant='body2' className='text-textSecondary'>
                        Error al cargar los datos
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {!loading && Array.isArray(tableData) && tableData.length > 0 && (
            <TablePagination
              component='div'
              count={totalCount}
              page={(filters.page || 1) - 1}
              onPageChange={handlePageChange}
              rowsPerPage={filters.per_page || 10}
              onRowsPerPageChange={handleRowsPerPageChange}
              rowsPerPageOptions={[5, 10, 25, 50]}
              labelRowsPerPage='Filas por página:'
              labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count !== -1 ? count : `más de ${to}`}`}
            />
          )}
        </CardContent>
      </Card>

      <AuditoriaModal
        open={auditOpen}
        model={auditTarget?.model || ''}
        id={auditTarget?.id || 0}
        onClose={() => setAuditOpen(false)}
      />

      <SemestreModal
        open={modalState.isOpen}
        mode={modalState.mode}
        semestre={modalState.semestre}
        periodoLectivoId={Number(selectedPeriodoId) || 0}
        onClose={handleCloseModal}
        onSuccess={handleDataChange}
      />

      <DeleteConfirmDialog
        open={deleteConfirmState.isOpen}
        semestre={deleteConfirmState.semestre}
        onClose={handleCloseDeleteConfirm}
        onSuccess={handleDataChange}
      />
    </div>
  )
}

export default memo(ConfigNotSemestrePage)
