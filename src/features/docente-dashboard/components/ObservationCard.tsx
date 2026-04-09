'use client'

import {
    ArrowForward,
    Groups as GroupsIcon,
    RateReview as ReviewIcon
} from '@mui/icons-material'
import {
    Box,
    Card,
    CardActionArea,
    CardContent,
    Typography,
    alpha,
    useTheme
} from '@mui/material'
import Link from 'next/link'

interface ObservationCardProps {
  id: number // grupoId
  groupName: string
  turno: string
  studentCount: number
}

const ObservationCard = ({
  groupName,
  turno,
  studentCount
}: ObservationCardProps) => {
  const theme = useTheme()
  const accentColor = theme.palette.secondary.main

  return (
    <Card elevation={3} sx={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      transition: 'transform 0.2s',
      borderLeft: `5px solid ${accentColor}`,
      '&:hover': {
        transform: 'translateY(-4px)',
        boxShadow: 8
      }
    }}>
      <CardActionArea 
        LinkComponent={Link} 
        href={`/docente/observaciones`} 
        sx={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'flex-start' }}
      >
        <CardContent sx={{ flexGrow: 1, width: '100%', display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            <Box display='flex' justifyContent='space-between' alignItems='flex-start' width="100%">
                <Box>
                    <Typography variant='caption' fontWeight="bold" sx={{ color: accentColor, textTransform: 'uppercase', letterSpacing: 1 }}>
                        Docente Guía
                    </Typography>
                    <Typography variant='h6' component='div' fontWeight='bold'>
                        Observaciones
                    </Typography>
                    <Typography variant='subtitle1' color='text.secondary'>
                        {groupName}
                    </Typography>
                </Box>
                <Box 
                    sx={{ 
                        bgcolor: alpha(accentColor, 0.1), 
                        p: 1, 
                        borderRadius: 2, 
                        color: accentColor,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}
                >
                    <ReviewIcon />
                </Box>
            </Box>

            <Box sx={{ mt: 'auto', pt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box display='flex' alignItems='center' gap={1} color='text.secondary'>
                    <GroupsIcon fontSize='small' />
                    <Typography variant='body2'>{studentCount} Estudiantes</Typography>
                </Box>
                <ArrowForward sx={{ color: accentColor, fontSize: 18 }} />
            </Box>
        </CardContent>
      </CardActionArea>
    </Card>
  )
}

export default ObservationCard
