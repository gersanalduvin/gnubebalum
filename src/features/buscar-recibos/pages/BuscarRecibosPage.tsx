'use client'

import { usePermissions } from '@/hooks/usePermissions'
import { PictureAsPdf as PdfIcon, Search as SearchIcon, DeleteForever as VoidIcon } from '@mui/icons-material'
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Grid,
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
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'react-hot-toast'
import { buscarRecibosService } from '../services/buscarRecibosService'
import type { ReciboItem } from '../types'

export default function BuscarRecibosPage() {
  const { hasPermission } = usePermissions()

  const [numeroRecibo, setNumeroRecibo] = useState('')
  const [nombreUsuario, setNombreUsuario] = useState('')
  const [fechaInicio, setFechaInicio] = useState('')
  const [fechaFin, setFechaFin] = useState('')
  const [perPage, setPerPage] = useState(15)
  const [page, setPage] = useState(1)
  const [items, setItems] = useState<ReciboItem[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [pdfLoadingId, setPdfLoadingId] = useState<number | null>(null)
  const [voidLoadingId, setVoidLoadingId] = useState<number | null>(null)
  const [deleteLoadingId, setDeleteLoadingId] = useState<number | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false)
  const [idToVoid, setIdToVoid] = useState<number | null>(null)
  const [idToDelete, setIdToDelete] = useState<number | null>(null)

  useEffect(() => {
    buscar(1)
  }, [])

  const lastPage = useMemo(() => Math.max(1, Math.ceil((total || 0) / (perPage || 1))), [total, perPage])

  const formatAmount = (v: number) =>
    new Intl.NumberFormat('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v || 0)

  const formatDate = (dateString: string) => {
    if (!dateString) return ''
    return new Date(dateString).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })
  }

  const buscar = async (toPage?: number) => {
    try {
      setLoading(true)
      const resp = await buscarRecibosService.listar({
        numero_recibo: numeroRecibo || undefined,
        nombre_usuario: nombreUsuario || undefined,
        fecha_inicio: fechaInicio || undefined,
        fecha_fin: fechaFin || undefined,
        page: toPage ?? page,
        per_page: perPage
      })
      const data = resp?.data
      setItems((data?.data as ReciboItem[]) || [])
      setTotal(Number(data?.total || 0))
      setPage(Number(data?.current_page || 1))
      toast.success('Recibos buscados exitosamente')
    } catch (err: any) {
      toast.error(err?.data?.message || 'Error al buscar recibos')
      setItems([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }

  const imprimir = async (id: number) => {
    try {
      setPdfLoadingId(id)
      const blob = await buscarRecibosService.imprimir(id)
      const url = window.URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }))
      window.open(url, '_blank')
      setTimeout(() => {
        window.URL.revokeObjectURL(url)
      }, 1000)
    } catch (error: any) {
      if (error.status === 401) {
        toast.error('Sesión expirada. Por favor, inicie sesión nuevamente.')
        window.location.href = '/auth/login'
        return
      }
      toast.error('Error al generar el PDF. Intente nuevamente.')
    } finally {
      setPdfLoadingId(null)
    }
  }

  const anular = (id: number) => {
    setIdToVoid(id)
    setConfirmOpen(true)
  }

  const handleConfirmAnular = async () => {
    if (!idToVoid) return
    try {
      setConfirmOpen(false)
      setVoidLoadingId(idToVoid)
      const resp = await buscarRecibosService.anular(idToVoid)
      toast.success(resp?.message || 'Recibo anulado exitosamente')
      await buscar(page)
    } catch (err: any) {
      const msg = err?.data?.message || 'Error al anular el recibo'
      toast.error(msg)
    } finally {
      setVoidLoadingId(null)
      setIdToVoid(null)
    }
  }

  const eliminar = (id: number) => {
    setIdToDelete(id)
    setConfirmDeleteOpen(true)
  }

  const handleConfirmEliminar = async () => {
    if (!idToDelete) return
    try {
      setConfirmDeleteOpen(false)
      setDeleteLoadingId(idToDelete)
      const resp = await buscarRecibosService.eliminar(idToDelete)
      toast.success(resp?.message || 'Recibo eliminado exitosamente')
      await buscar(page)
    } catch (err: any) {
      const msg = err?.data?.message || 'Error al eliminar el recibo'
      toast.error(msg)
    } finally {
      setDeleteLoadingId(null)
      setIdToDelete(null)
    }
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant='h4' sx={{ mb: 2 }}>
        Buscar Recibos
      </Typography>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={12} md={3}>
              <TextField
                label='Número de recibo'
                value={numeroRecibo}
                onChange={e => setNumeroRecibo(e.target.value)}
                fullWidth
                size='small'
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                label='Nombre de usuario'
                value={nombreUsuario}
                onChange={e => setNombreUsuario(e.target.value)}
                fullWidth
                size='small'
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <TextField
                label='Fecha inicio'
                type='date'
                value={fechaInicio}
                onChange={e => setFechaInicio(e.target.value)}
                fullWidth
                size='small'
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <TextField
                label='Fecha fin'
                type='date'
                value={fechaFin}
                onChange={e => setFechaFin(e.target.value)}
                fullWidth
                size='small'
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={1}>
              <Select fullWidth size='small' value={perPage} onChange={e => setPerPage(Number(e.target.value))}>
                {[10, 15, 25, 50, 100].map(v => (
                  <MenuItem key={v} value={v}>
                    {v}
                  </MenuItem>
                ))}
              </Select>
            </Grid>
            <Grid item xs={12} md={1}>
              <Button
                variant='contained'
                startIcon={loading ? <CircularProgress size={20} /> : <SearchIcon />}
                onClick={() => buscar(1)}
                disabled={loading}
                fullWidth
              >
                {loading ? 'Buscando...' : 'Buscar'}
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <TableContainer component={Paper} elevation={0}>
            <Table size='small'>
              <TableHead>
                <TableRow>
                  <TableCell>
                    <strong>Fecha</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Usuario</strong>
                  </TableCell>
                  <TableCell>
                    <strong>N° Recibo</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Tipo</strong>
                  </TableCell>
                  <TableCell align='right'>
                    <strong>Total</strong>
                  </TableCell>
                  <TableCell align='center'>
                    <strong>Acciones</strong>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {items.map(item => (
                  <TableRow key={item.id}>
                    <TableCell>{formatDate(item.fecha)}</TableCell>
                    <TableCell>{item.nombre_usuario}</TableCell>
                    <TableCell>{item.numero_recibo}</TableCell>
                    <TableCell>
                      {item.tipo && (
                        <Chip
                          label={item.tipo.toUpperCase()}
                          size='small'
                          color={item.tipo === 'interno' ? 'info' : 'secondary'}
                          variant='outlined'
                        />
                      )}
                    </TableCell>
                    <TableCell align='right'>
                      <Chip label={formatAmount(Number(item.total) || 0)} size='small' color='primary' />
                    </TableCell>
                    <TableCell align='center'>
                      <Button
                        variant='outlined'
                        color='secondary'
                        size='small'
                        startIcon={pdfLoadingId === item.id ? <CircularProgress size={16} /> : <PdfIcon />}
                        disabled={pdfLoadingId === item.id}
                        onClick={() => imprimir(item.id)}
                      >
                        {pdfLoadingId === item.id ? 'Abriendo...' : 'Imprimir'}
                      </Button>
                      {item.estado === 'anulado' && (
                        <Chip label='Anulado' color='error' size='small' variant='outlined' sx={{ ml: 1 }} />
                      )}

                      {item.estado === 'anulado' && hasPermission('recibos.eliminar_anulado') && (
                        <Button
                          sx={{ ml: 1 }}
                          variant='outlined'
                          color='error'
                          size='small'
                          startIcon={deleteLoadingId === item.id ? <CircularProgress size={16} /> : <VoidIcon />}
                          disabled={deleteLoadingId === item.id}
                          onClick={() => eliminar(item.id)}
                        >
                          {deleteLoadingId === item.id ? 'Eliminando...' : 'Eliminar'}
                        </Button>
                      )}

                      {item.estado !== 'anulado' && hasPermission('buscar_recibo') && (
                        <Button
                          sx={{ ml: 1 }}
                          variant='outlined'
                          color='error'
                          size='small'
                          startIcon={voidLoadingId === item.id ? <CircularProgress size={16} /> : <VoidIcon />}
                          disabled={voidLoadingId === item.id}
                          onClick={() => anular(item.id)}
                        >
                          {voidLoadingId === item.id ? 'Anulando...' : 'Anular'}
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant='body2'>Total: {total} registros</Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button variant='outlined' disabled={page <= 1 || loading} onClick={() => buscar(page - 1)}>
                Anterior
              </Button>
              <Typography variant='body2' sx={{ alignSelf: 'center' }}>
                Página {page} de {lastPage}
              </Typography>
              <Button variant='outlined' disabled={page >= lastPage || loading} onClick={() => buscar(page + 1)}>
                Siguiente
              </Button>
            </Box>
          </Box>
        </CardContent>
      </Card>

      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <DialogTitle>Confirmar Anulación</DialogTitle>
        <DialogContent>
          <DialogContentText>
            ¿Está seguro de que desea anular este recibo? Esta acción no se puede deshacer.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)} color='primary'>
            Cancelar
          </Button>
          <Button onClick={handleConfirmAnular} color='error' variant='contained'>
            Anular
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={confirmDeleteOpen} onClose={() => setConfirmDeleteOpen(false)}>
        <DialogTitle>Confirmar Eliminación</DialogTitle>
        <DialogContent>
          <DialogContentText>
            ¿Está seguro de que desea eliminar permanentemente este recibo? Esta acción no se puede deshacer.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDeleteOpen(false)} color='primary'>
            Cancelar
          </Button>
          <Button onClick={handleConfirmEliminar} color='error' variant='contained'>
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
