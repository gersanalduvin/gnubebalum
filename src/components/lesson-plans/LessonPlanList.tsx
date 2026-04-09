'use client'

import { LessonPlan } from '@/services/lessonPlanService'
import TabContext from '@mui/lab/TabContext'
import TabList from '@mui/lab/TabList'
import TabPanel from '@mui/lab/TabPanel'
import {
    Box,
    Card,
    CardHeader,
    Chip,
    IconButton,
    Paper,
    Tab,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TableFooter,
    TablePagination,
    Tooltip,
    Typography
} from '@mui/material'
import React, { useState } from 'react'

interface LessonPlanListProps {
  plans: LessonPlan[]
  pendingTeachers: any[]
  onEdit: (plan: LessonPlan) => void
  onDelete: (id: number) => void
  onView: (plan: LessonPlan) => void
  onCopy?: (plan: LessonPlan) => void // Add onCopy prop
  asignaturas?: any[]
  showPending?: boolean
  canEdit?: boolean
  canDelete?: boolean
  onTabChange?: (value: string) => void
  page?: number
  rowsPerPage?: number
  totalRows?: number
  onPageChange?: (e: any, newPage: number) => void
  onRowsPerPageChange?: (e: any) => void
}

import { usePermissions } from '@/hooks/usePermissions'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

// ... (keep interface)

const LessonPlanList: React.FC<LessonPlanListProps> = ({ plans = [], pendingTeachers = [], onEdit, onDelete, onView, onCopy, asignaturas = [], showPending = true, canEdit = false, canDelete = false, onTabChange, page = 0, rowsPerPage = 15, totalRows = 0, onPageChange, onRowsPerPageChange }) => {
    const { user, isSuperAdmin } = usePermissions()
    // Determine if viewer is admin-like
    const isAdmin = isSuperAdmin || (user as any)?.tipo_usuario === 'administrativo' || (user as any)?.superadmin === 1

    const getSubjectName = (plan: LessonPlan) => {
        if (plan.is_general) return 'PLAN GENERAL'

        // 1. Try relationship
        const relName = plan.asignatura?.materia?.nombre || plan.asignatura?.nombre
        if (relName) return relName

        // 2. Try catalog lookup
        if (plan.asignatura_id && asignaturas.length > 0) {
             const found = asignaturas.find((a: any) => a.id === plan.asignatura_id || a.asignatura_id === plan.asignatura_id)
             if (found) {
                 return found.nombre || found.asignatura?.nombre || found.materia?.nombre || 'Desconocida'
             }
        }

        // 3. Fallback: If it has an ID but no name found, show ID. If no ID, it's general.
        return plan.asignatura_id ? `Materia ID: ${plan.asignatura_id}` : 'PLAN GENERAL'
    }
  const [tabValue, setTabValue] = useState('1')

  const handleChange = (event: React.SyntheticEvent, newValue: string) => {
    setTabValue(newValue)
    if (onTabChange) onTabChange(newValue)
  }

  return (
    <Card>
       <CardHeader title="Gestión de Planes de Clases" />
       <TabContext value={tabValue}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 3 }}>
          <TabList onChange={handleChange} aria-label="lesson plans tabs">
            <Tab label={`Planificados (${plans.length})`} value="1" />
            {showPending && <Tab label={`Pendientes (${pendingTeachers.length})`} value="2" />}
          </TabList>
        </Box>
        <TabPanel value="1">
             {plans.length === 0 ? (
                 <Typography variant="body2" sx={{p:2, textAlign:'center'}}>No hay planes registrados con los filtros actuales.</Typography>
             ) : (
                 <TableContainer component={Paper} elevation={0} variant="outlined">
                    <Table size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell>Docente</TableCell>
                                <TableCell>Asignatura</TableCell>
                                <TableCell>Grupos</TableCell>
                                <TableCell>Fecha Clase</TableCell>
                                <TableCell>Creado el</TableCell>
                                <TableCell>Estado</TableCell>
                                <TableCell align="right">Acciones</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {plans.map((plan) => (
                                <TableRow key={plan.id}>
                                    <TableCell>{plan.user?.name || plan.user?.username || 'N/A'}</TableCell>
                                    <TableCell>
                                        {getSubjectName(plan)}
                                    </TableCell>
                                    <TableCell>
                                         {/* Show group names */}
                                         {plan.groups && plan.groups.length > 0
                                            ? plan.groups.map(g => g.nombre).join(', ')
                                            : 'Sin Grupos'}
                                    </TableCell>
                                    <TableCell>
                                        {plan.start_date ? (() => {
                                            // Handle straight YYYY-MM-DD strings manually to avoid timezone shifts
                                            if (typeof plan.start_date === 'string' && plan.start_date.includes('-')) {
                                                const [y, m, d] = plan.start_date.substring(0, 10).split('-')
                                                return `${d}/${m}/${y}`
                                            }
                                            return format(new Date(plan.start_date), 'dd/MM/yyyy')
                                        })() : 'N/A'}
                                    </TableCell>
                                    <TableCell>
                                        {plan.created_at ? format(new Date(plan.created_at), 'dd/MM/yyyy p', { locale: es }) : 'N/A'}
                                    </TableCell>
                                    <TableCell>
                                        <Chip
                                            label={plan.is_submitted ? (isAdmin ? "Recibido" : "Enviado") : "Borrador"}
                                            color={plan.is_submitted ? (isAdmin ? "info" : "success") : "default"}
                                            size="small"
                                        />
                                        {plan.archivo_url && <Chip label="PDF" color="info" size="small" sx={{ ml: 1 }} />}
                                    </TableCell>
                                    <TableCell align="right">
                                        <Tooltip title="Ver">
                                            <IconButton onClick={() => onView(plan)} color="primary" size="small">
                                                <i className="ri-eye-line"></i>
                                            </IconButton>
                                        </Tooltip>

                                        {!plan.archivo_url ? (
                                            <Tooltip title="Descargar PDF">
                                                <IconButton
                                                    onClick={async () => {
                                                        try {
                                                            const { exportLessonPlanPdf } = await import('@/services/lessonPlanService')
                                                            const response = await exportLessonPlanPdf(plan.id!)
                                                            const file = new Blob([response.data], { type: 'application/pdf' })
                                                            const url = window.URL.createObjectURL(file)
                                                            const link = document.createElement('a')
                                                            link.href = url
                                                            link.setAttribute('download', `plan_clase_${plan.id}.pdf`)
                                                            document.body.appendChild(link)
                                                            link.click()
                                                            link.parentNode?.removeChild(link)
                                                            window.URL.revokeObjectURL(url)
                                                            import('react-hot-toast').then(t => t.toast.success("PDF descargado"))
                                                        } catch (e) {
                                                            import('react-hot-toast').then(t => t.toast.error("Error al descargar PDF"))
                                                        }
                                                    }}
                                                    color="error"
                                                    size="small"
                                                >
                                                    <i className="ri-file-pdf-2-line"></i>
                                                </IconButton>
                                            </Tooltip>
                                        ) : (
                                            <Tooltip title="Descargar Archivo Adjunto">
                                                <IconButton
                                                    component="a"
                                                    href={plan.file_full_url || plan.archivo_url}
                                                    target="_blank"
                                                    color="info"
                                                    size="small"
                                                >
                                                    <i className="ri-download-2-line"></i>
                                                </IconButton>
                                            </Tooltip>
                                        )}
                                        {/* Copy Button - Hide for General Plans */}
                                        {!isAdmin && onCopy && (plan.user_id === plan.current_user_id || canEdit) && !plan.is_general && plan.asignatura?.permitir_copia && (
                                            <Tooltip title="Copiar Plan (Crear nuevo borrador)">
                                                <IconButton onClick={() => onCopy(plan)} color="secondary" size="small">
                                                    <i className="ri-file-copy-line"></i>
                                                </IconButton>
                                            </Tooltip>
                                        )}
                                        {/* Only show edit/delete if NOT admin, and (owner or has permission) - Removed !plan.is_submitted check */}
                                        {!isAdmin && (plan.user_id === plan.current_user_id || canEdit) && (
                                             <Tooltip title="Editar">
                                                 <IconButton onClick={() => onEdit(plan)} color="info" size="small">
                                                     <i className="ri-pencil-line"></i>
                                                 </IconButton>
                                             </Tooltip>
                                         )}
                                        {!isAdmin && (plan.user_id === plan.current_user_id || canDelete) && (
                                             <Tooltip title="Eliminar">
                                                 <IconButton onClick={() => onDelete(plan.id!)} color="error" size="small">
                                                     <i className="ri-delete-bin-line"></i>
                                                 </IconButton>
                                             </Tooltip>
                                         )}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                        {(onPageChange && onRowsPerPageChange) && (
                            <TableFooter>
                                <TableRow>
                                    <TablePagination
                                        rowsPerPageOptions={[15, 30, 50, 100]}
                                        count={totalRows}
                                        rowsPerPage={rowsPerPage}
                                        page={page}
                                        onPageChange={onPageChange}
                                        onRowsPerPageChange={onRowsPerPageChange}
                                        labelRowsPerPage="Filas por página:"
                                        labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count !== -1 ? count : `más de ${to}`}`}
                                        colSpan={7}
                                    />
                                </TableRow>
                            </TableFooter>
                        )}
                    </Table>
                 </TableContainer>
             )}
        </TabPanel>
        {showPending && (
            <TabPanel value="2">
             {pendingTeachers.length === 0 ? (
                 <Typography variant="body2" sx={{p:2, textAlign:'center'}}>¡Todos los docentes han planificado!</Typography>
             ) : (
                <TableContainer component={Paper} elevation={0} variant="outlined">
                    <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell>Docente</TableCell>
                                    <TableCell>Asignatura</TableCell>
                                    <TableCell>Grupo</TableCell>
                                </TableRow>
                            </TableHead>
                             <TableBody>
                                {pendingTeachers.map((teacher: any, idx: number) => (
                                    <TableRow key={`${teacher.user_id}-${teacher.asignatura_id}-${teacher.grupo_id}-${idx}`}>
                                        <TableCell>{teacher.docente_nombre}</TableCell>
                                        <TableCell>{teacher.asignatura_nombre}</TableCell>
                                        <TableCell>{teacher.grupo_nombre}</TableCell>
                                    </TableRow>
                                ))}
                             </TableBody>
                    </Table>
                </TableContainer>
             )}
            </TabPanel>
        )}
      </TabContext>
    </Card>
  )
}

export default LessonPlanList
