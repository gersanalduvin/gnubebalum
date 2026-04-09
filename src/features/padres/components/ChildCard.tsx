import Link from 'next/link'

// MUI Imports
import Avatar from '@mui/material/Avatar'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'

// Type Imports
import type { Student } from '../services/parentService'

interface Props {
  student: Student
}

const ChildCard = ({ student }: Props) => {
  return (
    <Card className='h-full'>
      <CardContent className='flex flex-col items-center gap-4 text-center'>
        <Avatar
          src={student.foto_url}
          alt={student.nombre_completo}
          sx={{ width: 100, height: 100, fontSize: '2rem' }}
        >
            {student.nombre_completo.charAt(0)}
        </Avatar>

        <Box>
            <Typography variant='h5' className='mb-2'>
            {student.nombre_completo}
            </Typography>
            <Typography variant='body2' color='text.secondary'>
            {student.codigo_unico}
            </Typography>
            {(student.grado || student.seccion) && (
                <Typography variant='body2' color='text.secondary' className='mt-1'>
                    {student.grado} - {student.seccion}
                </Typography>
            )}
        </Box>

        <Button
            component={Link}
            href={`/padres/hijos/${student.id}`}
            variant='contained'
            fullWidth
            className='mt-2'
        >
            Ver Detalles
        </Button>
      </CardContent>
    </Card>
  )
}

export default ChildCard
