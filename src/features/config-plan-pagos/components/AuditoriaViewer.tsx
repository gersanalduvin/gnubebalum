'use client'

import React from 'react'

import {
  Box,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip
} from '@mui/material'
import { ExpandMore as ExpandMoreIcon } from '@mui/icons-material'

import type { CambioAuditoria } from '../types'

interface AuditoriaViewerProps {
  cambios: string | CambioAuditoria[]
}

const AuditoriaViewer: React.FC<AuditoriaViewerProps> = ({ cambios }) => {
  // Parsear los cambios si vienen como string
  const parsedCambios: CambioAuditoria[] = React.useMemo(() => {
    if (typeof cambios === 'string') {
      try {
        return JSON.parse(cambios)
      } catch {
        return []
      }
    }
    return Array.isArray(cambios) ? cambios : []
  }, [cambios])

  // Función para obtener el color según la acción
  const getAccionColor = (accion: string) => {
    switch (accion.toLowerCase()) {
      case 'create':
      case 'created':
        return 'success'
      case 'update':
      case 'updated':
        return 'warning'
      case 'delete':
      case 'deleted':
        return 'error'
      default:
        return 'default'
    }
  }

  // Función para obtener el icono según la acción
  const getAccionIcon = (accion: string) => {
    switch (accion.toLowerCase()) {
      case 'create':
      case 'created':
        return '➕'
      case 'update':
      case 'updated':
        return '✏️'
      case 'delete':
      case 'deleted':
        return '🗑️'
      default:
        return '📝'
    }
  }

  // Función para formatear valores especiales
  const formatValue = (key: string, value: any) => {
    if (value === null || value === undefined) return '-'
    
    // Formatear fechas
    if (key.includes('fecha') && typeof value === 'string') {
      try {
        return new Date(value).toLocaleDateString('es-CR')
      } catch {
        return value
      }
    }
    
    // Formatear montos
    if (key === 'monto' && typeof value === 'number') {
      return new Intl.NumberFormat('es-CR', {
        style: 'currency',
        currency: 'CRC'
      }).format(value)
    }
    
    // Formatear booleanos
    if (typeof value === 'boolean') {
      return value ? 'Sí' : 'No'
    }
    
    // Para objetos, convertir a JSON
    if (typeof value === 'object') {
      return JSON.stringify(value)
    }
    
    return String(value)
  }

  // Función para renderizar la comparación de datos
  const renderDataComparison = (datosNuevos: Record<string, any>, datosAnteriores: Record<string, any>) => {
    const allKeys = new Set([...Object.keys(datosNuevos || {}), ...Object.keys(datosAnteriores || {})])
    const filteredKeys = Array.from(allKeys).filter(key => 
      !['id', 'uuid', 'created_at', 'updated_at', 'created_by', 'updated_by', 'deleted_by', 'deleted_at', 'is_synced', 'synced_at', 'updated_locally_at', 'version', 'cambios'].includes(key)
    )

    if (filteredKeys.length === 0) {
      return (
        <Typography variant="body2" color="text.secondary">
          No hay cambios de datos para mostrar
        </Typography>
      )
    }

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
            {filteredKeys.map((key) => {
              const valorAnterior = datosAnteriores?.[key]
              const valorNuevo = datosNuevos?.[key]
              const hasChanged = valorAnterior !== valorNuevo

              return (
                <TableRow key={key} sx={{ backgroundColor: hasChanged ? 'action.hover' : 'transparent' }}>
                  <TableCell>
                    <Typography variant="body2" fontWeight="medium">
                      {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography 
                      variant="body2" 
                      color={hasChanged ? 'error.main' : 'text.secondary'}
                      sx={{ textDecoration: hasChanged ? 'line-through' : 'none' }}
                    >
                      {formatValue(key, valorAnterior)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography 
                      variant="body2" 
                      color={hasChanged ? 'success.main' : 'text.secondary'}
                      fontWeight={hasChanged ? 'medium' : 'normal'}
                    >
                      {formatValue(key, valorNuevo)}
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

  if (!parsedCambios || parsedCambios.length === 0) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          No hay historial de cambios disponible
        </Typography>
      </Box>
    )
  }

  return (
    <Box sx={{ width: '100%' }}>
      {parsedCambios.map((cambio, index) => (
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
                {cambio.usuario_email || 
                 (cambio.datos_nuevos?.usuario) || 
                 (cambio.datos_anteriores?.usuario) || 
                 "Usuario"}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ ml: 'auto' }}>
                {new Date(cambio.fecha).toLocaleString('es-CR', {
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
              {renderDataComparison(cambio.datos_nuevos, cambio.datos_anteriores || {})}
            </Box>
          </AccordionDetails>
        </Accordion>
      ))}
    </Box>
  )
}

export default AuditoriaViewer