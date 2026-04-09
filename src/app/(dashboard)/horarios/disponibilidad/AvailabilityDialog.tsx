import { DocenteDisponibilidad } from '@/services/scheduleService';
import {
    Box,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Grid,
    TextField,
    ToggleButton,
    ToggleButtonGroup,
    Typography
} from '@mui/material';
import React, { useEffect, useState } from 'react';

interface AvailabilityDialogProps {
    open: boolean;
    onClose: () => void;
    onSave: (data: Partial<DocenteDisponibilidad> & { selectedDays?: number[] }) => Promise<void>;
    onDelete?: (id: number) => Promise<void>;
    initialData?: Partial<DocenteDisponibilidad>;
    readOnly?: boolean;
}

const AvailabilityDialog: React.FC<AvailabilityDialogProps> = ({
    open,
    onClose,
    onSave,
    onDelete,
    initialData,
    readOnly = false
}) => {
    const [formData, setFormData] = useState<Partial<DocenteDisponibilidad>>({
        hora_inicio: '07:00',
        hora_fin: '12:00',
        titulo: 'Disponible',
        disponible: true,
        motivo: ''
    });
    const [selectedDays, setSelectedDays] = useState<number[]>([]);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        if (open && initialData) {
            setFormData({
                ...initialData,
                titulo: initialData.titulo || 'Disponible',
                hora_inicio: initialData.hora_inicio || '07:00',
                hora_fin: initialData.hora_fin || '12:00',
                disponible: initialData.disponible !== undefined ? initialData.disponible : true,
                motivo: initialData.motivo || ''
            });
            if (initialData.dia_semana) {
                setSelectedDays([initialData.dia_semana]);
            } else {
                setSelectedDays([]);
            }
        }
    }, [open, initialData]);

    const handleDayChange = (
        event: React.MouseEvent<HTMLElement>,
        newDays: number[],
    ) => {
        if (newDays.length > 0) {
            setSelectedDays(newDays);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await onSave({ ...formData, selectedDays });
            onClose();
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!initialData?.id || !onDelete) return;
        if (!confirm('¿Seguro que desea eliminar esta restricción?')) return;
        
        setDeleting(true);
        try {
            await onDelete(initialData.id);
            onClose();
        } finally {
            setDeleting(false);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>
                {initialData?.id ? 'Editar Disponibilidad' : 'Marcar Disponibilidad'}
            </DialogTitle>
            <DialogContent>
                <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <TextField
                        label="Título"
                        fullWidth
                        value={formData.titulo}
                        onChange={(e) => setFormData(prev => ({ ...prev, titulo: e.target.value }))}
                        disabled={readOnly}
                    />

                    <Grid container spacing={2}>
                        <Grid item xs={6}>
                            <TextField
                                label="Hora Inicio"
                                type="time"
                                fullWidth
                                InputLabelProps={{ shrink: true }}
                                value={formData.hora_inicio}
                                onChange={(e) => setFormData(prev => ({ ...prev, hora_inicio: e.target.value }))}
                                disabled={readOnly}
                            />
                        </Grid>
                        <Grid item xs={6}>
                            <TextField
                                label="Hora Fin"
                                type="time"
                                fullWidth
                                InputLabelProps={{ shrink: true }}
                                value={formData.hora_fin}
                                onChange={(e) => setFormData(prev => ({ ...prev, hora_fin: e.target.value }))}
                                disabled={readOnly}
                            />
                        </Grid>
                    </Grid>

                    <TextField
                        label="Motivo (Opcional)"
                        fullWidth
                        multiline
                        rows={2}
                        value={formData.motivo}
                        onChange={(e) => setFormData(prev => ({ ...prev, motivo: e.target.value }))}
                        disabled={readOnly}
                    />

                    {!initialData?.id && (
                        <Box sx={{ mt: 1 }}>
                            <Typography variant="subtitle2" gutterBottom>
                                Aplicar a los días:
                            </Typography>
                            <ToggleButtonGroup
                                value={selectedDays}
                                onChange={handleDayChange}
                                aria-label="days of week"
                                size="small"
                                fullWidth
                                color="primary"
                            >
                                <ToggleButton value={1} aria-label="lunes">Lun</ToggleButton>
                                <ToggleButton value={2} aria-label="martes">Mar</ToggleButton>
                                <ToggleButton value={3} aria-label="miercoles">Mie</ToggleButton>
                                <ToggleButton value={4} aria-label="jueves">Jue</ToggleButton>
                                <ToggleButton value={5} aria-label="viernes">Vie</ToggleButton>
                                <ToggleButton value={6} aria-label="sabado">Sab</ToggleButton>
                                <ToggleButton value={7} aria-label="domingo">Dom</ToggleButton>
                            </ToggleButtonGroup>
                        </Box>
                    )}
                </Box>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2 }}>
                {!readOnly && initialData?.id && (
                    <Button 
                        onClick={handleDelete} 
                        color="error" 
                        disabled={saving || deleting}
                        sx={{ mr: 'auto' }}
                    >
                        Eliminar
                    </Button>
                )}
                <Button onClick={onClose} disabled={saving || deleting}>Cancelar</Button>
                {!readOnly && (
                    <Button 
                        onClick={handleSave} 
                        variant="contained" 
                        disabled={saving || deleting}
                    >
                        {saving ? 'Guardando...' : 'Guardar'}
                    </Button>
                )}
            </DialogActions>
        </Dialog>
    );
};

export default AvailabilityDialog;
