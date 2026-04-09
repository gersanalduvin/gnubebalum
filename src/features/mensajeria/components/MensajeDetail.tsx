'use client';

import {
    ArrowBack as IconArrowLeft,
    CalendarToday as IconCalendar,
    Check as IconCheck,
    Download as IconDownload,
    Reply as IconMessageReply,
    AttachFile as IconPaperclip,
    Person as IconUser,
    Close as IconX
} from '@mui/icons-material';
import {
    Avatar,
    Box,
    Button,
    Card,
    CardActions,
    CardContent,
    CardHeader,
    Chip,
    Divider,
    Grid,
    Paper,
    Skeleton,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography
} from '@mui/material';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

import { useAuth } from '@/hooks/useAuth';
import { createEcho } from '@/lib/echo';
import { mensajeriaService } from '../services/mensajeriaService';
import { Mensaje } from '../types';
import MensajeConfirmacionDialog from './MensajeConfirmacionDialog';
import MensajeEstadisticas from './MensajeEstadisticas';
import MensajeRespuestaForm from './MensajeRespuestaForm';

interface MensajeDetailProps {
  mensajeId: string;
}

export default function MensajeDetail({ mensajeId }: MensajeDetailProps) {
  const router = useRouter();
  const { user, accessToken } = useAuth();
  const [showRespuestaForm, setShowRespuestaForm] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [mensaje, setMensaje] = useState<Mensaje | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [canReply, setCanReply] = useState(false);

  const isOfficeDoc = (filename: string) => {
      const ext = filename?.split('.').pop()?.toLowerCase() || '';
      return ['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'].includes(ext);
  };

  const getAttachmentUrl = useCallback((adjunto: any) => {
      if (isOfficeDoc(adjunto.nombre)) {
          return `https://view.officeapps.live.com/op/view.aspx?src=${encodeURIComponent(adjunto.s3_url)}`;
      }
      return adjunto.s3_url;
  }, []);

  useEffect(() => {
    // Check permissions on mount
    const permsStr = localStorage.getItem('permissions');
    if (user?.superadmin) {
        setCanReply(true);
        return;
    }

    if (permsStr) {
        try {
            const p = JSON.parse(permsStr);
            // Helper to check standard array or object-values
            const hasPermissionInCollection = (collection: any) => {
                if (collection === 'todos') return true;
                if (Array.isArray(collection)) return collection.includes('redactar_mensaje');
                if (typeof collection === 'object' && collection !== null) {
                    return Object.values(collection).includes('redactar_mensaje');
                }
                return false;
            };

            // Check wrapping structure or direct structure
            if (p.permisos && hasPermissionInCollection(p.permisos)) {
                setCanReply(true);
            } else if (hasPermissionInCollection(p)) {
                setCanReply(true);
            }
        } catch (e) {
            console.error("Error parsing permissions", e);
        }
    }
  }, [user]);

  const fetchMensaje = useCallback(async () => {
    if (!mensajeId) {
        console.error("fetchMensaje: mensajeId no definido");
        return;
    }
    
    setIsLoading(true);
    console.log('Fetching mensaje with ID:', mensajeId);
    try {
      const data = await mensajeriaService.getMensaje(mensajeId);
      console.log('Mensaje fetched successfully:', data);
      setMensaje(data);
    } catch (error: any) {
      console.error('Error fetching mensaje (JSON):', JSON.stringify(error, null, 2));
      console.error('Error fetching mensaje (raw):', error);
      
      if (error?.status === 404) {
          // Manejar no encontrado explícitamente si es necesario
      }
    } finally {
      setIsLoading(false);
    }
  }, [mensajeId]);

  useEffect(() => {
    fetchMensaje();
  }, [fetchMensaje]);

  useEffect(() => {
    if (user && accessToken) {
        const echo = createEcho(accessToken);
        echo.private(`App.Models.User.${user.id}`)
            .listen('MensajeEnviado', (e: any) => {
                // If the event is about this message (update/reply), refresh it
                if (e.mensaje && e.mensaje.id == mensajeId) {
                   fetchMensaje();
                }
            })
            .listen('MensajeLeido', (e: any) => {
                if (e.mensaje_id == mensajeId) {
                   fetchMensaje();
                }
            });
            
        return () => {
            echo.leave(`App.Models.User.${user.id}`);
        };
    }
  }, [user, accessToken, mensajeId, fetchMensaje]);

  if (isLoading) {
    return (
      <Box sx={{ p: 3 }}>
        <Skeleton variant="rectangular" height={100} sx={{ mb: 2 }} />
        <Skeleton variant="rectangular" height={300} />
      </Box>
    );
  }

  if (!mensaje) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Card>
          <CardContent>
            <Typography variant="h6">Mensaje no encontrado</Typography>
            <Button onClick={() => router.back()} sx={{ mt: 2 }}>Volver</Button>
          </CardContent>
        </Card>
      </Box>
    );
  }

  const getTipoChip = (tipo: string) => {
    switch (tipo) {
      case 'LECTURA':
        return <Chip label="Lectura" color="info" variant="outlined" />;
      case 'CONFIRMACION':
        return <Chip label="Confirmación" color="warning" variant="outlined" />;
      default:
        return <Chip label="General" variant="outlined" />;
    }
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <Button 
          startIcon={<IconArrowLeft />} 
          onClick={() => router.back()}
          color="inherit"
        >
          Volver
        </Button>
        <Typography variant="h5" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
           {mensaje.asunto}
        </Typography>
        {getTipoChip(mensaje.tipo_mensaje)}
      </Box>

      {/* Mensaje principal */}
      <Card sx={{ mb: 4 }}>
        <CardHeader
          avatar={
            <Avatar sx={{ bgcolor: 'primary.main' }}>
              <IconUser />
            </Avatar>
          }
          title={mensaje.remitente.nombre_completo}
          subheader={
             <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
               <Typography variant="body2" color="text.secondary">{mensaje.remitente.email}</Typography>
               <Typography variant="body2" color="text.secondary">•</Typography>
               <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'text.secondary' }}>
                 <IconCalendar fontSize="small" sx={{ fontSize: 14 }} />
                 <Typography variant="body2">
                   {format(new Date(mensaje.created_at), "d 'de' MMMM 'de' yyyy, HH:mm", { locale: es })}
                 </Typography>
               </Box>
             </Box>
          }
        />
        <Divider />
        <CardContent>
          <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', mb: 3 }}>
            {mensaje.contenido}
          </Typography>

          {/* Adjuntos */}
          {mensaje.adjuntos && mensaje.adjuntos.length > 0 && (
            <Box sx={{ mt: 3, p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
              <Typography variant="subtitle2" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <IconPaperclip /> Archivos adjuntos ({mensaje.adjuntos.length})
              </Typography>
              <Grid container spacing={2}>
                {mensaje.adjuntos.map((adjunto, index) => (
                  <Grid item xs={12} md={6} key={index}>
                    <Button
                      component="a"
                      href={getAttachmentUrl(adjunto)}
                      target="_blank"
                      rel="noopener noreferrer"
                      variant="outlined"
                      fullWidth
                      startIcon={<IconDownload />}
                      sx={{ justifyContent: 'flex-start', textAlign: 'left' }}
                    >
                      <Box sx={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        <Typography variant="body2" noWrap>{adjunto.nombre}</Typography>
                        <Typography variant="caption" display="block" color="text.secondary">
                          {(adjunto.size / 1024 / 1024).toFixed(2)} MB
                        </Typography>
                      </Box>
                    </Button>
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}
        </CardContent>

        {/* Estadísticas de Lectura - Para el remitente */}
        {user?.id == mensaje.remitente.id && (
          <CardContent sx={{ pt: 0 }}>
            <MensajeEstadisticas mensajeId={mensajeId} />
          </CardContent>
        )}

        {/* Estadísticas de Confirmación */}
        {mensaje.tipo_mensaje === 'CONFIRMACION' && (
          <CardContent sx={{ pt: 0 }}>
            <Divider sx={{ mb: 2 }}>Confirmaciones de Asistencia</Divider>
               
               {user?.id == mensaje.remitente.id ? (
                  // Vista para el REMITENTE: Estadísticas y Lista
                  <>
                     <Grid container spacing={2} sx={{ mb: 3 }}>
                       <Grid item xs={6}>
                          <Card variant="outlined" sx={{ textAlign: 'center', p: 2, bgcolor: 'success.lighter', borderColor: 'success.main' }}>
                             <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 1 }}>
                                <IconCheck color="success" />
                                <Typography variant="h4" color="success.main" fontWeight="bold">
                                  {mensaje.confirmaciones_si}
                                </Typography>
                             </Box>
                             <Typography variant="body2" color="text.secondary">SÍ</Typography>
                          </Card>
                       </Grid>
                       <Grid item xs={6}>
                          <Card variant="outlined" sx={{ textAlign: 'center', p: 2, bgcolor: 'error.lighter', borderColor: 'error.main' }}>
                             <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 1 }}>
                                <IconX color="error" />
                                <Typography variant="h4" color="error.main" fontWeight="bold">
                                  {mensaje.confirmaciones_no}
                                </Typography>
                             </Box>
                             <Typography variant="body2" color="text.secondary">NO</Typography>
                          </Card>
                       </Grid>
                     </Grid>

                     <Typography variant="subtitle2" sx={{ mb: 2 }}>Detalle de Respuestas</Typography>
                     <TableContainer component={Paper} variant="outlined">
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell>Usuario</TableCell>
                                    <TableCell align="center">Respuesta</TableCell>
                                    <TableCell>Razón / Detalle</TableCell>
                                    <TableCell align="right">Fecha</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {mensaje.confirmaciones?.map((conf) => (
                                    <TableRow key={conf.user_id}>
                                        <TableCell>{conf.usuario_nombre || 'Desconocido'}</TableCell>
                                        <TableCell align="center">
                                            <Chip
                                                label={conf.respuesta}
                                                color={conf.respuesta === 'SI' ? 'success' : 'error'}
                                                size="small"
                                                variant="filled"
                                            />
                                        </TableCell>
                                        <TableCell>
                                            {conf.razon ? (
                                                <Typography variant="body2" color="text.secondary">{conf.razon}</Typography>
                                            ) : (
                                                <Typography variant="caption" color="text.disabled">-</Typography>
                                            )}
                                        </TableCell>
                                        <TableCell align="right">
                                            {format(new Date(conf.fecha), 'dd/MM/yyyy HH:mm', { locale: es })}
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {(!mensaje.confirmaciones || mensaje.confirmaciones.length === 0) && (
                                    <TableRow>
                                        <TableCell colSpan={4} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                                            Aún no hay confirmaciones registradas
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                     </TableContainer>
                  </>
               ) : (
                  // Vista para el DESTINATARIO
                  (() => {
                      const miConfirmacion = mensaje.confirmaciones?.find(c => c.user_id == user?.id);
                      // Si ya respondió, NO permitir cambios (regla estricta solicitada)
                      const isDisabled = !!miConfirmacion;
                      
                      return (
                          <Box>
                              {miConfirmacion ? (
                                  <Paper variant="outlined" sx={{ p: 2, mb: 0, bgcolor: 'background.default', textAlign: 'center' }}>
                                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                          Tu respuesta del {format(new Date(miConfirmacion.fecha), "d 'de' MMMM, HH:mm", { locale: es })}:
                                      </Typography>
                                      <Typography variant="h6" color={miConfirmacion.respuesta === 'SI' ? 'success.main' : 'error.main'} fontWeight="bold">
                                          {miConfirmacion.respuesta === 'SI' ? 'SÍ' : 'NO'}
                                      </Typography>
                                      {miConfirmacion.razon && (
                                          <Typography variant="body2" color="text.secondary" sx={{ mt: 1, fontStyle: 'italic' }}>
                                              "{miConfirmacion.razon}"
                                          </Typography>
                                      )}
                                  </Paper>
                              ) : (
                                  <Button 
                                      variant="contained" 
                                      color="primary"
                                      fullWidth 
                                      size="large"
                                      onClick={() => setShowConfirmDialog(true)}
                                   >
                                     Responder
                                   </Button>
                              )}
                          </Box>
                      );
                  })()
               )}
            </CardContent>
          )}

        {/* Acciones del Footer (Responder) */}
        {mensaje.tipo_mensaje === 'GENERAL' && canReply && (
           <>
              <Divider />
              <CardActions sx={{ p: 2 }}>
                  <Button 
                    startIcon={showRespuestaForm ? <IconX /> : <IconMessageReply />} 
                    variant={showRespuestaForm ? "outlined" : "contained"}
                    onClick={() => setShowRespuestaForm(!showRespuestaForm)}
                    fullWidth
                  >
                    {showRespuestaForm ? 'Cancelar Respuesta' : 'Responder'}
                  </Button>
              </CardActions>
           </>
        )}
      </Card>

      {/* Formulario de Respuesta */}
      {showRespuestaForm && (
        <Box sx={{ mb: 4 }}>
          <MensajeRespuestaForm
            mensajeId={mensajeId}
            onSuccess={() => {
              setShowRespuestaForm(false);
              fetchMensaje();
            }}
          />
        </Box>
      )}

      {/* Lista de Respuestas (Hilo) */}
      {mensaje.respuestas && mensaje.respuestas.length > 0 && (
        <Stack spacing={2} sx={{ mb: 4 }}>
          <Typography variant="h6">Respuestas ({mensaje.respuestas.length})</Typography>
          {mensaje.respuestas.map((respuesta: any) => (
            <Card key={respuesta.id} sx={{ ml: { xs: 0, md: 4 } }}>
               <CardContent>
                 <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                    <Avatar sx={{ width: 32, height: 32 }}>
                       {respuesta.usuario.nombre_completo.charAt(0)}
                    </Avatar>
                    <Box>
                      <Typography variant="subtitle2">{respuesta.usuario.nombre_completo}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {format(new Date(respuesta.created_at), "d 'de' MMMM, HH:mm", { locale: es })}
                      </Typography>
                    </Box>
                 </Box>
                 <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{respuesta.contenido}</Typography>
                 
                 {/* Adjuntos en respuesta */}
                 {respuesta.adjuntos && respuesta.adjuntos.length > 0 && (
                   <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                     {respuesta.adjuntos.map((adjunto: any, idx: number) => (
                       <Chip 
                          key={idx}
                          icon={<IconPaperclip fontSize="small" sx={{ fontSize: 14 }} />}
                          label={adjunto.nombre}
                          component="a"
                          href={getAttachmentUrl(adjunto)}
                          target="_blank"
                          clickable
                          variant="outlined"
                          size="small"
                       />
                     ))}
                   </Box>
                 )}
               </CardContent>
            </Card>
          ))}
        </Stack>
      )}

      {/* Dialog de confirmación */}
      <MensajeConfirmacionDialog
        open={showConfirmDialog}
        onClose={() => setShowConfirmDialog(false)}
        mensajeId={mensajeId}
        onSuccess={() => {
          fetchMensaje();
        }}
      />
    </Box>
  );
}
