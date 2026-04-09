import {
  Box,
  Checkbox,
  Divider,
  FormControl,
  FormControlLabel,
  IconButton,
  MenuItem,
  Paper,
  Popover,
  Select,
  Typography
} from '@mui/material'
import React, { useEffect, useState } from 'react'

interface EvidenceCellProps {
  studentId: number
  evidenceId: number | string
  evidenceName: string
  indicators: any
  currentValue: {
    escala_detalle_id: number | ''
    indicadores_check: any
  }
  scaleValues: any[]
  isLocked: boolean
  isAssigned: boolean
  isCustom?: boolean
  onChange: (
    studentId: number,
    evidenceId: number | string,
    newVal: { escala_detalle_id: number | ''; indicadores_check: any }
  ) => void
  onCopyDown?: (studentId: number, evidenceId: number | string) => void
  onFocus?: (studentId: number, colIndex: number) => void
  onBlur?: () => void
  colIndex?: number
}

export const EvidenceCell = ({
  studentId,
  evidenceId,
  evidenceName,
  indicators,
  currentValue,
  scaleValues,
  isLocked,
  isAssigned,
  isCustom = false,
  onChange,
  onCopyDown,
  onFocus,
  onBlur,
  colIndex = -1
}: EvidenceCellProps) => {
  const getInitialChecks = (sourceChecks: any, sourceIndicators: any) => {
    const checkState = sourceChecks || {}
    if (Object.keys(checkState).length > 0) return checkState

    let criteriaList: string[] = []
    if (sourceIndicators?.criterios && Array.isArray(sourceIndicators.criterios)) {
      criteriaList = sourceIndicators.criterios
    } else if (sourceIndicators?.criterio) {
      if (typeof sourceIndicators.criterio === 'string') criteriaList = [sourceIndicators.criterio]
      else if (typeof sourceIndicators.criterio === 'object') criteriaList = Object.values(sourceIndicators.criterio)
    }

    if (sourceIndicators?.type === 'select') {
      return checkState
    }

    if (criteriaList.length > 0) {
      const defaultCheck: any = {}
      criteriaList.forEach(crit => {
        defaultCheck[crit] = true
      })
      return defaultCheck
    }
    return checkState
  }

  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null)
  const [localCheck, setLocalCheck] = useState<any>(getInitialChecks(currentValue.indicadores_check, indicators))
  const [localGrade, setLocalGrade] = useState<number | ''>(currentValue.escala_detalle_id)

  useEffect(() => {
    setLocalCheck(getInitialChecks(currentValue.indicadores_check, indicators))
    setLocalGrade(currentValue.escala_detalle_id)
  }, [currentValue, indicators])

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    if (isLocked) return
    setAnchorEl(event.currentTarget)
  }

  let criteriaList: string[] = []
  if (indicators?.criterios && Array.isArray(indicators.criterios)) {
    criteriaList = indicators.criterios
  } else if (indicators?.criterio) {
    if (typeof indicators.criterio === 'string') criteriaList = [indicators.criterio]
    else if (typeof indicators.criterio === 'object') criteriaList = Object.values(indicators.criterio)
  }

  const selectedScale = scaleValues.find(s => s.id == localGrade)
  const totalInd = criteriaList.length
  const checkedCount = criteriaList.filter(crit => localCheck[crit] === true).length

  const handleClose = () => {
    setAnchorEl(null)
    
    // Solo enviamos los checks que pertenecen a los criterios actuales
    const filteredCheck: any = {}
    criteriaList.forEach(crit => {
      if (localCheck[crit] !== undefined) {
        filteredCheck[crit] = localCheck[crit]
      }
    })

    onChange(studentId, evidenceId, {
      escala_detalle_id: localGrade,
      indicadores_check: filteredCheck
    })
  }

  if (!scaleValues || scaleValues.length === 0) {
    return (
      <Box p={1}>
        <Typography variant='caption' color='error'>
          Sin Escala
        </Typography>
      </Box>
    )
  }

  if (!isAssigned) {
    return (
      <Box
        sx={{
          p: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'grey.100',
          color: 'text.disabled',
          height: '100%',
          minHeight: 40
        }}
      >
        <Typography variant='caption' sx={{ fontStyle: 'italic' }}>
          N/A
        </Typography>
      </Box>
    )
  }

  if (indicators?.type === 'select') {
    const selectedAnswer = localCheck['respuesta'] || ''
    return (
      <Box sx={{ p: 0.5, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
        <FormControl size='small' fullWidth sx={{ minWidth: 120 }}>
          <Select
            value={selectedAnswer}
            onChange={e => {
              const val = e.target.value as string
              setLocalCheck({ respuesta: val })
              onChange(studentId, evidenceId, {
                escala_detalle_id: '',
                indicadores_check: { respuesta: val }
              })
            }}
            disabled={isLocked}
            displayEmpty
            onFocus={() => onFocus && onFocus(studentId, colIndex)}
            onBlur={() => onBlur && onBlur()}
            sx={{ fontSize: '0.875rem', '& .MuiSelect-select': { py: 0.5 }, borderRadius: 1 }}
          >
            <MenuItem value=''>-</MenuItem>
            {criteriaList.map((opt, idx) => (
              <MenuItem key={idx} value={typeof opt === 'string' ? opt : JSON.stringify(opt)}>
                {typeof opt === 'string' ? opt : JSON.stringify(opt)}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        {/* Copy Down Button */}
        {selectedAnswer && onCopyDown && !isLocked && (
          <IconButton
            size='small'
            onClick={() => onCopyDown(studentId, evidenceId)}
            sx={{ p: 0.3, bgcolor: 'action.hover', '&:hover': { bgcolor: 'primary.light' } }}
            title='Copiar hacia abajo (Ctrl+Shift+D)'
          >
            <Typography variant='caption' sx={{ fontSize: '0.6rem' }}>
              ↓
            </Typography>
          </IconButton>
        )}
      </Box>
    )
  }

  return (
    <Box
      sx={{
        p: 0.5,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 0.5,
        bgcolor: localGrade ? 'primary.50' : 'transparent'
      }}
    >
      <FormControl size='small' fullWidth sx={{ minWidth: 100 }}>
        <Select
          value={localGrade}
          onChange={e => {
            const val = e.target.value as number | ''
            setLocalGrade(val)
            onChange(studentId, evidenceId, {
              escala_detalle_id: val,
              indicadores_check: localCheck
            })
          }}
          disabled={isLocked}
          displayEmpty
            onFocus={() => onFocus && onFocus(studentId, colIndex)}
            onBlur={() => onBlur && onBlur()}
            sx={{
              fontSize: '0.875rem',
              '& .MuiSelect-select': { py: 0.5 },
              bgcolor: isCustom ? 'warning.50' : 'transparent',
              borderRadius: 1
            }}
          >
          <MenuItem value=''>-</MenuItem>
          {scaleValues.map(s => (
            <MenuItem key={s.id} value={s.id}>
              {s.abreviatura || s.nombre}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {/* Copy Down Button */}
      {localGrade && onCopyDown && !isLocked && (
        <IconButton
          size='small'
          onClick={() => onCopyDown(studentId, evidenceId)}
          sx={{
            p: 0.3,
            bgcolor: 'action.hover',
            '&:hover': { bgcolor: 'primary.light' }
          }}
          title='Copiar hacia abajo (Ctrl+Shift+D)'
        >
          <Typography variant='caption' sx={{ fontSize: '0.6rem' }}>
            ↓
          </Typography>
        </IconButton>
      )}

      {totalInd > 0 && (
        <IconButton
          size='small'
          onClick={handleClick}
          sx={{
            p: 0.5,
            bgcolor: checkedCount > 0 ? 'success.light' : 'action.selected',
            color: checkedCount > 0 ? 'white' : 'action.active',
            '&:hover': { bgcolor: checkedCount > 0 ? 'success.main' : 'action.hover' }
          }}
          title={`${checkedCount}/${totalInd} Indicadores`}
          disabled={isLocked}
        >
          <Typography variant='caption' fontWeight='bold' sx={{ fontSize: '0.7rem' }}>
            {checkedCount}/{totalInd}
          </Typography>
        </IconButton>
      )}

      <Popover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        transformOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Paper sx={{ p: 2, minWidth: 250, maxWidth: 300 }}>
          {isCustom && (
            <Typography variant='caption' sx={{ bgcolor: 'warning.main', color: 'white', px: 1, py: 0.2, borderRadius: 1, mb: 1, display: 'inline-block' }}>
              ✦ Evidencia Personalizada
            </Typography>
          )}
            {typeof evidenceName === 'string' ? evidenceName : JSON.stringify(evidenceName)}
          <Typography variant='caption' color='text.secondary' paragraph>
            Seleccione los indicadores logrados:
          </Typography>
          <Divider sx={{ mb: 1 }} />

          {criteriaList.length > 0 ? (
            criteriaList.map((crit, idx) => (
              <FormControlLabel
                key={idx}
                control={
                  <Checkbox
                    checked={!!localCheck[crit]}
                    onChange={() => {
                      const newCheck = { ...localCheck, [crit]: !localCheck[crit] }
                      setLocalCheck(newCheck)
                    }}
                    size='small'
                  />
                }
                label={<Typography variant='body2'>{typeof crit === 'string' ? crit : JSON.stringify(crit)}</Typography>}
                sx={{ display: 'flex', mb: 0.5 }}
              />
            ))
          ) : (
            <Typography variant='caption' fontStyle='italic'>
              No hay indicadores definidos.
            </Typography>
          )}

          <Box mt={2} display='flex' justifyContent='flex-end'>
            <Typography variant='caption' sx={{ cursor: 'pointer', color: 'primary.main' }} onClick={handleClose}>
              Listo
            </Typography>
          </Box>
        </Paper>
      </Popover>
    </Box>
  )
}
