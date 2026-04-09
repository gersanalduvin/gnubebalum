'use client'

import { Add, Delete, Description, Download, Edit, ExpandMore, InsertLink, OpenInNew } from '@mui/icons-material'
import {
    Accordion,
    AccordionDetails,
    AccordionSummary,
    Alert,
    Box,
    Button,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControl,
    FormControlLabel,
    IconButton,
    Radio,
    RadioGroup,
    TextField,
    Typography
} from '@mui/material'
import { useEffect, useState } from 'react'
import { toast } from 'react-hot-toast'
import { createResource, deleteResource, deleteResourceFile, getResources, Resource, updateResource } from '../services/resourcesService'

interface ResourcesTabProps {
    assignmentId: number;
    selectedCorte: number | '';
    cortes: any[];
    isLocked?: boolean;
}

const ResourcesTab = ({ assignmentId, selectedCorte, cortes, isLocked }: ResourcesTabProps) => {
    const [resources, setResources] = useState<Resource[]>([])
    const [loading, setLoading] = useState(false)
    
    // Modal State
    const [modalOpen, setModalOpen] = useState(false)
    const [saving, setSaving] = useState(false)
    const [editingResource, setEditingResource] = useState<Resource | null>(null)
    
    // Delete Confirmation State
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
    const [deleteTarget, setDeleteTarget] = useState<{ type: 'resource' | 'file'; id: number } | null>(null)
    const [deleting, setDeleting] = useState(false)
    
    const [formData, setFormData] = useState({
        titulo: '',
        descripcion: '',
        tipo: 'archivo' as 'archivo' | 'enlace',
        enlace: '',
        files: [] as File[],
        existingFiles: [] as any[] // For display during edit
    })

    const fetchResources = async () => {
        if (!assignmentId) return
        try {
            setLoading(true)
            const data = await getResources(assignmentId, selectedCorte === '' ? undefined : selectedCorte)
            setResources(data)
        } catch (error) {
            console.error(error)
            toast.error('Error al cargar recursos')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchResources()
    }, [assignmentId, selectedCorte])

    const handleOpenCreate = () => {
        setEditingResource(null)
        setFormData({
            titulo: '',
            descripcion: '',
            tipo: 'archivo',
            enlace: '',
            files: [],
            existingFiles: []
        })
        setModalOpen(true)
    }

    const handleOpenEdit = (resource: Resource) => {
        setEditingResource(resource)
        setFormData({
            titulo: resource.titulo,
            descripcion: resource.descripcion || '',
            tipo: resource.tipo,
            enlace: resource.tipo === 'enlace' ? resource.contenido : '',
            files: [],
            existingFiles: resource.archivos || []
        })
        setModalOpen(true)
    }

    const handleSave = async () => {
        if (!formData.titulo) {
            toast.error('El título es obligatorio')
            return
        }
        
        if (formData.tipo === 'archivo' && !editingResource) {
             if (formData.files.length === 0) {
                toast.error('Seleccione al menos un archivo')
                return
            }
        }
        
        if (formData.tipo === 'archivo') {
            if (formData.files.length > 5) {
                toast.error('Máximo 5 archivos permitidos')
                return
            }
            // Validate sizes
            for (const file of formData.files) {
                 if (file.size > 5 * 1024 * 1024) {
                     toast.error(`El archivo ${file.name} excede los 5MB`)
                     return
                 }
            }
        }

        if (formData.tipo === 'enlace' && !formData.enlace) {
            toast.error('Ingrese el enlace')
            return
        }

        try {
            setSaving(true)
            const data = new FormData()
            data.append('titulo', formData.titulo)
            data.append('descripcion', formData.descripcion || '')
            data.append('tipo', formData.tipo)
            
            // If editing, preserve corte unless user changes logic (here we use selectedCorte if creating, 
            // but for editing we might want to keep original or allow change. 
            // Requirement was auto-assign selectedCorte. 
            // For safety, let's keep original corte logic: default to selectedCorte for new, 
            // keep existing for edit unless we want to move it.
            // Simplified: Always use selectedCorte if provided, or current resource corte_id
            
            const corteId = editingResource?.corte_id || (selectedCorte ? String(selectedCorte) : '')
            if (corteId) data.append('corte_id', String(corteId))
            
            if (formData.tipo === 'archivo') {
                formData.files.forEach((file) => {
                    data.append('archivos[]', file)
                })
            } else {
                data.append('contenido', formData.enlace)
            }

            if (editingResource) {
                await updateResource(editingResource.id, data)
                toast.success('Recurso actualizado')
            } else {
                await createResource(assignmentId, data)
                toast.success('Recurso creado')
            }
            
            setModalOpen(false)
            fetchResources()
        } catch (error: any) {
            console.error(error)
            const msg = error?.response?.data?.message || 'Error al guardar recurso'
            toast.error(msg)
        } finally {
            setSaving(false)
        }
    }

    const getViewerUrl = (url: string, name: string) => {
        const ext = name.split('.').pop()?.toLowerCase() || ''
        const docs = ['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx']
        if (docs.includes(ext)) {
            return `https://view.officeapps.live.com/op/view.aspx?src=${encodeURIComponent(url)}`
        }
        return url
    }

    const handleDeleteFile = (fileId: number) => {
        setDeleteTarget({ type: 'file', id: fileId })
        setDeleteConfirmOpen(true)
    }

    const handleDelete = (id: number) => {
        setDeleteTarget({ type: 'resource', id: id })
        setDeleteConfirmOpen(true)
    }

    const executeDelete = async () => {
        if (!deleteTarget) return
        
        try {
            setDeleting(true)
            if (deleteTarget.type === 'resource') {
                await deleteResource(deleteTarget.id)
                toast.success('Recurso eliminado')
                setResources(prev => prev.filter(r => r.id !== deleteTarget.id))
            } else {
                await deleteResourceFile(deleteTarget.id)
                toast.success('Archivo eliminado')
                 setFormData(prev => ({
                    ...prev,
                    existingFiles: prev.existingFiles.filter(f => f.id !== deleteTarget.id)
                }))
                setResources(prev => prev.map(r => {
                    if (r.id === editingResource?.id) {
                        return {
                            ...r,
                            archivos: r.archivos?.filter(a => a.id !== deleteTarget.id)
                        }
                    }
                    return r
                }))
            }
            setDeleteConfirmOpen(false)
            setDeleteTarget(null)
        } catch (error) {
            console.error(error)
            toast.error('Error al eliminar')
        } finally {
            setDeleting(false)
        }
    }

    return (
        <Box sx={{ py: 2 }}>
            {isLocked && (
               <Box mb={2}>
                   <Alert severity="warning">
                       Periodo cerrado. No se pueden agregar, editar ni eliminar materiales.
                   </Alert>
               </Box>
            )}

            <Box mb={2} display="flex" justifyContent="flex-end">
                <Button 
                    variant="contained" 
                    startIcon={<Add />} 
                    disabled={isLocked}
                    onClick={handleOpenCreate}
                >
                    Agregar Material
                </Button>
            </Box>

            {loading ? (
                <Box display='flex' justifyContent='center' my={4}><CircularProgress /></Box>
            ) : (
                <Box>
                    {resources.length === 0 && (
                        <Typography textAlign="center" color="text.secondary" my={4}>
                            No hay materiales publicados.
                        </Typography>
                    )}
                    {resources.map(resource => (
                        <Accordion key={resource.id} disableGutters elevation={2} sx={{ mb: 1, '&:before': { display: 'none' } }}>
                            <AccordionSummary expandIcon={<ExpandMore />}>
                                <Box display="flex" alignItems="center" gap={2} width="100%">
                                    {resource.tipo === 'archivo' ? <Description color="primary" /> : <InsertLink color="info" />}
                                    <Typography fontWeight="bold">{resource.titulo}</Typography>
                                    
                                    <Box flexGrow={1} />
                                    
                                    {!isLocked && (
                                        <Box onClick={e => e.stopPropagation()} display="flex" gap={1}>
                                             <IconButton component="div" size="small" onClick={() => handleOpenEdit(resource)} color="primary">
                                                <Edit fontSize="small" />
                                             </IconButton>
                                             <IconButton component="div" size="small" onClick={() => handleDelete(resource.id)} color="error">
                                                <Delete fontSize="small" />
                                             </IconButton>
                                        </Box>
                                    )}
                                </Box>
                            </AccordionSummary>
                            <AccordionDetails sx={{ borderTop: '1px solid #eee', pt: 2 }}>
                                {resource.descripcion && (
                                    <Typography variant="body1" paragraph>
                                        {resource.descripcion}
                                    </Typography>
                                )}
                                
                                <Typography variant="caption" display="block" color="text.secondary" gutterBottom>
                                    Publicado el {new Date(resource.created_at).toLocaleDateString()}
                                </Typography>

                                <Box mt={2}>
                                    {resource.tipo === 'archivo' && resource.archivos ? (
                                        <Box display="flex" flexDirection="column" gap={1} alignItems="flex-start">
                                            {resource.archivos.map((file, idx) => (
                                                <Button 
                                                    key={idx}
                                                    variant="outlined"
                                                    startIcon={<Download />}
                                                    href={getViewerUrl(file.url, file.nombre_original)}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                >
                                                    {file.nombre_original} ({(file.size / 1024).toFixed(1)} KB)
                                                </Button>
                                            ))}
                                        </Box>
                                    ) : (
                                        <Button 
                                            variant="contained" 
                                            startIcon={<OpenInNew />}
                                            href={resource.contenido}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                        >
                                            Abrir Enlace / Video
                                        </Button>
                                    )}
                                </Box>
                            </AccordionDetails>
                        </Accordion>
                    ))}
                </Box>
            )}

            {/* Create/Edit Modal */}
            <Dialog open={modalOpen} onClose={() => setModalOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>{editingResource ? 'Editar Material' : 'Agregar Material de Clase'}</DialogTitle>
                <DialogContent>
                    <Box display="flex" flexDirection="column" gap={2} mt={1}>
                        <TextField 
                            label="Título" 
                            fullWidth 
                            value={formData.titulo}
                            onChange={e => setFormData({...formData, titulo: e.target.value})}
                        />
                         <TextField 
                            label="Descripción (Opcional)" 
                            fullWidth 
                            multiline
                            rows={2}
                            value={formData.descripcion}
                            onChange={e => setFormData({...formData, descripcion: e.target.value})}
                        />

                        <FormControl component="fieldset">
                             <Typography variant="body2" color="text.secondary" gutterBottom>Tipo de Recurso</Typography>
                             <RadioGroup 
                                row 
                                value={formData.tipo}
                                onChange={e => setFormData({...formData, tipo: e.target.value as any})}
                             >
                                 <FormControlLabel value="archivo" control={<Radio />} label="Archivo" />
                                 <FormControlLabel value="enlace" control={<Radio />} label="Enlace / Video" />
                             </RadioGroup>
                        </FormControl>

                        {formData.tipo === 'archivo' ? (
                            <Box>
                                {formData.existingFiles.length > 0 && (
                                    <Box mb={2}>
                                        <Typography variant="caption" color="text.secondary">Archivos existentes:</Typography>
                                        {formData.existingFiles.map((f, i) => (
                                            <Box key={f.id || i} display="flex" alignItems="center" justifyContent="space-between">
                                                <Typography variant="body2" noWrap sx={{ maxWidth: '85%' }}>• {f.nombre_original}</Typography>
                                                <IconButton size="small" color="error" onClick={() => handleDeleteFile(f.id)}>
                                                    <Delete fontSize="small" />
                                                </IconButton>
                                            </Box>
                                        ))}
                                    </Box>
                                )}

                                <Button
                                    variant="outlined"
                                    component="label"
                                    startIcon={<Description />}
                                >
                                    {editingResource ? 'Agregar/Reemplazar Archivos (Max 5)' : 'Seleccionar Archivos (Max 5)'}
                                    <input
                                        type="file"
                                        multiple
                                        hidden
                                        accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png"
                                        onChange={e => {
                                            if (e.target.files) {
                                                const files = Array.from(e.target.files)
                                                if (files.length > 5) {
                                                    toast.error('Máximo 5 archivos')
                                                    return
                                                }
                                                setFormData({...formData, files})
                                            }
                                        }}
                                    />
                                </Button>
                                <Box mt={1} display="flex" flexDirection="column" gap={0.5}>
                                    {formData.files.map((f, i) => (
                                        <Typography key={i} variant="caption" display="block">
                                            NUEVO: {f.name} ({(f.size / 1024 / 1024).toFixed(2)} MB)
                                        </Typography>
                                    ))}
                                </Box>
                            </Box>
                        ) : (
                            <TextField 
                                label="URL del Enlace" 
                                fullWidth 
                                placeholder="https://..."
                                value={formData.enlace}
                                onChange={e => setFormData({...formData, enlace: e.target.value})}
                            />
                        )}
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setModalOpen(false)} color="inherit">Cancelar</Button>
                    <Button onClick={handleSave} variant="contained" disabled={saving}>
                        {saving ? 'Guardando...' : 'Guardar'}
                    </Button>
                </DialogActions>
            </Dialog>

             {/* Delete Confirmation Modal */}
             <Dialog open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)} maxWidth="xs" fullWidth>
                <DialogTitle>Confirmar Eliminación</DialogTitle>
                <DialogContent>
                    <Typography>
                        {deleteTarget?.type === 'resource' 
                            ? '¿Está seguro de que desea eliminar este recurso completamente? Esta acción no se puede deshacer.'
                            : '¿Está seguro de que desea eliminar este archivo? Esta acción no se puede deshacer.'}
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteConfirmOpen(false)} color="inherit" disabled={deleting}>Cancelar</Button>
                    <Button onClick={executeDelete} variant="contained" color="error" disabled={deleting}>
                        {deleting ? 'Eliminando...' : 'Eliminar'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    )
}

export default ResourcesTab
