'use client'

import { Autocomplete, Button, Card, CardContent, CardHeader, Grid, TextField } from '@mui/material'
import { DataGrid, GridColDef } from '@mui/x-data-grid'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'

// Icons
import PrintIcon from '@mui/icons-material/Print'

// Services
import periodoLectivoService from '@/features/periodo-lectivo/services/periodoLectivoService'
import { cargaAcademicaService } from '@/features/reportes-carga-academica/services/cargaAcademicaService'

const columns: GridColDef[] = [
    { field: 'asignatura', headerName: 'ASIGNATURA', flex: 1 },
    { field: 'docente', headerName: 'DOCENTE', flex: 1 },
    { field: 'grado', headerName: 'GRADO', flex: 1 },
    { field: 'grupo', headerName: 'GRUPO', flex: 1 },
]

const CargaAcademicaPage = () => {
    // Filters State
    const [periodo, setPeriodo] = useState<any | null>(null)
    const [grado, setGrado] = useState<any | null>(null)
    const [materia, setMateria] = useState<any | null>(null)
    const [grupo, setGrupo] = useState<any | null>(null)

    // Data Selects
    const [periodos, setPeriodos] = useState<any[]>([])
    const [grados, setGrados] = useState<any[]>([])
    const [materias, setMaterias] = useState<any[]>([])
    const [grupos, setGrupos] = useState<any[]>([])

    // Data State
    const [data, setData] = useState<any[]>([])
    const [loading, setLoading] = useState(false)
    const [printing, setPrinting] = useState(false)

    // Load initial periods data
    useEffect(() => {
        periodoLectivoService.getAllPeriodosLectivos().then((res) => {
            const list = res.data || []
            setPeriodos(list)
            if (list.length > 0 && !periodo) {
                setPeriodo(list[0])
            }
        })
    }, [])

    // Load other filters when period changes
    useEffect(() => {
        if (periodo?.id) {
            cargaAcademicaService.getFiltros(periodo.id).then(res => {
                setMaterias(res.materias || [])
                setGrados(res.grados || [])
                setGrupos(res.grupos || [])
            })
            // Reset other filters when period changes
            setMateria(null)
            setGrado(null)
            setGrupo(null)
        } else {
            setMaterias([])
            setGrados([])
            setGrupos([])
        }
    }, [periodo])

    // Filtered groups based on selected grade
    const filteredGrupos = grupo ? grupos : (grado ? grupos.filter(g => g.grado_id === grado.id) : grupos)

    // Fetch Report Data
    useEffect(() => {
        if (!periodo?.id) return

        setLoading(true)
        const filters = {
            periodo_lectivo_id: periodo?.id,
            materia_id: materia?.id,
            grado_id: grado?.id,
            grupo_id: grupo?.id
        }

        cargaAcademicaService.getCargaAcademica(filters)
            .then(res => setData(res))
            .catch(err => {
                console.error(err)
                toast.error('Error al cargar reporte')
            })
            .finally(() => setLoading(false))
    }, [periodo, materia, grado, grupo])

    const handlePrint = async () => {
        if (!periodo?.id) {
            toast.error('Seleccione un periodo lectivo')
            return
        }

        const filters = {
            periodo_lectivo_id: periodo?.id,
            materia_id: materia?.id,
            grado_id: grado?.id,
            grupo_id: grupo?.id
        }

        setPrinting(true)
        try {
            await toast.promise(
                cargaAcademicaService.exportPdf(filters),
                {
                    loading: 'Generando PDF...',
                    success: 'PDF generado correctamente',
                    error: 'Error al generar PDF'
                }
            )
        } catch (error) {
            console.error(error)
        } finally {
            setPrinting(false)
        }
    }


    return (
        <Card>
            <CardHeader 
                title="Reporte Carga Académica" 
                action={
                    <Button 
                        variant="contained" 
                        startIcon={<PrintIcon />} 
                        onClick={handlePrint}
                        disabled={loading || printing || data.length === 0}
                    >
                        {printing ? 'Generando...' : 'Imprimir'}
                    </Button>
                }
            />
            <CardContent>
                <Grid container spacing={2} sx={{ mb: 4 }}>
                     <Grid item xs={12} md={3}>
                        <Autocomplete
                            size="small"
                            options={periodos}
                            getOptionLabel={(o) => o?.nombre || ''}
                            value={periodo}
                            onChange={(_, v) => setPeriodo(v)}
                            renderInput={(params) => <TextField {...params} label="Periodo Lectivo" size="small" />}
                        />
                     </Grid>
                     <Grid item xs={12} md={3}>
                        <Autocomplete
                            size="small"
                            options={materias}
                            getOptionLabel={(o) => o?.nombre || ''}
                            value={materia}
                            onChange={(_, v) => setMateria(v)}
                            renderInput={(params) => <TextField {...params} label="Asignatura" size="small" />}
                        />
                     </Grid>
                     <Grid item xs={12} md={3}>
                        <Autocomplete
                            size="small"
                            options={grados}
                            getOptionLabel={(o) => o?.nombre || ''}
                            value={grado}
                            onChange={(_, v) => setGrado(v)}
                            renderInput={(params) => <TextField {...params} label="Grado" size="small" />}
                        />
                     </Grid>
                     <Grid item xs={12} md={3}>
                        <Autocomplete
                            size="small"
                            options={filteredGrupos}
                            getOptionLabel={(o) => o ? `${o.grado?.nombre || ''} ${o.seccion?.nombre || ''} (${o.turno?.nombre || ''})` : ''}
                            value={grupo}
                            onChange={(_, v) => setGrupo(v)}
                            renderInput={(params) => <TextField {...params} label="Grupo" size="small" />}
                            disabled={!periodo}
                        />
                     </Grid>
                </Grid>

                <div style={{ height: 600, width: '100%' }}>
                    <DataGrid
                        rows={data}
                        columns={columns}
                        loading={loading}
                        density="compact"
                        disableRowSelectionOnClick
                        getRowClassName={(params) => params.indexRelativeToCurrentPage % 2 === 0 ? 'even' : 'odd'}
                        sx={{
                            backgroundColor: 'background.paper',
                            '& .MuiDataGrid-row.odd': {
                                backgroundColor: (theme) => theme.palette.action.hover,
                            }
                        }}
                    />
                </div>
            </CardContent>
        </Card>
    )
}

export default CargaAcademicaPage
