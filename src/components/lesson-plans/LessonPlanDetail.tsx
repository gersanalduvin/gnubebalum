import { LessonPlan } from '@/services/lessonPlanService'
import {
    Box,
    Button,
    Card,
    CardContent,
    CardHeader,
    Chip,
    CircularProgress,
    Divider,
    Grid,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableRow,
    Typography
} from '@mui/material'
import React from 'react'
import { toast } from 'react-hot-toast'

interface LessonPlanDetailProps {
  plan: LessonPlan
  onBack: () => void
  asignaturas?: any[] // List of available subjects for fallback lookup
}

const LessonPlanDetail: React.FC<LessonPlanDetailProps> = ({ plan, onBack, asignaturas = [] }) => {
  // Helper to parse content safely
  const getContent = () => {
    if (typeof plan.contenido === 'string') {
        try {
            return JSON.parse(plan.contenido)
        } catch {
            return {}
        }
    }
    return plan.contenido || {}
  }
  
  // Helper to get subject name
  const getSubjectName = () => {
      if (plan.is_general) return 'PLAN GENERAL'
      if (plan.asignatura?.nombre) return plan.asignatura.nombre
      if (plan.asignatura?.materia?.nombre) return plan.asignatura.materia.nombre
      
      if (plan.asignatura_id && asignaturas.length > 0) {
          const found = asignaturas.find(a => a.id === plan.asignatura_id)
          if (found) return found.nombre || found.materia?.nombre || found.asignatura?.nombre
      }
      
      return plan.is_general || !plan.asignatura_id ? 'PLAN GENERAL' : `ID: ${plan.asignatura_id}`
  }

  // Helper to format date
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A'
    // Split by T to handle ISO, then by -
    const [y, m, d] = dateString.split('T')[0].split('-')
    return `${d}/${m}/${y}`
  }

  const renderAttachments = (archivos?: any[]) => {
    if (!archivos || archivos.length === 0) return null;
    return (
        <Box sx={{ mt: 0.5, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            {archivos.map((url, idx) => {
                const fileName = typeof url === 'string' ? url.split('/').pop() || 'Archivo' : 'Archivo';
                return (
                    <Chip
                        key={idx}
                        label={fileName.length > 25 ? fileName.substring(0, 25) + '...' : fileName}
                        component="a"
                        href={url}
                        target="_blank"
                        clickable
                        icon={<i className="ri-attachment-line" style={{ fontSize: '0.9rem' }}></i>}
                        size="small"
                        color="primary"
                        variant="outlined"
                        title={typeof url === 'string' ? fileName : ''}
                        sx={{ height: '22px', '& .MuiChip-label': { px: 1, fontSize: '0.75rem' } }}
                    />
                );
            })}
        </Box>
    );
  };

  const content = getContent()
  const hasFile = !!plan.archivo_url

  // URL for file - assuming standard storage URL or S3
  // If only path is stored, prefix might be needed. Looking at network response in previous screenshots
  // User response: "lesson_plans/..." (S3 path likely).
  // Need a way to convert to full URL. Usually helper or configured base URL.
  // For now, assume a full URL generation logic is needed or verify if backend sends full URL.
  // Backend code showed `data['archivo_url'] = $path`.
  // Use file_full_url directly. Fallback to '#' if missing to avoid 404 local links.
  const fileUrl = plan.file_full_url || '#'

  const [isExporting, setIsExporting] = React.useState(false)

  const handleExportPdf = async () => {
    try {
        setIsExporting(true)
        if (!plan.id) throw new Error("ID del plan no encontrado")
        const response = await (await import('@/services/lessonPlanService')).exportLessonPlanPdf(plan.id)
        
        const file = new Blob([response.data], { type: 'application/pdf' })
        const url = window.URL.createObjectURL(file)
        const link = document.createElement('a')
        link.href = url
        link.setAttribute('download', `plan_clase_${plan.id}.pdf`)
        document.body.appendChild(link)
        link.click()
        link.parentNode?.removeChild(link)
        window.URL.revokeObjectURL(url)
        
        toast.success("PDF generado correctamente")
    } catch (e) {
        console.error("Error exporting PDF", e)
        toast.error("Error al generar el PDF")
    } finally {
        setIsExporting(false)
    }
  }

  return (
    <Card>
      <CardHeader
        title={
            <Box display="flex" alignItems="center" gap={2}>
                <Typography variant="h6">Detalle del Plan de Clase</Typography>
                <Chip 
                    label={plan.is_submitted ? "Enviado" : "Borrador"} 
                    color={plan.is_submitted ? "success" : "default"} 
                    size="small" 
                />
            </Box>
        }
        action={
          <Box sx={{ display: 'flex', gap: 1 }}>
              <Button 
                variant="outlined" 
                color="secondary"
                onClick={handleExportPdf}
                disabled={isExporting}
                startIcon={isExporting ? <CircularProgress size={16} /> : <i className="ri-file-download-line"></i>}
              >
                {isExporting ? 'Generando...' : 'Descargar PDF'}
              </Button>
              <Button variant="outlined" onClick={onBack} startIcon={<i className="ri-arrow-left-line"></i>}>
                Volver
              </Button>
          </Box>
        }
      />
      <CardContent>
        {/* Header Info */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} md={3}>
                <Typography variant="subtitle2" color="text.secondary">Docente</Typography>
                <Typography variant="body1">{plan.user?.name || 'N/A'}</Typography>
            </Grid>
            <Grid item xs={12} md={3}>
                <Typography variant="subtitle2" color="text.secondary">Fecha Inicio</Typography>
                <Typography variant="body1">{formatDate(plan.start_date)}</Typography>
            </Grid>
            <Grid item xs={12} md={3}>
                <Typography variant="subtitle2" color="text.secondary">Fecha Fin</Typography>
                <Typography variant="body1">{formatDate(plan.end_date)}</Typography>
            </Grid>
            <Grid item xs={12} md={3}>
                <Typography variant="subtitle2" color="text.secondary">Nivel</Typography>
                <Typography variant="body1" sx={{ textTransform: 'capitalize' }}>{plan.nivel}</Typography>
            </Grid>
            <Grid item xs={12} md={3}>
                <Typography variant="subtitle2" color="text.secondary">Asignatura</Typography>
                <Typography variant="body1">{getSubjectName()}</Typography>
            </Grid>
            <Grid item xs={12} md={9}>
                <Typography variant="subtitle2" color="text.secondary">Grupos</Typography>
                <Box display="flex" gap={1} flexWrap="wrap">
                    {plan.groups?.map((g: any) => (
                        <Chip key={g.id} label={g.nombre || `${g.grado?.nombre || ''} ${g.seccion?.nombre || ''}`} size="small" />
                    ))}
                    {(!plan.groups || plan.groups.length === 0) && <Typography variant="body2">-</Typography>}
                </Box>
            </Grid>
        </Grid>

        <Divider sx={{ my: 2 }} />

        {/* Content or File */}
        {hasFile ? (
            <Box sx={{ 
                mt: 2, 
                p: 3, 
                border: '1px dashed', 
                borderColor: 'divider',
                borderRadius: 1, 
                textAlign: 'center', 
                bgcolor: 'action.hover' 
            }}>
                <Typography variant="h6" gutterBottom>Archivo Adjunto</Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                    Este plan de clase tiene un archivo PDF adjunto. 
                </Typography>
                <Button 
                    variant="contained" 
                    color="primary"
                    component="a" 
                    href={fileUrl} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    startIcon={<i className="ri-file-pdf-line"></i>}
                >
                    Ver Archivo en Nueva Ventana
                </Button>
            </Box>
        ) : (
            <Box>
                {/* Dynamic Content Display */}
                <Grid container spacing={2}>
                    {plan.nivel !== 'primaria' && (
                        <>
                            <Grid item xs={12}>
                                <Typography variant="subtitle2" color="text.secondary">Objetivo / Aprendizaje Esperado</Typography>
                                <Box sx={{ p: 2, bgcolor: 'background.default', borderRadius: 1, mt: 1 }}>
                                    <Typography variant="body1">{content.objetivo || 'Sin objetivo definido'}</Typography>
                                </Box>
                            </Grid>
                            <Grid item xs={12}>
                                <Typography variant="subtitle2" color="text.secondary">Contenido Principal / Tema</Typography>
                                <Box sx={{ p: 2, bgcolor: 'background.default', borderRadius: 1, mt: 1 }}>
                                    <Typography variant="body1">{content.contenido_principal || 'Sin contenido definido'}</Typography>
                                </Box>
                            </Grid>
                        </>
                    )}

                    {/* Sections */}
                    {content.secciones && Array.isArray(content.secciones) && content.secciones.map((section: any, index: number) => (
                        <Grid item xs={12} key={index} sx={{ mt: 2 }}>
                            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>{section.titulo}</Typography>
                            
                            {section.tipo === 'tabla' ? (
                                <TableContainer component={Paper} elevation={0} variant="outlined">
                                    <Table size="small">

                                        <TableBody>
                                            {section.campos?.map((campo: any, cIndex: number) => (
                                                <TableRow key={cIndex}>
                                                    <TableCell width="30%" sx={{ fontWeight: 500, bgcolor: 'action.hover' }}>{campo.nombre}</TableCell>
                                                    <TableCell>
                                                        <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{campo.valor}</Typography>
                                                        {renderAttachments(campo.archivos)}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            ) : (
                                <Grid container spacing={2}>
                                    {section.campos?.map((campo: any, cIndex: number) => (
                                        <Grid item xs={12} sm={6} key={cIndex}>
                                            <Typography variant="subtitle2" color="text.secondary">{campo.nombre}</Typography>
                                            <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{campo.valor}</Typography>
                                            {renderAttachments(campo.archivos)}
                                        </Grid>
                                    ))}
                                </Grid>
                            )}
                        </Grid>
                    ))}
                </Grid>
            </Box>
        )}

      </CardContent>
    </Card>
  )
}

export default LessonPlanDetail
