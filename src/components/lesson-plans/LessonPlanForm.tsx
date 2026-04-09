'use client'

import {
    Box,
    Button,
    Card,
    CardContent,
    CardHeader,
    CircularProgress,
    Divider,
    FormControl,
    FormControlLabel,
    Grid,
    InputLabel,
    MenuItem,
    Select,
    Switch,
    TextField,
    Typography
} from '@mui/material'
import React, { useEffect, useRef, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { toast } from 'react-hot-toast'

import { createLessonPlan, LessonPlan, updateLessonPlan } from '@/services/lessonPlanService'
import DynamicSectionEditor from './DynamicSectionEditor'
import { getGeneralTemplate, getInicialTemplate, getPrimariaTemplate, type Section } from './lessonPlanTemplates'

interface LessonPlanFormProps {
  initialData?: LessonPlan
  onSuccess?: () => void
  onCancel?: () => void
  // Catalog data passed from parent for performance
  periodos?: any[]
  parciales?: any[]
  asignaturas?: any[]
  grupos?: any[] 
  isEdit?: boolean
  canViewAll?: boolean
}

const LessonPlanForm: React.FC<LessonPlanFormProps> = ({ 
  initialData, 
  onSuccess, 
  onCancel,
  periodos = [],
  parciales = [],
  asignaturas = [],
  grupos = [],
  isEdit = false,
  canViewAll = false
}) => {
  // Auto-find active period for teachers
  const activePeriodId = periodos.find(p => p.periodo_nota)?.id || periodos.find(p => p.estado === 'Activo')?.id

  const [usePdf, setUsePdf] = useState(!!initialData?.archivo_url)
  const [nivel, setNivel] = useState<'inicial' | 'primaria'>(initialData?.nivel || 'primaria')
  const [isLoading, setIsLoading] = useState(false)
  const [sections, setSections] = useState<Section[]>([])
  const [filteredGrupos, setFilteredGrupos] = useState<any[]>(grupos)
  
  // Track submit mode (draft vs final)
  const submitActionRef = useRef<'draft' | 'submit'>('submit')
  
  // New State for Group-First Filtering
  const [selectedGroupId, setSelectedGroupId] = useState<number | ''>('')

  // Calculate default partial based on current date
  const defaultParcialId = parciales.find(p => {
    try {
        const now = new Date();
        const start = new Date(p.fecha_inicio_corte);
        const end = new Date(p.fecha_fin_corte);
        return now >= start && now <= end;
    } catch (e) { return false; }
  })?.id || parciales[0]?.id

  // Initialize sections from initialData or template
  useEffect(() => {
    if (initialData?.contenido) {
      const content = initialData.contenido as any
      if (content.secciones && Array.isArray(content.secciones)) {
        setSections(content.secciones)
      } else {
        // Load template based on nivel
        const template = nivel === 'inicial' ? getInicialTemplate() : getGeneralTemplate()
        setSections(template.secciones)
      }
    } else {
      // Load template for new plans
      const template = nivel === 'inicial' ? getInicialTemplate() : getGeneralTemplate()
      setSections(template.secciones)
    }
  }, [initialData, nivel])

  const { control, handleSubmit, watch, setValue, register, getValues, formState: { errors } } = useForm({
    defaultValues: {
      periodo_lectivo_id: initialData?.periodo_lectivo_id || activePeriodId || '',
      parcial_id: initialData?.parcial_id || defaultParcialId || '',
      asignatura_id: initialData?.asignatura_id || '',
      groups: initialData?.groups ? initialData.groups.map((g: any) => typeof g === 'object' ? g.id : g) : [],
      nivel: initialData?.nivel || 'primaria',
      start_date: initialData?.start_date || null,
      end_date: initialData?.end_date || null,
      tiempo: (initialData?.contenido as any)?.tiempo || '',
      objetivo: (initialData?.contenido as any)?.objetivo || '',
      contenido_principal: (initialData?.contenido as any)?.contenido_principal || '',
      valor: (initialData?.contenido as any)?.valor || '',
      tema_motivador: (initialData?.contenido as any)?.tema_motivador || '',
      file: null
    }
  })

  // Ensure period is set if teacher
  useEffect(() => {
    if (!canViewAll && !initialData && activePeriodId) {
        setValue('periodo_lectivo_id', activePeriodId)
    }
  }, [canViewAll, initialData, activePeriodId, setValue])

  // Watch Nivel to switch form fields
  const watchedNivel = watch('nivel')
  const watchedPeriodo = watch('periodo_lectivo_id')
  const watchedAsignatura = watch('asignatura_id')
  
  // Update state when watch changes to render correct fields
  useEffect(() => {
    setNivel(watchedNivel as 'inicial' | 'primaria')
  }, [watchedNivel])

  // Filter grupos based on selected asignatura and period
  useEffect(() => {
    let result = grupos

    // 1. Filter by Periodo Lectivo
    if (watchedPeriodo) {
        result = result.filter((g: any) => {
            // Check if backend returns periodo_lectivo_id directly or nested
            return g.periodo_lectivo_id == watchedPeriodo
        })
    }

    // 2. Filter by Asignatura/Grado
    if (watchedAsignatura && watchedAsignatura !== 0 && asignaturas.length > 0) {
      const selectedAsignatura = asignaturas.find((a: any) => a.id === Number(watchedAsignatura))
      
      if (selectedAsignatura) {
        result = result.filter((g: any) => g.grado_id === selectedAsignatura.grado_id)
      }
    } else if (selectedGroupId) {
         // If no subject selected yet, but Group Filter is active, show only that group (or groups of same grade?)
         // User wants to select Group -> Subject.
         // But the "Multi Select" at bottom shows targets.
         // If I select Group A, I likely want to assign to Group A.
         // So let's filter the multi-select to shows groups valid for the Filtered Scope (which is just that group or grade?)
         // Let's filter by the selected group's grade to allow multi-group assignment within same grade
         const selectedGroup = grupos.find(g => g.id === selectedGroupId)
         if(selectedGroup) {
             result = result.filter((g: any) => g.grado_id === selectedGroup.grado_id)
         }
    }

    // 3. Deduplicate by Name (to avoid "1 GRADO - A" appearing twice if data inconsistency exists)
    // We keep the first occurrence of each name
    const uniqueMap = new Map();
    result.forEach((g: any) => {
        const name = g.nombre || `${g.grado?.nombre || ''} ${g.seccion?.nombre || ''}`
        if (!uniqueMap.has(name)) {
            uniqueMap.set(name, g);
        }
    });
    const uniqueResult = Array.from(uniqueMap.values());

    setFilteredGrupos(uniqueResult)
    
    // Clear selected groups if they don't match the new filter
    // We need to keep groups that are in the new filtered list (by ID is ideal, but if IDs changed due to dedup, we might lose selection if we selected the "duplicate" one)
    // However, since we select by ID, if the user selected ID 100 (duplicate A) and we kept ID 101 (duplicate B), the selection is lost.
    // This is acceptable behavior for "fixing" duplicates.
    const currentGroups = watch('groups') || []
    const validGroups = currentGroups.filter((gid: number) => 
      uniqueResult.some((g: any) => g.id === gid)
    )
    
    // Only update if selection changed size (avoid infinite loop)
    // But wait, if we deduped, we might have removed the selected ID.
    // If the user hasn't selected anything yet, it's fine.
    // If they have, we might clear it. Use strict check.
    if (currentGroups.length > 0 && validGroups.length !== currentGroups.length) {
       setValue('groups', validGroups)
    }

  }, [watchedAsignatura, watchedPeriodo, asignaturas, grupos, setValue, watch])

  // Initial Content structure if empty
  useEffect(() => {
      if(!initialData && !isEdit) {
          if(nivel === 'inicial') {
              // Initialize empty fields for Inicial
          }
      }
  }, [nivel])

  const onSubmit = async (formData: any) => {
    setIsLoading(true)
    try {
        const isSubmitted = submitActionRef.current === 'submit'

        const payload = {
          ...formData,
          is_submitted: isSubmitted,
          contenido: {
            objetivo: formData.objetivo || '',
            contenido_principal: formData.contenido_principal || '',
            valor: formData.valor || '', // New field
            tema_motivador: formData.tema_motivador || '', // New field
            tiempo: formData.tiempo || '',
            secciones: sections
          }
        }
      
      if (isEdit && initialData?.id) {
        await updateLessonPlan(initialData.id, payload)
        toast.success(isSubmitted ? 'Plan actualizado y enviado' : 'Borrador actualizado')
      } else {
        await createLessonPlan(payload)
        toast.success(isSubmitted ? 'Plan creado y enviado' : 'Borrador guardado')
      }
      if (onSuccess) onSuccess()
    } catch (error: any) {
      console.error(error)
      toast.error(error?.message || 'Error al guardar el plan')
    } finally {
      setIsLoading(false)
    }
  }

  const loadTemplate = (templateNivel: 'inicial' | 'primaria' | 'general') => {
    let template;
    if (templateNivel === 'inicial') template = getInicialTemplate();
    else if (templateNivel === 'general') template = getGeneralTemplate();
    else template = getPrimariaTemplate();

    setSections(template.secciones)
    setValue('objetivo', template.objetivo)
    setValue('contenido_principal', template.contenido_principal)
    if (templateNivel === 'inicial') {
        setValue('valor', template.valor || '')
        setValue('tema_motivador', template.tema_motivador || '')
    }
    toast.success(`Plantilla cargada`)
  }

  return (
    <Card>
      <CardHeader 
        title={isEdit ? "Editar Plan de Clase" : "Nuevo Plan de Clase"} 
        action={
            <FormControlLabel
                control={<Switch checked={usePdf} onChange={(e: any) => setUsePdf(e.target.checked)} />}
                label="Subir PDF"
            />
        }
      />
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)}>
          <Grid container spacing={3}>
            {/* Header Fields - Row 1 */}
            <Grid item xs={12} md={3} sx={{ display: 'none' }}>
                <FormControl fullWidth size="small">
                    <InputLabel>Periodo Lectivo</InputLabel>
                    <Controller
                        name="periodo_lectivo_id"
                        control={control}
                        rules={{ required: true }}
                        render={({ field }) => (
                            <Select {...field} label="Periodo Lectivo" error={!!errors.periodo_lectivo_id}>
                                {periodos.map(p => <MenuItem key={p.id} value={p.id}>{p.nombre}</MenuItem>)}
                            </Select>
                        )}
                    />
                </FormControl>
            </Grid>
            <Grid item xs={12} md={3} sx={{ display: 'none' }}>
                <FormControl fullWidth size="small">
                    <InputLabel>Corte / Parcial</InputLabel>
                    <Controller
                        name="parcial_id"
                        control={control}
                        rules={{ required: true }}
                        render={({ field }) => (
                            <Select {...field} label="Corte / Parcial" error={!!errors.parcial_id}>
                                 {parciales.map(p => <MenuItem key={p.id} value={p.id}>{p.nombre || `Corte ${p.orden || ''}`}</MenuItem>)}
                            </Select>
                        )}
                    />
                </FormControl>
            </Grid>
             <Grid item xs={12} md={3}>
                <FormControl fullWidth size="small">
                    <InputLabel>Grupo</InputLabel>
                    <Controller
                        name="groups"
                        control={control}
                        rules={{ required: true }}
                        render={({ field }) => (
                            <Select 
                                {...field}
                                value={field.value?.[0] || ''} 
                                label="Grupo"
                                onChange={(e) => {
                                    const gid = Number(e.target.value)
                                    // Set as array for backend compatibility
                                    field.onChange(gid ? [gid] : [])
                                    // Reset subject to force re-selection
                                    setValue('asignatura_id', '') 
                                }}
                            >
                                <MenuItem value=""><em>Seleccione un grupo...</em></MenuItem>
                                {grupos.map(g => (
                                     <MenuItem key={g.id} value={g.id}>
                                        {g.nombre || `${g.grado?.nombre || ''} ${g.seccion?.nombre || ''}`}
                                    </MenuItem>
                                ))}
                            </Select>
                        )}
                    />
                </FormControl>
            </Grid>

             <Grid item xs={12} md={3}>
                <FormControl fullWidth size="small">
                    <InputLabel>Asignatura</InputLabel>
                    <Controller
                        name="asignatura_id"
                        control={control}
                        rules={{ required: true }}
                        render={({ field }) => {
                            // Filter Asignaturas based on Selected Group Grade
                            // We use the current value of 'groups' (array) to find the selected group
                            const currentGroups = getValues('groups')
                            const selectedGroupId = currentGroups?.[0]
                            
                            let filteredAsignaturas = asignaturas
                            if (selectedGroupId) {
                                const selectedGroup = grupos.find(g => g.id === selectedGroupId)
                                if (selectedGroup) {
                                    filteredAsignaturas = asignaturas.filter(a => a.grado_id === selectedGroup.grado_id)
                                }
                            }

                            return (
                                <Select {...field} label="Asignatura" error={!!errors.asignatura_id}>
                                    <MenuItem value={0}><em>Todas las asignaturas (General)</em></MenuItem>
                                    {filteredAsignaturas.map(a => (
                                        <MenuItem key={a.id} value={a.id}>
                                            {a.materia?.nombre || 'Sin nombre'} {a.grado_nombre ? `(${a.grado_nombre})` : ''}
                                        </MenuItem>
                                    ))}
                                </Select>
                            )
                        }}
                    />
                </FormControl>
            </Grid>
            
            <Grid item xs={12} md={3}>
                <FormControl fullWidth size="small">
                    <InputLabel>Nivel</InputLabel>
                     <Controller
                        name="nivel"
                        control={control}
                        render={({ field }) => (
                            <Select {...field} label="Nivel">
                                <MenuItem value="primaria">Primaria</MenuItem>
                                <MenuItem value="inicial">Educación Inicial</MenuItem>
                            </Select>
                        )}
                    />
                </FormControl>
            </Grid>
             <Grid item xs={12} md={3}>
                  <FormControl fullWidth size="small">
                    <Typography variant="caption" sx={{ mb: 0.5, fontWeight: 'bold', color: 'text.secondary' }}>
                        Fecha de Inicio
                    </Typography>
                    <Controller
                        name="start_date"
                        control={control}
                         rules={{ required: true }}
                        render={({ field }) => (
                            <TextField 
                                {...field} 
                                type="date" 
                                size="small" 
                                error={!!errors.start_date}
                                value={field.value ? String(field.value).split('T')[0] : ''}
                            />
                        )}
                    />
                </FormControl>
            </Grid>
             <Grid item xs={12} md={3}>
                  <FormControl fullWidth size="small">
                    <Typography variant="caption" sx={{ mb: 0.5, fontWeight: 'bold', color: 'text.secondary' }}>
                        Duración / Tiempo
                    </Typography>
                    <Controller
                        name="tiempo"
                        control={control}
                        render={({ field }) => (
                            <TextField 
                                {...field} 
                                size="small" 
                                value={field.value ?? ''}
                                placeholder="Ej: 2 horas"
                            />
                        )}
                    />
                </FormControl>
            </Grid>

             {/* Valor Field - Initially only for Inicial but maybe useful for others? Reqs specify for Inicial */}




            <Grid item xs={12}>
                {(usePdf || watchedAsignatura === 0) ? (
                    <Box sx={{ p: 3, border: (theme) => `2px dashed ${theme.palette.divider}`, borderRadius: 2, textAlign: 'center' }}>
                         <Typography variant="body1" gutterBottom>
                            Subir Archivo del Plan (PDF, Imagen, Documento)
                        </Typography>
                        <input 
                            accept=".pdf,image/*,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip" 
                            type="file" 
                            onChange={(e) => {
                                if (e.target.files && e.target.files.length > 0) {
                                    setValue('file', e.target.files[0] as any, { shouldValidate: true, shouldDirty: true })
                                }
                            }}
                            style={{ display: 'block', margin: '0 auto' }}
                        />

                         {initialData?.archivo_url && (
                             <Box sx={{ 
                                mt: 2, 
                                p: 2, 
                                border: '1px dashed', 
                                borderColor: 'primary.main', 
                                borderRadius: 1, 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'center', 
                                gap: 1, 
                                bgcolor: 'action.hover'
                             }}>
                                 <i className="ri-file-text-line" style={{ fontSize: '1.5rem' }}></i>
                                 <Box>
                                     <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                                         Archivo actualmente adjunto
                                     </Typography>
                                     <Button 
                                        component="a" 
                                        href={initialData.file_full_url || initialData.archivo_url} 
                                        target="_blank" 
                                        rel="noreferrer"
                                        size="small"
                                        variant="outlined"
                                        sx={{ mt: 0.5 }}
                                        startIcon={<i className="ri-eye-line"></i>}
                                    >
                                        Ver Archivo
                                    </Button>
                                 </Box>
                             </Box>
                         )}
                    </Box>
                ) : (
                    <>
                        <Divider sx={{ my: 2 }}>Contenido del Plan</Divider>
                        
                        {/* Common Fields - Hidden for Primaria */}
                        {nivel !== 'primaria' && (
                            <Grid container spacing={2} sx={{ mb: 3 }}>
                                {nivel === 'inicial' && (
                                    <Grid item xs={12}>
                                        <Controller
                                            name="valor"
                                            control={control}
                                            render={({ field }) => (
                                                <TextField 
                                                    {...field} 
                                                    label="Valor"
                                                    fullWidth 
                                                    size="small"
                                                    value={field.value ?? ''}
                                                />
                                            )}
                                        />
                                    </Grid>
                                )}
                                <Grid item xs={12}>
                                    <Controller
                                        name="objetivo"
                                        control={control}
                                        render={({ field }) => (
                                            <TextField 
                                                {...field} 
                                                label={nivel === 'inicial' ? "Aprendizajes Esperado" : "Objetivo / Aprendizaje Esperado"}
                                                fullWidth 
                                                multiline 
                                                rows={2}
                                                size="small"
                                                value={field.value ?? ''}
                                            />
                                        )}
                                    />
                                </Grid>
                                {nivel === 'inicial' && (
                                    <Grid item xs={12}>
                                        <Controller
                                            name="tema_motivador"
                                            control={control}
                                            render={({ field }) => (
                                                <TextField 
                                                    {...field} 
                                                    label="Tema motivador"
                                                    fullWidth 
                                                    size="small"
                                                    value={field.value ?? ''}
                                                />
                                            )}
                                        />
                                    </Grid>
                                )}
                                {nivel !== 'inicial' && (
                                    <Grid item xs={12}>
                                        <Controller
                                            name="contenido_principal"
                                            control={control}
                                            render={({ field }) => (
                                                <TextField 
                                                    {...field} 
                                                    label="Contenido Principal / Tema" 
                                                    fullWidth 
                                                    multiline 
                                                    rows={2}
                                                    size="small"
                                                    value={field.value ?? ''}
                                                />
                                            )}
                                        />
                                    </Grid>
                                )}
                            </Grid>
                        )}

                        {nivel !== 'inicial' && (
                            <Box sx={{ mb: 2, display: 'flex', gap: 2 }}>
                                {nivel !== 'primaria' && (
                                    <Button
                                        variant="outlined"
                                        size="small"
                                        onClick={() => loadTemplate('inicial')}
                                        startIcon={<i className="ri-file-list-line"></i>}
                                    >
                                        Cargar Plantilla Inicial
                                    </Button>
                                )}
                                <Button
                                    variant="outlined"
                                    size="small"
                                    onClick={() => loadTemplate('general')}
                                    startIcon={<i className="ri-file-list-line"></i>}
                                >
                                    Cargar Plantilla General
                                </Button>
                                <Button
                                    variant="outlined"
                                    size="small"
                                    onClick={() => loadTemplate('primaria')}
                                    startIcon={<i className="ri-calculator-line"></i>}
                                >
                                    Cargar Plantilla Matemática
                                </Button>
                            </Box>
                        )}

                        {/* Dynamic Sections */}
                        <DynamicSectionEditor
                            sections={sections}
                            onChange={setSections}
                            disabled={isLoading}
                        />
                    </>
                )}
            </Grid>

            <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
                <Button variant="outlined" color="secondary" onClick={onCancel}>
                    Cancelar
                </Button>
                <Box sx={{ display: 'flex', gap: 2 }}>
                    <Button 
                        type="submit"
                        variant="outlined" 
                        onClick={() => { submitActionRef.current = 'draft' }}
                        disabled={isLoading}
                    >
                        {isLoading ? <CircularProgress size={24} /> : 'Guardar como Borrador'}
                    </Button>
                    <Button 
                        type="submit" 
                        variant="contained" 
                        disabled={isLoading}
                        onClick={() => { submitActionRef.current = 'submit' }}
                    >
                        {isLoading ? <CircularProgress size={24} /> : (isEdit ? 'Actualizar y Enviar' : 'Enviar Plan')}
                    </Button>
                </Box>
            </Grid>
          </Grid>
        </form>
      </CardContent>
    </Card>
  )
}

export default LessonPlanForm
