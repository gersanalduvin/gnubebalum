'use client'

import {
    Add as AddIcon,
    Delete as DeleteIcon,
    Description as DescriptionIcon,
    ExpandMore as ExpandMoreIcon,
    Upload as UploadIcon
} from '@mui/icons-material'
import {
    Accordion,
    AccordionDetails,
    AccordionSummary,
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    FormControl,
    Grid,
    IconButton,
    InputLabel,
    MenuItem,
    Select,
    TextField,
    Typography
} from '@mui/material'
import { useCallback, useState } from 'react'
import type {
    ExperienciaLaboral,
    FormacionAcademica,
    Referencia,
    UserProfessionalProfileFormData,
    ValidationErrors
} from '../types'

interface Props {
  formData: UserProfessionalProfileFormData
  setFormData: (data: UserProfessionalProfileFormData) => void
  errors: ValidationErrors
  isAdmin?: boolean
  userId?: number
  onDocumentUpload?: (formacionIndex: number, file: File) => Promise<void>
  onDocumentDelete?: (formacionIndex: number) => Promise<void>
  isUploadingDocument?: boolean
}

export default function ProfessionalProfileForm({
  formData,
  setFormData,
  errors,
  isAdmin = false,
  userId,
  onDocumentUpload,
  onDocumentDelete,
  isUploadingDocument = false
}: Props) {
  const [expandedSections, setExpandedSections] = useState<string[]>(['datos-personales'])

  const getFieldError = useCallback(
    (field: string): string => {
      const fieldErrors = errors[field]
      if (!fieldErrors || fieldErrors.length === 0) return ''
      return fieldErrors[0]
    },
    [errors]
  )

  const hasFieldError = useCallback(
    (field: string): boolean => {
      const fieldErrors = errors[field]
      return !!(fieldErrors && fieldErrors.length > 0)
    },
    [errors]
  )

  const toggleSection = (section: string) => {
    setExpandedSections(prev =>
      prev.includes(section) ? prev.filter(s => s !== section) : [...prev, section]
    )
  }

  // Handlers para Experiencia Laboral
  const addExperiencia = () => {
    const newExp: ExperienciaLaboral = {
      cargo: '',
      empresa: '',
      fecha_inicio: '',
      fecha_fin: null,
      actualmente: false,
      descripcion: ''
    }
    setFormData({
      ...formData,
      experiencia_laboral: [...(formData.experiencia_laboral || []), newExp]
    })
  }

  const updateExperiencia = (index: number, field: keyof ExperienciaLaboral, value: any) => {
    const updated = [...(formData.experiencia_laboral || [])]
    updated[index] = { ...updated[index], [field]: value }
    setFormData({ ...formData, experiencia_laboral: updated })
  }

  const removeExperiencia = (index: number) => {
    const updated = [...(formData.experiencia_laboral || [])]
    updated.splice(index, 1)
    setFormData({ ...formData, experiencia_laboral: updated })
  }

  // Handlers para Formación Académica
  const addFormacion = () => {
    const newForm: FormacionAcademica = {
      nivel: '',
      titulo: '',
      institucion: '',
      anio_inicio: new Date().getFullYear(),
      anio_fin: null,
      en_curso: false
    }
    setFormData({
      ...formData,
      formacion_academica: [...(formData.formacion_academica || []), newForm]
    })
  }

  const updateFormacion = (index: number, field: keyof FormacionAcademica, value: any) => {
    const updated = [...(formData.formacion_academica || [])]
    updated[index] = { ...updated[index], [field]: value }
    setFormData({ ...formData, formacion_academica: updated })
  }

  const removeFormacion = (index: number) => {
    const updated = [...(formData.formacion_academica || [])]
    updated.splice(index, 1)
    setFormData({ ...formData, formacion_academica: updated })
  }

  // Handlers para Habilidades Blandas
  const [newHabilidad, setNewHabilidad] = useState('')

  const addHabilidad = () => {
    if (newHabilidad.trim()) {
      setFormData({
        ...formData,
        habilidades_blandas: [...(formData.habilidades_blandas || []), newHabilidad.trim()]
      })
      setNewHabilidad('')
    }
  }

  const removeHabilidad = (index: number) => {
    const updated = [...(formData.habilidades_blandas || [])]
    updated.splice(index, 1)
    setFormData({ ...formData, habilidades_blandas: updated })
  }

  // Handlers para Referencias
  const addReferencia = () => {
    const newRef: Referencia = {
      nombre: '',
      cargo: '',
      empresa: '',
      telefono: '',
      email: ''
    }
    setFormData({
      ...formData,
      referencias: [...(formData.referencias || []), newRef]
    })
  }

  const updateReferencia = (index: number, field: keyof Referencia, value: string) => {
    const updated = [...(formData.referencias || [])]
    updated[index] = { ...updated[index], [field]: value }
    setFormData({ ...formData, referencias: updated })
  }

  const removeReferencia = (index: number) => {
    const updated = [...(formData.referencias || [])]
    updated.splice(index, 1)
    setFormData({ ...formData, referencias: updated })
  }

  return (
    <Box>
      {/* Sección 1: Datos Personales */}
      <Accordion
        expanded={expandedSections.includes('datos-personales')}
        onChange={() => toggleSection('datos-personales')}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6">1. Datos Personales</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Cédula"
                value={formData.cedula || ''}
                onChange={e => setFormData({ ...formData, cedula: e.target.value })}
                error={hasFieldError('cedula')}
                helperText={getFieldError('cedula')}
                fullWidth
                size="small"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth size="small" error={hasFieldError('estado_civil')}>
                <InputLabel>Estado Civil</InputLabel>
                <Select
                  label="Estado Civil"
                  value={formData.estado_civil || ''}
                  onChange={e => setFormData({ ...formData, estado_civil: e.target.value })}
                >
                  <MenuItem value="Soltero">Soltero</MenuItem>
                  <MenuItem value="Casado">Casado</MenuItem>
                  <MenuItem value="Divorciado">Divorciado</MenuItem>
                  <MenuItem value="Viudo">Viudo</MenuItem>
                  <MenuItem value="Unión libre">Unión libre</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Nacionalidad"
                value={formData.nacionalidad || ''}
                onChange={e => setFormData({ ...formData, nacionalidad: e.target.value })}
                error={hasFieldError('nacionalidad')}
                helperText={getFieldError('nacionalidad')}
                fullWidth
                size="small"
              />
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>

      {/* Sección 2: Presentación */}
      <Accordion
        expanded={expandedSections.includes('presentacion')}
        onChange={() => toggleSection('presentacion')}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6">2. Presentación Profesional</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                label="Presentación"
                value={formData.presentacion || ''}
                onChange={e => setFormData({ ...formData, presentacion: e.target.value })}
                error={hasFieldError('presentacion')}
                helperText={getFieldError('presentacion') || 'Breve descripción profesional'}
                fullWidth
                multiline
                rows={4}
                size="small"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Teléfono Profesional"
                value={formData.telefono_profesional || ''}
                onChange={e => setFormData({ ...formData, telefono_profesional: e.target.value })}
                error={hasFieldError('telefono_profesional')}
                helperText={getFieldError('telefono_profesional')}
                fullWidth
                size="small"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Email Profesional"
                type="email"
                value={formData.email_profesional || ''}
                onChange={e => setFormData({ ...formData, email_profesional: e.target.value })}
                error={hasFieldError('email_profesional')}
                helperText={getFieldError('email_profesional')}
                fullWidth
                size="small"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="LinkedIn URL"
                value={formData.linkedin_url || ''}
                onChange={e => setFormData({ ...formData, linkedin_url: e.target.value })}
                error={hasFieldError('linkedin_url')}
                helperText={getFieldError('linkedin_url')}
                fullWidth
                size="small"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Sitio Web"
                value={formData.sitio_web || ''}
                onChange={e => setFormData({ ...formData, sitio_web: e.target.value })}
                error={hasFieldError('sitio_web')}
                helperText={getFieldError('sitio_web')}
                fullWidth
                size="small"
              />
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>

      {/* Sección 3: Experiencia Laboral */}
      <Accordion
        expanded={expandedSections.includes('experiencia')}
        onChange={() => toggleSection('experiencia')}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6">3. Experiencia Laboral</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Box>
            {(formData.experiencia_laboral || []).map((exp, index) => (
              <Card key={index} sx={{ mb: 2 }}>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="subtitle1">Experiencia #{index + 1}</Typography>
                    <IconButton onClick={() => removeExperiencia(index)} color="error" size="small">
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        label="Cargo"
                        value={exp.cargo}
                        onChange={e => updateExperiencia(index, 'cargo', e.target.value)}
                        error={hasFieldError(`experiencia_laboral.${index}.cargo`)}
                        helperText={getFieldError(`experiencia_laboral.${index}.cargo`)}
                        fullWidth
                        size="small"
                        required
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        label="Empresa"
                        value={exp.empresa}
                        onChange={e => updateExperiencia(index, 'empresa', e.target.value)}
                        error={hasFieldError(`experiencia_laboral.${index}.empresa`)}
                        helperText={getFieldError(`experiencia_laboral.${index}.empresa`)}
                        fullWidth
                        size="small"
                        required
                      />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <TextField
                        label="Fecha Inicio"
                        type="date"
                        value={exp.fecha_inicio}
                        onChange={e => updateExperiencia(index, 'fecha_inicio', e.target.value)}
                        error={hasFieldError(`experiencia_laboral.${index}.fecha_inicio`)}
                        helperText={getFieldError(`experiencia_laboral.${index}.fecha_inicio`)}
                        fullWidth
                        size="small"
                        InputLabelProps={{ shrink: true }}
                        required
                      />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <TextField
                        label="Fecha Fin"
                        type="date"
                        value={exp.fecha_fin || ''}
                        onChange={e => updateExperiencia(index, 'fecha_fin', e.target.value || null)}
                        disabled={exp.actualmente}
                        error={hasFieldError(`experiencia_laboral.${index}.fecha_fin`)}
                        helperText={getFieldError(`experiencia_laboral.${index}.fecha_fin`)}
                        fullWidth
                        size="small"
                        InputLabelProps={{ shrink: true }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <FormControl fullWidth size="small">
                        <InputLabel>Actualmente</InputLabel>
                        <Select
                          label="Actualmente"
                          value={exp.actualmente ? 'true' : 'false'}
                          onChange={e => updateExperiencia(index, 'actualmente', e.target.value === 'true')}
                        >
                          <MenuItem value="false">No</MenuItem>
                          <MenuItem value="true">Sí</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        label="Descripción"
                        value={exp.descripcion}
                        onChange={e => updateExperiencia(index, 'descripcion', e.target.value)}
                        error={hasFieldError(`experiencia_laboral.${index}.descripcion`)}
                        helperText={getFieldError(`experiencia_laboral.${index}.descripcion`)}
                        fullWidth
                        multiline
                        rows={3}
                        size="small"
                      />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            ))}
            <Button startIcon={<AddIcon />} onClick={addExperiencia} variant="outlined" fullWidth>
              Agregar Experiencia
            </Button>
          </Box>
        </AccordionDetails>
      </Accordion>

      {/* Sección 4: Formación Académica */}
      <Accordion
        expanded={expandedSections.includes('formacion')}
        onChange={() => toggleSection('formacion')}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6">4. Formación Académica</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Box>
            {(formData.formacion_academica || []).map((form, index) => (
              <Card key={index} sx={{ mb: 2 }}>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="subtitle1">Formación #{index + 1}</Typography>
                    <IconButton onClick={() => removeFormacion(index)} color="error" size="small">
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        label="Nivel"
                        value={form.nivel}
                        onChange={e => updateFormacion(index, 'nivel', e.target.value)}
                        error={hasFieldError(`formacion_academica.${index}.nivel`)}
                        helperText={getFieldError(`formacion_academica.${index}.nivel`) || 'Ej: Licenciatura, Maestría'}
                        fullWidth
                        size="small"
                        required
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        label="Título"
                        value={form.titulo}
                        onChange={e => updateFormacion(index, 'titulo', e.target.value)}
                        error={hasFieldError(`formacion_academica.${index}.titulo`)}
                        helperText={getFieldError(`formacion_academica.${index}.titulo`)}
                        fullWidth
                        size="small"
                        required
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        label="Institución"
                        value={form.institucion}
                        onChange={e => updateFormacion(index, 'institucion', e.target.value)}
                        error={hasFieldError(`formacion_academica.${index}.institucion`)}
                        helperText={getFieldError(`formacion_academica.${index}.institucion`)}
                        fullWidth
                        size="small"
                        required
                      />
                    </Grid>
                    <Grid item xs={12} sm={2}>
                      <TextField
                        label="Año Inicio"
                        type="number"
                        value={form.anio_inicio}
                        onChange={e => updateFormacion(index, 'anio_inicio', parseInt(e.target.value))}
                        error={hasFieldError(`formacion_academica.${index}.anio_inicio`)}
                        helperText={getFieldError(`formacion_academica.${index}.anio_inicio`)}
                        fullWidth
                        size="small"
                        required
                      />
                    </Grid>
                    <Grid item xs={12} sm={2}>
                      <TextField
                        label="Año Fin"
                        type="number"
                        value={form.anio_fin || ''}
                        onChange={e => updateFormacion(index, 'anio_fin', e.target.value ? parseInt(e.target.value) : null)}
                        disabled={form.en_curso}
                        error={hasFieldError(`formacion_academica.${index}.anio_fin`)}
                        helperText={getFieldError(`formacion_academica.${index}.anio_fin`)}
                        fullWidth
                        size="small"
                      />
                    </Grid>
                    <Grid item xs={12} sm={2}>
                      <FormControl fullWidth size="small">
                        <InputLabel>En Curso</InputLabel>
                        <Select
                          label="En Curso"
                          value={form.en_curso ? 'true' : 'false'}
                          onChange={e => updateFormacion(index, 'en_curso', e.target.value === 'true')}
                        >
                          <MenuItem value="false">No</MenuItem>
                          <MenuItem value="true">Sí</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    {onDocumentUpload && (
                      <Grid item xs={12}>
                        <Box display="flex" alignItems="center" gap={2}>
                          {form.documento_url ? (
                            <>
                              <Chip
                                icon={<DescriptionIcon />}
                                label="Documento adjunto"
                                color="success"
                                onDelete={() => onDocumentDelete?.(index)}
                                disabled={isUploadingDocument}
                              />
                              <Button
                                size="small"
                                href={form.documento_url}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                Ver Documento
                              </Button>
                            </>
                          ) : (
                            <Button
                              variant="outlined"
                              size="small"
                              component="label"
                              startIcon={<UploadIcon />}
                              disabled={isUploadingDocument}
                            >
                              Subir Documento (PDF)
                              <input
                                type="file"
                                hidden
                                accept=".pdf"
                                onChange={e => {
                                  const file = e.target.files?.[0]
                                  if (file) onDocumentUpload(index, file)
                                }}
                              />
                            </Button>
                          )}
                        </Box>
                      </Grid>
                    )}
                  </Grid>
                </CardContent>
              </Card>
            ))}
            <Button startIcon={<AddIcon />} onClick={addFormacion} variant="outlined" fullWidth>
              Agregar Formación
            </Button>
          </Box>
        </AccordionDetails>
      </Accordion>

      {/* Sección 5: Habilidades Blandas */}
      <Accordion
        expanded={expandedSections.includes('habilidades')}
        onChange={() => toggleSection('habilidades')}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6">5. Habilidades Blandas</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Box>
            <Box display="flex" gap={1} mb={2}>
              <TextField
                label="Nueva Habilidad"
                value={newHabilidad}
                onChange={e => setNewHabilidad(e.target.value)}
                onKeyPress={e => e.key === 'Enter' && addHabilidad()}
                fullWidth
                size="small"
                placeholder="Ej: Trabajo en equipo, Liderazgo"
              />
              <Button onClick={addHabilidad} variant="contained" disabled={!newHabilidad.trim()}>
                Agregar
              </Button>
            </Box>
            <Box display="flex" flexWrap="wrap" gap={1}>
              {(formData.habilidades_blandas || []).map((habilidad, index) => (
                <Chip
                  key={index}
                  label={habilidad}
                  onDelete={() => removeHabilidad(index)}
                  color="primary"
                  variant="outlined"
                />
              ))}
            </Box>
          </Box>
        </AccordionDetails>
      </Accordion>

      {/* Sección 6: Referencias */}
      <Accordion
        expanded={expandedSections.includes('referencias')}
        onChange={() => toggleSection('referencias')}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6">6. Referencias Profesionales</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Box>
            {(formData.referencias || []).map((ref, index) => (
              <Card key={index} sx={{ mb: 2 }}>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="subtitle1">Referencia #{index + 1}</Typography>
                    <IconButton onClick={() => removeReferencia(index)} color="error" size="small">
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        label="Nombre"
                        value={ref.nombre}
                        onChange={e => updateReferencia(index, 'nombre', e.target.value)}
                        error={hasFieldError(`referencias.${index}.nombre`)}
                        helperText={getFieldError(`referencias.${index}.nombre`)}
                        fullWidth
                        size="small"
                        required
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        label="Cargo"
                        value={ref.cargo}
                        onChange={e => updateReferencia(index, 'cargo', e.target.value)}
                        error={hasFieldError(`referencias.${index}.cargo`)}
                        helperText={getFieldError(`referencias.${index}.cargo`)}
                        fullWidth
                        size="small"
                        required
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        label="Empresa"
                        value={ref.empresa}
                        onChange={e => updateReferencia(index, 'empresa', e.target.value)}
                        error={hasFieldError(`referencias.${index}.empresa`)}
                        helperText={getFieldError(`referencias.${index}.empresa`)}
                        fullWidth
                        size="small"
                      />
                    </Grid>
                    <Grid item xs={12} sm={3}>
                      <TextField
                        label="Teléfono"
                        value={ref.telefono}
                        onChange={e => updateReferencia(index, 'telefono', e.target.value)}
                        error={hasFieldError(`referencias.${index}.telefono`)}
                        helperText={getFieldError(`referencias.${index}.telefono`)}
                        fullWidth
                        size="small"
                        required
                      />
                    </Grid>
                    <Grid item xs={12} sm={3}>
                      <TextField
                        label="Email"
                        type="email"
                        value={ref.email}
                        onChange={e => updateReferencia(index, 'email', e.target.value)}
                        error={hasFieldError(`referencias.${index}.email`)}
                        helperText={getFieldError(`referencias.${index}.email`)}
                        fullWidth
                        size="small"
                      />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            ))}
            <Button startIcon={<AddIcon />} onClick={addReferencia} variant="outlined" fullWidth>
              Agregar Referencia
            </Button>
          </Box>
        </AccordionDetails>
      </Accordion>
    </Box>
  )
}
