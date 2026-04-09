'use client'

import React, { useState, useEffect } from 'react'
import {
  Card,
  CardHeader,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TablePagination,
  TextField,
  Button,
  Grid,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Typography,
  Chip,
  Box,
  FormControlLabel,
  Switch
} from '@mui/material'
import { LoginLogService, LoginLog, LoginLogsFilters } from '../services/LoginLogService'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

export default function LoginLogsTable() {
  const [logs, setLogs] = useState<LoginLog[]>([])
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(15)
  const [totalRows, setTotalRows] = useState(0)
  const [loading, setLoading] = useState(false)

  // Filters
  const [filters, setFilters] = useState<LoginLogsFilters>({
    fecha_inicio: '',
    fecha_fin: '',
    tipo_usuario: '',
    search: '',
    per_page: 15,
    unique: false
  })

  // Applied Filters to prevent fetching on every keystroke
  const [appliedFilters, setAppliedFilters] = useState<LoginLogsFilters>({
    fecha_inicio: '',
    fecha_fin: '',
    tipo_usuario: '',
    search: '',
    per_page: 15,
    unique: false
  })

  const fetchLogs = async (currentPage: number, currentFilters: LoginLogsFilters) => {
    setLoading(true)
    try {
      const params = {
        ...currentFilters,
        per_page: rowsPerPage
      }
      const response = await LoginLogService.getLogs(currentPage + 1, params)
      if (response.success && response.data) {
        setLogs(response.data.data)
        setTotalRows(response.data.total)
      } else {
        setLogs([])
        setTotalRows(0)
      }
    } catch (error) {
      console.error('Failed to load login logs', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLogs(page, appliedFilters)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, rowsPerPage, appliedFilters])

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage)
  }

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10))
    setPage(0)
  }

  const handleFilterChange = (field: keyof LoginLogsFilters, value: any) => {
    setFilters(prev => ({ ...prev, [field]: value }))
  }

  const applyFilters = () => {
    setPage(0)
    setAppliedFilters(filters)
  }

  const clearFilters = () => {
    const emptyFilters = {
      fecha_inicio: '',
      fecha_fin: '',
      tipo_usuario: '',
      search: '',
      per_page: rowsPerPage,
      unique: false
    }
    setFilters(emptyFilters)
    setAppliedFilters(emptyFilters)
    setPage(0)
  }

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd/MM/yyyy HH:mm", { locale: es })
    } catch (e) {
      return dateString
    }
  }

  const getTypeChipColor = (tipo: string) => {
    switch (tipo?.toLowerCase()) {
      case 'alumno': return 'info'
      case 'docente': return 'success'
      case 'administrativo': return 'secondary'
      case 'superuser': return 'error'
      case 'familia': return 'warning'
      default: return 'default'
    }
  }

  return (
    <Card>
      <CardHeader title="Registro de Accesos" />
      <CardContent>
        {/* Filtros */}
        <Box sx={{ mb: 3 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={3}>
              <TextField
                fullWidth
                size="small"
                label="Buscar (Nombre / Email)"
                value={filters.search}
                onChange={e => handleFilterChange('search', e.target.value)}
                onKeyDown={e => e.key === 'Enter' && applyFilters()}
              />
            </Grid>
            <Grid item xs={12} sm={2.5}>
              <FormControl fullWidth size="small">
                <InputLabel>Tipo de Usuario</InputLabel>
                <Select
                  value={filters.tipo_usuario}
                  label="Tipo de Usuario"
                  onChange={e => handleFilterChange('tipo_usuario', e.target.value)}
                >
                  <MenuItem value="">Todos</MenuItem>
                  <MenuItem value="alumno">Alumno</MenuItem>
                  <MenuItem value="docente">Docente</MenuItem>
                  <MenuItem value="administrativo">Administrativo</MenuItem>
                  <MenuItem value="familia">Familia</MenuItem>
                  <MenuItem value="superuser">Superusuario</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={2.5}>
              <TextField
                fullWidth
                size="small"
                type="date"
                label="Fecha Inicio"
                InputLabelProps={{ shrink: true }}
                value={filters.fecha_inicio}
                onChange={e => handleFilterChange('fecha_inicio', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={2.5}>
              <TextField
                fullWidth
                size="small"
                type="date"
                label="Fecha Fin"
                InputLabelProps={{ shrink: true }}
                value={filters.fecha_fin}
                onChange={e => handleFilterChange('fecha_fin', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={1.5} sx={{ display: 'flex', gap: 1 }}>
              <Button variant="contained" color="primary" onClick={applyFilters} fullWidth>
                Filtrar
              </Button>
              <Button variant="outlined" color="secondary" onClick={clearFilters} title="Limpiar">
                <i className="ri-refresh-line" />
              </Button>
            </Grid>
            <Grid item xs={12} sx={{ pt: 1 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={!!filters.unique}
                    onChange={e => handleFilterChange('unique', e.target.checked)}
                    name="unique"
                    color="primary"
                    size="small"
                  />
                }
                label={<Typography variant="body2">Mostrar solo el último acceso por usuario</Typography>}
              />
            </Grid>
          </Grid>
        </Box>

        {/* Tabla */}
        <TableContainer component={Paper} elevation={0} variant="outlined">
          <Table size="small">
             <TableHead>
              <TableRow sx={{ backgroundColor: 'action.hover' }}>
                <TableCell>Usuario</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Tipo</TableCell>
                <TableCell>Hijos Asociados</TableCell>
                <TableCell>IP</TableCell>
                <TableCell>Navegador / Dispositivo</TableCell>
                <TableCell>Fecha y Hora</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                    Cargando registros...
                  </TableCell>
                </TableRow>
              ) : logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                    No se encontraron registros de acceso.
                  </TableCell>
                </TableRow>
              ) : (
                logs.map(log => (
                  <TableRow key={log.id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight={500}>{log.user?.name || 'Desconocido'}</Typography>
                      {log.user?.role && (
                        <Typography variant="caption" color="textSecondary">{log.user.role.nombre}</Typography>
                      )}
                    </TableCell>
                    <TableCell>{log.user?.email}</TableCell>
                    <TableCell>
                      <Chip 
                        label={log.user?.tipo_usuario || 'N/A'} 
                        size="small" 
                        color={getTypeChipColor(log.user?.tipo_usuario) as any} 
                        variant="outlined" 
                        sx={{ textTransform: 'capitalize' }}
                      />
                    </TableCell>
                    <TableCell>
                      {log.user?.hijos && log.user.hijos.length > 0 ? (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {log.user.hijos.map(hijo => (
                            <Chip 
                              key={hijo.id} 
                              label={hijo.name || `${(hijo as any).primer_nombre} ${(hijo as any).primer_apellido}`} 
                              size="small" 
                              variant="outlined" 
                              color="primary"
                            />
                          ))}
                        </Box>
                      ) : (
                        log.user?.tipo_usuario === 'familia' ? <Typography variant="caption" color="textSecondary">Sin hijos asignados</Typography> : '-'
                      )}
                    </TableCell>
                    <TableCell>{log.ip_address || '-'}</TableCell>
                    <TableCell sx={{ maxWidth: 200, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={log.user_agent || ''}>
                      {log.user_agent || '-'}
                    </TableCell>
                    <TableCell>{formatDate(log.created_at)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          component="div"
          count={totalRows}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          rowsPerPageOptions={[15, 30, 50, 100]}
          labelRowsPerPage="Filas por página"
          labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count !== -1 ? count : `más de ${to}`}`}
        />
      </CardContent>
    </Card>
  )
}
