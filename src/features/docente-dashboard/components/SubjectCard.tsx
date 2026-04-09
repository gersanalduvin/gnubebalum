'use client'

import {
    Groups as GroupsIcon,
    School as SchoolIcon
} from '@mui/icons-material'
import {
    Box,
    Card,
    CardActionArea,
    CardContent,
    Typography
} from '@mui/material'
import Link from 'next/link'

interface SubjectCardProps {
  id: number
  subjectName: string
  groupName: string
  periodName: string // e.g. "Turno Mañana"
  active: boolean
  scheduleInfo: string // e.g. "Lun, Mie, Vie 8:00 - 9:30"
  studentCount: number
}

const SubjectCard = ({
  id,
  subjectName,
  groupName,
  periodName,
  active,
  scheduleInfo,
  studentCount
}: SubjectCardProps) => {
  return (
    <Card elevation={3} sx={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      transition: 'transform 0.2s',
      '&:hover': {
        transform: 'translateY(-4px)',
        boxShadow: 6
      }
    }}>
      <CardActionArea 
        LinkComponent={Link} 
        href={`/docente/calificaciones/${id}`} 
        sx={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'flex-start' }}
      >
        <CardContent sx={{ flexGrow: 1, width: '100%', display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box display='flex' justifyContent='space-between' alignItems='flex-start'>
            <Box>
                <Typography variant='h6' component='div' fontWeight='bold' color='primary.main'>
                {subjectName}
                </Typography>
                <Typography variant='subtitle1' color='text.secondary'>
                {groupName}
                </Typography>
            </Box>

            </Box>

            <Box display='flex' alignItems='center' gap={1} color='text.secondary'>
                <SchoolIcon fontSize='small' />
                <Typography variant='body2'>{periodName}</Typography>
            </Box>
            
            <Box display='flex' alignItems='center' gap={1} color='text.secondary'>
                <GroupsIcon fontSize='small' />
                <Typography variant='body2'>{studentCount} Estudiantes</Typography>
            </Box>


        </CardContent>
      </CardActionArea>
    </Card>
  )
}

export default SubjectCard
