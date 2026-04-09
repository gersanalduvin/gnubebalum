import {
    Box,
    Chip,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    Typography
} from '@mui/material'
import React, { useMemo, useState } from 'react'

interface CoverageItem {
    user_id: number
    docente: string
    asignatura_id: number
    asignatura: string
    grupo_id: number
    grupo: string
    plan_id: number | null
    planificado: boolean
    enviado: boolean
    fecha_plan: string | null
}

interface LessonPlanCoverageProps {
    data: CoverageItem[]
    isLoading: boolean
}

const LessonPlanCoverage: React.FC<LessonPlanCoverageProps> = ({ data, isLoading }) => {
    const [searchTerm, setSearchTerm] = useState('')

    const filteredData = useMemo(() => {
        if (!searchTerm) return data
        const lowSearch = searchTerm.toLowerCase()
        return data.filter(item => 
            item.docente.toLowerCase().includes(lowSearch) ||
            item.asignatura.toLowerCase().includes(lowSearch) ||
            item.grupo.toLowerCase().includes(lowSearch)
        )
    }, [data, searchTerm])

    return (
        <Box>
            <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6">Cobertura de Planificación</Typography>
                <TextField 
                    size="small" 
                    placeholder="Buscar docente, materia o grupo..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    sx={{ width: 300 }}
                    InputProps={{
                        startAdornment: (
                            <Box component="span" sx={{ color: 'text.secondary', mr: 1, display: 'flex' }}>
                                <i className="ri-search-line"></i>
                            </Box>
                        )
                    }}
                />
            </Box>

            <TableContainer component={Paper} elevation={0} variant="outlined">
                <Table size="small">
                    <TableHead sx={{ bgcolor: 'background.default' }}>
                        <TableRow>
                            <TableCell sx={{ fontWeight: 'bold' }}>Docente</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Asignatura</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Grupo</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }} align="center">Estado</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Info</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={5} align="center" sx={{ py: 3 }}>
                                    Cargando datos de cobertura...
                                </TableCell>
                            </TableRow>
                        ) : filteredData.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} align="center" sx={{ py: 3 }}>
                                    No se encontraron registros de asignación.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredData.map((item, index) => (
                                <TableRow key={index} hover>
                                    <TableCell>{item.docente}</TableCell>
                                    <TableCell>{item.asignatura}</TableCell>
                                    <TableCell>{item.grupo}</TableCell>
                                    <TableCell align="center">
                                        <Chip 
                                            label={item.planificado ? (item.enviado ? 'Enviado' : 'Borrador') : 'Sin Planificar'}
                                            color={item.planificado ? (item.enviado ? 'success' : 'info') : 'error'}
                                            size="small"
                                            variant={item.planificado ? 'filled' : 'outlined'}
                                            sx={{ minWidth: 100 }}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        {item.fecha_plan && (
                                            <Typography variant="caption" color="text.secondary">
                                                Fecha: {(() => {
                                                    const dateStr = String(item.fecha_plan)
                                                    // Handle YYYY-MM-DD manually to avoid timezone shifts (UTC vs Local)
                                                    if (dateStr.includes('-')) {
                                                        const [y, m, d] = dateStr.substring(0, 10).split('-')
                                                        return `${d}/${m}/${y}`
                                                    }
                                                    return new Date(item.fecha_plan).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })
                                                })()}
                                            </Typography>
                                        )}
                                        {!item.planificado && (
                                            <Typography variant="caption" color="error">
                                                Pendiente de entrega
                                            </Typography>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: 'success.main' }} />
                    <Typography variant="caption">Planificado y Enviado</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: 'info.main' }} />
                    <Typography variant="caption">En Borrador</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: 'error.main' }} />
                    <Typography variant="caption">Sin Planificación</Typography>
                </Box>
            </Box>
        </Box>
    )
}

export default LessonPlanCoverage
