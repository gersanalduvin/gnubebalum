import {
    Close,
    Info,
    KeyboardArrowDown,
    KeyboardArrowLeft,
    KeyboardArrowRight,
    KeyboardArrowUp,
    KeyboardReturn,
    Square
} from '@mui/icons-material'
import {
    Box,
    Dialog,
    DialogContent,
    DialogTitle,
    Divider,
    IconButton,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Paper,
    Typography
} from '@mui/material'

interface Props {
    open: boolean
    onClose: () => void
}

export default function HelpModal({ open, onClose }: Props) {
    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Info color="primary" />
                    Guía de Uso y Colores
                </Box>
                <IconButton onClick={onClose} size="small">
                    <Close />
                </IconButton>
            </DialogTitle>
            <DialogContent dividers>
                {/* Keyboard Shortcuts Section */}
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                    Atajos de Teclado
                </Typography>
                <List dense>
                    <ListItem>
                        <ListItemIcon sx={{ minWidth: 40 }}>
                            <Box sx={{ display: 'flex', gap: 0.5 }}>
                                <KeyboardArrowUp fontSize="small" />
                                <KeyboardArrowDown fontSize="small" />
                                <KeyboardArrowLeft fontSize="small" />
                                <KeyboardArrowRight fontSize="small" />
                            </Box>
                        </ListItemIcon>
                        <ListItemText 
                            primary="Flechas direccionales" 
                            secondary="Navegar entre celdas de calificaciones." 
                        />
                    </ListItem>
                    <ListItem>
                        <ListItemIcon sx={{ minWidth: 40 }}>
                            <KeyboardReturn fontSize="small" />
                        </ListItemIcon>
                        <ListItemText 
                            primary="Enter" 
                            secondary="Baja al siguiente estudiante en la misma tarea." 
                        />
                    </ListItem>
                    <ListItem>
                        <ListItemIcon sx={{ minWidth: 40 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', bgcolor: 'grey.200', px: 0.5, borderRadius: 0.5, fontSize: '0.75rem', fontWeight: 'bold' }}>
                                CTRL
                            </Box>
                            <Box sx={{ mx: 0.5 }}>+</Box>
                            <KeyboardArrowDown fontSize="small" />
                        </ListItemIcon>
                        <ListItemText 
                            primary="Copiar hacia abajo" 
                            secondary="Copia la nota actual al estudiante de abajo." 
                        />
                    </ListItem>
                </List>

                <Divider sx={{ my: 2 }} />

                {/* Colors Legend Section */}
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                    Significado de Colores
                </Typography>
                <Grid container spacing={2} sx={{ mt: 0.5 }}>
                    <Grid item xs={12} sm={6}>
                        <Paper variant="outlined" sx={{ p: 1, display: 'flex', alignItems: 'center', gap: 1, bgcolor: 'warning.light' }}>
                            <Square sx={{ color: 'warning.light', border: 1, borderColor: 'warning.main' }} />
                            <Typography variant="body2">Cambios sin guardar</Typography>
                        </Paper>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <Paper variant="outlined" sx={{ p: 1, display: 'flex', alignItems: 'center', gap: 1, bgcolor: 'error.lighter' }}>
                            <Square sx={{ color: 'error.lighter', border: 1, borderColor: 'error.light' }} />
                            <Typography variant="body2">Valor fuera de rango</Typography>
                        </Paper>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <Paper variant="outlined" sx={{ p: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Square sx={{ color: 'success.main' }} />
                            <Typography variant="body2">Tarea Revisada (Borde Verde)</Typography>
                        </Paper>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <Paper variant="outlined" sx={{ p: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Square sx={{ color: 'info.main' }} />
                            <Typography variant="body2">Tarea Entregada (Borde Azul)</Typography>
                        </Paper>
                    </Grid>
                </Grid>

                <Box sx={{ mt: 3, p: 2, bgcolor: 'primary.50', borderRadius: 1 }}>
                    <Typography variant="caption" color="primary.dark" sx={{ display: 'block' }}>
                        * Recuerde presionar el botón "Guardar Cambios" al finalizar para que las notas se registren permanentemente.
                    </Typography>
                </Box>
            </DialogContent>
        </Dialog>
    )
}

import { Grid } from '@mui/material'
