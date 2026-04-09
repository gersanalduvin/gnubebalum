'use client'

// React Imports
import { useState } from 'react'

// MUI Imports
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import Alert from '@mui/material/Alert'
import Link from '@mui/material/Link'

// Component Imports
import Logo from '@components/layout/shared/Logo'

// Hook Imports
import { useImageVariant } from '@core/hooks/useImageVariant'

// Type Imports
import type { Mode } from '@core/types'

type Props = {
  mode: Mode
}

const ForgotPassword = ({ mode }: Props) => {
  // States
  const [email, setEmail] = useState('')
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  // Vars
  const darkImg = '/images/pages/auth-forgot-password-illustration-dark.png'
  const lightImg = '/images/pages/auth-forgot-password-illustration-light.png'
  const borderedDarkImg = '/images/pages/auth-forgot-password-illustration-bordered-dark.png'
  const borderedLightImg = '/images/pages/auth-forgot-password-illustration-bordered-light.png'

  // Hooks
  const authBackground = useImageVariant(mode, lightImg, darkImg, borderedLightImg, borderedDarkImg)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      setIsSubmitted(true)
    } catch (err) {
      setError('Error al enviar el correo de recuperación. Inténtalo de nuevo.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className='flex bs-full justify-center'>
      <div className='flex bs-full items-center justify-center flex-1 min-bs-[100dvh] relative p-6 max-md:hidden'>
        <div className='plb-12 pis-12'>
          <img
            src={authBackground}
            alt='forgot-password-illustration'
            className='max-bs-[500px] max-is-full bs-auto'
          />
        </div>

      </div>
      <div className='flex justify-center items-center bs-full bg-backgroundPaper !min-is-full p-6 md:!min-is-[unset] md:p-12 md:is-[480px]'>
        <div className='absolute block-start-5 sm:block-start-[33px] inline-start-6 sm:inline-start-[38px]'>
          <Logo />
        </div>
        <Card className='flex flex-col sm:is-[400px]'>
          <CardContent className='p-6 sm:!p-12'>
            <div className='flex flex-col gap-5'>
              <div>
                <Typography variant='h4'>¿Olvidaste tu contraseña? 🔒</Typography>
                <Typography className='mbs-1'>Ingresa tu email y te enviaremos instrucciones para restablecer tu contraseña</Typography>
              </div>
              {!isSubmitted ? (
                <form noValidate autoComplete='off' onSubmit={handleSubmit} className='flex flex-col gap-5'>
                  <TextField
                    autoFocus
                    fullWidth
                    label='Email'
                    type='email'
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                  {error && (
                    <Alert severity='error'>
                      {error}
                    </Alert>
                  )}
                  <Button
                    fullWidth
                    variant='contained'
                    type='submit'
                    disabled={isLoading || !email}
                  >
                    {isLoading ? 'Enviando...' : 'Enviar instrucciones'}
                  </Button>
                  <Typography className='flex justify-center items-center' color='primary'>
                    <Link href='/login' className='flex items-center'>
                      <i className='ri-arrow-left-s-line' />
                      <span>Volver al login</span>
                    </Link>
                  </Typography>
                </form>
              ) : (
                <div className='flex flex-col gap-5'>
                  <Alert severity='success'>
                    Se han enviado las instrucciones de recuperación a tu email.
                  </Alert>
                  <Typography className='flex justify-center items-center' color='primary'>
                    <Link href='/login' className='flex items-center'>
                      <i className='ri-arrow-left-s-line' />
                      <span>Volver al login</span>
                    </Link>
                  </Typography>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default ForgotPassword