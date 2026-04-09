import { Close, Email, Transgender } from '@mui/icons-material'
import {
    Avatar,
    Box,
    Dialog,
    DialogContent,
    DialogTitle,
    Divider,
    IconButton,
    Stack,
    Typography
} from '@mui/material'

interface StudentProfileModalProps {
    open: boolean
    onClose: () => void
    student: {
        nombre_completo: string
        correo?: string
        sexo?: string
        foto_url?: string
    } | null
}

const StudentProfileModal = ({ open, onClose, student }: StudentProfileModalProps) => {
    if (!student) return null

    return (
        <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
                <Typography variant="h6" component="span">Perfil del Estudiante</Typography>
                <IconButton onClick={onClose} size="small"><Close /></IconButton>
            </DialogTitle>
            <Divider />
            <DialogContent>
                <Box display="flex" flexDirection="column" alignItems="center" gap={2} py={2}>
                    <Avatar 
                        src={student.foto_url || undefined} 
                        sx={{ width: 120, height: 120, border: '4px solid', borderColor: 'primary.light' }}
                    >
                        {student.nombre_completo.charAt(0)}
                    </Avatar>
                    
                    <Typography variant="h5" align="center" fontWeight="bold">
                        {student.nombre_completo}
                    </Typography>

                    <Stack spacing={2} width="100%" sx={{ mt: 2 }}>
                        <Box display="flex" alignItems="center" gap={2}>
                            <Email color="action" />
                            <Box>
                                <Typography variant="caption" color="text.secondary" display="block">Correo Electrónico</Typography>
                                <Typography variant="body1">{student.correo || 'No registrado'}</Typography>
                            </Box>
                        </Box>
                        
                        <Box display="flex" alignItems="center" gap={2}>
                            <Transgender color="action" />
                            <Box>
                                <Typography variant="caption" color="text.secondary" display="block">Sexo</Typography>
                                <Typography variant="body1">
                                    {student.sexo === 'M' ? 'Masculino' : student.sexo === 'F' ? 'Femenino' : 'No definido'}
                                </Typography>
                            </Box>
                        </Box>
                    </Stack>
                </Box>
            </DialogContent>
        </Dialog>
    )
}

export default StudentProfileModal
