import { alpha, Box, Button, Card, CardContent, CardHeader, Chip, Grid, IconButton, InputAdornment, TextField, useTheme } from '@mui/material'
import React from 'react'
import { toast } from 'react-hot-toast'

interface Campo {
  nombre: string
  valor: string
  archivos?: (string | File)[]
}

interface Section {
  id: string
  titulo: string
  tipo: 'simple' | 'tabla'
  campos: Campo[]
}

interface DynamicSectionEditorProps {
  sections: Section[]
  onChange: (sections: Section[]) => void
  disabled?: boolean
}

export const DynamicSectionEditor: React.FC<DynamicSectionEditorProps> = ({ sections, onChange, disabled = false }) => {
  const theme = useTheme();
  
  const handleAddSection = () => {
    const newSection: Section = {
      id: `section-${Date.now()}`,
      titulo: 'Nueva Sección',
      tipo: 'simple',
      campos: [{ nombre: 'Descripción', valor: '' }]
    }
    onChange([...sections, newSection])
  }

  const handleRemoveSection = (sectionId: string) => {
    onChange(sections.filter(s => s.id !== sectionId))
  }

  const handleSectionChange = (sectionId: string, updates: Partial<Section>) => {
    onChange(sections.map(s => s.id === sectionId ? { ...s, ...updates } : s))
  }

  const handleAddField = (sectionId: string) => {
    onChange(sections.map(s => {
      if (s.id === sectionId) {
        return {
          ...s,
          campos: [...s.campos, { nombre: 'Nuevo Campo', valor: '' }]
        }
      }
      return s
    }))
  }

  const handleRemoveField = (sectionId: string, fieldIndex: number) => {
    onChange(sections.map(s => {
      if (s.id === sectionId) {
        return {
          ...s,
          campos: s.campos.filter((_, i) => i !== fieldIndex)
        }
      }
      return s
    }))
  }

  const handleFieldChange = (sectionId: string, fieldIndex: number, field: 'nombre' | 'valor', value: string) => {
    onChange(sections.map(s => {
      if (s.id === sectionId) {
        return {
          ...s,
          campos: s.campos.map((c, i) => i === fieldIndex ? { ...c, [field]: value } : c)
        }
      }
      return s
    }))
  }

  const handleMoveSection = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return
    if (direction === 'down' && index === sections.length - 1) return

    const newSections = [...sections]
    const temp = newSections[index]
    if (direction === 'up') {
      newSections[index] = newSections[index - 1]
      newSections[index - 1] = temp
    } else {
      newSections[index] = newSections[index + 1]
      newSections[index + 1] = temp
    }
    onChange(newSections)
  }

  const handleDuplicateSection = (index: number) => {
    const sectionToDuplicate = sections[index]
    const newSection: Section = {
      ...sectionToDuplicate,
      id: `section-${Date.now()}`,
      titulo: `${sectionToDuplicate.titulo} (Copia)`
      // Fields are copied by spread, no need to map deep if simple structure, 
      // but if fields have IDs later we might need to regenerate them. 
      // Current interface Campo has simple string/value.
    }
    
    // Insert after current index
    const newSections = [...sections]
    newSections.splice(index + 1, 0, newSection)
    onChange(newSections)
  }

  return (
    <Box>
      {sections.map((section, sectionIndex) => (
        <Card 
          key={section.id} 
          sx={{ 
            mb: 2, 
            border: `1px solid ${theme.palette.divider}`,
            backgroundColor: section.tipo === 'tabla' 
              ? alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.08 : 0.04) 
              : 'background.paper'
          }}
        >
          <CardHeader
            sx={{
               backgroundColor: section.tipo === 'tabla' 
                 ? alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.12 : 0.08) 
                 : alpha(theme.palette.action.disabledBackground, 0.05),
               borderBottom: `1px solid ${theme.palette.divider}`,
               p: 1.5,
               '& .MuiCardHeader-action': { alignSelf: 'center' }
            }}
            title={
              <TextField
                value={section.titulo}
                onChange={(e) => handleSectionChange(section.id, { titulo: e.target.value })}
                size="small"
                fullWidth
                disabled={disabled}
                placeholder="Título de la sección"
                sx={{ 
                    fontWeight: 'bold',
                    '& .MuiInputBase-input': { fontWeight: 600, fontSize: '0.95rem' }
                }}
                variant="standard"
                InputProps={{ 
                    disableUnderline: true,
                    endAdornment: (
                        <InputAdornment position="end">
                            <i className="ri-pencil-line" style={{ color: theme.palette.text.secondary, fontSize: '1rem' }}></i>
                        </InputAdornment>
                    )
                }}
              />
            }
            action={
              <Box sx={{ display: 'flex', gap: 1 }}>
                  <IconButton 
                    onClick={() => handleDuplicateSection(sectionIndex)}
                    disabled={disabled}
                    title="Duplicar Sección"
                    size="small"
                    color="primary"
                  >
                    <i className="ri-file-copy-line"></i>
                  </IconButton>

                  <IconButton 
                    onClick={() => handleMoveSection(sectionIndex, 'up')}
                    disabled={disabled || sectionIndex === 0}
                    title="Mover Arriba"
                    size="small"
                  >
                    <i className="ri-arrow-up-line"></i>
                  </IconButton>

                  <IconButton 
                    onClick={() => handleMoveSection(sectionIndex, 'down')}
                    disabled={disabled || sectionIndex === sections.length - 1}
                    title="Mover Abajo"
                    size="small"
                  >
                    <i className="ri-arrow-down-line"></i>
                  </IconButton>

                  <IconButton 
                    onClick={() => handleRemoveSection(section.id)}
                    disabled={disabled}
                    color="error"
                    size="small"
                    title="Eliminar Sección"
                  >
                    <i className="ri-delete-bin-line"></i>
                  </IconButton>
              </Box>
            }
          />
          <CardContent sx={{ p: 2, pt: 4 }}>
            <Grid container spacing={2}>
              {section.campos.map((campo, fieldIndex) => (
                <React.Fragment key={fieldIndex}>
                  {section.tipo === 'tabla' && (
                    <Grid item xs={12} md={4}>
                      <TextField
                        label="Nombre del Campo"
                        value={campo.nombre}
                        onChange={(e) => handleFieldChange(section.id, fieldIndex, 'nombre', e.target.value)}
                        size="small"
                        fullWidth
                        disabled={disabled}
                        sx={{ bgcolor: 'background.paper' }}
                      />
                    </Grid>
                  )}
                  <Grid item xs={12} md={section.tipo === 'tabla' ? 6 : 9}>
                    <TextField
                      label={section.tipo === 'simple' ? campo.nombre : 'Contenido'}
                      value={campo.valor || ''}
                      onChange={(e) => handleFieldChange(section.id, fieldIndex, 'valor', e.target.value)}
                      size="small"
                      fullWidth
                      multiline={campo.nombre.toLowerCase() !== 'hora'}
                      rows={campo.nombre.toLowerCase() === 'hora' ? 1 : 2}
                      disabled={disabled}
                      sx={{ bgcolor: 'background.paper' }}
                    />
                     {campo.archivos && campo.archivos.length > 0 && (
                        <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                            {campo.archivos.map((fileOrUrl, idx) => {
                                const isFile = fileOrUrl instanceof File
                                const fileName = isFile ? fileOrUrl.name : (fileOrUrl as string).split('/').pop() || 'Archivo'
                                const fileUrl = isFile ? undefined : (fileOrUrl as string)

                                return (
                                    <Chip
                                        key={idx}
                                        label={fileName.length > 20 ? fileName.substring(0, 20) + '...' : fileName}
                                        component={isFile ? 'div' : 'a'}
                                        href={fileUrl}
                                        target={isFile ? undefined : "_blank"}
                                        clickable={!isFile}
                                        onDelete={disabled ? undefined : () => {
                                            const newFiles = campo.archivos?.filter((_, i) => i !== idx) || []
                                            onChange(sections.map(s => {
                                                if(s.id === section.id) {
                                                    return {
                                                        ...s,
                                                        campos: s.campos.map((c, i) => i === fieldIndex ? { ...c, archivos: newFiles } : c)
                                                    }
                                                }
                                                return s
                                            }))
                                        }}
                                        icon={<i className="ri-attachment-line"></i>}
                                        size="small"
                                        color={isFile ? "warning" : "primary"}
                                        variant="outlined"
                                        sx={isFile ? { borderColor: 'orange', color: 'orange' } : {}}
                                    />
                                )
                            })}
                        </Box>
                     )}
                  </Grid>
                  <Grid item xs={12} md={2} sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-end', gap: 1 }}>
                     <Button
                        component="label"
                        size="small"
                        variant="outlined"
                        disabled={disabled}
                        startIcon={<i className="ri-upload-2-line"></i>}
                        sx={{ minWidth: 'auto', px: 1 }}
                        title="Adjuntar archivo"
                     >
                        <input
                            type="file"
                            hidden
                            onChange={(e) => {
                                if (e.target.files && e.target.files[0]) {
                                    const file = e.target.files[0]
                                    const currentFiles = campo.archivos || []
                                    if (currentFiles.length >= 5) {
                                        toast.error('Máximo 5 archivos por campo')
                                        return
                                    }
                                    
                                    // Update state with Local File
                                    onChange(sections.map(s => {
                                        if(s.id === section.id) {
                                            return {
                                                ...s,
                                                campos: s.campos.map((c, i) => i === fieldIndex ? { ...c, archivos: [...currentFiles, file] } : c)
                                            }
                                        }
                                        return s
                                    }))
                                    toast.success('Archivo agregado (pendiente de guardar)')
                                    e.target.value = '' // Reset input
                                }
                            }}
                        />
                     </Button>
                    <IconButton
                      onClick={() => handleRemoveField(section.id, fieldIndex)}
                      disabled={disabled || section.campos.length === 1}
                      color="error"
                      size="small"
                    >
                      <i className="ri-close-line"></i>
                    </IconButton>
                  </Grid>
                </React.Fragment>
              ))}
              
              <Grid item xs={12}>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => handleAddField(section.id)}
                  disabled={disabled}
                  startIcon={<i className="ri-add-line"></i>}
                  sx={{ mt: 1 }}
                >
                  Agregar Campo
                </Button>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      ))}

      <Button
        variant="contained"
        onClick={handleAddSection}
        disabled={disabled}
        startIcon={<i className="ri-add-line"></i>}
        sx={{ mt: 2 }}
      >
        Agregar Sección
      </Button>
    </Box>
  )
}

export default DynamicSectionEditor
