'use client'

import { usePermissions } from '@/hooks/usePermissions'
import {
    Autocomplete,
    Box,
    Button,
    CircularProgress,
    FormControl,
    Grid,
    InputLabel,
    MenuItem,
    Select,
    TextField,
    Typography
} from '@mui/material'
import { useEffect, useState } from 'react'
import { toast } from 'react-hot-toast'

// Components
import LessonPlanDetail from '@/components/lesson-plans/LessonPlanDetail'
import LessonPlanForm from '@/components/lesson-plans/LessonPlanForm'
import LessonPlanList from '@/components/lesson-plans/LessonPlanList'
import LessonPlanStats from '@/components/lesson-plans/LessonPlanStats'
import LessonPlanCoverage from '@components/lesson-plans/LessonPlanCoverage'; // New import

// Services
import {
    deleteLessonPlan,
    duplicateLessonPlan,
    exportPdfCobertura,
    exportPdfListado,
    exportPdfPendientes,
    getLessonPlans,
    getLessonPlanStats,
    getMyAssignments,
    getMyGroups,
    getPlanningCoverage,
    getTeacherStatus
} from '@/services/lessonPlanService'

// Feature Services
import docentesService from '@/features/docentes/services/docentesService'
import gruposService from '@/features/config-grupos/services/gruposService'
import configNotSemestreService from '@/features/config-not-semestre/services/configNotSemestreService'
import notAsignaturaGradoService from '@/features/not-asignatura-grado/services/notAsignaturaGradoService'
import periodoLectivoService from '@/features/periodo-lectivo/services/periodoLectivoService'

const LessonPlansPage = () => {
    const { hasPermission, isSuperAdmin, user } = usePermissions()
    const [view, setView] = useState<'list' | 'form' | 'detail' | 'coverage'>('list')
    const [isLoading, setIsLoading] = useState(false)
    const [isCoverageLoading, setIsCoverageLoading] = useState(false)
    const [isExportingPdf, setIsExportingPdf] = useState(false)
    const [listTab, setListTab] = useState('1')

    // Data States
    const [plans, setPlans] = useState([])
    const [pendingTeachers, setPendingTeachers] = useState([])
    const [stats, setStats] = useState<any>(null)
    const [coverageData, setCoverageData] = useState([])

    // Catalogs
    const [periodos, setPeriodos] = useState<any[]>([])
    const [grupos, setGrupos] = useState<any[]>([])
    const [asignaturas, setAsignaturas] = useState<any[]>([])
    const [parciales, setParciales] = useState<any[]>([])
    const [docentes, setDocentes] = useState<any[]>([])

    // Filters
    const [periodoFilter, setPeriodoFilter] = useState('')
    const [parcialFilter, setParcialFilter] = useState('')
    const [startDate, setStartDate] = useState<string>('')
    const [endDate, setEndDate] = useState<string>('')
    const [statusFilter, setStatusFilter] = useState<'todos' | 'borrador' | 'enviado'>('todos')
    const [docenteFilter, setDocenteFilter] = useState('')
    const [asignaturaFilter, setAsignaturaFilter] = useState('')
    const [filterMode, setFilterMode] = useState<'corte' | 'fecha'>('corte')

    // Pagination
    const [page, setPage] = useState(0)
    const [rowsPerPage, setRowsPerPage] = useState(15)
    const [totalRows, setTotalRows] = useState(0)

    // Edit State
    const [editingPlan, setEditingPlan] = useState<any>(null)
    // Permissions
    const isAdministrative = (user as any)?.tipo_usuario === 'administrativo' || (user as any)?.tipo_usuario === 'superuser'
    const isSuperAdminDirect = (user as any)?.superadmin === 1 || (user as any)?.superadmin === true

    // Explicitly check tipo_usuario or permission as requested.
    // "no hay que restringir" -> We allow anyone with teacher operations permission to attempt loading their groups.
    const isDocente = hasPermission('operaciones.docentes') || (user as any)?.tipo_usuario === 'docente'

    const canViewAll = isSuperAdmin || isSuperAdminDirect || isAdministrative || hasPermission('agenda.planes_clases.ver_todos')
    const canCreate = isDocente && hasPermission('agenda.planes_clases.crear')
    const canEdit = isSuperAdmin || isAdministrative || hasPermission('agenda.planes_clases.editar')
    const canDelete = isSuperAdmin || isAdministrative || hasPermission('agenda.planes_clases.eliminar')

    useEffect(() => {
        if (user) {
             loadCatalogs()
        }
    }, [user?.id])

    useEffect(() => {
        if (periodoFilter) {
            loadParciales(Number(periodoFilter))
        }
    }, [periodoFilter])

    useEffect(() => {
        console.log('[useEffect] Triggered with:', { view, periodoFilter, parcialFilter, canViewAll })

        // Coverage view - load coverage data
        if (view === 'coverage' && periodoFilter) {
            console.log('[useEffect] Loading coverage data')
            loadCoverageData()
            return
        }

        // List view logic
        if (view === 'list') {
            if (canViewAll) {
                // Administrators: Only require Period and Parcial
                if (periodoFilter && parcialFilter) {
                    console.log('[useEffect] Loading dashboard data (admin)')
                    loadDashboardData()
                } else {
                     // Check if we need to clear or just do nothing. User said "no tiene que hacer peticiones... ni mostrar datos"
                     // So we clear the current data.
                     setPlans([])
                     setStats(null)
                }
            } else {
                // Teachers: load their own plans
                console.log('[useEffect] Loading my plans (teacher)')
                loadMyPlans()
            }
        }
    }, [periodoFilter, parcialFilter, startDate, endDate, statusFilter, docenteFilter, asignaturaFilter, view, filterMode, page, rowsPerPage])


    const loadCatalogs = async () => {
        try {
            // Fetch Periodos
            // Check if getAllPeriodosLectivos returns directly or {data: ...}
            // PeriodoLectivoService.getAllPeriodosLectivos returns ApiResponse<ConfPeriodoLectivo[]>
            const periodsRes = await periodoLectivoService.getAllPeriodosLectivos()
            setPeriodos(periodsRes.data || [])

            const activePeriod = periodsRes.data?.find((p: any) => p.periodo_nota) || periodsRes.data?.find((p: any) => p.estado === 'Activo')
            if (activePeriod && !periodoFilter) setPeriodoFilter(String(activePeriod.id))

            // Logic:
            // 1. If User has Teacher permissions (isDocente), TRY to load their specific assignments/groups.
            // 2. If they have specific groups, showing ONLY them is preferred.
            // 3. If they have NO specific groups/assignments, but canViewAll (Admin), fallback to ALL catalogs.

            let loadedSpecificData = false;

            if (isDocente && activePeriod) {
                console.log('Attempting to load specific teacher assignments for period:', activePeriod.id)
                try {
                    const [myAssignmentsRes, myGroupsRes] = await Promise.all([
                        getMyAssignments(activePeriod.id),
                        getMyGroups(activePeriod.id)
                    ]);

                    const assignmentsData = myAssignmentsRes.data || myAssignmentsRes;
                    const groupsData = myGroupsRes.data || myGroupsRes;

                    if (assignmentsData.asignaturas && Array.isArray(assignmentsData.asignaturas) && assignmentsData.asignaturas.length > 0) {
                        setAsignaturas(assignmentsData.asignaturas)
                    }

                    if (groupsData && Array.isArray(groupsData) && groupsData.length > 0) {
                        setGrupos(groupsData)
                        // If we found groups, we consider this a successful "Teacher Load".
                        // We will NOT fall back to "All Groups" in this case, to respect "solo filtre el grupo asociado"
                        loadedSpecificData = true;
                    }
                } catch (assignError: any) {
                    console.error('Error attempting to load my assignments', assignError)
                    // Ensure we don't crash, and proceed to fallback checks
                }
            }

            // Fallback / Admin Logic: Load All IF we didn't load specific teacher data
            // (Or if we want to merge? User said "solo filtre el grupo asociado", so usually we want restricted list if available.)
            // But if I am Admin and I have NO assigned groups, I need to see ALL.
            if (!loadedSpecificData && canViewAll) {
                 console.log('Loading ALL catalogs (Admin fallback)')
                // Fetch Grupos
                const gruposRes = await gruposService.getAllGrupos()

                // Remove duplicates by id to avoid showing same group multiple times
                const uniqueGrupos = gruposRes.data?.reduce((acc: any[], current: any) => {
                    const exists = acc.find(item => item.id === current.id)
                    if (!exists) {
                        acc.push(current)
                    }
                    return acc
                }, []) || []

                setGrupos(uniqueGrupos)

                // Fetch Asignaturas (NotAsignaturaGrado)
                // notAsignaturaGradoService.getAll returns any[] directly
                const params = new URLSearchParams()
                const asignaturasRes = await notAsignaturaGradoService.getAll(params)

                // Remove duplicates by materia_id to avoid showing same subject multiple times
                const uniqueAsignaturas = asignaturasRes?.reduce((acc: any[], current: any) => {
                    const exists = acc.find(item => item.materia_id === current.materia_id)
                    if (!exists) {
                        acc.push(current)
                    }
                    return acc
                }, []) || []

                setAsignaturas(uniqueAsignaturas)

                // Fetch Docentes
                const docentesRes = await docentesService.getDocentes({ per_page: 500 })
                const docsData = (docentesRes as any).data || Array.isArray(docentesRes) ? docentesRes : []
                setDocentes(Array.isArray(docsData) ? docsData : Array.isArray((docsData as any).data) ? (docsData as any).data : [])
            }

        } catch (e) {
            console.error("Error loading catalogs", e)
            toast.error("Error cargando catálogos")
        }
    }

    const loadParciales = async (periodoId: number) => {
        try {
            // Fetch Semestres for Periodo, and extract Parciales
            const params = new URLSearchParams()
            params.append('periodo_lectivo_id', String(periodoId))
            const semestresRes = await configNotSemestreService.list(params)

            // semestresRes might be paginated { data: [] } or just []
            const semestres = (semestresRes as any).data || []
            let allParciales: any[] = []
            semestres.forEach((s: any) => {
                if (s.parciales && Array.isArray(s.parciales)) {
                    allParciales = [...allParciales, ...s.parciales]
                }
            })
            setParciales(allParciales)
            if(allParciales.length > 0) {
                 // Optionally set default parcial?
            }
        } catch (e) {
            console.error("Error loading parciales", e)
        }
    }

    const loadDashboardData = async () => {
        if (!periodoFilter || !parcialFilter) {
            setIsLoading(false)
            return
        }

        setIsLoading(true)
        try {
            // Always load plans with new filters and pagination
            const filters: any = {
                periodo_lectivo_id: periodoFilter,
                parcial_id: parcialFilter || undefined,
                start_date: startDate ? startDate : undefined,
                end_date: endDate ? endDate : (startDate ? startDate : undefined),
                page: page + 1,
                per_page: rowsPerPage
            }

            if (statusFilter !== 'todos') {
                filters.is_submitted = statusFilter === 'enviado'
            }

            if (docenteFilter) {
                filters.user_id = docenteFilter
            }

            if (asignaturaFilter) {
                filters.asignatura_id = asignaturaFilter
            }

            const response = await getLessonPlans(filters)
            
            // Handle paginated response structure vs plain array
            const plansData = response?.data ? response.data : (Array.isArray(response) ? response : [])
            setPlans(plansData)
            setTotalRows(response?.total || plansData.length)

            // Only load stats and teacher status if user has permission
            if (canViewAll) {
                try {
                    const [statsResults, statusResults] = await Promise.all([
                        getLessonPlanStats(String(periodoFilter), String(parcialFilter), startDate, startDate),
                        getTeacherStatus(String(periodoFilter), String(parcialFilter), startDate, startDate)
                    ])

                    console.log('Stats results:', statsResults)
                    console.log('Teacher status results:', statusResults)

                    // Service already returns response.data, so we don't need to unwrap .data again
                    setStats(statsResults || null)
                    setPendingTeachers(statusResults?.sin_plan || [])
                } catch (adminError) {
                    console.warn('Error loading admin data:', adminError)
                    // Don't fail the whole load if admin data fails
                }
            }
        } catch (error: any) {
            console.error('Error loading lesson plans:', error)
            toast.error(error?.message || 'Error al cargar los planes de clase')
        } finally {
            setIsLoading(false)
        }
    }

    const loadCoverageData = async () => {
        if (!periodoFilter) return
        setIsCoverageLoading(true)
        try {
            const coverageRes = await getPlanningCoverage(
                periodoFilter,
                filterMode === 'corte' ? parcialFilter : undefined,
                filterMode === 'fecha' ? startDate : undefined
            )
            setCoverageData(coverageRes || [])
        } catch (error: any) {
            console.error('Error loading coverage data:', error?.response?.data || error)
            toast.error('Error al cargar datos de cobertura')
        } finally {
            setIsCoverageLoading(false)
        }
    }

    const handleExportPdf = async () => {
        if (listTab === '2') {
            return handleExportPendientesPdf()
        }

        try {
            setIsExportingPdf(true)
            const filters: any = {
                periodo_lectivo_id: periodoFilter,
                parcial_id: parcialFilter || undefined,
                start_date: startDate ? startDate : '',
                end_date: endDate ? endDate : (startDate ? startDate : '')
            }
            if (statusFilter !== 'todos') filters.is_submitted = statusFilter === 'enviado'
            if (docenteFilter) filters.user_id = docenteFilter
            if (asignaturaFilter) filters.asignatura_id = asignaturaFilter

            const response = await exportPdfListado(filters)

            const file = new Blob([response.data], { type: 'application/pdf' })
            const url = window.URL.createObjectURL(file)
            window.open(url, '_blank')
            toast.success("PDF generado correctamente")
        } catch (e) {
            console.error("Error exporting PDF", e)
            toast.error("Error al exportar PDF")
        } finally {
            setIsExportingPdf(false)
        }
    }

    const handleExportPendientesPdf = async () => {
        try {
            setIsExportingPdf(true)
            const response = await exportPdfPendientes(
                periodoFilter,
                parcialFilter,
                filterMode === 'fecha' ? startDate : ''
            )

            const file = new Blob([response.data], { type: 'application/pdf' })
            const url = window.URL.createObjectURL(file)
            window.open(url, '_blank')
            toast.success("PDF de pendientes generado")
        } catch (e) {
            console.error("Error exporting pending PDF", e)
            toast.error("Error al exportar PDF de pendientes")
        } finally {
            setIsExportingPdf(false)
        }
    }

    const handleExportCoveragePdf = async () => {
        try {
            setIsExportingPdf(true)
            const response = await exportPdfCobertura(
                periodoFilter,
                parcialFilter,
                filterMode === 'fecha' ? startDate : ''
            )

            const file = new Blob([response.data], { type: 'application/pdf' })
            const url = window.URL.createObjectURL(file)
            window.open(url, '_blank')
            toast.success("PDF generado correctamente")
        } catch (e) {
            console.error("Error exporting coverage PDF", e)
            toast.error("Error al exportar PDF de cobertura")
        } finally {
            setIsExportingPdf(false)
        }
    }

    const loadAllSubmittedPlans = async () => {
        console.log('[loadAllSubmittedPlans] Starting to load submitted plans...')
        setIsLoading(true)
        try {
            // Load all submitted plans (is_submitted = true) without filters
            const filters: any = { is_submitted: true }
            if (periodoFilter) filters.periodo_lectivo_id = periodoFilter
            if (parcialFilter) filters.parcial_id = parcialFilter
            // Only add date filters if they have actual values (not empty strings)
            if (startDate && startDate.trim()) {
                filters.start_date = startDate
                filters.end_date = startDate
            }

            console.log('[loadAllSubmittedPlans] Filters:', filters)
            const results = await getLessonPlans(filters)
            // Support pagination object
            const plansData = results?.data ? results.data : (Array.isArray(results) ? results : [])
            setPlans(plansData)
            setTotalRows(results?.total || plansData.length)
            console.log('[loadAllSubmittedPlans] Plans state updated')
        } catch (error) {
            console.error('Error loading submitted plans:', error)
            toast.error('Error al cargar los planes enviados')
        } finally {
            setIsLoading(false)
        }
    }

    const loadMyPlans = async () => {
        setIsLoading(true)
        try {
            const filters: any = {
                user_id: 'me', // handled by backend mostly or strict,
                // but service will pass user_id if we want, or rely on lack of permission
            }
            if(periodoFilter) filters.periodo_lectivo_id = periodoFilter
            if(parcialFilter) filters.parcial_id = parcialFilter
            if(startDate) {
                filters.start_date = startDate
                filters.end_date = endDate || startDate
            }
            if (statusFilter !== 'todos') {
                filters.is_submitted = statusFilter === 'enviado'
            }
            if (asignaturaFilter) {
                filters.asignatura_id = asignaturaFilter
            }
            filters.page = page + 1
            filters.per_page = rowsPerPage

            const response = await getLessonPlans(filters)
            const plansData = response?.data ? response.data : (Array.isArray(response) ? response : [])
            setPlans(plansData)
            setTotalRows(response?.total || plansData.length)
        } catch (error) {
            console.error(error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleCreate = () => {
        // Pre-fill initial data with currently selected filters
        setEditingPlan({
            periodo_lectivo_id: periodoFilter ? Number(periodoFilter) : '',
            parcial_id: parcialFilter ? Number(parcialFilter) : ''
        })
        setView('form')
    }

    const handleEdit = (plan: any) => {
        setEditingPlan(plan)
        setView('form')
    }

    const formSuccess = () => {
        setView('list')
        if (periodoFilter && parcialFilter) loadDashboardData()
        else loadMyPlans()
    }

    const handleView = (plan: any) => {
        setEditingPlan(plan)
        setView('detail')
    }

    const handleCopy = async (plan: any) => {
        if (!confirm("¿Desea crear una copia de este plan de clase?")) return;

        const toastId = toast.loading('Copiando plan...');
        try {
            await duplicateLessonPlan(plan.id);
            toast.success('Plan copiado exitosamente', { id: toastId });
             // Refresh list
             if (periodoFilter && parcialFilter && canViewAll) loadDashboardData();
             else loadMyPlans();
        } catch (error: any) {
            console.error('Error copying plan:', error);
            toast.error(error?.message || 'Error al copiar el plan', { id: toastId });
        }
    }

    if (view === 'detail' && editingPlan) {
        return (
            <Grid container spacing={3}>
                <Grid item xs={12}>
                    <LessonPlanDetail
                        plan={editingPlan}
                        onBack={() => setView('list')}
                        asignaturas={asignaturas}
                    />
                </Grid>
            </Grid>
        )
    }

    if (view === 'form') {
        return (
            <Grid container spacing={3}>
                <Grid item xs={12}>
                    <LessonPlanForm
                        initialData={editingPlan}
                        onSuccess={formSuccess}
                        onCancel={() => setView('list')}
                        periodos={periodos}
                        parciales={parciales}
                        asignaturas={asignaturas}
                        grupos={grupos}
                        isEdit={!!editingPlan?.id}
                        canViewAll={canViewAll} // Pass permission prop
                    />
                </Grid>
            </Grid>
        )
    }

    return (
        <Grid container spacing={3}>
            <Grid item xs={12} display="flex" justifyContent="space-between" alignItems="center">
                <Box display="flex" alignItems="center" gap={2}>
                    <Typography variant="h5">Planes de Clases</Typography>
                    {canViewAll && (
                        <Box sx={{ border: '1px solid #e0e0e0', borderRadius: 1, p: 0.5, display: 'flex', bgcolor: 'background.paper' }}>
                            <Button
                                size="small"
                                variant={view === 'list' ? 'contained' : 'text'}
                                onClick={() => setView('list')}
                                sx={{ borderRadius: 1 }}
                            >
                                Listado
                            </Button>
                            <Button
                                size="small"
                                variant={view === 'coverage' ? 'contained' : 'text'}
                                onClick={() => setView('coverage')}
                                sx={{ borderRadius: 1 }}
                            >
                                Cobertura
                            </Button>
                        </Box>
                    )}
                </Box>
                <Box display="flex" gap={1}>
                    {canViewAll && (
                        <Button
                            variant="outlined"
                            color="error"
                            disabled={isExportingPdf}
                            onClick={view === 'coverage' ? handleExportCoveragePdf : handleExportPdf}
                            startIcon={isExportingPdf ? <CircularProgress size={16} color="inherit" /> : <i className="ri-file-pdf-line"></i>}
                        >
                            {isExportingPdf ? 'Generando...' : 'Exportar PDF'}
                        </Button>
                    )}
                    {canCreate && parcialFilter && (
                        <Button variant="contained" onClick={handleCreate}>
                            Crear Plan
                        </Button>
                    )}
                </Box>
            </Grid>

            {/* Filters Row */}
            <Grid item xs={12}>
                 <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', bgcolor: 'background.paper', p: 2, borderRadius: 1, flexWrap: 'wrap' }}>
                     <FormControl size="small" sx={{ minWidth: 150, display: !canViewAll ? 'none' : 'flex' }}>
                        <InputLabel>Periodo Lectivo</InputLabel>
                        <Select
                            label="Periodo Lectivo"
                            value={periodoFilter}
                            onChange={(e) => setPeriodoFilter(e.target.value)}
                        >
                            {periodos.map((p: any) => <MenuItem key={p.id} value={String(p.id)}>{p.nombre}</MenuItem>)}
                        </Select>
                     </FormControl>

                     {!canViewAll && periodos.find(p => String(p.id) === periodoFilter) && (
                        <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mr: 2 }}>
                            Periodo: {periodos.find(p => String(p.id) === periodoFilter)?.nombre}
                        </Typography>
                     )}

                     {/* Parcial Filter - Only if Corte mode */}
                     {(view === 'list' || (view === 'coverage' && filterMode === 'corte')) && (
                        <FormControl size="small" sx={{ minWidth: 150 }}>
                            <InputLabel>Parcial (Corte)</InputLabel>
                            <Select
                                label="Parcial (Corte)"
                                value={parcialFilter}
                                onChange={(e) => setParcialFilter(e.target.value)}
                                disabled={!periodoFilter}
                            >
                                <MenuItem value=""><em>Seleccione</em></MenuItem>
                                {parciales.map((p: any) => (
                                    <MenuItem key={p.id} value={String(p.id)}>
                                        {p.nombre || `Corte ${p.orden || ''}`}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                     )}

                     {/* Filter Mode Selector - ONLY for Coverage */}
                     {view === 'coverage' && (
                         <Box sx={{ display: 'flex', border: '1px solid #e0e0e0', borderRadius: 1, overflow: 'hidden' }}>
                            <Button
                                size="small"
                                variant={filterMode === 'corte' ? 'contained' : 'outlined'}
                                onClick={() => { setFilterMode('corte'); setPage(0); }}
                                sx={{ border: 'none', borderRadius: 0 }}
                            >
                                Por Corte
                            </Button>
                            <Button
                                size="small"
                                variant={filterMode === 'fecha' ? 'contained' : 'outlined'}
                                onClick={() => { setFilterMode('fecha'); setPage(0); }}
                                sx={{ border: 'none', borderRadius: 0 }}
                            >
                                Por Fecha
                            </Button>
                         </Box>
                     )}

                     {/* Removed Status Filter as per user request */}

                     {/* User Filter (Admins only) via Autocomplete */}
                     {canViewAll && (
                         <FormControl size="small" sx={{ minWidth: 250 }}>
                             <Autocomplete
                                 size="small"
                                 options={[
                                     { id: '', label: 'Cualquier Docente' },
                                     ...docentes.map(d => ({
                                         id: String(d.id),
                                         label: d.name || d.username || `Docente ID: ${d.id}`
                                     }))
                                 ]}
                                 getOptionLabel={(option) => option.label}
                                 value={
                                     [
                                         { id: '', label: 'Cualquier Docente' },
                                         ...docentes.map(d => ({
                                             id: String(d.id),
                                             label: d.name || d.username || `Docente ID: ${d.id}`
                                         }))
                                     ].find(opt => opt.id === docenteFilter) || { id: '', label: 'Cualquier Docente' }
                                 }
                                 onChange={(e, newValue) => {
                                     setDocenteFilter(newValue?.id || '')
                                     setPage(0)
                                 }}
                                 isOptionEqualToValue={(option, value) => option.id === value?.id}
                                 renderInput={(params) => <TextField {...params} label="Filtro de usuario (Docente)" placeholder="Buscar..." />}
                             />
                         </FormControl>
                     )}
                     
                     {/* Subject Filter via Autocomplete */}
                     <FormControl size="small" sx={{ minWidth: 250 }}>
                         <Autocomplete
                             size="small"
                             options={[
                                 { id: '', label: 'Cualquiera' },
                                 { id: '0', label: 'Plan General' },
                                 ...asignaturas.map((a: any) => ({
                                     id: String(a.id || a.asignatura_id || a.materia_id),
                                     label: a.nombre || a.asignatura?.nombre || a.materia?.nombre || `Materia ID: ${a.materia_id || a.id}`
                                 }))
                             ]}
                             getOptionLabel={(option) => option.label}
                             value={
                                 [
                                     { id: '', label: 'Cualquiera' },
                                     { id: '0', label: 'Plan General' },
                                     ...asignaturas.map((a: any) => ({
                                         id: String(a.id || a.asignatura_id || a.materia_id),
                                         label: a.nombre || a.asignatura?.nombre || a.materia?.nombre || `Materia ID: ${a.materia_id || a.id}`
                                     }))
                                 ].find(opt => opt.id === asignaturaFilter) || { id: '', label: 'Cualquiera' }
                             }
                             onChange={(e, newValue) => {
                                 setAsignaturaFilter(newValue?.id || '')
                                 setPage(0)
                             }}
                             isOptionEqualToValue={(option, value) => option.id === value?.id}
                             renderInput={(params) => <TextField {...params} label="Asignatura" placeholder="Buscar asignatura..." />}
                         />
                     </FormControl>

                     {/* Date Filter - Required for Coverage Fecha mode, optional for List */}
                     {(view === 'list' || (view === 'coverage' && filterMode === 'fecha')) && (
                        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                            <TextField
                                type="date"
                                size="small"
                                label="Fecha"
                                value={startDate ? startDate.substring(0, 10) : ''}
                                onChange={(e) => { setStartDate(e.target.value); setPage(0); }}
                                InputLabelProps={{ shrink: true }}
                                sx={{ width: 150 }}
                                required={view === 'coverage'}
                            />
                            <Typography variant="body2">-</Typography>
                            <TextField
                                type="date"
                                size="small"
                                label="Fecha Fin"
                                value={endDate ? endDate.substring(0, 10) : startDate.substring(0, 10)}
                                onChange={(e) => { setEndDate(e.target.value); setPage(0); }}
                                InputLabelProps={{ shrink: true }}
                                sx={{ width: 150 }}
                            />
                        </Box>
                     )}
                 </Box>
            </Grid>

            {view === 'list' ? (
                <>
                    {canViewAll && stats && (
                        <Grid item xs={12}>
                            <LessonPlanStats stats={stats} isLoading={isLoading} />
                        </Grid>
                    )}

                    <Grid item xs={12}>
                        {isLoading ? (
                            <Box display="flex" justifyContent="center" p={5}><CircularProgress /></Box>
                        ) : (
                            <LessonPlanList
                                plans={plans}
                                pendingTeachers={pendingTeachers}
                                onEdit={handleEdit}
                                onDelete={async (id) => {
                                if(confirm("¿Seguro que desea eliminar?")) {
                                    await deleteLessonPlan(id)
                                    loadDashboardData()
                                }
                                }}
                                onView={handleView}
                                onCopy={handleCopy}
                                asignaturas={asignaturas}
                                showPending={canViewAll}
                                canEdit={canEdit}
                                canDelete={canDelete}
                                onTabChange={setListTab}
                                // Pagination configuration
                                page={page}
                                rowsPerPage={rowsPerPage}
                                totalRows={totalRows}
                                onPageChange={(e, newPage) => setPage(newPage)}
                                onRowsPerPageChange={(e) => {
                                    setRowsPerPage(parseInt(e.target.value, 10))
                                    setPage(0)
                                }}
                            />
                        )}
                    </Grid>
                </>
            ) : (
                <Grid item xs={12}>
                    <LessonPlanCoverage
                        data={coverageData}
                        isLoading={isCoverageLoading}
                    />
                </Grid>
            )}
        </Grid>
    )
}

export default LessonPlansPage
