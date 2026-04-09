'use client'

import { memo, useCallback, useEffect, useMemo, useState } from 'react'

import { Email as EmailIcon, MoreHoriz as MoreHorizIcon, Print as PrintIcon } from '@mui/icons-material'
import {
    Box,
    Checkbox,
    CircularProgress,
    Divider,
    FormControl,
    FormControlLabel,
    Grid,
    IconButton,
    InputAdornment,
    InputLabel,
    ListItemText,
    Menu,
    MenuItem,
    Select,
    Tab,
    Tabs,
    TextField,
    Tooltip,
    Typography,
    useMediaQuery,
    useTheme
} from '@mui/material'

import { AlumnosService } from '../services/alumnosService'
import { EmailGeneratorService } from '../services/emailGeneratorService'
import type { AlumnoFormData, ValidationErrors } from '../types'
import AlumnoHeader from './AlumnoHeader'
import ArancelesTab from './ArancelesTab'
import RegistroAcademico from './RegistroAcademico'

interface TabPanelProps {
  children?: React.ReactNode
  index: number
  value: number
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props

  return (
    <div
      role='tabpanel'
      style={{ display: value !== index ? 'none' : 'block' }}
      id={`alumno-tabpanel-${index}`}
      aria-labelledby={`alumno-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  )
}

interface AlumnoFormTabsProps {
  formData: AlumnoFormData
  onChange: (field: keyof AlumnoFormData, value: any) => void
  errors: ValidationErrors
  photoUrl?: string
  onPhotoUpload?: (file: File) => void
  onPhotoDelete?: () => void
  onViewChanges?: () => void
  isEdit?: boolean
  isUploadingPhoto?: boolean
  isDeletingPhoto?: boolean
  isActive?: boolean | null
  readOnly?: boolean
}

function AlumnoFormTabs({
  formData,
  onChange,
  errors,
  photoUrl,
  onPhotoUpload,
  onPhotoDelete,
  onViewChanges,
  isEdit = false,
  isUploadingPhoto = false,
  isDeletingPhoto = false,
  isActive,
  readOnly = false
}: AlumnoFormTabsProps) {
  const [value, setValue] = useState(0)
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false)
  const [generatingEmail, setGeneratingEmail] = useState(false)
  const [autoGenerateEnabled, setAutoGenerateEnabled] = useState(true)
  const [emailManuallyEdited, setEmailManuallyEdited] = useState(false)
  const [emailGenerationCounter, setEmailGenerationCounter] = useState(0)
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)

  // Responsive breakpoints
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const isTablet = useMediaQuery(theme.breakpoints.down('md'))

  // Tab configuration
  const allTabs = [
    { label: 'Datos Básicos', index: 0, priority: 1 },
    { label: 'Información Familiar', index: 1, priority: 2 },
    { label: 'Datos Relativos del Alumno', index: 2, priority: 3 },
    { label: 'Información de Retiro', index: 3, priority: 4 },
    { label: 'Registro Académico', index: 4, priority: 5 },
    { label: 'Aranceles', index: 5, priority: 6 }
  ]

  // Determine visible tabs based on screen size
  const getVisibleTabs = () => {
    if (isMobile) {
      return allTabs.slice(0, 2) // Solo mostrar 2 tabs en móvil
    } else if (isTablet) {
      return allTabs.slice(0, 4) // Mostrar 4 tabs en tablet
    }
    return allTabs // Mostrar todos en desktop
  }

  const visibleTabs = getVisibleTabs()
  const hiddenTabs = allTabs.filter(tab => !visibleTabs.includes(tab))
  const hasHiddenTabs = hiddenTabs.length > 0

  // Handle menu
  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
  }

  const handleTabFromMenu = (tabIndex: number) => {
    setValue(tabIndex)
    handleMenuClose()
  }

  // Helper function to get error message for a field
  const getFieldError = useCallback(
    (field: keyof AlumnoFormData): string => {
      const fieldErrors = errors[field]
      if (!fieldErrors || fieldErrors.length === 0) return ''
      return fieldErrors[0] // Return the first error message
    },
    [errors]
  )

  // Helper function to check if field has error
  const hasFieldError = useCallback(
    (field: keyof AlumnoFormData): boolean => {
      const fieldErrors = errors[field]
      return fieldErrors && fieldErrors.length > 0
    },
    [errors]
  )

  // Helper function to get field styles - orange label for empty fields
  const getFieldStyles = useCallback(
    (field: keyof AlumnoFormData): any => {
      const fieldValue = formData[field]
      const isEmpty = !fieldValue || (typeof fieldValue === 'string' && fieldValue.trim() === '')

      if (isEmpty) {
        return {
          '& .MuiInputLabel-root': {
            color: 'warning.main', // Orange color for empty fields
          },
          '& .MuiInputLabel-root.Mui-focused': {
            color: 'warning.main', // Keep orange when focused
          }
        }
      }

      return {}
    },
    [formData]
  )

  // Helper function to calculate age from birth date
  const calculateAge = useCallback((birthDate: string | undefined): string => {
    if (!birthDate) return ''

    try {
      const birth = new Date(birthDate)
      const today = new Date()

      if (isNaN(birth.getTime())) return ''

      let age = today.getFullYear() - birth.getFullYear()
      const monthDiff = today.getMonth() - birth.getMonth()

      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--
      }

      return age >= 0 ? `${age} años` : ''
    } catch (error) {
      return ''
    }
  }, [])

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue)
  }

  // Función para generar email sin consultar backend (solo formato)
  const generateEmailFormat = useCallback((primerNombre: string, primerApellido: string): string => {
    if (!primerNombre?.trim() || !primerApellido?.trim()) {
      return ''
    }
    return EmailGeneratorService.generateEmail(primerNombre, primerApellido)
  }, [])

  // Efecto para generar email automáticamente cuando cambian los nombres - Optimizado con debounce
  useEffect(() => {
    // Solo generar email automáticamente en modo creación, no en edición
    // Y solo si el usuario no ha editado manualmente el email
    if (!isEdit && autoGenerateEnabled && !emailManuallyEdited && formData.primer_nombre && formData.primer_apellido) {
      // Resetear el contador cuando cambien los nombres
      setEmailGenerationCounter(0)

      // Debounce de 300ms para evitar múltiples ejecuciones mientras se escribe
      const timeoutId = setTimeout(() => {
        // Solo generar si el campo de email está vacío o si coincide con el patrón generado anteriormente
        const currentEmail = formData.email || ''
        const newEmail = generateEmailFormat(formData.primer_nombre, formData.primer_apellido)

        // Generar automáticamente solo si:
        // 1. El email está vacío, O
        // 2. El email actual sigue el patrón de generación automática (contiene @cempp.com)
        if (!currentEmail || currentEmail.includes('@cempp.com')) {
          if (newEmail && newEmail !== currentEmail) {
            onChange('email', newEmail)
          }
        }
      }, 300)

      return () => clearTimeout(timeoutId)
    }
  }, [
    formData.primer_nombre,
    formData.primer_apellido,
    autoGenerateEnabled,
    generateEmailFormat,
    onChange,
    formData.email,
    isEdit,
    emailManuallyEdited
  ])

  // Optimizar handleChange con useCallback
  const handleChange = useCallback(
    (field: keyof AlumnoFormData, value: any) => {
      onChange(field, value)
    },
    [onChange]
  )

  // Optimizar handleGenerateEmail con useCallback - Versión local sin API
  const handleGenerateEmail = useCallback(() => {
    if (!formData.primer_nombre || !formData.primer_apellido) {
      return
    }

    setGeneratingEmail(true)

    // Generar email base localmente
    const baseEmail = EmailGeneratorService.generateEmail(
      formData.primer_nombre,
      formData.primer_apellido
    )

    if (baseEmail) {
      let finalEmail = baseEmail

      // Si ya se ha generado al menos una vez, agregar el contador
      if (emailGenerationCounter > 0) {
        const [localPart, domain] = baseEmail.split('@')
        finalEmail = `${localPart}${emailGenerationCounter}@${domain}`
      }

      onChange('email', finalEmail)
      // Incrementar el contador para la próxima generación
      setEmailGenerationCounter(prev => prev + 1)
      // Cuando se genera automáticamente, resetear el flag de edición manual
      setEmailManuallyEdited(false)
    }

    setGeneratingEmail(false)
  }, [formData.primer_nombre, formData.primer_apellido, onChange, emailGenerationCounter])

  // Función para manejar cambios manuales en el email
  const handleEmailChange = useCallback((value: string) => {
    onChange('email', value)
    // Marcar que el email ha sido editado manualmente
    setEmailManuallyEdited(true)
    // Resetear el contador cuando el usuario edita manualmente
    setEmailGenerationCounter(0)
  }, [onChange])

  // Optimizar handlePhotoChange con useCallback
  const handlePhotoChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0]
      if (file && onPhotoUpload) {
        onPhotoUpload(file)
      }
    },
    [onPhotoUpload]
  )

  // Función para contar errores por pestaña - Memoizada para evitar recálculos
  const getErrorCountByTab = useMemo(() => {
    return (tabIndex: number): number => {
      const errorFields = Object.keys(errors)

      // Mapeo de campos por pestaña
      const tabFieldsMap: Record<number, string[]> = {
        0: [
          // Datos Básicos
          'primer_nombre',
          'segundo_nombre',
          'primer_apellido',
          'segundo_apellido',
          'email',
          'fecha_nacimiento',
          'lugar_nacimiento',
          'sexo',
          'codigo_mined',
          'codigo_unico',
          'correo_notificaciones',
          'observaciones',
          'nombre_persona_firma',
          'cedula_firma'
        ],
        1: [
          // Información Familiar
          'nombre_madre',
          'fecha_nacimiento_madre',
          'cedula_madre',
          'religion_madre',
          'estado_civil_madre',
          'telefono_madre',
          'telefono_claro_madre',
          'telefono_tigo_madre',
          'direccion_madre',
          'barrio_madre',
          'ocupacion_madre',
          'lugar_trabajo_madre',
          'telefono_trabajo_madre',
          'nombre_padre',
          'fecha_nacimiento_padre',
          'cedula_padre',
          'religion_padre',
          'estado_civil_padre',
          'telefono_padre',
          'telefono_claro_padre',
          'telefono_tigo_padre',
          'direccion_padre',
          'barrio_padre',
          'ocupacion_padre',
          'lugar_trabajo_padre',
          'telefono_trabajo_padre',
          'nombre_responsable',
          'cedula_responsable',
          'telefono_responsable',
          'direccion_responsable',
          'cantidad_hijos',
          'lugar_en_familia',
          'personas_hogar',
          'encargado_alumno',
          'contacto_emergencia',
          'telefono_emergencia',
          'metodos_disciplina',
          'pasatiempos_familiares'
        ],
        2: [
          // Datos Relativos del Alumno
          'personalidad',
          'parto',
          'sufrimiento_fetal',
          'edad_gateo',
          'edad_caminar',
          'edad_hablar',
          'habilidades',
          'pasatiempos',
          'preocupaciones',
          'juegos_preferidos',
          'diagnostico_medico',
          'estado_animo_general',
          'tiene_fobias',
          'generador_fobia',
          'tiene_agresividad',
          'tipo_agresividad',
          'patologias_detalle',
          'consume_farmacos',
          'farmacos_detalle',
          'tiene_alergias',
          'causas_alergia',
          'alteraciones_patron_sueño',
          'se_duerme_temprano',
          'se_duerme_tarde',
          'apnea_sueño',
          'pesadillas',
          'enuresis_secundaria',
          'alteraciones_apetito_detalle',
          'aversion_alimentos',
          'reflujo',
          'alimentos_favoritos',
          'alteracion_vision',
          'alteracion_audicion',
          'alteracion_tacto',
          'especifique_alteraciones_sentidos',
          'se_relaciona_familiares',
          'establece_relacion_coetaneos',
          'evita_contacto_personas',
          'especifique_evita_personas',
          'evita_lugares_situaciones',
          'especifique_evita_lugares',
          'respeta_figuras_autoridad',
          'atiende_cuando_llaman',
          'es_capaz_comunicarse',
          'comunica_palabras',
          'comunica_señas',
          'comunica_llanto',
          'dificultad_expresarse',
          'especifique_dificultad_expresarse',
          'dificultad_comprender',
          'especifique_dificultad_comprender',
          'atiende_orientaciones',
          'alteraciones_oseas',
          'alteraciones_musculares',
          'pie_plano',
          'referido_escuela_especial',
          'trajo_epicrisis',
          'presenta_diagnostico_matricula'
        ],
        3: [
          // Información de Retiro
          'fecha_retiro',
          'retiro_notificado',
          'motivo_retiro',
          'informacion_retiro_adicional'
        ]
      }

      const tabFields = tabFieldsMap[tabIndex] || []
      return errorFields.filter(field => tabFields.includes(field)).length
    }
  }, [errors])

  // Función para generar el label de la pestaña con contador de errores - Memoizada
  const getTabLabel = useCallback(
    (label: string, tabIndex: number): string => {
      const errorCount = getErrorCountByTab(tabIndex)
      return errorCount > 0 ? `${label} (${errorCount})` : label
    },
    [getErrorCountByTab]
  )

  return (
    <Box sx={{ width: '100%' }}>
      {/* Header con información del alumno */}
      <AlumnoHeader
        formData={formData}
        photoUrl={photoUrl}
        onPhotoUpload={onPhotoUpload}
        onPhotoDelete={onPhotoDelete}
        onViewChanges={onViewChanges}
        isEdit={isEdit}
        isUploading={isUploadingPhoto}
        isDeleting={isDeletingPhoto}
        isActive={isActive}
        readOnly={readOnly}
      />

        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Tabs
              value={value}
              onChange={handleTabChange}
              aria-label='Formulario de alumno'
              variant={isMobile ? "scrollable" : "standard"}
              scrollButtons={isMobile ? "auto" : false}
              allowScrollButtonsMobile={isMobile}
              sx={{
                flexGrow: 1,
                '& .MuiTabs-flexContainer': {
                  gap: isMobile ? 0 : 1
                },
                '& .MuiTab-root': {
                  minWidth: isMobile ? 120 : 'auto',
                  fontSize: isMobile ? '0.75rem' : '0.875rem',
                  padding: isMobile ? '6px 8px' : '12px 16px'
                }
              }}
            >
              {visibleTabs.map((tab) => (
                <Tab
                  key={tab.index}
                  label={getTabLabel(tab.label, tab.index)}
                  sx={{
                    color: getErrorCountByTab(tab.index) > 0 ? 'error.main' : 'inherit',
                    fontWeight: getErrorCountByTab(tab.index) > 0 ? 'bold' : 'normal'
                  }}
                />
              ))}
            </Tabs>

            {hasHiddenTabs && (
              <>
                <IconButton
                  onClick={handleMenuClick}
                  size="small"
                  sx={{
                    ml: 1,
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 1
                  }}
                >
                  <MoreHorizIcon />
                </IconButton>

                <Menu
                  anchorEl={anchorEl}
                  open={Boolean(anchorEl)}
                  onClose={handleMenuClose}
                  PaperProps={{
                    sx: {
                      maxHeight: 300,
                      width: '250px'
                    }
                  }}
                >
                  {hiddenTabs.map((tab) => (
                    <MenuItem
                      key={tab.index}
                      onClick={() => handleTabFromMenu(tab.index)}
                      selected={value === tab.index}
                      sx={{
                        color: getErrorCountByTab(tab.index) > 0 ? 'error.main' : 'inherit',
                        fontWeight: getErrorCountByTab(tab.index) > 0 ? 'bold' : 'normal'
                      }}
                    >
                      <ListItemText
                        primary={getTabLabel(tab.label, tab.index)}
                        primaryTypographyProps={{
                          fontSize: '0.875rem'
                        }}
                      />
                    </MenuItem>
                  ))}
                </Menu>
              </>
            )}
          </Box>
        </Box>

        {/* Tab 1: Datos Básicos */}
        <TabPanel value={value} index={0}>
          <Grid container spacing={3}>
            {/* Información personal */}
            <Grid item xs={12}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label='Código MINED'
                    value={formData.codigo_mined || ''}
                    onChange={e => onChange('codigo_mined', e.target.value)}
                    error={hasFieldError('codigo_mined')}
                    helperText={getFieldError('codigo_mined')}
                    disabled={readOnly}
                    sx={getFieldStyles('codigo_mined')}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label='Código Único'
                    value={formData.codigo_unico || ''}
                    onChange={e => onChange('codigo_unico', e.target.value)}
                    error={hasFieldError('codigo_unico')}
                    helperText={getFieldError('codigo_unico')}
                    disabled={readOnly}
                    sx={getFieldStyles('codigo_unico')}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label='Primer Nombre *'
                    value={formData.primer_nombre || ''}
                    onChange={e => onChange('primer_nombre', e.target.value)}
                    error={hasFieldError('primer_nombre')}
                    helperText={getFieldError('primer_nombre')}
                    disabled={readOnly}
                    sx={getFieldStyles('primer_nombre')}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label='Segundo Nombre'
                    value={formData.segundo_nombre || ''}
                    onChange={e => onChange('segundo_nombre', e.target.value)}
                    error={hasFieldError('segundo_nombre')}
                    helperText={getFieldError('segundo_nombre')}
                    disabled={readOnly}
                    sx={getFieldStyles('segundo_nombre')}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label='Primer Apellido *'
                    value={formData.primer_apellido || ''}
                    onChange={e => onChange('primer_apellido', e.target.value)}
                    error={hasFieldError('primer_apellido')}
                    helperText={getFieldError('primer_apellido')}
                    disabled={readOnly}
                    sx={getFieldStyles('primer_apellido')}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label='Segundo Apellido'
                    value={formData.segundo_apellido || ''}
                    onChange={e => onChange('segundo_apellido', e.target.value)}
                    error={hasFieldError('segundo_apellido')}
                    helperText={getFieldError('segundo_apellido')}
                    disabled={readOnly}
                    sx={getFieldStyles('segundo_apellido')}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label='Email'
                    type='email'
                    value={formData.email || ''}
                    onChange={e => handleEmailChange(e.target.value)}
                    error={hasFieldError('email')}
                    helperText={getFieldError('email')}
                    size='small'
                    sx={getFieldStyles('email')}
                    disabled={isEdit} // Deshabilitar el campo email en modo edición
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position='end'>
                          <Tooltip title={isEdit ? 'El correo no se puede modificar en modo edición' : 'Verificar y generar correo único'}>
                            <span>
                              <IconButton
                                onClick={handleGenerateEmail}
                                disabled={isEdit || !formData.primer_nombre || !formData.primer_apellido || generatingEmail}
                                size='small'
                              >
                                {generatingEmail ? <CircularProgress size={20} /> : <EmailIcon />}
                              </IconButton>
                            </span>
                          </Tooltip>
                        </InputAdornment>
                      )
                    }}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label='Fecha de Nacimiento *'
                    type='date'
                    value={formData.fecha_nacimiento || ''}
                    onChange={e => onChange('fecha_nacimiento', e.target.value)}
                    size='small'
                    required
                    disabled={readOnly}
                    error={hasFieldError('fecha_nacimiento')}
                    helperText={getFieldError('fecha_nacimiento')}
                    InputLabelProps={{
                      shrink: true,
                    }}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label='Edad del Alumno'
                    value={formData.edad || ''}
                    InputProps={{
                      readOnly: true,
                    }}
                    size='small'
                    sx={{
                      '& .MuiInputBase-input': {
                        backgroundColor: 'action.hover',
                        fontWeight: 'bold',
                        color: 'primary.main'
                      }
                    }}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label='Lugar de Nacimiento'
                    value={formData.lugar_nacimiento || ''}
                    onChange={e => onChange('lugar_nacimiento', e.target.value)}
                    error={hasFieldError('lugar_nacimiento')}
                    helperText={getFieldError('lugar_nacimiento')}
                    disabled={readOnly}
                    sx={getFieldStyles('lugar_nacimiento')}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth size='small' sx={getFieldStyles('sexo')} error={hasFieldError('sexo')} required>
                    <InputLabel>Sexo *</InputLabel>
                    <Select disabled={readOnly} value={formData.sexo || ''} onChange={e => onChange('sexo', e.target.value)} label='Sexo *'>
                      <MenuItem value='M'>Masculino</MenuItem>
                      <MenuItem value='F'>Femenino</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </Grid>

            {/* Información Adicional */}
            <Grid item xs={12}>
              <Typography variant='h6' gutterBottom sx={{ mt: 3 }}>
                Información Adicional
              </Typography>
              <Divider sx={{ mb: 2 }} />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label='Correo de Notificaciones'
                type='email'
                value={formData.correo_notificaciones || ''}
                onChange={e => onChange('correo_notificaciones', e.target.value)}
                error={hasFieldError('correo_notificaciones')}
                helperText={getFieldError('correo_notificaciones')}
                disabled={readOnly}
                    sx={getFieldStyles('correo_notificaciones')}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label='Observaciones'
                multiline
                rows={4}
                value={formData.observaciones || ''}
                onChange={e => onChange('observaciones', e.target.value)}
                error={hasFieldError('observaciones')}
                helperText={getFieldError('observaciones')}
                disabled={readOnly}
                    sx={getFieldStyles('observaciones')}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label='Nombre de la Persona que Firma'
                value={formData.nombre_persona_firma || ''}
                onChange={e => onChange('nombre_persona_firma', e.target.value)}
                error={hasFieldError('nombre_persona_firma')}
                helperText={getFieldError('nombre_persona_firma')}
                disabled={readOnly}
                    sx={getFieldStyles('nombre_persona_firma')}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label='Cédula de la Persona que Firma'
                value={formData.cedula_firma || ''}
                onChange={e => onChange('cedula_firma', e.target.value)}
                error={hasFieldError('cedula_firma')}
                helperText={getFieldError('cedula_firma')}
                disabled={readOnly}
                    sx={getFieldStyles('cedula_firma')}
              />
            </Grid>
          </Grid>
        </TabPanel>

        {/* Tab 2: Información Familiar */}
        <TabPanel value={value} index={1}>
          <Grid container spacing={3}>
            {/* Información de la Madre */}
            <Grid item xs={12}>
              <Typography variant='h6' gutterBottom>
                Información de la Madre
              </Typography>
              <Divider sx={{ mb: 2 }} />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label='Nombre de la Madre'
                value={formData.nombre_madre || ''}
                onChange={e => onChange('nombre_madre', e.target.value)}
                error={hasFieldError('nombre_madre')}
                helperText={getFieldError('nombre_madre')}
                size='small'
                    sx={getFieldStyles('nombre_madre')}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label='Fecha de Nacimiento de la Madre'
                type='date'
                value={formData.fecha_nacimiento_madre || ''}
                onChange={e => onChange('fecha_nacimiento_madre', e.target.value)}
                size='small'
                error={hasFieldError('fecha_nacimiento_madre')}
                helperText={getFieldError('fecha_nacimiento_madre')}
                InputLabelProps={{
                  shrink: true,
                }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label='Edad de la Madre'
                value={formData.edad_madre || ''}
                InputProps={{
                  readOnly: true,
                }}
                size='small'
                sx={{
                  '& .MuiInputBase-input': {
                    backgroundColor: 'action.hover',
                    fontWeight: 'bold',
                    color: 'primary.main'
                  }
                }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label='Cédula de la Madre'
                value={formData.cedula_madre || ''}
                onChange={e => onChange('cedula_madre', e.target.value)}
                error={hasFieldError('cedula_madre')}
                helperText={getFieldError('cedula_madre')}
                size='small'
                    sx={getFieldStyles('cedula_madre')}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth size='small' sx={getFieldStyles('cedula_madre')} error={hasFieldError('cedula_madre')}>
                <InputLabel>Estado Civil de la Madre</InputLabel>
                <Select
                  value={formData.estado_civil_madre || ''}
                  onChange={e => onChange('estado_civil_madre', e.target.value)}
                  disabled={readOnly}
                  label='Estado Civil de la Madre'
                >
                  <MenuItem value='soltera'>Soltera</MenuItem>
                  <MenuItem value='casada'>Casada</MenuItem>
                  <MenuItem value='divorciada'>Divorciada</MenuItem>
                  <MenuItem value='viuda'>Viuda</MenuItem>
                  <MenuItem value='union_libre'>Unión Libre</MenuItem>
                  <MenuItem value='separada'>Separada</MenuItem>
                  <MenuItem value='otro'>Otro</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label='Religión de la Madre'
                value={formData.religion_madre || ''}
                onChange={e => onChange('religion_madre', e.target.value)}
                error={hasFieldError('religion_madre')}
                helperText={getFieldError('religion_madre')}
                size='small'
                    sx={getFieldStyles('religion_madre')}
              />
            </Grid>

            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label='Teléfono Principal'
                value={formData.telefono_madre || ''}
                onChange={e => onChange('telefono_madre', e.target.value)}
                error={hasFieldError('telefono_madre')}
                helperText={getFieldError('telefono_madre')}
                size='small'
                    sx={getFieldStyles('telefono_madre')}
              />
            </Grid>

            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label='Teléfono Claro'
                value={formData.telefono_claro_madre || ''}
                onChange={e => onChange('telefono_claro_madre', e.target.value)}
                error={hasFieldError('telefono_claro_madre')}
                helperText={getFieldError('telefono_claro_madre')}
                size='small'
                    sx={getFieldStyles('telefono_claro_madre')}
              />
            </Grid>

            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label='Teléfono Tigo'
                value={formData.telefono_tigo_madre || ''}
                onChange={e => onChange('telefono_tigo_madre', e.target.value)}
                error={hasFieldError('telefono_tigo_padre')}
                helperText={getFieldError('telefono_tigo_padre')}
                size='small'
                    sx={getFieldStyles('telefono_tigo_madre')}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label='Dirección de Residencia'
                value={formData.direccion_madre || ''}
                onChange={e => onChange('direccion_madre', e.target.value)}
                error={hasFieldError('direccion_madre')}
                helperText={getFieldError('direccion_madre')}
                size='small'
                    sx={getFieldStyles('direccion_madre')}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label='Barrio'
                value={formData.barrio_madre || ''}
                onChange={e => onChange('barrio_madre', e.target.value)}
                error={hasFieldError('barrio_padre')}
                helperText={getFieldError('barrio_padre')}
                size='small'
                    sx={getFieldStyles('barrio_madre')}
              />
            </Grid>

            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label='Ocupación'
                value={formData.ocupacion_madre || ''}
                onChange={e => onChange('ocupacion_madre', e.target.value)}
                error={hasFieldError('ocupacion_padre')}
                helperText={getFieldError('ocupacion_padre')}
                size='small'
                    sx={getFieldStyles('ocupacion_madre')}
              />
            </Grid>

            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label='Lugar de Trabajo'
                value={formData.lugar_trabajo_madre || ''}
                onChange={e => onChange('lugar_trabajo_madre', e.target.value)}
                error={hasFieldError('lugar_trabajo_madre')}
                helperText={getFieldError('lugar_trabajo_madre')}
                size='small'
                    sx={getFieldStyles('lugar_trabajo_madre')}
              />
            </Grid>

            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label='Teléfono del Trabajo'
                value={formData.telefono_trabajo_madre || ''}
                onChange={e => onChange('telefono_trabajo_madre', e.target.value)}
                error={hasFieldError('telefono_trabajo_madre')}
                helperText={getFieldError('telefono_trabajo_madre')}
                size='small'
                    sx={getFieldStyles('telefono_trabajo_madre')}
              />
            </Grid>

            {/* Información del Padre */}
            <Grid item xs={12}>
              <Typography variant='h6' gutterBottom sx={{ mt: 3 }}>
                Información del Padre
              </Typography>
              <Divider sx={{ mb: 2 }} />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label='Nombre del Padre'
                value={formData.nombre_padre || ''}
                onChange={e => onChange('nombre_padre', e.target.value)}
                error={hasFieldError('nombre_padre')}
                helperText={getFieldError('nombre_padre')}
                size='small'
                    sx={getFieldStyles('nombre_padre')}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label='Fecha de Nacimiento del Padre'
                type='date'
                value={formData.fecha_nacimiento_padre || ''}
                onChange={e => onChange('fecha_nacimiento_padre', e.target.value)}
                size='small'
                error={hasFieldError('fecha_nacimiento_padre')}
                helperText={getFieldError('fecha_nacimiento_padre')}
                InputLabelProps={{
                  shrink: true,
                }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label='Edad del Padre'
                value={formData.edad_padre || ''}
                InputProps={{
                  readOnly: true,
                }}
                size='small'
                sx={{
                  '& .MuiInputBase-input': {
                    backgroundColor: 'action.hover',
                    fontWeight: 'bold',
                    color: 'primary.main'
                  }
                }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label='Cédula del Padre'
                value={formData.cedula_padre || ''}
                onChange={e => onChange('cedula_padre', e.target.value)}
                error={hasFieldError('cedula_padre')}
                helperText={getFieldError('cedula_padre')}
                size='small'
                    sx={getFieldStyles('cedula_padre')}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth size='small' sx={getFieldStyles('cedula_padre')} error={hasFieldError('cedula_padre')}>
                <InputLabel>Estado Civil del Padre</InputLabel>
                <Select
                  value={formData.estado_civil_padre || ''}
                  onChange={e => onChange('estado_civil_padre', e.target.value)}
                  disabled={readOnly}
                  label='Estado Civil del Padre'
                >
                  <MenuItem value='soltero'>Soltero</MenuItem>
                  <MenuItem value='casado'>Casado</MenuItem>
                  <MenuItem value='divorciado'>Divorciado</MenuItem>
                  <MenuItem value='viudo'>Viudo</MenuItem>
                  <MenuItem value='union_libre'>Unión Libre</MenuItem>
                  <MenuItem value='separado'>Separado</MenuItem>
                  <MenuItem value='otro'>Otro</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label='Religión del Padre'
                value={formData.religion_padre || ''}
                onChange={e => onChange('religion_padre', e.target.value)}
                error={hasFieldError('religion_padre')}
                helperText={getFieldError('religion_padre')}
                size='small'
                    sx={getFieldStyles('religion_padre')}
              />
            </Grid>

            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label='Teléfono Principal'
                value={formData.telefono_padre || ''}
                onChange={e => onChange('telefono_padre', e.target.value)}
                error={hasFieldError('telefono_padre')}
                helperText={getFieldError('telefono_padre')}
                size='small'
                    sx={getFieldStyles('telefono_padre')}
              />
            </Grid>

            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label='Teléfono Claro'
                value={formData.telefono_claro_padre || ''}
                onChange={e => onChange('telefono_claro_padre', e.target.value)}
                error={hasFieldError('telefono_claro_padre')}
                helperText={getFieldError('telefono_claro_padre')}
                size='small'
                    sx={getFieldStyles('telefono_claro_padre')}
              />
            </Grid>

            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label='Teléfono Tigo'
                value={formData.telefono_tigo_padre || ''}
                onChange={e => onChange('telefono_tigo_padre', e.target.value)}
                error={hasFieldError('telefono_tigo_padre')}
                helperText={getFieldError('telefono_tigo_padre')}
                size='small'
                    sx={getFieldStyles('telefono_tigo_padre')}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label='Dirección de Residencia'
                value={formData.direccion_padre || ''}
                onChange={e => onChange('direccion_padre', e.target.value)}
                error={hasFieldError('direccion_padre')}
                helperText={getFieldError('direccion_padre')}
                size='small'
                    sx={getFieldStyles('direccion_padre')}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label='Barrio'
                value={formData.barrio_padre || ''}
                onChange={e => onChange('barrio_padre', e.target.value)}
                error={hasFieldError('barrio_padre')}
                helperText={getFieldError('barrio_padre')}
                size='small'
                    sx={getFieldStyles('barrio_padre')}
              />
            </Grid>

            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label='Ocupación'
                value={formData.ocupacion_padre || ''}
                onChange={e => onChange('ocupacion_padre', e.target.value)}
                error={hasFieldError('ocupacion_padre')}
                helperText={getFieldError('ocupacion_padre')}
                size='small'
                    sx={getFieldStyles('ocupacion_padre')}
              />
            </Grid>

            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label='Lugar de Trabajo'
                value={formData.lugar_trabajo_padre || ''}
                onChange={e => onChange('lugar_trabajo_padre', e.target.value)}
                error={hasFieldError('lugar_trabajo_padre')}
                helperText={getFieldError('lugar_trabajo_padre')}
                size='small'
                    sx={getFieldStyles('lugar_trabajo_padre')}
              />
            </Grid>

            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label='Teléfono del Trabajo'
                value={formData.telefono_trabajo_padre || ''}
                onChange={e => onChange('telefono_trabajo_padre', e.target.value)}
                error={hasFieldError('telefono_trabajo_padre')}
                helperText={getFieldError('telefono_trabajo_padre')}
                size='small'
                    sx={getFieldStyles('telefono_trabajo_padre')}
              />
            </Grid>

            {/* Información del Responsable */}
            <Grid item xs={12}>
              <Typography variant='h6' gutterBottom sx={{ mt: 3 }}>
                Información del responsable del niño en caso de que los padres estén fuera del país
              </Typography>
              <Divider sx={{ mb: 2 }} />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label='Nombre del Responsable'
                value={formData.nombre_responsable || ''}
                onChange={e => onChange('nombre_responsable', e.target.value)}
                error={hasFieldError('nombre_responsable')}
                helperText={getFieldError('nombre_responsable')}
                size='small'
                    sx={getFieldStyles('nombre_responsable')}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label='Cédula del Responsable'
                value={formData.cedula_responsable || ''}
                onChange={e => onChange('cedula_responsable', e.target.value)}
                error={hasFieldError('cedula_responsable')}
                helperText={getFieldError('cedula_responsable')}
                size='small'
                    sx={getFieldStyles('cedula_responsable')}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label='Teléfono del Responsable'
                value={formData.telefono_responsable || ''}
                onChange={e => onChange('telefono_responsable', e.target.value)}
                error={hasFieldError('telefono_responsable')}
                helperText={getFieldError('telefono_responsable')}
                size='small'
                    sx={getFieldStyles('telefono_responsable')}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label='Dirección del Responsable'
                value={formData.direccion_responsable || ''}
                onChange={e => onChange('direccion_responsable', e.target.value)}
                error={hasFieldError('direccion_responsable')}
                helperText={getFieldError('direccion_responsable')}
                size='small'
                    sx={getFieldStyles('direccion_responsable')}
              />
            </Grid>

            {/* Datos Familiares */}
            <Grid item xs={12}>
              <Typography variant='h6' gutterBottom sx={{ mt: 3 }}>
                Datos Familiares
              </Typography>
              <Divider sx={{ mb: 2 }} />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label='Cantidad de Hijos'
                type='number'
                value={formData.cantidad_hijos || ''}
                onChange={e => onChange('cantidad_hijos', parseInt(e.target.value) || null)}
                error={hasFieldError('cantidad_hijos')}
                helperText={getFieldError('cantidad_hijos')}
                size='small'
                    sx={getFieldStyles('cantidad_hijos')}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label='Lugar del niño en relación con sus hermanos'
                value={formData.lugar_en_familia || ''}
                onChange={e => onChange('lugar_en_familia', e.target.value)}
                error={hasFieldError('lugar_en_familia')}
                helperText={getFieldError('lugar_en_familia')}
                size='small'
                    sx={getFieldStyles('lugar_en_familia')}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label='Personas que habitan en su hogar'
                multiline
                rows={2}
                value={formData.personas_hogar || ''}
                onChange={e => onChange('personas_hogar', e.target.value)}
                error={hasFieldError('personas_hogar')}
                helperText={getFieldError('personas_hogar')}
                size='small'
                    sx={getFieldStyles('personas_hogar')}
              />
            </Grid>

            <Grid item xs={12} sm={12}>
              <TextField
                fullWidth
                multiline
                rows={2}
                label='Personas que están a cargo del alumno(a)'
                value={formData.encargado_alumno || ''}
                onChange={e => onChange('encargado_alumno', e.target.value)}
                error={hasFieldError('encargado_alumno')}
                helperText={getFieldError('encargado_alumno')}
                size='small'
                    sx={getFieldStyles('encargado_alumno')}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label='Contacto de Emergencia'
                value={formData.contacto_emergencia || ''}
                onChange={e => onChange('contacto_emergencia', e.target.value)}
                error={hasFieldError('contacto_emergencia')}
                helperText={getFieldError('contacto_emergencia')}
                size='small'
                    sx={getFieldStyles('contacto_emergencia')}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label='Teléfono de Emergencia'
                value={formData.telefono_emergencia || ''}
                onChange={e => onChange('telefono_emergencia', e.target.value)}
                error={hasFieldError('telefono_emergencia')}
                helperText={getFieldError('telefono_emergencia')}
                size='small'
                    sx={getFieldStyles('telefono_emergencia')}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label='Métodos disciplinarios que emplean en casa con su niño o niña'
                multiline
                rows={2}
                value={formData.metodos_disciplina || ''}
                onChange={e => onChange('metodos_disciplina', e.target.value)}
                error={hasFieldError('metodos_disciplina')}
                helperText={getFieldError('metodos_disciplina')}
                size='small'
                    sx={getFieldStyles('metodos_disciplina')}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label='Pasatiempos y actividades familiares'
                multiline
                rows={2}
                value={formData.pasatiempos_familiares || ''}
                onChange={e => onChange('pasatiempos_familiares', e.target.value)}
                error={hasFieldError('pasatiempos_familiares')}
                helperText={getFieldError('pasatiempos_familiares')}
                size='small'
                    sx={getFieldStyles('pasatiempos_familiares')}
              />
            </Grid>
          </Grid>
        </TabPanel>

        {/* Tab 3: Datos Relativos del Alumno */}
        <TabPanel value={value} index={2}>
          <Grid container spacing={3}>
            {/* Área Médica/Psicológica */}
            <Grid item xs={12}>
              <Typography variant='h6' gutterBottom>
                Información Médica y Psicológica
              </Typography>
              <Divider sx={{ mb: 2 }} />
            </Grid>

            <Grid item xs={12} sm={12}>
              <TextField
                fullWidth
                label='Descripción de la personalidad del alumno(a)'
                multiline
                rows={3}
                value={formData.personalidad || ''}
                onChange={e => onChange('personalidad', e.target.value)}
                error={hasFieldError('personalidad')}
                helperText={getFieldError('personalidad')}
                size='small'
                    sx={getFieldStyles('personalidad')}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth size='small' sx={getFieldStyles('parto')} error={hasFieldError('parto')}>
                <InputLabel>Tipo de Parto al nacer</InputLabel>
                <Select
                  value={formData.parto || ''}
                  onChange={e => onChange('parto', e.target.value)}
                  disabled={readOnly}
                  label='Tipo de Parto'
                >
                  <MenuItem value='natural'>Natural</MenuItem>
                  <MenuItem value='cesarea'>Cesárea</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={4}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.sufrimiento_fetal || false}
                    onChange={e => onChange('sufrimiento_fetal', e.target.checked)}
                    disabled={readOnly}
                  />
                }
                label='Tuvo sufrimiento fetal'
              />
            </Grid>

            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label='Edad de Gateo (meses)'
                type='number'
                value={formData.edad_gateo || ''}
                onChange={e => onChange('edad_gateo', parseInt(e.target.value) || null)}
                error={hasFieldError('edad_gateo')}
                helperText={getFieldError('edad_gateo')}
                size='small'
                    sx={getFieldStyles('edad_gateo')}
              />
            </Grid>

            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label='Edad de Caminar (meses)'
                type='number'
                value={formData.edad_caminar || ''}
                onChange={e => onChange('edad_caminar', parseInt(e.target.value) || null)}
                error={hasFieldError('edad_caminar')}
                helperText={getFieldError('edad_caminar')}
                size='small'
                    sx={getFieldStyles('edad_caminar')}
              />
            </Grid>

            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label='Edad de Hablar (meses)'
                type='number'
                value={formData.edad_hablar || ''}
                onChange={e => onChange('edad_hablar', parseInt(e.target.value) || null)}
                error={hasFieldError('edad_hablar')}
                helperText={getFieldError('edad_hablar')}
                size='small'
                    sx={getFieldStyles('edad_hablar')}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label='Habilidades que tiene el niño o niña'
                multiline
                rows={2}
                value={formData.habilidades || ''}
                onChange={e => onChange('habilidades', e.target.value)}
                error={hasFieldError('habilidades')}
                helperText={getFieldError('habilidades')}
                size='small'
                    sx={getFieldStyles('habilidades')}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label='Pasatiempos'
                multiline
                rows={2}
                value={formData.pasatiempos || ''}
                onChange={e => onChange('pasatiempos', e.target.value)}
                error={hasFieldError('pasatiempos')}
                helperText={getFieldError('pasatiempos')}
                size='small'
                    sx={getFieldStyles('pasatiempos')}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label='Preocupaciones'
                multiline
                rows={2}
                value={formData.preocupaciones || ''}
                onChange={e => onChange('preocupaciones', e.target.value)}
                error={hasFieldError('preocupaciones')}
                helperText={getFieldError('preocupaciones')}
                size='small'
                    sx={getFieldStyles('preocupaciones')}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label='Juegos Preferidos'
                multiline
                rows={2}
                value={formData.juegos_preferidos || ''}
                onChange={e => onChange('juegos_preferidos', e.target.value)}
                error={hasFieldError('juegos_preferidos')}
                helperText={getFieldError('juegos_preferidos')}
                size='small'
                    sx={getFieldStyles('juegos_preferidos')}
              />
            </Grid>

            {/* Área Social */}
            <Grid item xs={12}>
              <Typography variant='h6' gutterBottom sx={{ mt: 3 }}>
                Área Social
              </Typography>
              <Divider sx={{ mb: 2 }} />
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.se_relaciona_familiares || false}
                    onChange={e => onChange('se_relaciona_familiares', e.target.checked)}
                  />
                }
                label='Se relaciona con sus familiares'
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.establece_relacion_coetaneos || false}
                    onChange={e => onChange('establece_relacion_coetaneos', e.target.checked)}
                  />
                }
                label='Establece relación con sus coetáneos'
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.evita_contacto_personas || false}
                    onChange={e => onChange('evita_contacto_personas', e.target.checked)}
                  />
                }
                label='Evita contacto con ciertas personas'
              />
            </Grid>

            {formData.evita_contacto_personas && (
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label='Especifique por qué evita contacto con personas'
                  multiline
                  rows={2}
                  value={formData.especifique_evita_personas || ''}
                  onChange={e => onChange('especifique_evita_personas', e.target.value)}
                  error={hasFieldError('especifique_evita_personas')}
                  helperText={getFieldError('especifique_evita_personas')}
                  size='small'
                    sx={getFieldStyles('especifique_evita_personas')}
                />
              </Grid>
            )}

            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.evita_lugares_situaciones || false}
                    onChange={e => onChange('evita_lugares_situaciones', e.target.checked)}
                  />
                }
                label='Evita ciertos lugares o situaciones'
              />
            </Grid>

            {formData.evita_lugares_situaciones && (
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label='Especifique qué lugares o situaciones evita'
                  multiline
                  rows={2}
                  value={formData.especifique_evita_lugares || ''}
                  onChange={e => onChange('especifique_evita_lugares', e.target.value)}
                  error={hasFieldError('especifique_evita_lugares')}
                  helperText={getFieldError('especifique_evita_lugares')}
                  size='small'
                    sx={getFieldStyles('especifique_evita_lugares')}
                />
              </Grid>
            )}

            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.respeta_figuras_autoridad || false}
                    onChange={e => onChange('respeta_figuras_autoridad', e.target.checked)}
                  />
                }
                label='Respeta figuras de autoridad'
              />
            </Grid>

            {/* Área Comunicativa */}
            <Grid item xs={12}>
              <Typography variant='h6' gutterBottom sx={{ mt: 3 }}>
                Área Comunicativa
              </Typography>
              <Divider sx={{ mb: 2 }} />
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.atiende_cuando_llaman || false}
                    onChange={e => onChange('atiende_cuando_llaman', e.target.checked)}
                  />
                }
                label='Atiende cuando se le llama por su nombre'
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.es_capaz_comunicarse || false}
                    onChange={e => onChange('es_capaz_comunicarse', e.target.checked)}
                  />
                }
                label='Es capaz de comunicarse'
              />
            </Grid>

            <Grid item xs={12} sm={4}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.comunica_palabras || false}
                    onChange={e => onChange('comunica_palabras', e.target.checked)}
                  />
                }
                label='Se comunica con palabras'
              />
            </Grid>

            <Grid item xs={12} sm={4}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.comunica_señas || false}
                    onChange={e => onChange('comunica_señas', e.target.checked)}
                  />
                }
                label='Se comunica con señas'
              />
            </Grid>

            <Grid item xs={12} sm={4}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.comunica_llanto || false}
                    onChange={e => onChange('comunica_llanto', e.target.checked)}
                  />
                }
                label='Se comunica con llanto'
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.dificultad_expresarse || false}
                    onChange={e => onChange('dificultad_expresarse', e.target.checked)}
                  />
                }
                label='Dificultad para expresarse'
              />
            </Grid>

            {formData.dificultad_expresarse && (
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label='Especifique las dificultades para expresarse'
                  multiline
                  rows={2}
                  value={formData.especifique_dificultad_expresarse || ''}
                  onChange={e => onChange('especifique_dificultad_expresarse', e.target.value)}
                  error={hasFieldError('especifique_dificultad_expresarse')}
                  helperText={getFieldError('especifique_dificultad_expresarse')}
                  size='small'
                    sx={getFieldStyles('especifique_dificultad_expresarse')}
                />
              </Grid>
            )}

            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.dificultad_comprender || false}
                    onChange={e => onChange('dificultad_comprender', e.target.checked)}
                  />
                }
                label='Dificultad para comprender'
              />
            </Grid>

            {formData.dificultad_comprender && (
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label='Especifique las dificultades para comprender'
                  multiline
                  rows={2}
                  value={formData.especifique_dificultad_comprender || ''}
                  onChange={e => onChange('especifique_dificultad_comprender', e.target.value)}
                  error={hasFieldError('especifique_dificultad_comprender')}
                  helperText={getFieldError('especifique_dificultad_comprender')}
                  size='small'
                    sx={getFieldStyles('especifique_dificultad_comprender')}
                />
              </Grid>
            )}

            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.atiende_orientaciones || false}
                    onChange={e => onChange('atiende_orientaciones', e.target.checked)}
                  />
                }
                label='Atiende orientaciones'
              />
            </Grid>

            {/* Área Psicológica */}
            <Grid item xs={12}>
              <Typography variant='h6' gutterBottom sx={{ mt: 3 }}>
                Área Psicológica
              </Typography>
              <Divider sx={{ mb: 2 }} />
            </Grid>

            <Grid item xs={12} sm={12}>
              <FormControl fullWidth size='small'>
                <InputLabel>El estado de ánimo del alumno generalmente es:</InputLabel>
                <Select
                  value={formData.estado_animo_general || ''}
                  onChange={e => onChange('estado_animo_general', e.target.value)}
                  label='El estado de ánimo del alumno generalmente es:'
                  error={hasFieldError('estado_animo_general')}
                >
                  <MenuItem value='alegre'>Alegre</MenuItem>
                  <MenuItem value='triste'>Triste</MenuItem>
                  <MenuItem value='enojado'>Enojado</MenuItem>
                  <MenuItem value='indiferente'>Indiferente</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.tiene_fobias || false}
                    onChange={e => onChange('tiene_fobias', e.target.checked)}
                  />
                }
                label='Presenta fobias'
              />
            </Grid>

            {formData.tiene_fobias && (
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label='¿Qué genera la fobia?'
                  multiline
                  rows={2}
                  value={formData.generador_fobia || ''}
                  onChange={e => onChange('generador_fobia', e.target.value)}
                  error={hasFieldError('generador_fobia')}
                  helperText={getFieldError('generador_fobia')}
                  size='small'
                    sx={getFieldStyles('generador_fobia')}
                />
              </Grid>
            )}

            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.tiene_agresividad || false}
                    onChange={e => onChange('tiene_agresividad', e.target.checked)}
                  />
                }
                label='Agresividad'
              />
            </Grid>

            {formData.tiene_agresividad && (
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth size='small'>
                  <InputLabel>Tipo de Agresividad</InputLabel>
                  <Select
                    value={formData.tipo_agresividad || ''}
                    onChange={e => onChange('tipo_agresividad', e.target.value)}
                    label='Tipo de Agresividad'
                    error={hasFieldError('tipo_agresividad')}
                  >
                    <MenuItem value='encubierta'>Encubierta</MenuItem>
                    <MenuItem value='directa'>Directa</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            )}

            {/* Área Médica Detallada */}
            <Grid item xs={12}>
              <Typography variant='h6' gutterBottom sx={{ mt: 3 }}>
                Área Médica Detallada
              </Typography>
              <Divider sx={{ mb: 2 }} />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label='Patologías que padece el alumno(a)'
                multiline
                rows={3}
                value={formData.patologias_detalle || ''}
                onChange={e => onChange('patologias_detalle', e.target.value)}
                error={hasFieldError('patologias_detalle')}
                helperText={getFieldError('patologias_detalle')}
                size='small'
                    sx={getFieldStyles('patologias_detalle')}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.consume_farmacos || false}
                    onChange={e => onChange('consume_farmacos', e.target.checked)}
                  />
                }
                label='Consume fármacos'
              />
            </Grid>

            {formData.consume_farmacos && (
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label='Especifique cuales fármacos consume el alumno(a)'
                  multiline
                  rows={2}
                  value={formData.farmacos_detalle || ''}
                  onChange={e => onChange('farmacos_detalle', e.target.value)}
                  error={hasFieldError('farmacos_detalle')}
                  helperText={getFieldError('farmacos_detalle')}
                  size='small'
                    sx={getFieldStyles('farmacos_detalle')}
                />
              </Grid>
            )}

            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.tiene_alergias || false}
                    onChange={e => onChange('tiene_alergias', e.target.checked)}
                  />
                }
                label='Alergias'
              />
            </Grid>

            {formData.tiene_alergias && (
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label='Causas de las Alergias'
                  multiline
                  rows={2}
                  value={formData.causas_alergia || ''}
                  onChange={e => onChange('causas_alergia', e.target.value)}
                  error={hasFieldError('causas_alergia')}
                  helperText={getFieldError('causas_alergia')}
                  size='small'
                    sx={getFieldStyles('causas_alergia')}
                />
              </Grid>
            )}

            {/* Alteraciones del Sueño */}
            <Grid item xs={12}>
              <Typography variant='h6' gutterBottom sx={{ mt: 3 }}>
                Alteraciones del patrón de sueño
              </Typography>
              <Divider sx={{ mb: 2 }} />
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.alteraciones_patron_sueño || false}
                    onChange={e => onChange('alteraciones_patron_sueño', e.target.checked)}
                  />
                }
                label='Alteraciones del patrón de sueño'
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.se_duerme_temprano || false}
                    onChange={e => onChange('se_duerme_temprano', e.target.checked)}
                  />
                }
                label='Se duerme temprano'
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.se_duerme_tarde || false}
                    onChange={e => onChange('se_duerme_tarde', e.target.checked)}
                  />
                }
                label='Se duerme tarde'
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.apnea_sueño || false}
                    onChange={e => onChange('apnea_sueño', e.target.checked)}
                  />
                }
                label='Presenta apnea del sueño'
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.pesadillas || false}
                    onChange={e => onChange('pesadillas', e.target.checked)}
                  />
                }
                label='Tiene pesadillas'
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.enuresis_secundaria || false}
                    onChange={e => onChange('enuresis_secundaria', e.target.checked)}
                  />
                }
                label='Enuresis secundaria'
              />
            </Grid>

            {/* Alteraciones del Apetito */}
            <Grid item xs={12}>
              <Typography variant='h6' gutterBottom sx={{ mt: 3 }}>
                Alteraciones del Apetito
              </Typography>
              <Divider sx={{ mb: 2 }} />
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.alteraciones_apetito_detalle || false}
                    onChange={e => onChange('alteraciones_apetito_detalle', e.target.checked)}
                  />
                }
                label='Alteraciones del apetito'
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label='Adversión a ciertos medicamentos'
                value={formData.aversion_alimentos || ''}
                onChange={e => onChange('aversion_alimentos', e.target.value)}
                error={hasFieldError('alteraciones_apetito_detalle')}
                helperText={getFieldError('aversion_alimentos')}
                size='small'
                    sx={getFieldStyles('aversion_alimentos')}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Checkbox checked={formData.reflujo || false} onChange={e => onChange('reflujo', e.target.checked)} />
                }
                label='Presenta reflujo'
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label='Alimentos Favoritos'
                value={formData.alimentos_favoritos || ''}
                onChange={e => onChange('alimentos_favoritos', e.target.value)}
                error={hasFieldError('reflujo')}
                helperText={getFieldError('alimentos_favoritos')}
                size='small'
                    sx={getFieldStyles('alimentos_favoritos')}
              />
            </Grid>

            {/* Alteraciones de los Sentidos */}
            <Grid item xs={12}>
              <Typography variant='h6' gutterBottom sx={{ mt: 3 }}>
                Alteraciones de los Sentidos
              </Typography>
              <Divider sx={{ mb: 2 }} />
            </Grid>

            <Grid item xs={12} sm={4}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.alteracion_vision || false}
                    onChange={e => onChange('alteracion_vision', e.target.checked)}
                  />
                }
                label='Alteraciones de la visión'
              />
            </Grid>

            <Grid item xs={12} sm={4}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.alteracion_audicion || false}
                    onChange={e => onChange('alteracion_audicion', e.target.checked)}
                  />
                }
                label='Alteraciones de la audición'
              />
            </Grid>

            <Grid item xs={12} sm={4}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.alteracion_tacto || false}
                    onChange={e => onChange('alteracion_tacto', e.target.checked)}
                  />
                }
                label='Alteraciones del tacto'
              />
            </Grid>

            {(formData.alteracion_vision || formData.alteracion_audicion || formData.alteracion_tacto) && (
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label='Especificación de Alteraciones de los Sentidos'
                  multiline
                  rows={2}
                  value={formData.especifique_alteraciones_sentidos || ''}
                  onChange={e => onChange('especifique_alteraciones_sentidos', e.target.value)}
                  error={hasFieldError('especifique_alteraciones_sentidos')}
                  helperText={getFieldError('especifique_alteraciones_sentidos')}
                  size='small'
                    sx={getFieldStyles('especifique_alteraciones_sentidos')}
                />
              </Grid>
            )}

            {/* Alteraciones Físicas */}
            <Grid item xs={12}>
              <Typography variant='h6' gutterBottom sx={{ mt: 3 }}>
                Alteraciones Físicas
              </Typography>
              <Divider sx={{ mb: 2 }} />
            </Grid>

            <Grid item xs={12} sm={4}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.alteraciones_oseas || false}
                    onChange={e => onChange('alteraciones_oseas', e.target.checked)}
                  />
                }
                label='Alteraciones óseas'
              />
            </Grid>

            <Grid item xs={12} sm={4}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.alteraciones_musculares || false}
                    onChange={e => onChange('alteraciones_musculares', e.target.checked)}
                  />
                }
                label='Alteraciones musculares'
              />
            </Grid>

            <Grid item xs={12} sm={4}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.pie_plano || false}
                    onChange={e => onChange('pie_plano', e.target.checked)}
                  />
                }
                label='Presenta pie plano'
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label='En caso de que su hijo(a) sea un niño con capacidades diferentes, traer el diagnóstico médico actualizado'
                multiline
                rows={3}
                value={formData.diagnostico_medico || ''}
                onChange={e => onChange('diagnostico_medico', e.target.value)}
                error={hasFieldError('diagnostico_medico')}
                helperText={getFieldError('diagnostico_medico')}
                size='small'
                    sx={getFieldStyles('diagnostico_medico')}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.presenta_diagnostico_matricula || false}
                    onChange={e => onChange('presenta_diagnostico_matricula', e.target.checked)}
                  />
                }
                label='Presenta diagnóstico en matrícula'
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.referido_escuela_especial || false}
                    onChange={e => onChange('referido_escuela_especial', e.target.checked)}
                  />
                }
                label='Referido a escuela especial'
              />
            </Grid>

            <Grid item xs={12} sm={4}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.trajo_epicrisis || false}
                    onChange={e => onChange('trajo_epicrisis', e.target.checked)}
                  />
                }
                label='Trajo epicrisis médica'
              />
            </Grid>
          </Grid>
        </TabPanel>

        {/* Tab 4: Información de Retiro */}
        <TabPanel value={value} index={3}>
          <Grid container spacing={3}>
            <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant='h6' gutterBottom>
                Información de Retiro
              </Typography>
               <Tooltip title={!isEdit ? "Guarde el alumno para imprimir" : "Imprimir Ficha de Retiro"}>
                <span>
                   <IconButton
                     onClick={async () => {
                       try {
                         if (!formData.id) return
                         setIsDownloadingPdf(true)

                         // Mostrar indicador de carga si es posible, o simplemente esperar
                         const blob = await AlumnosService.downloadWithdrawalPdf(formData.id)
                         const url = window.URL.createObjectURL(blob)
                         window.open(url, '_blank')

                         // Limpiar después de un tiempo
                         setTimeout(() => window.URL.revokeObjectURL(url), 100)
                       } catch (error) {
                         console.error('Error al descargar PDF:', error)
                         // Aquí podrías agregar una notificación tostada si tienes un sistema de notificaciones
                       } finally {
                         setIsDownloadingPdf(false)
                       }
                     }}
                     disabled={!isEdit || isDownloadingPdf}
                     color="primary"
                   >
                     {isDownloadingPdf ? <CircularProgress size={24} /> : <PrintIcon />}
                   </IconButton>
                </span>
              </Tooltip>
            </Grid>
            <Divider sx={{ mb: 2, width: '100%' }} />

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label='Fecha de Retiro'
                type='date'
                value={formData.fecha_retiro || ''}
                onChange={e => onChange('fecha_retiro', e.target.value)}
                size='small'
                error={hasFieldError('fecha_retiro')}
                helperText={getFieldError('fecha_retiro')}
                InputLabelProps={{
                  shrink: true,
                }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.retiro_notificado || false}
                    onChange={e => onChange('retiro_notificado', e.target.checked)}
                  />
                }
                label='Es notificado por sus padres:'
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label='Motivo del Retiro'
                multiline
                rows={3}
                value={formData.motivo_retiro || ''}
                onChange={e => onChange('motivo_retiro', e.target.value)}
                error={hasFieldError('motivo_retiro')}
                helperText={getFieldError('motivo_retiro')}
                size='small'
                    sx={getFieldStyles('motivo_retiro')}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label='Observaciones (Comentario de las cosas que usted cree es importante conozca la nueva maestra) '
                multiline
                rows={3}
                value={formData.informacion_retiro_adicional || ''}
                onChange={e => onChange('informacion_retiro_adicional', e.target.value)}
                error={hasFieldError('informacion_retiro_adicional')}
                helperText={getFieldError('informacion_retiro_adicional')}
                size='small'
                    sx={getFieldStyles('informacion_retiro_adicional')}
              />
            </Grid>
          </Grid>
        </TabPanel>

        {/* Tab 5: Registro Académico */}
        <TabPanel value={value} index={4}>
          {formData.id ? (
            <RegistroAcademico userId={formData.id} />
          ) : (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="body1" color="text.secondary">
                Debe guardar el alumno primero para poder gestionar su registro académico.
              </Typography>
            </Box>
          )}
        </TabPanel>

        {/* Tab 6: Aranceles */}
        <TabPanel value={value} index={5}>
          {formData.id ? (
            <ArancelesTab userId={formData.id} />
          ) : (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="body1" color="text.secondary">
                Debe guardar el alumno primero para poder gestionar sus aranceles.
              </Typography>
            </Box>
          )}
        </TabPanel>
      </Box>
  )
}

// Aplicar React.memo para optimizar re-renderizaciones
export default memo(AlumnoFormTabs)
