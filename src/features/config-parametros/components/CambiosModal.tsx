'use client'

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Box,
  Chip,
  IconButton,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material'

import {
  Close as CloseIcon,
  History as HistoryIcon,
  ExpandMore as ExpandMoreIcon
} from '@mui/icons-material'

import type { CambiosModalProps, CambioParametro } from '../types/index'

export default function CambiosModal({ open, onClose, cambios }: CambiosModalProps) {
  
  // Formatear valor para mostrar
  const formatValue = (value: any): string => {
    if (value === null || value === undefined) {
      return 'N/A'
    }
    if (typeof value === 'boolean') {
      return value ? 'Sí' : 'No'
    }
    if (typeof value === 'number') {
      return value.toString()
    }
    return value.toString()
  }

  // Obtener etiqueta del campo
  const getFieldLabel = (campo: string): string => {
    const labels: { [key: string]: string } = {
      consecutivo_recibo_oficial: 'Consecutivo Recibo Oficial',
      consecutivo_recibo_interno: 'Consecutivo Recibo Interno',
      tasa_cambio_dolar: 'Tasa de Cambio Dólar',
      terminal_separada: 'Terminal Separada'
    }
    return labels[campo] || campo
  }

  // Función para obtener el icono según el tipo de cambio
  const getAccionIcon = (accion: string) => {
    switch (accion.toLowerCase()) {
      case 'creado':
        return '➕'
      case 'actualizado':
        return '✏️'
      case 'eliminado':
        return '🗑️'
      default:
        return '📝'
    }
  }

  // Obtener color del chip según la acción
  const getAccionColor = (accion: string) => {
    switch (accion.toLowerCase()) {
      case 'creado':
        return 'success'
      case 'actualizado':
        return 'warning'
      case 'eliminado':
        return 'error'
      default:
        return 'default'
    }
  }

  // Renderizar la comparación de un cambio individual
  const renderCambioComparison = (cambio: CambioParametro) => {
    const datosAnteriores = cambio.datos_anteriores || {}
    const datosNuevos = cambio.datos_nuevos || {}
    
    // Obtener todos los campos que cambiaron
    const camposModificados = new Set([
      ...Object.keys(datosAnteriores),
      ...Object.keys(datosNuevos)
    ])

    // Filtrar campos que no queremos mostrar
    const camposExcluidos = ['id', 'uuid', 'created_at', 'updated_at', 'deleted_at', 'created_by', 'updated_by', 'deleted_by', 'is_synced', 'synced_at', 'updated_locally_at', 'version', 'cambios']
    const camposAMostrar = Array.from(camposModificados).filter(campo => !camposExcluidos.includes(campo))

    return (
      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell><strong>Campo</strong></TableCell>
              <TableCell><strong>Valor Anterior</strong></TableCell>
              <TableCell><strong>Valor Nuevo</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {camposAMostrar.map((campo) => {
              const valorAnterior = datosAnteriores[campo]
              const valorNuevo = datosNuevos[campo]
              const hasChanged = valorAnterior !== valorNuevo

              return (
                <TableRow key={campo} sx={{ backgroundColor: hasChanged ? 'action.hover' : 'transparent' }}>
                  <TableCell component="th" scope="row">
                    <Typography variant="body2" fontWeight="medium">
                      {getFieldLabel(campo)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography 
                      variant="body2" 
                      color={hasChanged ? 'error.main' : 'text.secondary'}
                      sx={{ textDecoration: hasChanged ? 'line-through' : 'none' }}
                    >
                      {formatValue(valorAnterior)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography 
                      variant="body2" 
                      color={hasChanged ? 'success.main' : 'text.secondary'}
                      fontWeight={hasChanged ? 'medium' : 'normal'}
                    >
                      {formatValue(valorNuevo)}
                    </Typography>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </TableContainer>
    )
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { minHeight: '400px' }
      }}
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box display="flex" alignItems="center" gap={1}>
            <HistoryIcon />
            <Typography variant="h6">
              Bitácora de Cambios
            </Typography>
          </Box>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        {cambios.length === 0 ? (
          <Box 
            display="flex" 
            justifyContent="center" 
            alignItems="center" 
            minHeight="200px"
            flexDirection="column"
            gap={2}
          >
            <HistoryIcon sx={{ fontSize: 48, color: 'text.secondary' }} />
            <Typography variant="body1" color="text.secondary">
              No hay cambios registrados
            </Typography>
          </Box>
        ) : (
          <Box sx={{ width: '100%' }}>
            {cambios.map((cambio, index) => (
              <Accordion key={index} sx={{ mb: 1 }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                    <Typography variant="h6" sx={{ fontSize: '1rem' }}>
                      {getAccionIcon(cambio.accion)}
                    </Typography>
                    <Chip
                      label={cambio.accion.toUpperCase()}
                      color={getAccionColor(cambio.accion) as any}
                      size="small"
                    />
                    <Typography variant="body2" color="text.secondary">
                      {cambio.usuario_email}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ ml: 'auto' }}>
                      {new Date(cambio.fecha).toLocaleString('es-ES', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </Typography>
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <Box sx={{ mt: 1 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Detalles del cambio:
                    </Typography>
                    {renderCambioComparison(cambio)}
                  </Box>
                </AccordionDetails>
              </Accordion>
            ))}
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} variant="outlined">
          Cerrar
        </Button>
      </DialogActions>
    </Dialog>
  )
}