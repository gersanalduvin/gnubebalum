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

import type { CambioAuditoria } from '../types/types_index'

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

  const getAccionColor = (accion?: string) => {
    if (!accion) return 'default'
    switch (accion.toUpperCase()) {
      case 'CREATE':
        return 'success'
      case 'UPDATE':
        return 'warning'
      case 'DELETE':
        return 'error'
      default:
        return 'default'
    }
  }

  const getAccionIcon = (accion?: string) => {
    if (!accion) return '📝'
    switch (accion.toUpperCase()) {
      case 'CREATE':
        return '➕'
      case 'UPDATE':
        return '✏️'
      case 'DELETE':
        return '🗑️'
      default:
        return '📝'
    }
  }

  const formatDate = (fecha: string) => {
    return new Date(fecha).toLocaleString('es-NI', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const renderFieldChange = (cambio: CambioAuditoria) => {
    return (
      <TableContainer component={Paper} sx={{ mt: 2 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell><strong>Campo</strong></TableCell>
              <TableCell><strong>Valor Anterior</strong></TableCell>
              <TableCell><strong>Valor Nuevo</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            <TableRow>
              <TableCell>
                <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                  {cambio.campo_modificado || cambio.campo}
                </Typography>
              </TableCell>
              <TableCell>
                {cambio.valor_anterior !== null && cambio.valor_anterior !== undefined ? (
                  <Typography variant="body2" color="error.main">
                    {String(cambio.valor_anterior)}
                  </Typography>
                ) : (
                  <Typography variant="body2" color="text.disabled" sx={{ fontStyle: 'italic' }}>
                    -
                  </Typography>
                )}
              </TableCell>
              <TableCell>
                {cambio.valor_nuevo !== null && cambio.valor_nuevo !== undefined ? (
                  <Typography variant="body2" color="success.main">
                    {String(cambio.valor_nuevo)}
                  </Typography>
                ) : (
                  <Typography variant="body2" color="text.disabled" sx={{ fontStyle: 'italic' }}>
                    -
                  </Typography>
                )}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
    )
  }

  if (!parsedCambios || parsedCambios.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography variant="body2" color="text.secondary">
          No hay cambios registrados para este producto.
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
                label={cambio.accion?.toUpperCase() || 'CAMBIO'}
                color={getAccionColor(cambio.accion) as any}
                size="small"
              />
              <Typography variant="body2" color="text.secondary">
                {cambio.usuario || "Usuario"}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ ml: 'auto' }}>
                {formatDate(cambio.fecha)}
              </Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Box sx={{ mt: 1 }}>
              <Typography variant="subtitle2" gutterBottom>
                Detalles del cambio:
              </Typography>
              {renderFieldChange(cambio)}
            </Box>
          </AccordionDetails>
        </Accordion>
      ))}
    </Box>
  )
}

export default AuditoriaViewer