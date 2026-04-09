'use client'
import React, { useEffect, useRef, useState } from 'react'

import {
  ArrowBack as IconArrowBack,
  InsertDriveFile as IconFile,
  AttachFile as IconPaperclip,
  Send as IconSend,
  Person as IconUser,
  Close as IconX
} from '@mui/icons-material'
import {
  Autocomplete,
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  CircularProgress,
  Grid,
  IconButton,
  LinearProgress,
  List,
  ListItem,
  ListItemSecondaryAction,
  ListItemText,
  MenuItem,
  TextField,
  Typography
} from '@mui/material'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

import { useAuth } from '@/hooks/useAuth'
import { mensajeriaService } from '../services/mensajeriaService'
import type { MensajeFormData } from '../types'

export default function MensajeComposer() {
  const router = useRouter()
  const { user } = useAuth()
  const [formData, setFormData] = useState<MensajeFormData>({
    asunto: '',
    contenido: '',
    tipo_mensaje: 'GENERAL',
    destinatarios: [],
    grupos: []
  })

  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [destinatariosDisponibles, setDestinatariosDisponibles] = useState<any[]>([])
  const [gruposDisponibles, setGruposDisponibles] = useState<any[]>([])
  const [seleccionPor, setSeleccionPor] = useState<'usuarios' | 'grupos' | 'familias' | 'docentes' | 'administrativos'>(
    'usuarios'
  )
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [loadingUsers, setLoadingUsers] = useState(false)
  const [loadingGrupos, setLoadingGrupos] = useState(false)
  const [selectedUsers, setSelectedUsers] = useState<any[]>([])

  // Cargar grupos iniciales - REMOVIDO para carga lazy
  // useEffect(() => {
  //   const fetchGrupos = async () => {
  //       try {
  //           const gruposData = await mensajeriaService.getGrupos().catch(() => []);
  //           setGruposDisponibles(gruposData);
  //       } catch (error) {
  //           console.error("Error cargando grupos", error);
  //       }
  //   };
  //   fetchGrupos();
  // }, []);

  // Cargar usuarios dinámicamente o iniciales
  useEffect(() => {
    loadUsers('')
  }, [])

  const loadUsers = async (search: string) => {
    setLoadingUsers(true)
    try {
      const usersData = await mensajeriaService.getDestinatariosPermitidos(search)
      setDestinatariosDisponibles(usersData)
    } catch (error) {
      console.error('Error buscando usuarios', error)
    } finally {
      setLoadingUsers(false)
    }
  }

  // Debounce search function
  const handleUserSearch = (event: React.SyntheticEvent, value: string) => {
    // Simple debounce implementation or reliance on user pause
    // For simplicity in this snippet, we call directly but usually you'd debounce.
    // MUI Autocomplete onInputChange fires on every key stroke.
    const timeoutId = setTimeout(() => {
      loadUsers(value)
    }, 500)
    return () => clearTimeout(timeoutId)
  }
  // Store timeout ref to clear proper debounce
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const onUserInputChange = (event: any, newInputValue: string) => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }
    searchTimeoutRef.current = setTimeout(() => {
      loadUsers(newInputValue)
    }, 500)
  }

  const handleCancel = () => {
    router.back()
  }

  const handleUserSelection = (event: any, newValue: any[]) => {
    setSelectedUsers(newValue)
    setFormData({
      ...formData,
      destinatarios: newValue.map((u: any) => u.id)
    })
  }

  const handleGroupSelection = (grupos: any[]) => {
    setFormData(prev => ({
      ...prev,
      grupos: grupos.map(g => g.id)
    }))
  }

  const removeFile = (index: number) => {
    setSelectedFiles(selectedFiles.filter((_, i) => i !== index))
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files)
      if (selectedFiles.length + files.length > 5) {
        toast.error('Solo puedes adjuntar hasta 5 archivos')
        return
      }
      setSelectedFiles([...selectedFiles, ...files])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validar destinatarios según el tipo de selección
    let hasDestinatarios = false

    if (seleccionPor === 'usuarios') {
      hasDestinatarios = formData.destinatarios.length > 0
    } else if (seleccionPor === 'grupos') {
      hasDestinatarios = (formData.grupos && formData.grupos.length > 0) || false
    } else {
      // Para tipos bulk como Familias, Docentes, Admin, asumimos que siempre es válido seleccionar
      hasDestinatarios = true
    }

    if (!hasDestinatarios) {
      toast.error('Debes seleccionar al menos un destinatario o grupo')
      return
    }

    setIsSubmitting(true)
    try {
      await mensajeriaService.crearMensaje({
        ...formData,
        tipo_destinatario: seleccionPor, // New field to instruct backend
        adjuntos: selectedFiles
      })
      toast.success('Mensaje enviado exitosamente')
      router.push('/mensajeria')
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'No se pudo enviar el mensaje')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card>
      <CardHeader
        title={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <IconButton onClick={handleCancel} size='small'>
              <IconArrowBack />
            </IconButton>
            <Typography variant='h6'>Nuevo Mensaje</Typography>
          </Box>
        }
      />
      <CardContent>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {/* Tipo de mensaje */}
                <TextField
                  select
                  label='Tipo de Mensaje'
                  value={formData.tipo_mensaje}
                  onChange={(e: any) => setFormData({ ...formData, tipo_mensaje: e.target.value })}
                  fullWidth
                >
                  <MenuItem value='GENERAL'>General</MenuItem>
                  <MenuItem value='LECTURA'>Lectura (con seguimiento)</MenuItem>
                  <MenuItem value='CONFIRMACION'>Confirmación (SI/NO)</MenuItem>
                </TextField>

                {/* Destinatarios */}
                <Box>
                  <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
                    <Button
                      variant={seleccionPor === 'usuarios' ? 'contained' : 'outlined'}
                      onClick={() => setSeleccionPor('usuarios')}
                      size='small'
                    >
                      Seleccionar Usuarios
                    </Button>
                    {user?.tipo_usuario !== 'familia' && (
                      <Button
                        variant={seleccionPor === 'grupos' ? 'contained' : 'outlined'}
                        onClick={() => {
                          setSeleccionPor('grupos')
                          if (gruposDisponibles.length === 0) {
                            setLoadingGrupos(true)
                            mensajeriaService
                              .getGrupos()
                              .then(data => setGruposDisponibles(data))
                              .catch(err => console.error('Error cargando grupos', err))
                              .finally(() => setLoadingGrupos(false))
                          }
                        }}
                        size='small'
                        disabled={loadingGrupos}
                        startIcon={loadingGrupos ? <CircularProgress size={16} /> : null}
                      >
                        {loadingGrupos ? 'Cargando...' : 'Grupos'}
                      </Button>
                    )}
                    {/* Botones de selección masiva ocultados según requerimiento */}
                    {/*
                        <Button
                            variant={seleccionPor === 'familias' ? 'contained' : 'outlined'}
                            onClick={() => setSeleccionPor('familias')}
                            size="small"
                        >
                            Familias
                        </Button>
                        <Button
                            variant={seleccionPor === 'docentes' ? 'contained' : 'outlined'}
                            onClick={() => setSeleccionPor('docentes')}
                            size="small"
                        >
                            Docentes
                        </Button>
                        <Button
                            variant={seleccionPor === 'administrativos' ? 'contained' : 'outlined'}
                            onClick={() => setSeleccionPor('administrativos')}
                            size="small"
                        >
                            Administrativo
                        </Button>
                        */}
                  </Box>

                  {seleccionPor === 'familias' && (
                    <Box sx={{ p: 2, bgcolor: 'info.main', color: 'info.contrastText', borderRadius: 1 }}>
                      <Typography variant='body2'>
                        Se enviará a los correos de familia que tengan alumnos asociados con el periodo lectivo actual.
                      </Typography>
                    </Box>
                  )}

                  {seleccionPor === 'docentes' && (
                    <Box sx={{ p: 2, bgcolor: 'info.main', color: 'info.contrastText', borderRadius: 1 }}>
                      <Typography variant='body2'>
                        Se enviará a todos los docentes que tengan materias asignadas del periodo lectivo seleccionado.
                      </Typography>
                    </Box>
                  )}

                  {seleccionPor === 'administrativos' && (
                    <Box sx={{ p: 2, bgcolor: 'info.main', color: 'info.contrastText', borderRadius: 1 }}>
                      <Typography variant='body2'>
                        Permitirá enviar a todos los usuarios de tipo administrativos.
                      </Typography>
                    </Box>
                  )}

                  {seleccionPor === 'usuarios' ? (
                    <Autocomplete
                      multiple
                      options={destinatariosDisponibles || []}
                      loading={loadingUsers}
                      getOptionLabel={option => option.nombre_completo}
                      isOptionEqualToValue={(option, value) => option.id === value.id}
                      // Use selectedUsers directly to persist selection
                      value={selectedUsers}
                      onChange={handleUserSelection}
                      onInputChange={onUserInputChange}
                      filterOptions={x => x} // Disable built-in filtering
                      renderTags={(value, getTagProps) =>
                        value.map((option, index) => (
                          <Chip
                            variant='outlined'
                            label={option.nombre_completo}
                            size='small'
                            avatar={<IconUser fontSize='small' />}
                            {...getTagProps({ index })}
                            key={option.id}
                          />
                        ))
                      }
                      renderInput={params => (
                        <TextField
                          {...params}
                          label='Destinatarios'
                          placeholder='Buscar usuarios...'
                          helperText={`${selectedUsers.length} seleccionados`}
                          InputProps={{
                            ...params.InputProps,
                            endAdornment: (
                              <React.Fragment>
                                {loadingUsers ? <CircularProgress color='inherit' size={20} /> : null}
                                {params.InputProps.endAdornment}
                              </React.Fragment>
                            )
                          }}
                        />
                      )}
                    />
                  ) : seleccionPor === 'grupos' ? (
                    <Autocomplete
                      multiple
                      options={[{ id: -1, nombre_completo: 'Seleccionar todos' }, ...(gruposDisponibles || [])]}
                      getOptionLabel={option => option.nombre_completo}
                      isOptionEqualToValue={(option, value) => option.id === value.id}
                      onChange={(_, values) => {
                        if (values.some(v => v.id === -1)) {
                          // Si seleccionó "Seleccionar todos"
                          const currentIds = formData.grupos || []
                          if (currentIds.length === gruposDisponibles.length) {
                            // Si ya estaban todos, deseleccionar todos
                            handleGroupSelection([])
                          } else {
                            // Si no estaban todos, seleccionar todos
                            handleGroupSelection(gruposDisponibles)
                          }
                        } else {
                          handleGroupSelection(values.filter(v => v.id !== -1))
                        }
                      }}
                      value={gruposDisponibles.filter(g => (formData.grupos || []).includes(g.id))}
                      filterOptions={(options, params) => {
                        const filtered = options.filter(
                          o => o.id !== -1 && o.nombre_completo.toLowerCase().includes(params.inputValue.toLowerCase())
                        )
                        return [
                          {
                            id: -1,
                            nombre_completo:
                              (formData.grupos || []).length === gruposDisponibles.length
                                ? 'Deseleccionar todos'
                                : 'Seleccionar todos'
                          },
                          ...filtered
                        ]
                      }}
                      renderInput={params => (
                        <TextField
                          {...params}
                          label='Seleccionar Grupos'
                          placeholder='Buscar grupo...'
                          helperText='Los miembros del grupo recibirán el mensaje.'
                          InputProps={{
                            ...params.InputProps,
                            endAdornment: (
                              <React.Fragment>
                                {loadingGrupos ? <CircularProgress color='inherit' size={20} /> : null}
                                {params.InputProps.endAdornment}
                              </React.Fragment>
                            )
                          }}
                        />
                      )}
                    />
                  ) : null}
                </Box>

                {/* Asunto */}
                <TextField
                  label='Asunto'
                  value={formData.asunto}
                  onChange={e => setFormData({ ...formData, asunto: e.target.value })}
                  required
                  fullWidth
                />

                {/* Contenido */}
                <TextField
                  label='Mensaje'
                  value={formData.contenido}
                  onChange={e => setFormData({ ...formData, contenido: e.target.value })}
                  required
                  multiline
                  rows={6}
                  fullWidth
                />

                {/* Adjuntos */}
                <Box>
                  <Typography variant='subtitle2' gutterBottom>
                    Adjuntos (máx. 5 archivos, 10MB c/u)
                    <Typography variant='caption' display='block' color='text.secondary'>
                      Formatos permitidos: Documentos (PDF, Office, Texto) e Imágenes (JPG, PNG)
                    </Typography>
                  </Typography>

                  <Button
                    variant='outlined'
                    component='label'
                    startIcon={<IconPaperclip />}
                    disabled={selectedFiles.length >= 5}
                  >
                    Adjuntar archivos
                    <input
                      type='file'
                      hidden
                      multiple
                      accept='.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.odt,.ods,.odp,.jpg,.jpeg,.png,.gif,.webp'
                      onChange={handleFileChange}
                    />
                  </Button>

                  {selectedFiles.length > 0 && (
                    <List dense>
                      {selectedFiles.map((file, index) => (
                        <ListItem key={index} sx={{ bgcolor: 'action.hover', borderRadius: 1, mb: 0.5 }}>
                          <IconFile style={{ marginRight: 8, fontSize: 18 }} />
                          <ListItemText primary={file.name} secondary={`${(file.size / 1024 / 1024).toFixed(2)} MB`} />
                          <ListItemSecondaryAction>
                            <IconButton edge='end' aria-label='delete' onClick={() => removeFile(index)}>
                              <IconX fontSize='small' />
                            </IconButton>
                          </ListItemSecondaryAction>
                        </ListItem>
                      ))}
                    </List>
                  )}
                </Box>
              </Box>
            </Grid>
          </Grid>

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 3 }}>
            <Button onClick={handleCancel} color='inherit'>
              Cancelar
            </Button>
            <Button
              type='submit'
              variant='contained'
              disabled={isSubmitting}
              startIcon={isSubmitting ? null : <IconSend />}
            >
              {isSubmitting ? 'Enviando...' : 'Enviar Mensaje'}
            </Button>
          </Box>
          {isSubmitting && <LinearProgress sx={{ mt: 2 }} />}
        </form>
      </CardContent>
    </Card>
  )
}
