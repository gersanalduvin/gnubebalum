'use client'

import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Box,
  Typography,
  TablePagination,
  Tooltip
} from '@mui/material'
import { Edit, Delete, ManageHistory as HistoryIcon } from '@mui/icons-material'

import { PermissionGuard } from '@/components/PermissionGuard'
import type { ConfigGrado, ConfigGradoResponse } from '../types'

interface ConfigGradoTableProps {
  data: ConfigGradoResponse | null
  loading: boolean
  onEdit: (grado: ConfigGrado) => void
  onDelete: (grado: ConfigGrado) => void
  onViewChanges: (grado: ConfigGrado) => void
  onPageChange: (page: number) => void
}

export default function ConfigGradoTable({
  data,
  loading,
  onEdit,
  onDelete,
  onViewChanges,
  onPageChange
}: ConfigGradoTableProps) {
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <Typography>Cargando...</Typography>
      </Box>
    )
  }

  if (!data || !data.data || data.data.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', p: 3 }}>
        <Typography color="text.secondary">
          No se encontraron grados
        </Typography>
      </Box>
    )
  }

  return (
    <Paper>
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Nombre</TableCell>
              <TableCell>Abreviatura</TableCell>
              <TableCell>Formato</TableCell>
              <TableCell>Orden</TableCell>
              <TableCell align="center">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data?.data && Array.isArray(data.data) ? data.data.map((grado) => (
              <TableRow key={grado.id} hover>
                <TableCell>{grado.id}</TableCell>
                <TableCell>
                  <Typography variant="body2" fontWeight="medium">
                    {grado.nombre}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" color="text.secondary">
                    {grado.abreviatura}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Box 
                    sx={{ 
                      display: 'inline-block',
                      px: 2,
                      py: 0.5,
                      borderRadius: 1,
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      bgcolor: grado.formato === 'cualitativo' ? 'primary.shades.10' : 'grey.100',
                      color: grado.formato === 'cualitativo' ? 'primary.main' : 'text.secondary',
                      border: '1px solid',
                      borderColor: grado.formato === 'cualitativo' ? 'primary.light' : 'grey.300'
                    }}
                  >
                    {grado.formato || 'cuantitativo'}
                  </Box>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {grado.orden}
                  </Typography>
                </TableCell>
                <TableCell align="center">
                  <PermissionGuard permission="auditoria.ver">
                    <Tooltip title="Ver cambios">
                      <IconButton
                        size="small"
                        onClick={() => onViewChanges(grado)}
                        className="text-info-main hover:bg-info-lightOpacity"
                      >
                        <HistoryIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </PermissionGuard>

                  <PermissionGuard permission="config_grado.update">
                    <Tooltip title="Editar">
                      <IconButton
                        size="small"
                        onClick={() => onEdit(grado)}
                        color="primary"
                      >
                        <Edit fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </PermissionGuard>

                  <PermissionGuard permission="config_grado.delete">
                    <Tooltip title="Eliminar">
                      <IconButton
                        size="small"
                        onClick={() => onDelete(grado)}
                        color="error"
                      >
                        <Delete fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </PermissionGuard>
                </TableCell>
              </TableRow>
            )) : (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  <Typography variant="body2" color="text.secondary">
                    No se encontraron grados
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
      
      <TablePagination
        component="div"
        count={data?.total || 0}
        page={(data?.current_page || 1) - 1}
        onPageChange={(_, page) => onPageChange(page + 1)}
        rowsPerPage={data?.per_page || 10}
        rowsPerPageOptions={[]}
        labelDisplayedRows={({ from, to, count }) => 
          `${from}-${to} de ${count !== -1 ? count : `más de ${to}`}`
        }
      />
    </Paper>
  )
}
