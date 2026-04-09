'use client';

import {
    Check as IconCheck,
    Visibility as IconEye,
    Message as IconMessage,
    AttachFile as IconPaperclip
} from '@mui/icons-material';
import {
    Box,
    Chip,
    Divider,
    Pagination,
    Skeleton,
    Stack,
    Typography
} from '@mui/material';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

import { useAuth } from '@/hooks/useAuth';
import { mensajeriaService } from '../services/mensajeriaService';
import type { FiltroMensaje } from '../types';

interface MensajeListProps {
  filtro: FiltroMensaje;
  refreshKey?: number;
}

interface PaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export default function MensajeList({ filtro, refreshKey = 0 }: MensajeListProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [mensajes, setMensajes] = useState<any[]>([]);
  const [paginationMeta, setPaginationMeta] = useState<PaginationMeta | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchMensajes = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await mensajeriaService.getMensajes({ filtro, page });
      // Extraer data y meta del response
      if (response && typeof response === 'object' && 'data' in response) {
        setMensajes(response.data || []);
        if ('meta' in response) {
          setPaginationMeta(response.meta as PaginationMeta);
        }
      } else {
        // Fallback si la respuesta es directamente el array
        setMensajes(response as any || []);
      }
    } catch (error: any) {
      console.error('Error fetching mensajes:', JSON.stringify(error, null, 2));
      // If error provides a message, maybe log it too just in case
      if (error?.message) console.error('Error message:', error.message);
      
      setMensajes([]);
      setPaginationMeta(null);
    } finally {
      setIsLoading(false);
    }
  }, [filtro, page]);

  useEffect(() => {
    fetchMensajes();
  }, [fetchMensajes, refreshKey]);

  // Reset page when filter changes
  useEffect(() => {
    setPage(1);
  }, [filtro]);

  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
  };

  const skeletons = Array.from({ length: 5 });

  if (isLoading) {
    return (
      <Stack spacing={0} divider={<Divider />}>
        {skeletons.map((_, i) => (
          <Box key={i} sx={{ p: 3 }}>
             <Skeleton variant="text" width="30%" height={30} />
             <Skeleton variant="text" width="60%" height={24} />
             <Skeleton variant="text" width="90%" height={20} />
          </Box>
        ))}
      </Stack>
    );
  }

  if (!mensajes || mensajes.length === 0) {
    return (
      <Box sx={{ p: 6, textAlign: 'center' }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
          <IconMessage sx={{ fontSize: 48, color: 'text.secondary' }} />
        </Box>
        <Typography variant="h6" gutterBottom>No hay mensajes</Typography>
        <Typography variant="body2" color="text.secondary">
          No tienes mensajes en esta categoría.
        </Typography>
      </Box>
    );
  }

  const getTipoIcon = (tipo: string) => {
    switch (tipo) {
      case 'LECTURA':
        return <IconEye fontSize="small" />;
      case 'CONFIRMACION':
        return <IconCheck fontSize="small" />;
      default:
        return <IconMessage fontSize="small" />;
    }
  };

  const getTipoLabel = (tipo: string) => {
    switch (tipo) {
      case 'LECTURA':
        return 'Lectura';
      case 'CONFIRMACION':
        return 'Confirmación';
      default:
        return 'General';
    }
  };

  return (
    <>
      <Stack spacing={0} divider={<Divider />}>
        {mensajes.map((mensaje) => {
          // Determine status relative to current user
          const recipientEntry = mensaje.destinatarios?.find((d: any) => d.user_id == user?.id);
          const esNoLeido = recipientEntry ? recipientEntry.estado === 'no_leido' : false;
          
          return (
            <Box
              key={mensaje.id}
              sx={{
                py: 1.5,
                px: 2,
                cursor: 'pointer',
                bgcolor: esNoLeido ? 'primary.lighter' : 'background.paper',
                borderLeft: esNoLeido ? 3 : 0,
                borderLeftColor: 'primary.main',
                transition: 'all 0.2s ease-in-out',
                borderBottom: '1px solid',
                borderColor: 'divider',
                '&:hover': {
                  bgcolor: 'action.hover',
                  transform: 'translateX(2px)'
                }
              }}
              onClick={() => router.push(`/mensajeria/${mensaje.id}`)}
            >
               <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 0.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                     <Typography variant="subtitle2" fontWeight={esNoLeido ? 700 : 600} color="text.primary">
                        {mensaje.remitente?.nombre_completo || 'Desconocido'}
                     </Typography>
                     {esNoLeido && (
                        <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'primary.main', display: 'inline-block' }} />
                     )}
                  </Box>
                  <Typography variant="caption" color="text.disabled" sx={{ whiteSpace: 'nowrap', ml: 1 }}>
                     {formatDistanceToNow(new Date(mensaje.created_at), { addSuffix: true, locale: es })}
                  </Typography>
               </Box>

               <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box sx={{ flex: 1, minWidth: 0, mr: 2 }}>
                     <Typography variant="body2" sx={{ fontWeight: esNoLeido ? 600 : 500, color: 'text.primary', mb: 0.25 }}>
                        {mensaje.asunto}
                     </Typography>
                     <Typography 
                        variant="caption" 
                        color="text.secondary" 
                        sx={{ 
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          display: '-webkit-box',
                          WebkitLineClamp: 1,
                          WebkitBoxOrient: 'vertical',
                          lineHeight: 1.5
                        }}
                     >
                        {mensaje.contenido}
                     </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', gap: 0.5, flexShrink: 0, alignItems: 'center' }}>
                      <Chip 
                        icon={getTipoIcon(mensaje.tipo_mensaje) as any} 
                        label={getTipoLabel(mensaje.tipo_mensaje)} 
                        size="small" 
                        variant="outlined"
                        sx={{ height: 20, fontSize: '0.7rem', '& .MuiChip-icon': { fontSize: '0.9rem' } }} 
                      />

                      {mensaje.adjuntos && mensaje.adjuntos.length > 0 && (
                        <Chip
                          icon={<IconPaperclip fontSize="small" />}
                          label={mensaje.adjuntos.length}
                          size="small"
                          variant="outlined"
                          sx={{ height: 20, fontSize: '0.7rem', '& .MuiChip-icon': { fontSize: '0.9rem' } }}
                        />
                      )}
                  </Box>
               </Box>
            </Box>
          );
        })}
      </Stack>

      {/* Paginación */}
      {paginationMeta && paginationMeta.last_page > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 3, gap: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Página {paginationMeta.current_page} de {paginationMeta.last_page} 
            ({paginationMeta.total} mensajes)
          </Typography>
          <Pagination 
            count={paginationMeta.last_page} 
            page={paginationMeta.current_page}
            onChange={handlePageChange}
            color="primary"
            showFirstButton
            showLastButton
          />
        </Box>
      )}
    </>
  );
}
