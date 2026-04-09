'use client'

import { PermissionGuard } from '@/components/PermissionGuard'
import { usePermissions } from '@/hooks/usePermissions'
import scheduleSubjectService from '@/services/scheduleSubjectService'
import { Refresh as RefreshIcon, Save as SaveIcon, Search as SearchIcon } from '@mui/icons-material'
import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    Checkbox,
    CircularProgress,
    IconButton,
    MenuItem,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    Tooltip,
    Typography
} from '@mui/material'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'react-hot-toast'

interface Item {
    id: number
    periodo_lectivo?: { id: number; nombre: string }
    grado?: { id: number; nombre: string }
    materia?: { id: number; nombre: string; abreviatura?: string }
    escala?: { id: number; nombre: string }
    horas_semanales?: number
    minutos?: number
    bloque_continuo?: number
    [key: string]: any
}

interface Filters {
    periodo_lectivo_id?: string
    grado_id?: string
    materia?: string
}

export default function ScheduleSubjectConfigPage() {
    const { hasPermission } = usePermissions()
    const [periodos, setPeriodos] = useState<any[]>([])
    const [grados, setGrados] = useState<any[]>([])
    
    const [filters, setFilters] = useState<Filters>({})
    const [items, setItems] = useState<Item[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    
    // Store changes locally
    const [editingItems, setEditingItems] = useState<{ [id: number]: Item }>({})
    const [isSavingAll, setIsSavingAll] = useState(false)

    // Refs for keyboard navigation: [itemId]-[field]
    const inputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({})

    const canQuery = useMemo(() => Boolean(filters.periodo_lectivo_id && filters.grado_id), [filters])
    const canEdit = hasPermission('horarios.asignaturas.edit')

    const loadCatalogs = useCallback(async () => {
        try {
            const data = await scheduleSubjectService.getPeriodosYGrados()
            setPeriodos(Array.isArray(data.periodos) ? data.periodos : [])
            setGrados(Array.isArray(data.grados) ? data.grados : [])
        } catch (error: any) {
            console.error(error)
            toast.error('Error al cargar catálogos')
        }
    }, [])

    const loadItems = useCallback(async () => {
        if (!canQuery) return
        setLoading(true)
        setError(null)
        try {
            const params = new URLSearchParams()
            if (filters.periodo_lectivo_id) params.set('periodo_lectivo_id', filters.periodo_lectivo_id)
            if (filters.grado_id) params.set('grado_id', filters.grado_id)
            if (filters.materia) params.set('materia', filters.materia)
            
            params.set('per_page', '100') 

            const data = await scheduleSubjectService.list(params)
            const list = Array.isArray(data?.data) ? data.data : []
            setItems(list)
            setEditingItems({}) 
        } catch (error: any) {
             const message = error?.data?.message || 'Error al cargar asignaturas'
             setError(message)
             toast.error(message)
             setItems([])
        } finally {
            setLoading(false)
        }
    }, [canQuery, filters])

    useEffect(() => {
        loadCatalogs()
    }, [loadCatalogs])

    useEffect(() => {
        if (canQuery) {
            loadItems()
        } else {
            setItems([])
        }
    }, [canQuery, filters.periodo_lectivo_id, filters.grado_id, loadItems])

    const handleLocalChange = (id: number, field: 'horas_semanales' | 'minutos' | 'bloque_continuo' | 'compartida', value: string | boolean) => {
        let val: number | boolean;
        
        if (typeof value === 'string') {
             const numValue = value === '' ? 0 : Number(value)
             if (isNaN(numValue)) return
             val = numValue
        } else {
            val = value
        }

        setEditingItems(prev => {
            const currentItem = prev[id] || items.find(i => i.id === id) || {} as Item
            // Ensure we are strict with the type assignment based on the field
            const updatedItem = {
                ...currentItem,
                id,
                [field]: val
            }
            // Force cast to Item because [field]: val is generic
            return {
                ...prev,
                [id]: updatedItem as Item
            }
        })
    }

    const getDisplayValue = (item: Item, field: 'horas_semanales' | 'minutos' | 'bloque_continuo' | 'compartida') => {
        if (editingItems[item.id] && editingItems[item.id][field] !== undefined) {
             return editingItems[item.id][field]
        }
        if (field === 'compartida') {
            return item[field] || false 
        }
        return item[field] || 0
    }

    const handleKeyDown = (e: React.KeyboardEvent, currentIndex: number, field: string) => {
        if (e.key === 'ArrowUp') {
            e.preventDefault()
            const prevIndex = currentIndex - 1
            if (prevIndex >= 0) {
                const prevItem = items[prevIndex]
                inputRefs.current[`${prevItem.id}-${field}`]?.focus()
                inputRefs.current[`${prevItem.id}-${field}`]?.select()
            }
        } else if (e.key === 'ArrowDown') {
            e.preventDefault()
            const nextIndex = currentIndex + 1
            if (nextIndex < items.length) {
                const nextItem = items[nextIndex]
                inputRefs.current[`${nextItem.id}-${field}`]?.focus()
                inputRefs.current[`${nextItem.id}-${field}`]?.select()
            }
        }
    }

    const saveAll = async () => {
        const idsToUpdate = Object.keys(editingItems).map(Number)
        if (idsToUpdate.length === 0) {
            toast('No hay cambios pendientes')
            return
        }

        setIsSavingAll(true)
        let errors = 0
        
        // We could do Promise.all but serial is safer for backend load if many items
        // Or specific bulk endpoint which we don't have yet.
        // Let's do Promise.all for speed, concurrency 5?
        // Simple Promise.all for now as lists are usually < 20 items per grade.
        
        try {
            const promises = idsToUpdate.map(async (id) => {
                const changes = editingItems[id]
                // Merge with original to be safe but service cleans payload now
                const original = items.find(i => i.id === id) || {}
                const payload = { ...original, ...changes }
                return scheduleSubjectService.update(id, payload)
            })

            await Promise.all(promises)
            toast.success('Cambios guardados correctamente')
            
            // Update main list
            setItems(prev => prev.map(item => editingItems[item.id] ? { ...item, ...editingItems[item.id] } : item))
            setEditingItems({})

        } catch (error) {
            console.error(error)
            toast.error('Ocurrió un error al guardar algunos registros')
            errors++
        } finally {
            setIsSavingAll(false)
        }
    }

    const hasChanges = Object.keys(editingItems).length > 0

    return (
        <PermissionGuard permission="horarios.asignaturas.index">
            <Box sx={{ p: 3, pb: 10, position: 'relative', minHeight: '80vh' }}>
                <Box sx={{ mb: 3 }}>
                    <Typography variant='h4' component='h1' gutterBottom>
                        Configuración de Horarios
                    </Typography>
                    <Typography variant='body1' color='text.secondary'>
                        Asignación de horas semanales y bloques continuos por materia
                    </Typography>
                </Box>

                <Card sx={{ mb: 3 }}>
                    <CardContent>
                        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
                             <TextField
                                select
                                size='small'
                                label='Periodo Lectivo'
                                value={filters.periodo_lectivo_id || ''}
                                onChange={e => setFilters(prev => ({ ...prev, periodo_lectivo_id: e.target.value }))}
                                sx={{ minWidth: 200 }}
                            >
                                <MenuItem value=''>Seleccione...</MenuItem>
                                {periodos.map(p => (
                                    <MenuItem key={p.id} value={String(p.id)}>
                                        {p.nombre || p.label || p.id}
                                    </MenuItem>
                                ))}
                            </TextField>

                            <TextField
                                select
                                size='small'
                                label='Grado'
                                value={filters.grado_id || ''}
                                onChange={e => setFilters(prev => ({ ...prev, grado_id: e.target.value }))}
                                sx={{ minWidth: 200 }}
                            >
                                <MenuItem value=''>Seleccione...</MenuItem>
                                {grados.map(g => (
                                    <MenuItem key={g.id} value={String(g.id)}>
                                        {g.nombre || g.label || g.id}
                                    </MenuItem>
                                ))}
                            </TextField>

                             <TextField
                                size='small'
                                placeholder='Buscar materia...'
                                value={filters.materia || ''}
                                onChange={e => setFilters(prev => ({ ...prev, materia: e.target.value }))}
                                sx={{ minWidth: 250, flexGrow: 1 }}
                                InputProps={{
                                    startAdornment: <SearchIcon color="action" sx={{ mr: 1 }} />
                                }}
                            />
                            
                            <Tooltip title="Recargar">
                                <span>
                                    <IconButton onClick={loadItems} disabled={!canQuery || loading}>
                                        <RefreshIcon />
                                    </IconButton>
                                </span>
                            </Tooltip>
                        </Box>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent>
                         {error && (
                            <Alert severity='error' sx={{ mb: 2 }}>{error}</Alert>
                        )}

                        {!canQuery && (
                            <Box sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
                                <Typography>Seleccione un Periodo y un Grado para comenzar.</Typography>
                            </Box>
                        )}

                        {canQuery && loading && (
                            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                                <CircularProgress />
                            </Box>
                        )}

                        {canQuery && !loading && items.length === 0 && !error && (
                            <Box sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
                                <Typography>No se encontraron asignaturas.</Typography>
                            </Box>
                        )}

                        {canQuery && !loading && items.length > 0 && (
                            <TableContainer component={Paper} variant="outlined">
                                <Table size="small">
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>Materia</TableCell>
                                            <TableCell>Escala</TableCell>
                                            <TableCell align="center" width={150}>Horas Semanales</TableCell>
                                            <TableCell align="center" width={150}>Minutos</TableCell>
                                            <TableCell align="center" width={150}>Bloques Continuos</TableCell>
                                            <TableCell align="center" width={150}>Compartida</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {items.map((item, index) => {
                                            return (
                                                <TableRow key={item.id} hover>
                                                    <TableCell>
                                                        <Typography variant="body2" fontWeight="medium">
                                                            {item.materia?.nombre || 'Sin nombre'}
                                                        </Typography>
                                                        {item.materia?.abreviatura && (
                                                            <Typography variant="caption" color="text.secondary">
                                                                {item.materia.abreviatura}
                                                            </Typography>
                                                        )}
                                                    </TableCell>
                                                    <TableCell>
                                                        {item.escala?.nombre || '-'}
                                                    </TableCell>
                                                    <TableCell align="center">
                                                        <TextField
                                                            size="small"
                                                            type="number"
                                                            disabled={!canEdit || isSavingAll}
                                                            value={getDisplayValue(item, 'horas_semanales')}
                                                            onChange={(e) => handleLocalChange(item.id, 'horas_semanales', e.target.value)}
                                                            inputRef={el => inputRefs.current[`${item.id}-horas_semanales`] = el}
                                                            onKeyDown={(e) => handleKeyDown(e, index, 'horas_semanales')}
                                                            onFocus={(e) => e.target.select()}
                                                            inputProps={{ min: 0, style: { textAlign: 'center' } }}
                                                            sx={{ maxWidth: 80 }}
                                                        />
                                                    </TableCell>
                                                    <TableCell align="center">
                                                        <TextField
                                                            size="small"
                                                            type="number"
                                                            disabled={!canEdit || isSavingAll}
                                                            value={getDisplayValue(item, 'minutos')}
                                                            onChange={(e) => handleLocalChange(item.id, 'minutos', e.target.value)}
                                                            inputRef={el => inputRefs.current[`${item.id}-minutos`] = el}
                                                            onKeyDown={(e) => handleKeyDown(e, index, 'minutos')}
                                                            onFocus={(e) => e.target.select()}
                                                            inputProps={{ min: 0, style: { textAlign: 'center' } }}
                                                            sx={{ maxWidth: 80 }}
                                                        />
                                                    </TableCell>
                                                    <TableCell align="center">
                                                        <TextField
                                                            size="small"
                                                            type="number"
                                                            disabled={!canEdit || isSavingAll}
                                                            value={getDisplayValue(item, 'bloque_continuo')}
                                                            onChange={(e) => handleLocalChange(item.id, 'bloque_continuo', e.target.value)}
                                                            inputRef={el => inputRefs.current[`${item.id}-bloque_continuo`] = el}
                                                            onKeyDown={(e) => handleKeyDown(e, index, 'bloque_continuo')}
                                                            onFocus={(e) => e.target.select()}
                                                            inputProps={{ min: 1, max: 2, style: { textAlign: 'center' } }} 
                                                            sx={{ maxWidth: 80 }}
                                                        />
                                                    </TableCell>
                                                    <TableCell align="center">
                                                        <Checkbox
                                                            checked={!!getDisplayValue(item, 'compartida')}
                                                            onChange={(e) => handleLocalChange(item.id, 'compartida', e.target.checked)}
                                                            disabled={!canEdit || isSavingAll}
                                                        />
                                                    </TableCell>
                                                </TableRow>
                                            )
                                        })}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        )}
                    </CardContent>
                </Card>
                
                {hasChanges && (
                    <Paper 
                        elevation={6}
                        sx={{ 
                            position: 'fixed', 
                            bottom: 30, 
                            right: 30, 
                            zIndex: 1000,
                            p: 2,
                            borderRadius: 4,
                            display: 'flex',
                            gap: 2,
                            alignItems: 'center',
                            backgroundColor: 'background.paper'
                        }}
                    >
                        <Typography variant="body2" color="text.secondary">
                            {Object.keys(editingItems).length} cambios pendientes
                        </Typography>
                        <Button 
                            variant="contained" 
                            color="primary" 
                            startIcon={isSavingAll ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                            onClick={saveAll}
                            disabled={isSavingAll}
                        >
                            {isSavingAll ? 'Guardando...' : 'Guardar Cambios'}
                        </Button>
                    </Paper>
                )}
            </Box>
        </PermissionGuard>
    )
}
