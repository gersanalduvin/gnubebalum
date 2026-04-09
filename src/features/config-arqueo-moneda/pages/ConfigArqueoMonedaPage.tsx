'use client'

import { useCallback, useEffect, useState } from 'react'
import { Box, Card, CardContent, Typography, Button, TextField, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, IconButton, Tooltip, Chip, CircularProgress, Dialog, DialogTitle, DialogContent, DialogActions, FormControl, InputLabel, Select, MenuItem } from '@mui/material'
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, Refresh as RefreshIcon, Search as SearchIcon, History as HistoryIcon } from '@mui/icons-material'
import { toast } from 'react-hot-toast'

import { usePermissions } from '@/hooks/usePermissions'
import arqueoMonedaService from '../services/arqueoMonedaService'
import ArqueoMonedaModal from '../components/ArqueoMonedaModal'
import type { ConfigArqueoMoneda } from '../types'
import AuditoriaModal from '@/features/auditoria/components/AuditoriaModal'

export default function ConfigArqueoMonedaPage() {
  const { hasPermission } = usePermissions()
  const canIndex = hasPermission('config_arqueo_moneda.index')
  const canCreate = hasPermission('config_arqueo_moneda.store')
  const canEdit = hasPermission('config_arqueo_moneda.update')
  const canDelete = hasPermission('config_arqueo_moneda.destroy')
  const canAudit = hasPermission('auditoria.ver')

  const [items, setItems] = useState<ConfigArqueoMoneda[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [moneda, setMoneda] = useState<string>('')

  const [modalOpen, setModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create')
  const [selected, setSelected] = useState<ConfigArqueoMoneda | undefined>(undefined)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [toDelete, setToDelete] = useState<ConfigArqueoMoneda | undefined>(undefined)
  const [auditOpen, setAuditOpen] = useState(false)
  const [auditTarget, setAuditTarget] = useState<{ model: string; id: number } | null>(null)

  const loadData = useCallback(async () => {
    if (!canIndex) { setLoading(false); return }
    try {
      setLoading(true)
      const monedaParam = moneda === '' ? undefined : Number(moneda)
      const resp = await arqueoMonedaService.list(1, 50, search, monedaParam)
      const data = (resp as any)?.data?.data || []
      setItems(data)
    } catch (error: any) {
      const msg = error?.data?.message || 'Error al cargar denominaciones'
      toast.error(msg)
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [search, moneda, canIndex])

  useEffect(() => { loadData() }, [loadData])

  const handleCreate = () => { setSelected(undefined); setModalMode('create'); setModalOpen(true) }
  const handleEdit = (it: ConfigArqueoMoneda) => { setSelected(it); setModalMode('edit'); setModalOpen(true) }
  const handleDelete = (it: ConfigArqueoMoneda) => {
    if (!canDelete) return
    setToDelete(it)
    setConfirmOpen(true)
  }

  const confirmDelete = async () => {
    if (!toDelete) return
    try {
      setDeleting(true)
      const resp = await arqueoMonedaService.remove(toDelete.id)
      if ((resp as any).success) toast.success((resp as any).message || 'Eliminado')
      setConfirmOpen(false)
      setToDelete(undefined)
      await loadData()
    } catch (error: any) {
      toast.error(error?.data?.message || 'Error al eliminar')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4">Denominación de Monedas</Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" startIcon={<RefreshIcon />} onClick={loadData} disabled={loading}>Actualizar</Button>
          {canCreate && <Button variant="contained" startIcon={<AddIcon />} onClick={handleCreate}>Nueva</Button>}
        </Box>
      </Box>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <TextField fullWidth size="small" label="Buscar denominación" value={search} onChange={e => setSearch(e.target.value)} sx={{ minWidth: 280 }} />
            <FormControl size="small" sx={{ minWidth: 180 }}>
              <InputLabel>Moneda</InputLabel>
              <Select label="Moneda" value={moneda} onChange={e => setMoneda(e.target.value)}>
                <MenuItem value="">Todas</MenuItem>
                <MenuItem value="0">Córdobas (C$)</MenuItem>
                <MenuItem value="1">Dólares (US$)</MenuItem>
              </Select>
            </FormControl>
            <Button variant="outlined" startIcon={<SearchIcon />} onClick={loadData}>Buscar</Button>
          </Box>
        </CardContent>
      </Card>

      <Card>
        <CardContent sx={{ p: 0 }}>
          <TableContainer component={Paper} elevation={0}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Moneda</TableCell>
                  <TableCell>Denominación</TableCell>
                  <TableCell>Multiplicador</TableCell>
                  <TableCell>Orden</TableCell>
                  <TableCell align="center">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={5} align="center" sx={{ py: 4 }}><CircularProgress /></TableCell></TableRow>
                ) : items.length === 0 ? (
                  <TableRow><TableCell colSpan={5} align="center">Sin registros</TableCell></TableRow>
                ) : items.map(it => (
                  <TableRow key={it.id} hover>
                    <TableCell>
                      <Chip size="small" label={it.moneda ? 'US$' : 'C$'} color={it.moneda ? 'primary' : 'default'} />
                    </TableCell>
                    <TableCell>{it.denominacion}</TableCell>
                    <TableCell>{it.multiplicador}</TableCell>
                    <TableCell>{it.orden}</TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                        {canAudit && (
                          <Tooltip title="Ver historial de cambios">
                            <IconButton size="small" color="info" onClick={() => { setAuditTarget({ model: 'config_arqueo_moneda', id: it.id }); setAuditOpen(true) }}>
                              <HistoryIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                        {canEdit && (
                          <Tooltip title="Editar"><IconButton size="small" onClick={() => handleEdit(it)}><EditIcon fontSize="small" /></IconButton></Tooltip>
                        )}
                        {canDelete && (
                          <Tooltip title="Eliminar"><IconButton size="small" color="error" onClick={() => handleDelete(it)}><DeleteIcon fontSize="small" /></IconButton></Tooltip>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      <ArqueoMonedaModal open={modalOpen} mode={modalMode} item={selected} onClose={() => setModalOpen(false)} onSuccess={loadData} />

      <Dialog open={confirmOpen} onClose={() => !deleting && setConfirmOpen(false)}>
        <DialogTitle>Confirmar eliminación</DialogTitle>
        <DialogContent>
          <Typography>¿Desea eliminar la denominación "{toDelete?.denominacion}"?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)} disabled={deleting}>Cancelar</Button>
          <Button onClick={confirmDelete} color="error" variant="contained" disabled={deleting} startIcon={deleting ? <CircularProgress size={16} /> : undefined}>{deleting ? 'Eliminando...' : 'Eliminar'}</Button>
        </DialogActions>
      </Dialog>

      <AuditoriaModal open={auditOpen} model={auditTarget?.model || ''} id={auditTarget?.id || 0} onClose={() => setAuditOpen(false)} />
    </Box>
  )
}
