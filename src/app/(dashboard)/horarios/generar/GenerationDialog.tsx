'use client'

import AccessTimeIcon from '@mui/icons-material/AccessTime'
import CloseIcon from '@mui/icons-material/Close'
import {
    Box,
    Button,
    Checkbox,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Divider,
    FormControlLabel,
    Grid,
    IconButton,
    TextField,
    Typography
} from '@mui/material'
import React, { useState } from 'react'

interface DayConfig {
  enabled: boolean
  start: string
  end: string
}

interface GenerationDialogProps {
  open: boolean
  title?: string
  isAI?: boolean
  onClose: () => void
  onGenerate: (data: {
    dailyConfig: Record<number, DayConfig>
    additionalInstructions: string
    recessMinutes: number
    subjectDuration: number
  }) => void
  loading: boolean
}

const DAYS = [
  { id: 1, label: 'Lunes' },
  { id: 2, label: 'Martes' },
  { id: 3, label: 'Miércoles' },
  { id: 4, label: 'Jueves' },
  { id: 5, label: 'Viernes' }
]

const GenerationDialog: React.FC<GenerationDialogProps> = ({ 
  open, 
  onClose, 
  onGenerate, 
  loading,
  title = "Configuración de Generación",
  isAI = true
}) => {
  const [dailyConfig, setDailyConfig] = useState<Record<number, DayConfig>>({
    1: { enabled: true, start: '07:00', end: '12:00' },
    2: { enabled: true, start: '07:00', end: '12:00' },
    3: { enabled: true, start: '07:00', end: '12:00' },
    4: { enabled: true, start: '07:00', end: '12:00' },
    5: { enabled: true, start: '07:00', end: '12:00' }
  })
  const [recessMinutes, setRecessMinutes] = useState(30)
  const [subjectDuration, setSubjectDuration] = useState(0)
  const [additionalInstructions, setAdditionalInstructions] = useState('')

  const handleToggleDay = (id: number) => {
    setDailyConfig(prev => ({
      ...prev,
      [id]: { ...prev[id], enabled: !prev[id].enabled }
    }))
  }

  const handleTimeChange = (id: number, field: 'start' | 'end', value: string) => {
    setDailyConfig(prev => ({
      ...prev,
      [id]: { ...prev[id], [field]: value }
    }))
  }

  const handleGenerate = () => {
    onGenerate({
      dailyConfig,
      additionalInstructions,
      recessMinutes,
      subjectDuration
    })
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ m: 0, p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AccessTimeIcon color="primary" />
          <Typography variant="h6">{title}</Typography>
        </Box>
        <IconButton onClick={onClose} disabled={loading}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        <Typography variant="subtitle2" gutterBottom color="text.secondary">
          Define el rango de horario permitido para cada día. El sistema intentará ajustar todas las clases dentro de estos límites.
        </Typography>

        <Box sx={{ mt: 2 }}>
          {DAYS.map((day, index) => (
            <React.Fragment key={day.id}>
              <Grid container spacing={2} alignItems="center" sx={{ py: 1.5 }}>
                <Grid item xs={4}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={dailyConfig[day.id].enabled}
                        onChange={() => handleToggleDay(day.id)}
                        disabled={loading}
                      />
                    }
                    label={day.label}
                  />
                </Grid>
                <Grid item xs={4}>
                  <TextField
                    label="Inicio"
                    type="time"
                    size="small"
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                    value={dailyConfig[day.id].start}
                    onChange={e => handleTimeChange(day.id, 'start', e.target.value)}
                    disabled={!dailyConfig[day.id].enabled || loading}
                  />
                </Grid>
                <Grid item xs={4}>
                  <TextField
                    label="Fin"
                    type="time"
                    size="small"
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                    value={dailyConfig[day.id].end}
                    onChange={e => handleTimeChange(day.id, 'end', e.target.value)}
                    disabled={!dailyConfig[day.id].enabled || loading}
                  />
                </Grid>
              </Grid>
              {index < DAYS.length - 1 && <Divider component="li" sx={{ listStyleType: 'none' }} />}
            </React.Fragment>
          ))}
        </Box>

        <Box sx={{ mt: 3, p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={6}>
              <Typography variant="subtitle2" fontWeight="bold">
                Duración del Receso (Min)
              </Typography>
              <TextField
                type="number"
                size="small"
                fullWidth
                value={recessMinutes}
                onChange={e => setRecessMinutes(Number(e.target.value))}
                disabled={loading}
                inputProps={{ min: 0, max: 60 }}
              />
            </Grid>
            <Grid item xs={6}>
              <Typography variant="subtitle2" fontWeight="bold">
                Duración Clases (Min)
              </Typography>
              <TextField
                type="number"
                size="small"
                fullWidth
                value={subjectDuration}
                onChange={e => setSubjectDuration(Number(e.target.value))}
                placeholder="Ej: 45"
                disabled={loading}
                inputProps={{ min: 0, max: 120 }}
                helperText="0 = Usar materias"
              />
            </Grid>
          </Grid>
        </Box>

        {isAI && (
            <Box sx={{ mt: 4 }}>
                <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                    Instrucciones Adicionales
                </Typography>
                <TextField
                    placeholder="Ej: Incluir receso de 20 min a las 9:30, Priorizar materias pesadas por la mañana..."
                    multiline
                    rows={3}
                    fullWidth
                    variant="outlined"
                    value={additionalInstructions}
                    onChange={e => setAdditionalInstructions(e.target.value)}
                    disabled={loading}
                />
            </Box>
        )}
      </DialogContent>
      <DialogActions sx={{ p: 2, gap: 1 }}>
        <Button onClick={onClose} color="inherit" disabled={loading}>
          Cancelar
        </Button>
        <Button
          onClick={handleGenerate}
          variant="contained"
          disabled={loading}
          sx={{
            background: isAI ? 'linear-gradient(45deg, #792813 30%, #d2912f 90%)' : 'primary.main',
            color: 'white',
            boxShadow: isAI ? '0 3px 5px 2px rgba(121, 40, 19, .3)' : 'none'
          }}
        >
          {loading ? 'Generando...' : 'Confirmar Generación'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default GenerationDialog
