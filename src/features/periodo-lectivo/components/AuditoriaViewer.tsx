'use client'

import React from 'react'

import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Chip,
  Box,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material'

import type { CambioAuditoria } from '../types'

interface AuditoriaViewerProps {
  cambios: CambioAuditoria[] | string
}

const AuditoriaViewer: React.FC<AuditoriaViewerProps> = ({ cambios }) => {
  // Parsear cambios si es string
  const parsedCambios = React.useMemo(() => {
    if (typeof cambios === 'string') {
      try {
        // Si es un string JSON, intentar parsearlo
        const parsed = JSON.parse(cambios)
        return Array.isArray(parsed) ? parsed : []
      } catch {
        // Si no es JSON válido, devolver array vacío
        return []
      }
    }
    return Array.isArray(cambios) ? cambios : []
  }, [cambios])

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return date.toLocaleString('es-ES', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      })
    } catch {
      return dateString
    }
  }

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

  const getAccionIcon = (accion: string) => {
    switch (accion.toLowerCase()) {
      case 'creado':
        return 'ri-add-circle-line'
      case 'actualizado':
        return 'ri-edit-circle-line'
      case 'eliminado':
        return 'ri-delete-bin-line'
      default:
        return 'ri-information-line'
    }
  }

  const renderDataComparison = (datosAnteriores: any, datosNuevos: any) => {
    if (!datosAnteriores && !datosNuevos) return null

    const allKeys = new Set([
      ...Object.keys(datosAnteriores || {}),
      ...Object.keys(datosNuevos || {})
    ])

    return (
      <TableContainer component={Paper} className="mt-3" elevation={0}>
        <Table size="small">
          <TableHead>
            <TableRow className="bg-gray-50">
              <TableCell className="font-semibold">Campo</TableCell>
              <TableCell className="font-semibold">Valor Anterior</TableCell>
              <TableCell className="font-semibold">Valor Nuevo</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {Array.from(allKeys).map((key) => {
              const valorAnterior = datosAnteriores?.[key]
              const valorNuevo = datosNuevos?.[key]
              const hasChanged = valorAnterior !== valorNuevo

              return (
                <TableRow key={key} className={hasChanged ? 'bg-yellow-50' : ''}>
                  <TableCell className="font-medium">
                    {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </TableCell>
                  <TableCell>
                    {valorAnterior !== undefined ? (
                      <span className={hasChanged ? 'text-red-600 line-through' : 'text-gray-600'}>
                        {typeof valorAnterior === 'boolean' 
                          ? (valorAnterior ? 'Sí' : 'No')
                          : String(valorAnterior)
                        }
                      </span>
                    ) : (
                      <span className="text-gray-400 italic">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {valorNuevo !== undefined ? (
                      <span className={hasChanged ? 'text-green-600 font-medium' : 'text-gray-600'}>
                        {typeof valorNuevo === 'boolean' 
                          ? (valorNuevo ? 'Sí' : 'No')
                          : String(valorNuevo)
                        }
                      </span>
                    ) : (
                      <span className="text-gray-400 italic">-</span>
                    )}
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
      <Box className="text-center py-8">
        <div className="bg-gray-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-3">
          <i className="ri-file-list-3-line text-gray-400 text-2xl" />
        </div>
        <Typography variant="body2" className="text-gray-500">
          No hay cambios registrados
        </Typography>
      </Box>
    )
  }

  return (
    <div className="space-y-3">
      {parsedCambios.map((cambio, index) => (
        <Accordion key={index} className="border border-gray-200 rounded-lg shadow-sm">
          <AccordionSummary
            expandIcon={<i className="ri-arrow-down-s-line text-gray-600" />}
            className="bg-gradient-to-r from-gray-50 to-gray-100"
          >
            <div className="flex items-center justify-between w-full mr-4">
              <div className="flex items-center gap-3">
                <div className="bg-white p-2 rounded-lg shadow-sm">
                  <i className={`${getAccionIcon(cambio.accion)} text-lg`} 
                     style={{ color: getAccionColor(cambio.accion) === 'success' ? '#4caf50' : 
                                     getAccionColor(cambio.accion) === 'warning' ? '#ff9800' : 
                                     getAccionColor(cambio.accion) === 'error' ? '#f44336' : '#757575' }} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <Chip 
                      label={cambio.accion}
                      color={getAccionColor(cambio.accion) as any}
                      size="small"
                      className="font-medium"
                    />
                    <Typography variant="body2" className="text-gray-600">
                      {cambio.usuario_email || 
                       (cambio.datos_nuevos?.usuario) || 
                       (cambio.datos_anteriores?.usuario) || 
                       "Usuario"}
                    </Typography>
                  </div>
                  <Typography variant="caption" className="text-gray-500 mt-1 block">
                    {formatDate(cambio.fecha)}
                  </Typography>
                </div>
              </div>
            </div>
          </AccordionSummary>
          <AccordionDetails className="bg-white">
            {(cambio.datos_anteriores || cambio.datos_nuevos) ? (
              <div>
                <Typography variant="subtitle2" className="mb-3 text-gray-700 font-semibold">
                  Detalles de los cambios:
                </Typography>
                {renderDataComparison(cambio.datos_anteriores, cambio.datos_nuevos)}
              </div>
            ) : (
              <Typography variant="body2" className="text-gray-500 italic">
                No hay detalles adicionales para este cambio
              </Typography>
            )}
          </AccordionDetails>
        </Accordion>
      ))}
    </div>
  )
}

export default AuditoriaViewer