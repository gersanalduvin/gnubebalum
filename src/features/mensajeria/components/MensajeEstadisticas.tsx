'use client';

import {
    CheckCircle as IconCheckCircle,
    Circle as IconCircle,
    ExpandMore as IconExpandMore,
    People as IconPeople
} from '@mui/icons-material';
import {
    Accordion,
    AccordionDetails,
    AccordionSummary,
    Avatar,
    Box,
    Card,
    CardContent,
    Chip,
    CircularProgress,
    Divider,
    LinearProgress,
    List,
    ListItem,
    ListItemAvatar,
    ListItemText,
    Typography
} from '@mui/material';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { useEffect, useState } from 'react';

import { mensajeriaService } from '../services/mensajeriaService';

interface MensajeEstadisticasProps {
  mensajeId: string;
}

interface EstadisticasData {
  total_destinatarios: number;
  total_leidos: number;
  total_no_leidos: number;
  porcentaje_lectura: number;
  usuarios_leidos: Array<{
    id: number;
    nombre_completo: string;
    email: string;
    fecha_lectura: string | null;
    ip: string | null;
    user_agent: string | null;
  }>;
  usuarios_no_leidos: Array<{
    id: number;
    nombre_completo: string;
    email: string;
  }>;
}

export default function MensajeEstadisticas({ mensajeId }: MensajeEstadisticasProps) {
  const [estadisticas, setEstadisticas] = useState<EstadisticasData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchEstadisticas = async () => {
      try {
        const data = await mensajeriaService.getEstadisticas(mensajeId);
        setEstadisticas(data);
      } catch (error) {
        console.error('Error fetching estadisticas:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchEstadisticas();
  }, [mensajeId]);

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!estadisticas) {
    return null;
  }

  return (
    <Card variant="outlined">
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
          <IconPeople color="primary" />
          <Typography variant="h6">Estadísticas de Lectura</Typography>
        </Box>

        {/* Resumen */}
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Porcentaje de lectura
            </Typography>
            <Typography variant="body2" fontWeight="bold">
              {estadisticas.porcentaje_lectura}%
            </Typography>
          </Box>
          <LinearProgress 
            variant="determinate" 
            value={estadisticas.porcentaje_lectura} 
            sx={{ height: 8, borderRadius: 1 }}
          />
        </Box>

        {/* Chips de resumen */}
        <Box sx={{ display: 'flex', gap: 1, mb: 3, flexWrap: 'wrap' }}>
          <Chip 
            icon={<IconPeople />}
            label={`Total: ${estadisticas.total_destinatarios}`}
            variant="outlined"
          />
          <Chip 
            icon={<IconCheckCircle />}
            label={`Leídos: ${estadisticas.total_leidos}`}
            color="success"
            variant="outlined"
          />
          <Chip 
            icon={<IconCircle />}
            label={`No leídos: ${estadisticas.total_no_leidos}`}
            color="warning"
            variant="outlined"
          />
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Lista de usuarios que leyeron */}
        {estadisticas.usuarios_leidos.length > 0 && (
          <Accordion defaultExpanded>
            <AccordionSummary expandIcon={<IconExpandMore />}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <IconCheckCircle color="success" fontSize="small" />
                <Typography>
                  Usuarios que leyeron ({estadisticas.total_leidos})
                </Typography>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <List dense>
                {estadisticas.usuarios_leidos.map((usuario) => (
                  <ListItem key={usuario.id}>
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: 'success.main' }}>
                        {usuario.nombre_completo.charAt(0).toUpperCase()}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={usuario.nombre_completo}
                      secondary={
                        <>
                          {usuario.email}
                          {usuario.fecha_lectura && (
                            <>
                              {' • '}
                              Leído {formatDistanceToNow(new Date(usuario.fecha_lectura), { 
                                addSuffix: true, 
                                locale: es 
                              })}
                            </>
                          )}
                        </>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </AccordionDetails>
          </Accordion>
        )}

        {/* Lista de usuarios que NO leyeron */}
        {estadisticas.usuarios_no_leidos.length > 0 && (
          <Accordion>
            <AccordionSummary expandIcon={<IconExpandMore />}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <IconCircle color="warning" fontSize="small" />
                <Typography>
                  Usuarios que no han leído ({estadisticas.total_no_leidos})
                </Typography>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <List dense>
                {estadisticas.usuarios_no_leidos.map((usuario) => (
                  <ListItem key={usuario.id}>
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: 'warning.main' }}>
                        {usuario.nombre_completo.charAt(0).toUpperCase()}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={usuario.nombre_completo}
                      secondary={usuario.email}
                    />
                  </ListItem>
                ))}
              </List>
            </AccordionDetails>
          </Accordion>
        )}
      </CardContent>
    </Card>
  );
}
