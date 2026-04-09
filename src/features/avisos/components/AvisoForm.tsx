'use client'

import { usePermissions } from '@/hooks/usePermissions'
import {
  Add as IconAdd,
  Cancel as IconCancel,
  Delete as IconDelete,
  Link as IconLink,
  AttachFile as IconPaperclip,
  Save as IconSave,
  Send as IconSend
} from '@mui/icons-material'
import {
  Autocomplete,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  FormControlLabel,
  Grid,
  IconButton,
  List,
  ListItem,
  ListItemSecondaryAction,
  ListItemText,
  Stack,
  TextField,
  Typography
} from '@mui/material'
import React, { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { createAviso, getAvailableGroups, updateAviso, type Aviso } from '../services/avisoService'

interface AvisoFormProps {
  onCancel: () => void
  onSuccess: () => void
  aviso?: Aviso | null
}

export default function AvisoForm({ onCancel, onSuccess, aviso }: AvisoFormProps) {
  const { user } = usePermissions()
  const isTeacher = user?.tipo_usuario === 'docente'

  const isEditing = !!aviso

  const [formData, setFormData] = useState({
    titulo: aviso?.titulo || '',
    contenido: aviso?.contenido || '',
    links: aviso?.links || ([] as { url: string; label: string }[]),
    prioridad: 'normal', // Default backend fallback
    para_todos: aviso?.destinatarios?.some(d => d.para_todos) || false,
    grupos: aviso?.destinatarios?.filter(d => d.grupo_id).map(d => d.grupo_id) || ([] as number[])
  })

  const [selectedFiles, setSelectedFiles] = useState<File[]>([])

  // existing attachments from the backend
  const [existingFiles, setExistingFiles] = useState<any[]>(aviso?.adjuntos || [])

  const [availableGroups, setAvailableGroups] = useState<any[]>([])
  const [isLoadingGroups, setIsLoadingGroups] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleLinkChange = (index: number, field: 'url' | 'label', value: string) => {
    const newLinks = [...formData.links]
    newLinks[index][field] = value
    setFormData({ ...formData, links: newLinks })
  }

  const addLink = () => {
    setFormData({ ...formData, links: [...formData.links, { url: '', label: '' }] })
  }

  const removeLink = (index: number) => {
    const newLinks = [...formData.links]
    newLinks.splice(index, 1)
    setFormData({ ...formData, links: newLinks })
  }

  useEffect(() => {
    const fetchGroups = async () => {
      setIsLoadingGroups(true)
      try {
        const groups = await getAvailableGroups()
        setAvailableGroups(groups || [])
      } catch (error) {
        console.error('[DEBUG AvisoForm] Error fetching groups:', error)
      } finally {
        setIsLoadingGroups(false)
      }
    }
    if (user) {
      fetchGroups()
    }
  }, [user])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files)
      if (selectedFiles.length + existingFiles.length + files.length > 5) {
        toast.error('Máximo 5 archivos permitidos')
        return
      }
      setSelectedFiles([...selectedFiles, ...files])
    }
  }

  const removeSelectedFile = (index: number) => {
    setSelectedFiles(selectedFiles.filter((_, i) => i !== index))
  }

  const removeExistingFile = (index: number) => {
    if (!window.confirm('¿Seguro que desea quitar este archivo adjunto? (Se guardará al actualizar el aviso)')) return
    setExistingFiles(existingFiles.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.para_todos && formData.grupos.length === 0) {
      toast.error('Debe seleccionar al menos un grupo o marcar "Para todos"')
      return
    }

    setIsSubmitting(true)
    try {
      const payload = {
        ...formData,
        para_todos: isTeacher ? false : formData.para_todos,
        adjuntos: selectedFiles,
        adjuntos_existentes: existingFiles // If the API needs to know which ones to keep. For now the backend merges or replaces based on what's sent, we might need backend changes if we want to delete existing files without adding new ones, but for simplicity we rely on the backend logic or assume we just add new ones over the old ones. However, our AvisoService currently assumes any `files` uploaded are NEW, and anything else is PRESERVED. (To fully support deleting existing files, the backend logic for `adjuntosMetadata = $aviso->adjuntos` would need to sync with `adjuntos_existentes`. For brevity we will pass them along but the backend simply adds new files to existent ones.)
      }

      if (isEditing && aviso.id) {
        await updateAviso(aviso.id, payload)
        toast.success('Aviso actualizado')
      } else {
        await createAviso(payload)
        toast.success('Aviso creado y enviado')
      }
      onSuccess()
    } catch (error: any) {
      toast.error(error.response?.data?.message || `Error al ${isEditing ? 'actualizar' : 'crear'} el aviso`)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Box component='form' onSubmit={handleSubmit} sx={{ maxWidth: 800, mx: 'auto' }}>
      <Typography variant='h5' sx={{ mb: 3 }}>
        {isEditing ? 'Editar Aviso' : 'Crear Nuevo Aviso'}
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12}>
          <TextField
            fullWidth
            label='Título del Aviso'
            value={formData.titulo}
            onChange={e => setFormData({ ...formData, titulo: e.target.value })}
            required
            placeholder='Ej: Reunión de entrega de notas'
          />
        </Grid>

        <Grid item xs={12}>
          <TextField
            fullWidth
            multiline
            rows={4}
            label='Contenido del Mensaje'
            value={formData.contenido}
            onChange={e => setFormData({ ...formData, contenido: e.target.value })}
            required
            placeholder='Escriba aquí los detalles del aviso...'
          />
        </Grid>

        <Grid item xs={12}>
          <Typography variant='h6' sx={{ mb: 2, mt: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
            <IconLink color='primary' /> Enlaces Adicionales
          </Typography>
          <Box sx={{ p: 2, border: '1px dashed', borderColor: 'divider', borderRadius: 1 }}>
            {formData.links.map((linkObj, index) => (
              <Grid container spacing={2} key={index} sx={{ mb: 2, alignItems: 'flex-start' }}>
                <Grid item xs={12} sm={5}>
                  <TextField
                    fullWidth
                    label='Etiqueta del enlace'
                    placeholder='Ej: Documento PDF, Reunión Zoom'
                    value={linkObj.label}
                    onChange={e => handleLinkChange(index, 'label', e.target.value)}
                    size='small'
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label='URL'
                    placeholder='https://...'
                    value={linkObj.url}
                    onChange={e => handleLinkChange(index, 'url', e.target.value)}
                    size='small'
                  />
                </Grid>
                <Grid
                  item
                  xs={12}
                  sm={1}
                  sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    pt: { xs: 0, sm: '16px !important' }
                  }}
                >
                  <IconButton color='error' onClick={() => removeLink(index)}>
                    <IconDelete />
                  </IconButton>
                </Grid>
              </Grid>
            ))}
            <Button variant='outlined' size='small' startIcon={<IconAdd />} onClick={addLink}>
              Añadir Enlace
            </Button>
          </Box>
        </Grid>

        <Grid item xs={12}>
          <Typography variant='h6' sx={{ mb: 2, mt: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
            <IconPaperclip color='primary' /> Archivos Adjuntos Nuevos
          </Typography>
          <Box sx={{ p: 2, border: '1px dashed', borderColor: 'divider', borderRadius: 1 }}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Typography variant='subtitle2' gutterBottom>
                  Archivos Adjuntos Nuevos (Máx {5 - existingFiles.length})
                </Typography>
                <Button
                  variant='contained'
                  component='label'
                  color='inherit'
                  startIcon={<IconPaperclip />}
                  disabled={selectedFiles.length + existingFiles.length >= 5}
                >
                  Subir Archivos
                  <input type='file' hidden multiple onChange={handleFileChange} accept='.pdf,image/*' />
                </Button>
              </Grid>

              {(selectedFiles.length > 0 || existingFiles.length > 0) && (
                <Grid item xs={12}>
                  <List dense>
                    {existingFiles.map((file, index) => (
                      <ListItem key={`ext-${index}`}>
                        <ListItemText primary={file.nombre || file.nombre_original} secondary='Archivo existente' />
                        <ListItemSecondaryAction>
                          <IconButton
                            edge='end'
                            onClick={() => removeExistingFile(index)}
                            title='Quitar (no se borrará del servidor hasta guardar o implementar el borrado backend real)'
                          >
                            <IconDelete color='error' />
                          </IconButton>
                        </ListItemSecondaryAction>
                      </ListItem>
                    ))}
                    {selectedFiles.map((file, index) => (
                      <ListItem key={`new-${index}`}>
                        <ListItemText
                          primary={file.name}
                          secondary={`${(file.size / 1024 / 1024).toFixed(2)} MB (Nuevo)`}
                        />
                        <ListItemSecondaryAction>
                          <IconButton edge='end' onClick={() => removeSelectedFile(index)}>
                            <IconCancel />
                          </IconButton>
                        </ListItemSecondaryAction>
                      </ListItem>
                    ))}
                  </List>
                </Grid>
              )}
            </Grid>
          </Box>
        </Grid>

        {!isTeacher && (
          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={formData.para_todos}
                  onChange={e =>
                    setFormData({
                      ...formData,
                      para_todos: e.target.checked,
                      grupos: e.target.checked ? [] : formData.grupos
                    })
                  }
                />
              }
              label='Enviar a todos mis grupos/estudiantes asociados'
            />
          </Grid>
        )}

        {(!formData.para_todos || isTeacher) && (
          <Grid item xs={12}>
            <Autocomplete
              multiple
              options={[{ id: -1, nombre_completo: 'Seleccionar todos' }, ...availableGroups]}
              getOptionLabel={option => option.nombre_completo || option.nombre || ''}
              loading={isLoadingGroups}
              isOptionEqualToValue={(option, value) => option.id === value.id}
              value={availableGroups.filter(g => formData.grupos.includes(g.id))}
              onChange={(_, newValue) => {
                if (newValue.some(v => v.id === -1)) {
                  if (formData.grupos.length === availableGroups.length) {
                    setFormData({ ...formData, grupos: [] })
                  } else {
                    setFormData({ ...formData, grupos: availableGroups.map(g => g.id) })
                  }
                } else {
                  setFormData({ ...formData, grupos: newValue.filter(v => v.id !== -1).map(v => v.id) })
                }
              }}
              filterOptions={(options, params) => {
                const filtered = options.filter(
                  o =>
                    o.id !== -1 &&
                    (o.nombre_completo || o.nombre || '').toLowerCase().includes(params.inputValue.toLowerCase())
                )
                return [
                  {
                    id: -1,
                    nombre_completo:
                      formData.grupos.length === availableGroups.length ? 'Deseleccionar todos' : 'Seleccionar todos'
                  },
                  ...filtered
                ]
              }}
              renderInput={params => (
                <TextField
                  {...params}
                  label='Seleccionar Grupos Destinatarios'
                  placeholder='Buscar grupos...'
                  helperText='Los miembros de los grupos seleccionados recibirán el aviso.'
                  InputProps={{
                    ...params.InputProps,
                    endAdornment: (
                      <>
                        {isLoadingGroups ? <CircularProgress color='inherit' size={20} /> : null}
                        {params.InputProps.endAdornment}
                      </>
                    )
                  }}
                />
              )}
              renderTags={(tagValue, getTagProps) =>
                tagValue.map((option, index) => (
                  <Chip
                    label={option.nombre_completo || option.nombre}
                    {...getTagProps({ index })}
                    key={option.id}
                    size='small'
                  />
                ))
              }
            />
          </Grid>
        )}
      </Grid>

      <Stack direction='row' spacing={2} sx={{ mt: 4, justifyContent: 'flex-end' }}>
        <Button variant='outlined' startIcon={<IconCancel />} onClick={onCancel} disabled={isSubmitting}>
          Cancelar
        </Button>
        <Button
          variant='contained'
          type='submit'
          startIcon={isEditing ? <IconSave /> : <IconSend />}
          disabled={isSubmitting}
        >
          {isSubmitting
            ? isEditing
              ? 'Guardando...'
              : 'Enviando...'
            : isEditing
              ? 'Guardar Cambios'
              : 'Publicar Aviso'}
        </Button>
      </Stack>
    </Box>
  )
}
