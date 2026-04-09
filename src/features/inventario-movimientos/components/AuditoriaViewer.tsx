'use client'

import React, { useState } from 'react'

import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  Button, 
  Accordion, 
  AccordionSummary, 
  AccordionDetails, 
  Typography, 
  Box, 
  Chip,
  Grid,
  Paper,
  Divider,
  Alert,
  IconButton
} from '@mui/material'

import { 
  ExpandMore as ExpandMoreIcon, 
  Person as PersonIcon, 
  AccessTime as TimeIcon,
  Close as CloseIcon,
  History as HistoryIcon,
  Schedule as ScheduleIcon,
  Edit as EditIcon,
  Add as AddIcon,
  Delete as DeleteIcon
} from '@mui/icons-material'

import type { MovimientoInventario, CambioAuditoria } from '@/features/inventario-movimientos/types/types_index'
import { getTipoMovimientoLabel, getEstadoMovimientoLabel } from '@/features/inventario-movimientos/types/types_index'

interface AuditoriaViewerProps {
  open: boolean
  movimiento: MovimientoInventario | null
  onClose: () => void
}

export default function AuditoriaViewer({ open, movimiento, onClose }: AuditoriaViewerProps) {
  const [expandedPanel, setExpandedPanel] = useState<string | false>(false)

  const handleAccordionChange = (panel: string) => (event: React.SyntheticEvent, isExpanded: boolean) => {
    setExpandedPanel(isExpanded ? panel : false)
  }

  // Función para parsear los cambios
  const parseCambios = (cambios: string | CambioAuditoria[]): CambioAuditoria[] => {
    if (!cambios) return []
    
    try {
      if (typeof cambios === 'string') {
        return JSON.parse(cambios)
      }
      return cambios
    } catch (error) {
      return []
    }
  }

  // Función para obtener el color de la acción
  const getActionColor = (action: string) => {
    switch (action.toLowerCase()) {
      case 'created':
      case 'create':
        return 'success'
      case 'updated':
      case 'update':
        return 'warning'
      case 'deleted':
      case 'delete':
        return 'error'
      default:
        return 'default'
    }
  }

  // Función para obtener el icono de la acción
  const getActionIcon = (action: string) => {
    switch (action.toLowerCase()) {
      case 'created':
      case 'create':
        return <AddIcon fontSize="small" />
      case 'updated':
      case 'update':
        return <EditIcon fontSize="small" />
      case 'deleted':
      case 'delete':
        return <DeleteIcon fontSize="small" />
      default:
        return <HistoryIcon fontSize="small" />
    }
  }

  // Función para obtener la etiqueta de la acción
  const getActionLabel = (action: string) => {
    switch (action.toLowerCase()) {
      case 'created':
      case 'create':
        return 'Creado'
      case 'updated':
      case 'update':
        return 'Actualizado'
      case 'deleted':
      case 'delete':
        return 'Eliminado'
      default:
        return action
    }
  }

  // Función para formatear el nombre del campo
  const formatFieldName = (field: string) => {
    const fieldNames: { [key: string]: string } = {
      'tipo_movimiento': 'Tipo de Movimiento',
      'cantidad': 'Cantidad',
      'costo_unitario': 'Costo Unitario',
      'costo_total': 'Costo Total',
      'valor_total': 'Valor Total',
      'moneda': 'Moneda',
      'fecha_movimiento': 'Fecha de Movimiento',
      'estado': 'Estado',
      'observaciones': 'Observaciones',
      'documento_tipo': 'Tipo de Documento',
      'documento_numero': 'Número de Documento',
      'almacen_id': 'Almacén',
      'almacen_destino_id': 'Almacén Destino',
      'stock_anterior': 'Stock Anterior',
      'stock_posterior': 'Stock Posterior',
      'created_at': 'Fecha de Creación',
      'updated_at': 'Fecha de Actualización'
    }
    return fieldNames[field] || field.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())
  }

  // Función para formatear el valor del campo
  const formatFieldValue = (field: string, value: any) => {
    if (value === null || value === undefined) return 'N/A'
    
    switch (field) {
      case 'tipo_movimiento':
        return getTipoMovimientoLabel(value)
      case 'estado':
        return getEstadoMovimientoLabel(value)
      case 'cantidad':
      case 'stock_anterior':
      case 'stock_posterior':
        return parseFloat(value).toLocaleString('es-NI')
      case 'costo_unitario':
      case 'costo_total':
      case 'valor_total':
        return `${parseFloat(value).toLocaleString('es-NI', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
      case 'fecha_movimiento':
      case 'created_at':
      case 'updated_at':
        return new Date(value).toLocaleString('es-NI')
      case 'moneda':
        return value === 'USD' ? 'Dólares (USD)' : 'Córdobas (NIO)'
      default:
        return String(value)
    }
  }

  // Función para formatear fecha
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-NI', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  if (!movimiento) return null

  const cambios = parseCambios(movimiento.cambios)

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { minHeight: '60vh', maxHeight: '90vh' }
      }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <HistoryIcon />
            <Typography variant="h6">
              Historial de Auditoría
            </Typography>
          </Box>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
        <Typography variant="subtitle2" color="text.secondary">
          Movimiento ID: {movimiento.id} - {getTipoMovimientoLabel(movimiento.tipo_movimiento)}
        </Typography>
      </DialogTitle>

      <DialogContent dividers>
        {cambios.length === 0 ? (
          <Alert severity="info">
            No hay historial de cambios disponible para este movimiento.
          </Alert>
        ) : (
          <Box sx={{ mt: 1 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Se encontraron {cambios.length} cambio(s) en el historial
            </Typography>

            {cambios.map((cambio, index) => (
              <Accordion
                key={index}
                expanded={expandedPanel === `panel-${index}`}
                onChange={handleAccordionChange(`panel-${index}`)}
                sx={{ mb: 1 }}
              >
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                    <Chip
                      icon={getActionIcon(cambio.accion)}
                      label={getActionLabel(cambio.accion)}
                      color={getActionColor(cambio.accion) as any}
                      size="small"
                    />
                    <Typography variant="body2" color="text.secondary">
                      {cambio.usuario} - {formatDate(cambio.fecha)}
                    </Typography>
                  </Box>
                </AccordionSummary>

                <AccordionDetails>
                  {cambio.datos_nuevos && Object.keys(cambio.datos_nuevos).length > 0 ? (
                    <Grid container spacing={2}>
                      {Object.entries(cambio.datos_nuevos).map(([field, newValue]) => {
                        const oldValue = cambio.datos_anteriores?.[field]
                        
                        // Solo mostrar campos que realmente cambiaron
                        if (oldValue === newValue) return null
                        
                        return (
                          <Grid item xs={12} key={field}>
                            <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                              <Typography variant="subtitle2" gutterBottom>
                                {formatFieldName(field)}
                              </Typography>
                              <Grid container spacing={2}>
                                <Grid item xs={6}>
                                  <Box>
                                    <Typography variant="caption" color="text.secondary">
                                      Valor Anterior:
                                    </Typography>
                                    <Typography 
                                      variant="body2" 
                                      sx={{ 
                                        p: 1, 
                                        bgcolor: 'error.light', 
                                        color: 'error.contrastText',
                                        borderRadius: 1,
                                        mt: 0.5
                                      }}
                                    >
                                      {formatFieldValue(field, oldValue)}
                                    </Typography>
                                  </Box>
                                </Grid>
                                <Grid item xs={6}>
                                  <Box>
                                    <Typography variant="caption" color="text.secondary">
                                      Valor Nuevo:
                                    </Typography>
                                    <Typography 
                                      variant="body2" 
                                      sx={{ 
                                        p: 1, 
                                        bgcolor: 'success.light', 
                                        color: 'success.contrastText',
                                        borderRadius: 1,
                                        mt: 0.5
                                      }}
                                    >
                                      {formatFieldValue(field, newValue)}
                                    </Typography>
                                  </Box>
                                </Grid>
                              </Grid>
                            </Paper>
                          </Grid>
                        )
                      })}
                    </Grid>
                  ) : (
                    <Alert severity="info">
                      No hay detalles de cambios específicos para esta acción.
                    </Alert>
                  )}
                </AccordionDetails>
              </Accordion>
            ))}
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} variant="contained">
          Cerrar
        </Button>
      </DialogActions>
    </Dialog>
  )
}