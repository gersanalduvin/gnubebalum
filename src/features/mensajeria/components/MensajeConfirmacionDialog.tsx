'use client';

import { Check as IconCheck, Close as IconX } from '@mui/icons-material';
import {
    Button,
    Collapse,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    Grid,
    Paper,
    TextField,
    Typography
} from '@mui/material';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';

import { mensajeriaService } from '../services/mensajeriaService';

interface MensajeConfirmacionDialogProps {
  open: boolean;
  onClose: () => void;
  mensajeId: string;
  onSuccess: () => void;
}

export default function MensajeConfirmacionDialog({ 
  open, 
  onClose, 
  mensajeId, 
  onSuccess 
}: MensajeConfirmacionDialogProps) {
  const [confirmacion, setConfirmacion] = useState<'SI' | 'NO'>('SI');
  const [razon, setRazon] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Limpiar estado al abrir/cerrar
  useEffect(() => {
    if (open) {
      setConfirmacion('SI');
      setRazon('');
      setError(null);
    }
  }, [open]);

  const handleSubmit = async () => {
    if (confirmacion === 'NO' && !razon.trim()) {
       setError('Por favor, indica la razón por la que no asistirás.');
       return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await mensajeriaService.confirmarMensaje(mensajeId, confirmacion, razon);
      toast.success('Confirmación registrada exitosamente');
      onSuccess();
      onClose();
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Error al registrar confirmación';
      toast.error(msg);
      // Si el error viene de backend (validacion), mostrarlo en el input también si es posible
      if (msg.includes('razon')) {
         setError(msg);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Confirmar Asistencia</DialogTitle>
      <DialogContent>
        <DialogContentText sx={{ mb: 3 }}>
          Por favor, selecciona tu respuesta para este evento o solicitud.
        </DialogContentText>
        
        <Grid container spacing={2} sx={{ mb: 3 }}>
           <Grid item xs={6}>
              <Paper 
                variant="outlined" 
                sx={{ 
                  p: 2, 
                  textAlign: 'center', 
                  cursor: 'pointer',
                  borderColor: confirmacion === 'SI' ? 'success.main' : 'divider',
                  bgcolor: confirmacion === 'SI' ? 'success.lighter' : 'background.paper',
                  borderWidth: confirmacion === 'SI' ? 2 : 1,
                  transition: 'all 0.2s'
                }}
                onClick={() => { setConfirmacion('SI'); setError(null); }}
              >
                 <IconCheck sx={{ fontSize: 32, color: confirmacion === 'SI' ? 'green' : 'gray' }} />
                 <Typography variant="subtitle1" fontWeight="bold" sx={{ mt: 1 }}>SÍ</Typography>
              </Paper>
           </Grid>
           <Grid item xs={6}>
              <Paper 
                variant="outlined" 
                sx={{ 
                  p: 2, 
                  textAlign: 'center', 
                  cursor: 'pointer',
                  borderColor: confirmacion === 'NO' ? 'error.main' : 'divider',
                  bgcolor: confirmacion === 'NO' ? 'error.lighter' : 'background.paper',
                  borderWidth: confirmacion === 'NO' ? 2 : 1,
                  transition: 'all 0.2s'
                }}
                onClick={() => setConfirmacion('NO')}
              >
                 <IconX sx={{ fontSize: 32, color: confirmacion === 'NO' ? 'red' : 'gray' }} />
                 <Typography variant="subtitle1" fontWeight="bold" sx={{ mt: 1 }}>NO</Typography>
              </Paper>
           </Grid>
        </Grid>

        <Collapse in={confirmacion === 'NO'}>
             <TextField
                fullWidth
                label="Razón (Obligatorio)"
                multiline
                rows={3}
                value={razon}
                onChange={(e) => {
                    setRazon(e.target.value);
                    if (e.target.value.trim()) setError(null);
                }}
                error={!!error}
                helperText={error}
                placeholder="Por favor explica brevemente por qué no puedes asistir..."
                variant="outlined"
             />
        </Collapse>

      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="inherit">Cancelar</Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained" 
          color="primary"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Enviando...' : 'Confirmar Respuesta'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
