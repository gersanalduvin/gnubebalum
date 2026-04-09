'use client';

import {
    InsertDriveFile as IconFile,
    AttachFile as IconPaperclip,
    Send as IconSend,
    Close as IconX
} from '@mui/icons-material';
import {
    Box,
    Button,
    Card,
    CardContent,
    IconButton,
    List,
    ListItem,
    ListItemSecondaryAction,
    ListItemText,
    TextField,
    Typography
} from '@mui/material';
import { useState } from 'react';
import toast from 'react-hot-toast';

import { mensajeriaService } from '../services/mensajeriaService';

interface MensajeRespuestaFormProps {
  mensajeId: string;
  onSuccess: () => void;
}

export default function MensajeRespuestaForm({ mensajeId, onSuccess }: MensajeRespuestaFormProps) {
  const [contenido, setContenido] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      if (selectedFiles.length + files.length > 3) {
        toast.error('Solo puedes adjuntar hasta 3 archivos en respuestas');
        return;
      }
      setSelectedFiles([...selectedFiles, ...files]);
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(selectedFiles.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contenido.trim()) return;

    setIsSubmitting(true);
    try {
      await mensajeriaService.responderMensaje(mensajeId, {
        contenido,
        adjuntos: selectedFiles,
      });
      toast.success('Respuesta enviada');
      setContenido('');
      setSelectedFiles([]);
      onSuccess();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al enviar respuesta');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card variant="outlined">
      <CardContent>
        <Typography variant="subtitle2" gutterBottom>Tu Respuesta</Typography>
        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            multiline
            rows={3}
            placeholder="Escribe tu respuesta aquí..."
            value={contenido}
            onChange={(e) => setContenido(e.target.value)}
            disabled={isSubmitting}
            sx={{ mb: 2 }}
          />
          
          {selectedFiles.length > 0 && (
            <List dense sx={{ mb: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
              {selectedFiles.map((file, index) => (
                <ListItem key={index}>
                  <IconFile style={{ marginRight: 8, fontSize: 16 }} />
                  <ListItemText 
                    primary={file.name} 
                    secondary={`${(file.size / 1024 / 1024).toFixed(2)} MB`} 
                  />
                  <ListItemSecondaryAction>
                    <IconButton edge="end" size="small" onClick={() => removeFile(index)}>
                      <IconX fontSize="small" />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          )}

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Button
              component="label"
              size="small"
              startIcon={<IconPaperclip fontSize="small" />}
              disabled={isSubmitting || selectedFiles.length >= 3}
            >
              Adjuntar
              <input 
                  type="file" 
                  hidden 
                  multiple 
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.odt,.ods,.odp,.jpg,.jpeg,.png,.gif,.webp"
                  onChange={handleFileChange} 
              />
            </Button>
            
            <Button 
               type="submit" 
               variant="contained" 
               color="primary"
               disabled={isSubmitting || !contenido.trim()}
               endIcon={<IconSend fontSize="small" />}
            >
              Responder
            </Button>
          </Box>
        </form>
      </CardContent>
    </Card>
  );
}
