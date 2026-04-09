'use client'

// MUI Imports
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Divider from '@mui/material/Divider'
import Typography from '@mui/material/Typography'

// Component Imports
import Logo from '@/components/layout/shared/Logo'

/**
 * Privacy Policy Page
 * Responsive and accessible publicly without login.
 */
export default function PrivacyPolicyPage() {
  return (
    <Box className='flex flex-col items-center justify-center min-bs-screen p-6'>
      <Box className='mbe-6'>
        <Logo />
      </Box>
      <Card className='max-is-[800px] shadow-lg'>
        <CardContent className='p-8 md:p-12'>
          <Typography variant='h4' color='primary' className='mbe-4 font-bold text-center'>
            Política de Privacidad
          </Typography>
          <Typography variant='body2' color='text.secondary' className='mbe-6 text-center'>
            Última actualización: 24 de febrero de 2026
          </Typography>

          <Divider className='mbe-6' />

          <Typography variant='h6' className='mbe-2 font-bold'>
            1. Introducción
          </Typography>
          <Typography variant='body1' className='mbe-4 text-justify text-foreground'>
            GNube es una plataforma de software como servicio (SaaS) desarrollada por <strong>GSOFTNIC</strong> para la
            gestión académica y administrativa. Esta política describe cómo se manejan los datos en la aplicación móvil{' '}
            <strong>Primeros Pasos - Leon</strong>.
          </Typography>

          <Typography variant='h6' className='mbe-2 font-bold'>
            2. Responsabilidad de los Datos
          </Typography>
          <Typography variant='body1' className='mbe-4 text-justify text-foreground'>
            GNube actúa únicamente como el proveedor de la infraestructura tecnológica. El{' '}
            <strong>Centro Escolar Mis Primeros Pasos (Primeros Pasos - Leon)</strong> es el único administrador y
            responsable legal del tratamiento, custodia y uso de los datos personales y académicos ingresados en la
            plataforma.
          </Typography>

          <Typography variant='h6' className='mbe-2 font-bold'>
            3. Información que Recolectamos
          </Typography>
          <Typography variant='body1' className='mbe-4 text-justify text-foreground'>
            Para el funcionamiento de la aplicación, el colegio gestiona los siguientes datos del usuario:
          </Typography>
          <ul className='list-disc pli-6 mbe-4 text-foreground'>
            <li>Información de perfil: Nombres, apellidos, correos electrónicos y números de teléfono.</li>
            <li>Datos académicos: Calificaciones, asistencia, horarios y tareas.</li>
            <li>Datos financieros: Estados de cuenta y registros de pago relacionados con el colegio.</li>
            <li>
              Uso de cámara y galería: Para adjuntar evidencias de tareas o fotos de perfil si el usuario lo permite.
            </li>
          </ul>

          <Typography variant='h6' className='mbe-2 font-bold'>
            4. Uso de la Información
          </Typography>
          <Typography variant='body1' className='mbe-4 text-justify text-foreground'>
            La información se utiliza exclusivamente para fines educativos y administrativos internos del colegio, tales
            como: Comunicación entre padres y docentes, consulta de rendimiento académico y gestión de trámites
            escolares.
          </Typography>

          <Typography variant='h6' className='mbe-2 font-bold'>
            5. Protección y Seguridad
          </Typography>
          <Typography variant='body1' className='mbe-4 text-justify text-foreground'>
            Implementamos medidas de seguridad técnicas para proteger la integridad y confidencialidad de la
            información. Los datos se transmiten de forma cifrada mediante protocolos seguros (HTTPS). GNube no vende,
            alquila ni comparte datos personales con terceras empresas con fines comerciales.
          </Typography>

          <Typography variant='h6' className='mbe-2 font-bold'>
            6. Derechos del Usuario
          </Typography>
          <Typography variant='body1' className='mbe-4 text-justify text-foreground'>
            Los usuarios pueden ejercer sus derechos de acceso, rectificación o eliminación de sus datos directamente
            con la administración del <strong>Centro Escolar Mis Primeros Pasos (Primeros Pasos - Leon)</strong>.
          </Typography>

          <Divider className='mbs-6 mbe-6' />

          <Typography variant='body2' className='text-center italic text-secondary'>
            Esta política ha sido diseñada para cumplir con las normativas de protección de datos del usuario de Google
            Play Store y Apple App Store.
          </Typography>

          <Box className='flex justify-center mbs-4'>
            <Typography variant='body2' color='text.secondary'>
              Soporte técnico:{' '}
              <a href='mailto:info@gsoftnic.com' className='text-primary hover:underline'>
                info@gsoftnic.com
              </a>
            </Typography>
          </Box>
        </CardContent>
      </Card>

      <Box className='mbs-6 text-center text-secondary'>
        <Typography variant='body2' color='text.secondary'>
          © 2026 Desarrollado por GSOFTNIC para Primeros Pasos - Leon.
        </Typography>
      </Box>
    </Box>
  )
}
