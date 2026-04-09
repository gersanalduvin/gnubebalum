'use client'

import { useState, useEffect, useMemo, useCallback, useRef, memo } from 'react'

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Grid,
  Alert,
  CircularProgress,
  Typography,
  Divider,
  Box,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  Stack
} from '@mui/material'

import { toast } from 'react-hot-toast'

import rolesService from '../services/rolesService'
import type { Role, CreateRoleRequest, UpdateRoleRequest } from '../types'

interface RoleModalProps {
  open: boolean
  mode: 'create' | 'edit'
  role?: Role
  onClose: () => void
  onSuccess: () => void
}

interface FormData {
  nombre: string
  permisos: string[]
}

interface FormErrors {
  nombre?: string
  permisos?: string
}

const RoleModal = ({ open, mode, role, onClose, onSuccess }: RoleModalProps) => {
  
  const [formData, setFormData] = useState<FormData>({
    nombre: '',
    permisos: []
  })
  
  const [errors, setErrors] = useState<FormErrors>({})
  const [loading, setLoading] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [availablePermissions, setAvailablePermissions] = useState<any>({})
  const [loadingPermissions, setLoadingPermissions] = useState(false)

  // Ref para evitar cargar permisos múltiples veces
  const permissionsLoadedRef = useRef(false)
  
  // Cargar permisos disponibles desde la API
  const loadAvailablePermissions = useCallback(async () => {
    // Evitar cargar permisos si ya se cargaron
    if (permissionsLoadedRef.current) {
      return
    }
    
    try {
      setLoadingPermissions(true)
      
      const result = await rolesService.getAvailablePermissions()
      
      if (result.success && result.data) {
        // Procesar los permisos del backend
        const processedPermissions = processBackendPermissions(result.data)
        
        setAvailablePermissions(processedPermissions)
        permissionsLoadedRef.current = true
      } else {
        await loadFallbackPermissions()
      }
    } catch (error) {
      console.error('Error loading permissions:', error)
      await loadFallbackPermissions()
    } finally {
      setLoadingPermissions(false)
    }
  }, [])
  
  // Función para procesar permisos del backend
  const processBackendPermissions = (data: any) => {
    // Si data tiene una propiedad data anidada, usar esa
    const permissionsData = data.data || data
    
    const grouped: { [key: string]: { [key: string]: any[] } } = {}
    
    if (typeof permissionsData === 'object' && permissionsData !== null && !Array.isArray(permissionsData)) {
      // Procesar cada categoría (configuracion, usuarios, etc.)
      Object.entries(permissionsData).forEach(([categoryKey, categoryData]: [string, any]) => {
        if (!categoryData || !categoryData.modules) {
          return
        }
        
        const categoryName = categoryData.category_name || categoryKey
        
        // Inicializar categoría en permisos agrupados
        if (!grouped[categoryName]) {
          grouped[categoryName] = {}
        }
        
        // Procesar cada módulo dentro de la categoría
        Object.entries(categoryData.modules).forEach(([moduleKey, moduleData]: [string, any]) => {
          if (!moduleData || !moduleData.permissions) {
            return
          }
          
          const moduleName = moduleData.module_name || moduleKey
          
          // Inicializar módulo en categoría
          if (!grouped[categoryName][moduleName]) {
            grouped[categoryName][moduleName] = []
          }
          
          // Procesar cada permiso dentro del módulo
          moduleData.permissions.forEach((permission: any) => {
            if (!permission || !permission.permission) {
              return
            }
            
            // Agregar permiso al módulo con formato esperado
            grouped[categoryName][moduleName].push({
              nombre: permission.permission,
              display_name: permission.display_name || permission.action,
              descripcion: `Permiso para ${permission.action} en el módulo de ${moduleName}`,
              category_name: categoryName,
              module_name: moduleName
            })
          })
        })
      })
      
      return grouped
    } else if (Array.isArray(permissionsData)) {
      permissionsData.forEach((permission: any) => {
        const categoryName = permission.category_name || 'Sin Categoría'
        const moduleName = permission.module_name || 'Sin Módulo'
        
        if (!grouped[categoryName]) {
          grouped[categoryName] = {}
        }
        
        if (!grouped[categoryName][moduleName]) {
          grouped[categoryName][moduleName] = []
        }
        
        grouped[categoryName][moduleName].push(permission)
      })
      
      return grouped
    } else {
      return {}
    }
  }
  
  // Función de fallback para cargar permisos por defecto
  const loadFallbackPermissions = async () => {
    try {
      const { AVAILABLE_PERMISSIONS } = await import('../types')
      
      const defaultPermissions: { [key: string]: { [key: string]: any[] } } = {
        'Configuración': {},
        'Gestión': {},
        'Reportes': {}
      }
      
      // Mapeo de módulos a categorías según el backend
      const moduleToCategory: { [key: string]: string } = {
        'ROLES': 'Configuración',
        'USUARIOS': 'Configuración', 
        'PERMISOS': 'Configuración',
        'PRODUCTOS': 'Gestión',
        'CATEGORIAS': 'Gestión',
        'VENTAS': 'Reportes',
        'USUARIOS_REPORTES': 'Reportes'
      }
      
      Object.entries(AVAILABLE_PERMISSIONS).forEach(([moduleName, modulePerms]) => {
        const categoryName = moduleToCategory[moduleName] || 'Configuración'
        
        if (!defaultPermissions[categoryName][moduleName]) {
          defaultPermissions[categoryName][moduleName] = []
        }
        
        const permissions = Object.entries(modulePerms).map(([action, permission]) => ({
          nombre: permission,
          display_name: `${action} ${moduleName}`,
          descripcion: `Permiso para ${action.toLowerCase()} en el módulo de ${moduleName.toLowerCase()}`,
          category_name: categoryName,
          module_name: moduleName
        }))
        
        defaultPermissions[categoryName][moduleName] = permissions
      })
      
      setAvailablePermissions(defaultPermissions)
      permissionsLoadedRef.current = true
    } catch (fallbackError) {
      console.error('Error in fallback:', fallbackError)
      setAvailablePermissions({})
      permissionsLoadedRef.current = true
    }
  }

  // Efectos
  useEffect(() => {
    if (open) {
      // Cargar permisos disponibles
      loadAvailablePermissions()
      
      // Inicializar formulario
      if (mode === 'edit' && role) {
        const initialPermisos = Array.isArray(role.permisos) 
          ? role.permisos.map(p => typeof p === 'string' ? p : String(p))
          : []

        setFormData({
          nombre: role.nombre,
          permisos: initialPermisos
        })
      } else {
        setFormData({ nombre: '', permisos: [] })
      }
      
      setErrors({})
      setSubmitError(null)
    } else {
      // Resetear el ref cuando se cierre el modal para permitir cargar permisos la próxima vez
      permissionsLoadedRef.current = false
    }
  }, [open, mode, role, loadAvailablePermissions])

  // Validación
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    if (!formData.nombre.trim()) {
      newErrors.nombre = 'El nombre es requerido'
    } else if (formData.nombre.length < 2) {
      newErrors.nombre = 'El nombre debe tener al menos 2 caracteres'
    } else if (formData.nombre.length > 255) {
      newErrors.nombre = 'El nombre no puede exceder 255 caracteres'
    }

    if (formData.permisos.length === 0) {
      newErrors.permisos = 'Debe seleccionar al menos un permiso'
    }

    setErrors(newErrors)
    
return Object.keys(newErrors).length === 0
  }

  // Handlers (optimizados con useCallback)
  const handleInputChange = useCallback((field: keyof FormData) => (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value

    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Limpiar error del campo
    if (errors[field as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }, [errors])

  const handlePermissionChange = useCallback((permissionName: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    const isChecked = event.target.checked
    
    setFormData(prev => {
      const currentPermisos = [...prev.permisos]
      
      if (isChecked) {
        // Agregar permiso si no existe
        if (!currentPermisos.includes(permissionName)) {
          currentPermisos.push(permissionName)
        }
      } else {
        // Remover permiso
        const index = currentPermisos.indexOf(permissionName)

        if (index > -1) {
          currentPermisos.splice(index, 1)
        }
      }
      
      return {
        ...prev,
        permisos: currentPermisos
      }
    })
    
    // Limpiar error de permisos
    if (errors.permisos) {
      setErrors(prev => ({ ...prev, permisos: undefined }))
    }
  }, [errors.permisos])

  // Función para seleccionar/deseleccionar permisos de una categoría
  const handleCategoryToggle = useCallback((categoryName: string) => {
    const categoryPermissions: string[] = []
    const categoryGroups = availablePermissions[categoryName]
    
    if (categoryGroups && typeof categoryGroups === 'object') {
      Object.values(categoryGroups).forEach((permissions: any) => {
        if (Array.isArray(permissions)) {
          permissions.forEach((permission: any) => {
            const permissionName = permission.nombre || permission.name || permission

            if (permissionName) {
              categoryPermissions.push(permissionName)
            }
          })
        }
      })
    }
    
    const allCategorySelected = categoryPermissions.every(name => formData.permisos.includes(name))
    
    setFormData(prev => {
      if (allCategorySelected) {
        // Deseleccionar toda la categoría
        return {
          ...prev,
          permisos: prev.permisos.filter(p => !categoryPermissions.includes(p))
        }
      } else {
        // Seleccionar toda la categoría
        const newPermisos = [...prev.permisos]

        categoryPermissions.forEach(permission => {
          if (!newPermisos.includes(permission)) {
            newPermisos.push(permission)
          }
        })
        
return {
          ...prev,
          permisos: newPermisos
        }
      }
    })
  }, [availablePermissions, formData.permisos])

  // Función para seleccionar/deseleccionar permisos de un módulo
  const handleModuleToggle = useCallback((categoryName: string, moduleName: string) => {
    const modulePermissions: string[] = []
    const categoryGroups = availablePermissions[categoryName]
    
    if (categoryGroups && categoryGroups[moduleName] && Array.isArray(categoryGroups[moduleName])) {
      categoryGroups[moduleName].forEach((permission: any) => {
        const permissionName = permission.nombre || permission.name || permission

        if (permissionName) {
          modulePermissions.push(permissionName)
        }
      })
    }
    
    const allModuleSelected = modulePermissions.every(name => formData.permisos.includes(name))
    
    setFormData(prev => {
      if (allModuleSelected) {
        // Deseleccionar todo el módulo
        return {
          ...prev,
          permisos: prev.permisos.filter(p => !modulePermissions.includes(p))
        }
      } else {
        // Seleccionar todo el módulo
        const newPermisos = [...prev.permisos]

        modulePermissions.forEach(permission => {
          if (!newPermisos.includes(permission)) {
            newPermisos.push(permission)
          }
        })
        
return {
          ...prev,
          permisos: newPermisos
        }
      }
    })
  }, [availablePermissions, formData.permisos])

  const handleSelectAllPermissions = () => {
    // Obtener todos los nombres de permisos de todos los grupos
    const allPermissionNames: string[] = []

    Object.values(availablePermissions).forEach((categoryGroups: any) => {
      if (categoryGroups && typeof categoryGroups === 'object') {
        Object.values(categoryGroups).forEach((permissions: any) => {
          if (Array.isArray(permissions)) {
            permissions.forEach((permission: any) => {
              const permissionName = permission.nombre || permission.name || permission

              if (permissionName && !allPermissionNames.includes(permissionName)) {
                allPermissionNames.push(permissionName)
              }
            })
          }
        })
      }
    })
    
    const hasAllSelected = allPermissionNames.every(name => formData.permisos.includes(name))
    
    setFormData(prev => ({
      ...prev,
      permisos: hasAllSelected ? [] : allPermissionNames
    }))
    
    // Limpiar error de permisos
    if (errors.permisos) {
      setErrors(prev => ({ ...prev, permisos: undefined }))
    }
  }

  const handleSubmit = async () => {
    if (!validateForm()) return

    try {
      setLoading(true)
      setSubmitError(null)

      if (mode === 'create') {
        const createData: CreateRoleRequest = {
          nombre: formData.nombre.trim(),
          permisos: formData.permisos
        }

        await rolesService.createRole(createData)
        toast.success('Rol creado exitosamente')
      } else if (role) {
        const updateData: UpdateRoleRequest = {
          nombre: formData.nombre.trim(),
          permisos: formData.permisos
        }

        await rolesService.updateRole(role.id, updateData)
        toast.success('Rol actualizado exitosamente')
      }

      onSuccess()
    } catch (error: any) {
      // Manejar errores de validación del backend
      // El httpClient devuelve errores con estructura: { status, statusText, data }
      const backendErrors = error.data?.errors || error.response?.data?.errors
      
      if (backendErrors) {
        const newErrors: FormErrors = {}
        
        // Mapear errores específicos del backend
        if (backendErrors.nombre) {
          newErrors.nombre = Array.isArray(backendErrors.nombre) 
            ? backendErrors.nombre[0] 
            : backendErrors.nombre
        }
        
        if (backendErrors.permisos) {
          newErrors.permisos = Array.isArray(backendErrors.permisos) 
            ? backendErrors.permisos[0] 
            : backendErrors.permisos
        }
        
        setErrors(newErrors)
        
        // Solo mostrar mensaje general si no hay errores específicos mapeados
        if (Object.keys(newErrors).length === 0) {
          const generalMessage = error.data?.message || error.response?.data?.message || 'Errores de validación'

          setSubmitError(generalMessage)
        } else {
          setSubmitError(null) // Limpiar error general si hay errores específicos
          toast.error('Errores de validación en el formulario')
        }
      } else {
        // Error general del servidor o de red
        const errorMessage = error.data?.message || error.response?.data?.message || error.message || 'Error al guardar el rol'

        setSubmitError(errorMessage)
        toast.error(errorMessage)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    if (!loading) {
      onClose()
    }
  }

  // Los permisos ya vienen agrupados de la API
  const groupedPermissions = availablePermissions

  // Obtener todos los nombres de permisos para validaciones (optimizado con useMemo)
  const allPermissionNames = useMemo(() => {
    const names: string[] = []

    Object.values(availablePermissions).forEach((categoryGroups: any) => {
      if (categoryGroups && typeof categoryGroups === 'object') {
        Object.values(categoryGroups).forEach((permissions: any) => {
          if (Array.isArray(permissions)) {
            permissions.forEach((permission: any) => {
              const permissionName = permission.nombre || permission.name || permission

              if (permissionName && !names.includes(permissionName)) {
                names.push(permissionName)
              }
            })
          }
        })
      }
    })
    
return names
  }, [availablePermissions])
  
  const hasAllSelected = useMemo(() => {
    return allPermissionNames.length > 0 && allPermissionNames.every(name => formData.permisos.includes(name))
  }, [allPermissionNames, formData.permisos])

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth='lg'
      fullWidth
      PaperProps={{
        sx: { 
          minHeight: '500px',
          maxHeight: '90vh',
          '& .MuiDialogContent-root': {
            paddingTop: '16px !important'
          }
        }
      }}
    >
      <DialogTitle>
        {mode === 'create' ? 'Crear Nuevo Rol' : `Editar Rol: ${role?.nombre}`}
      </DialogTitle>
      
      <DialogContent>
        {submitError && (
          <Alert severity='error' sx={{ mb: 3 }}>
            {submitError}
          </Alert>
        )}
        
        <Grid container spacing={2}>
          {/* Información básica */}
          <Grid item xs={12}>
            <Typography variant='h6' sx={{ mb: 1, fontWeight: 600 }}>
              Información Básica
            </Typography>
          </Grid>
          
          <Grid item xs={12}>
            <TextField
              fullWidth
              label='Nombre del Rol'
              value={formData.nombre}
              onChange={handleInputChange('nombre')}
              error={!!errors.nombre}
              helperText={errors.nombre}
              disabled={loading}
              required
              size='small'
            />
          </Grid>
          

          

          
          {/* Permisos */}
          <Grid item xs={12}>
            <Divider sx={{ mt: 2, mb: 1 }} />
            <Stack direction='row' justifyContent='space-between' alignItems='center' sx={{ mb: 2 }}>
              <Box>
                <Typography variant='h6'>
                  Permisos
                </Typography>
                <Typography variant='body2' color='text.secondary'>
                  {formData.permisos.length} de {allPermissionNames.length} seleccionados
                </Typography>
              </Box>
              <Button
                size='small'
                variant='outlined'
                onClick={handleSelectAllPermissions}
                disabled={loading || loadingPermissions}
              >
                {hasAllSelected ? 'Deseleccionar Todo' : 'Seleccionar Todo'}
              </Button>
            </Stack>
            

            
            {errors.permisos && (
              <Alert severity='error' sx={{ mb: 2 }}>
                {errors.permisos}
              </Alert>
            )}
          </Grid>
          
          {loadingPermissions ? (
            <Grid item xs={12}>
              <Box className='flex justify-center items-center py-4'>
                <CircularProgress size={20} />
                <Typography variant='body2' sx={{ ml: 2 }}>
                  Cargando permisos...
                </Typography>
              </Box>
            </Grid>
          ) : (
            <Grid item xs={12}>
              {Object.entries(groupedPermissions).map(([categoryName, moduleGroups]) => {
                // Verificar si moduleGroups es un objeto
                if (!moduleGroups || typeof moduleGroups !== 'object') {
                  return null;
                }
                
                // Verificar si hay módulos con permisos en esta categoría
                const hasModulesWithPermissions = Object.values(moduleGroups).some((permissions: any) => 
                  Array.isArray(permissions) && permissions.length > 0
                )
                
                if (!hasModulesWithPermissions) {
                  return null;
                }
                
                // Contar permisos seleccionados en toda la categoría
                let totalInCategory = 0
                let selectedInCategory = 0
                
                Object.values(moduleGroups).forEach((permissions: any) => {
                  if (Array.isArray(permissions) && permissions.length > 0) {
                    const categoryPermissionNames = permissions.map((p: any) => p.nombre || p.name || p)

                    totalInCategory += categoryPermissionNames.length
                    selectedInCategory += categoryPermissionNames.filter(name => formData.permisos.includes(name)).length
                  }
                })
                
                return (
                  <Box key={categoryName} sx={{ mb: 2 }}>
                    {/* Título de la categoría con botón para seleccionar toda la categoría */}
                    <Stack direction='row' alignItems='center' justifyContent='space-between' sx={{ mb: 1 }}>
                      <Typography variant='h6' sx={{ fontWeight: 600, color: 'primary.main' }}>
                        {categoryName}
                        <Chip 
                          label={`${selectedInCategory}/${totalInCategory}`}
                          size='small'
                          color={selectedInCategory === totalInCategory ? 'success' : selectedInCategory > 0 ? 'warning' : 'default'}
                          variant='outlined'
                          sx={{ ml: 2 }}
                        />
                      </Typography>
                      <Box
                        component='span'
                        onClick={() => handleCategoryToggle(categoryName)}
                        sx={{ 
                          minWidth: 'auto', 
                          px: 2,
                          py: 0.5,
                          border: '1px solid',
                          borderColor: 'primary.main',
                          borderRadius: 1,
                          fontSize: '0.875rem',
                          color: 'primary.main',
                          cursor: loading ? 'not-allowed' : 'pointer',
                          opacity: loading ? 0.5 : 1,
                          backgroundColor: 'transparent',
                          '&:hover': {
                            backgroundColor: 'primary.main',
                            color: 'white'
                          }
                        }}
                      >
                        {selectedInCategory === totalInCategory ? 'Deseleccionar' : 'Seleccionar'} Todo
                      </Box>
                    </Stack>
                    
                    {/* Módulos dentro de la categoría */}
                     {Object.entries(moduleGroups).map(([moduleName, modulePermissions]) => {
                       if (!Array.isArray(modulePermissions) || modulePermissions.length === 0) return null;
                       
                       const modulePermissionNames = modulePermissions.map((p: any) => p.nombre || p.name || p)
                       const selectedInModule = modulePermissionNames.filter(name => formData.permisos.includes(name)).length
                       const totalInModule = modulePermissionNames.length
                      
                      return (
                        <Accordion key={`${categoryName}-${moduleName}`} defaultExpanded sx={{ mb: 1, ml: 2 }}>
                          <AccordionSummary
                            sx={{ 
                              minHeight: 48,
                              '&.Mui-expanded': { minHeight: 48 },
                              '& .MuiAccordionSummary-content': { 
                                alignItems: 'center',
                                '&.Mui-expanded': { margin: '12px 0' }
                              }
                            }}
                          >
                            <Stack direction='row' alignItems='center' spacing={2} sx={{ width: '100%' }}>
                              <Typography variant='subtitle1' sx={{ fontWeight: 600, textTransform: 'capitalize' }}>
                                {moduleName}
                              </Typography>
                              <Chip 
                                label={`${selectedInModule}/${totalInModule}`}
                                size='small'
                                color={selectedInModule === totalInModule ? 'success' : selectedInModule > 0 ? 'warning' : 'default'}
                                variant='outlined'
                              />
                              <Box sx={{ flexGrow: 1 }} />
                              <Box
                                component='span'
                                onClick={() => handleModuleToggle(categoryName, moduleName)}
                                sx={{ 
                                  minWidth: 'auto', 
                                  px: 1, 
                                  fontSize: '0.75rem',
                                  color: 'primary.main',
                                  cursor: loading ? 'not-allowed' : 'pointer',
                                  opacity: loading ? 0.5 : 1,
                                  textDecoration: 'underline',
                                  '&:hover': {
                                    color: 'primary.dark',
                                    textDecoration: 'none'
                                  }
                                }}
                              >
                                {selectedInModule === totalInModule ? 'Deseleccionar' : 'Seleccionar'} Todo
                              </Box>
                            </Stack>
                          </AccordionSummary>
                          <AccordionDetails sx={{ pt: 0 }}>
                            <FormGroup>
                              <Grid container spacing={1}>
                                {modulePermissions.map((permission: any, index: number) => {
                                  const permissionName = permission.nombre || permission.name || permission;
                                  const displayName = permission.display_name || permission.descripcion || permissionName;
                                  const description = permission.descripcion || permission.description;
                                  
                                  // Validar que permissionName no sea undefined/null
                                  if (!permissionName || typeof permissionName !== 'string') {
                                    console.warn('⚠️ Permiso inválido encontrado:', permission);
                                    
return null;
                                  }
                                  
                                  // Crear una clave única combinando el índice y el nombre del permiso
                                  const uniqueKey = `${index}-${permissionName}`;
                                  
                                  return (
                                    <Grid item xs={12} sm={6} key={uniqueKey}>
                                      <FormControlLabel
                                        control={
                                          <Checkbox
                                            checked={formData.permisos.includes(permissionName)}
                                            onChange={handlePermissionChange(permissionName)}
                                            disabled={loading}
                                            size='small'
                                          />
                                        }
                                        label={
                                          <Box>
                                            <Typography variant='body2' sx={{ fontWeight: 500, lineHeight: 1.2 }}>
                                              {displayName}
                                            </Typography>
                                            {description && (
                                              <Typography variant='caption' color='text.secondary' sx={{ display: 'block', lineHeight: 1.1 }}>
                                                {description}
                                              </Typography>
                                            )}
                                          </Box>
                                        }
                                        sx={{ 
                                          margin: 0,
                                          padding: '4px 8px',
                                          borderRadius: 1,
                                          '&:hover': {
                                            backgroundColor: 'action.hover'
                                          }
                                        }}
                                      />
                                    </Grid>
                                  );
                                })}
                              </Grid>
                            </FormGroup>
                          </AccordionDetails>
                        </Accordion>
                      );
                    })}
                  </Box>
                );
              })}
            </Grid>
          )}
        </Grid>
      </DialogContent>
      

      
      <DialogActions className='dialog-actions-dense'>
        <Button
          onClick={handleClose}
          disabled={loading}
        >
          Cancelar
        </Button>
        <Button
          variant='contained'
          onClick={handleSubmit}
          disabled={loading || loadingPermissions}
          startIcon={loading ? <CircularProgress size={16} /> : undefined}
        >
          {loading ? 'Guardando...' : (mode === 'create' ? 'Crear Rol' : 'Actualizar Rol')}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default memo(RoleModal)