'use client'

import React, { useState, memo, useCallback } from 'react'

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Alert,
  CircularProgress,
  Box,
  Chip
} from '@mui/material'

import rolesService from '../services/rolesService'
import type { Role } from '../types'

interface DeleteConfirmDialogProps {
  open: boolean
  role?: Role
  onClose: () => void
  onSuccess: () => void
}

const DeleteConfirmDialog = ({ open, role, onClose, onSuccess }: DeleteConfirmDialogProps) => {
  // Estados
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [validationInfo, setValidationInfo] = useState<{
    canDelete: boolean
    message?: string
    relatedData?: {
      users_count?: number
      dependencies?: string[]
    }
  } | null>(null)

  const [validationLoading, setValidationLoading] = useState(false)

  // Validar si se puede eliminar el rol
  const validateDeletion = useCallback(async () => {
    if (!role) return

    try {
      setValidationLoading(true)
      setError(null)
      const response = await rolesService.validateRoleDeletion(role.id)

      setValidationInfo(response.data)
    } catch (error: any) {
      setError(error.message || 'Error al validar la eliminación')
      setValidationInfo({ canDelete: false, message: 'Error de validación' })
    } finally {
      setValidationLoading(false)
    }
  }, [role])

  // Efectos
  React.useEffect(() => {
    if (open && role) {
      validateDeletion()
    } else {
      setValidationInfo(null)
      setError(null)
    }
  }, [open, role, validateDeletion])

  // Handlers
  const handleDelete = async () => {
    if (!role || !validationInfo?.canDelete) return

    try {
      setLoading(true)
      setError(null)
      await rolesService.deleteRole(role.id)
      onSuccess()
    } catch (error: any) {
      setError(error.message || 'Error al eliminar el rol')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    if (!loading && !validationLoading) {
      onClose()
    }
  }

  if (!role) return null

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth='sm'
      fullWidth
    >
      <DialogTitle>
        <Box className='flex items-center gap-2'>
          <i className='ri-delete-bin-line text-error' />
          Confirmar Eliminación
        </Box>
      </DialogTitle>
      
      <DialogContent>
        {error && (
          <Alert severity='error' sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        
        {validationLoading ? (
          <Box className='flex justify-center items-center py-8'>
            <CircularProgress size={24} />
            <Typography variant='body2' sx={{ ml: 2 }}>
              Validando eliminación...
            </Typography>
          </Box>
        ) : (
          <>
            <Typography variant='body1' gutterBottom>
              ¿Está seguro que desea eliminar el siguiente rol?
            </Typography>
            
            <Box className='bg-gray-50 p-4 rounded-lg my-3'>
              <Box className='flex items-center justify-between mb-2'>
                <Typography variant='h6' className='font-medium'>
                  {role.nombre}
                </Typography>
                <Chip
                  label='Activo'
                  color='success'
                  variant='tonal'
                  size='small'
                />
              </Box>
              
              <Typography variant='body2' color='text.secondary'>
                Permisos: {role.permisos.length}
              </Typography>
              
              <Typography variant='caption' color='text.secondary'>
                Creado: {new Date(role.created_at).toLocaleDateString()}
              </Typography>
            </Box>
            
            {validationInfo && (
              <>
                {!validationInfo.canDelete ? (
                  <Alert severity='warning' sx={{ mt: 2 }}>
                    <Typography variant='body2' className='font-medium' gutterBottom>
                      No se puede eliminar este rol
                    </Typography>
                    <Typography variant='body2'>
                      {validationInfo.message || 'El rol tiene dependencias que impiden su eliminación.'}
                    </Typography>
                    
                    {validationInfo.relatedData?.users_count && validationInfo.relatedData.users_count > 0 && (
                      <Typography variant='body2' sx={{ mt: 1 }}>
                        • {validationInfo.relatedData.users_count} usuario(s) asignado(s) a este rol
                      </Typography>
                    )}
                    
                    {validationInfo.relatedData?.dependencies && validationInfo.relatedData.dependencies.length > 0 && (
                      <Box sx={{ mt: 1 }}>
                        <Typography variant='body2'>• Dependencias:</Typography>
                        <ul style={{ marginLeft: '1rem', marginTop: '0.25rem' }}>
                          {validationInfo.relatedData.dependencies.map((dep, index) => (
                            <li key={index}>
                              <Typography variant='body2'>{dep}</Typography>
                            </li>
                          ))}
                        </ul>
                      </Box>
                    )}
                  </Alert>
                ) : (
                  <Alert severity='info' sx={{ mt: 2 }}>
                    <Typography variant='body2'>
                      {validationInfo.message || 'El rol puede ser eliminado de forma segura.'}
                    </Typography>
                  </Alert>
                )}
              </>
            )}
            
            {validationInfo?.canDelete && (
              <Alert severity='error' sx={{ mt: 2 }}>
                <Typography variant='body2' className='font-medium'>
                  ⚠️ Esta acción no se puede deshacer
                </Typography>
                <Typography variant='body2'>
                  Una vez eliminado, el rol y toda su configuración se perderán permanentemente.
                </Typography>
              </Alert>
            )}
          </>
        )}
      </DialogContent>
      
      <DialogActions className='dialog-actions-dense'>
        <Button
          onClick={handleClose}
          disabled={loading || validationLoading}
        >
          Cancelar
        </Button>
        
        {validationInfo?.canDelete && (
          <Button
            variant='contained'
            color='error'
            onClick={handleDelete}
            disabled={loading || validationLoading}
            startIcon={loading ? <CircularProgress size={16} /> : <i className='ri-delete-bin-line' />}
          >
            {loading ? 'Eliminando...' : 'Eliminar Rol'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  )
}

export default memo(DeleteConfirmDialog)