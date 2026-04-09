import React from 'react'

// MUI Imports
import Avatar from '@mui/material/Avatar'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import Typography from '@mui/material/Typography'

export interface StudentGlanceData {
  id: string | number
  nombre_completo: string
  codigo_unico: string
  grado: string
  seccion?: string
  foto_url?: string
  asistencia_porcentaje: string
  promedio_actual: string
}

interface Props {
  student: StudentGlanceData
  onClick: (id: string | number) => void
}

const StudentGlanceCard: React.FC<Props> = ({ student, onClick }) => {
  return (
    <Card
      onClick={() => onClick(student.id)}
      sx={{
        cursor: 'pointer',
        transition: 'transform 0.2s ease-in-out, box-shadow 0.2s',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: 'var(--mui-shadows-6)'
        },
        borderRadius: '16px',
        overflow: 'hidden',
        position: 'relative'
      }}
    >
      {/* Decorative Blob */}
      <Box
        sx={{
          position: 'absolute',
          top: -20,
          right: -20,
          width: 100,
          height: 100,
          borderRadius: '50%',
          backgroundColor: 'primary.main',
          opacity: 0.1,
          zIndex: 0
        }}
      />

      <CardContent sx={{ position: 'relative', zIndex: 1, p: 3 }}>
        <Box display='flex' alignItems='flex-start' mb={3}>
          <Avatar
            src={student.foto_url}
            sx={{ width: 64, height: 64, mr: 2, border: '2px solid', borderColor: 'primary.light' }}
          />
          <Box flex={1}>
            <Typography variant='h6' fontWeight='bold' noWrap title={student.nombre_completo}>
              {student.nombre_completo}
            </Typography>
            <Chip
              label={`${student.grado} ${student.seccion || ''}`.trim()}
              size='small'
              color='primary'
              variant='filled'
              sx={{ mt: 1, fontWeight: 600 }}
            />
          </Box>
        </Box>

        <Box display='flex' justifyContent='space-between' alignItems='center'>
          <Box display='flex' alignItems='center'>
            <i className='ri-checkbox-circle-line text-success mr-1 text-xl' />
            <Box>
              <Typography variant='body1' fontWeight='bold'>
                {student.asistencia_porcentaje}%
              </Typography>
              <Typography variant='caption' color='text.secondary'>
                Asistencia
              </Typography>
            </Box>
          </Box>
          <Box display='flex' alignItems='center'>
            <i className='ri-star-line text-warning mr-1 text-xl' />
            <Box>
              <Typography variant='body1' fontWeight='bold'>
                {student.promedio_actual}
              </Typography>
              <Typography variant='caption' color='text.secondary'>
                Promedio
              </Typography>
            </Box>
          </Box>
        </Box>
      </CardContent>
    </Card>
  )
}

export default StudentGlanceCard
