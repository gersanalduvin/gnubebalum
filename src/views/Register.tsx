'use client'

// React Imports
import { useState } from 'react'

// MUI Imports
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import TextField from '@mui/material/TextField'
import IconButton from '@mui/material/IconButton'
import InputAdornment from '@mui/material/InputAdornment'
import Checkbox from '@mui/material/Checkbox'
import Button from '@mui/material/Button'
import FormControlLabel from '@mui/material/FormControlLabel'
import Divider from '@mui/material/Divider'
import Alert from '@mui/material/Alert'
import Link from '@mui/material/Link'

// Third-party Imports
import { toast } from 'react-toastify'

// Component Imports
import Logo from '@components/layout/shared/Logo'

// Hook Imports
import { useImageVariant } from '@core/hooks/useImageVariant'

// Type Imports
import type { Mode } from '@core/types'

type Props = {
  mode: Mode
}

const Register = ({ mode }: Props) => {
  // States
  const [isPasswordShown, setIsPasswordShown] = useState(false)
  const [isConfirmPasswordShown, setIsConfirmPasswordShown] = useState(false)

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    privacyPolicies: false
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(false)

  // Vars
  const darkImg = '/images/pages/auth-register-illustration-dark.png'
  const lightImg = '/images/pages/auth-register-illustration-light.png'
  const borderedDarkImg = '/images/pages/auth-register-illustration-bordered-dark.png'
  const borderedLightImg = '/images/pages/auth-register-illustration-bordered-light.png'

  // Hooks
  const authBackground = useImageVariant(mode, lightImg, darkImg, borderedLightImg, borderedDarkImg)

  const handleClickShowPassword = () => setIsPasswordShown(show => !show)
  const handleClickShowConfirmPassword = () => setIsConfirmPasswordShown(show => !show)

  const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = field === 'privacyPolicies' ? e.target.checked : e.target.value

    setFormData(prev => ({ ...prev, [field]: value }))

    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.username.trim()) {
      newErrors.username = 'El nombre de usuario es requerido'
    }

    if (!formData.email.trim()) {
      newErrors.email = 'El email es requerido'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'El email no es válido'
    }

    if (!formData.password) {
      newErrors.password = 'La contraseña es requerida'
    } else if (formData.password.length < 6) {
      newErrors.password = 'La contraseña debe tener al menos 6 caracteres'
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Confirma tu contraseña'
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Las contraseñas no coinciden'
    }

    if (!formData.privacyPolicies) {
      newErrors.privacyPolicies = 'Debes aceptar los términos y condiciones'
    }

    setErrors(newErrors)

    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setIsLoading(true)

    try {

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Handle successful registration
      toast.success('¡Registro exitoso! Redirigiendo al dashboard...')
    } catch (error) {
      setErrors({ submit: 'Error al registrar usuario. Inténtalo de nuevo.' })
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
            alt='register-illustration'
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
                <Typography variant='h4'>La aventura comienza aquí 🚀</Typography>
                <Typography className='mbs-1'>¡Haz que la gestión de tu aplicación sea fácil y divertida!</Typography>
              </div>
              <form noValidate autoComplete='off' onSubmit={handleSubmit} className='flex flex-col gap-5'>
                <TextField
                  autoFocus
                  fullWidth
                  label='Nombre de usuario'
                  value={formData.username}
                  onChange={handleChange('username')}
                  error={!!errors.username}
                  helperText={errors.username}
                />
                <TextField
                  fullWidth
                  label='Email'
                  type='email'
                  value={formData.email}
                  onChange={handleChange('email')}
                  error={!!errors.email}
                  helperText={errors.email}
                />
                <TextField
                  fullWidth
                  label='Contraseña'
                  type={isPasswordShown ? 'text' : 'password'}
                  value={formData.password}
                  onChange={handleChange('password')}
                  error={!!errors.password}
                  helperText={errors.password}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position='end'>
                        <IconButton
                          size='small'
                          edge='end'
                          onClick={handleClickShowPassword}
                          onMouseDown={e => e.preventDefault()}
                        >
                          <i className={isPasswordShown ? 'ri-eye-off-line' : 'ri-eye-line'} />
                        </IconButton>
                      </InputAdornment>
                    )
                  }}
                />
                <TextField
                  fullWidth
                  label='Confirmar contraseña'
                  type={isConfirmPasswordShown ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={handleChange('confirmPassword')}
                  error={!!errors.confirmPassword}
                  helperText={errors.confirmPassword}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position='end'>
                        <IconButton
                          size='small'
                          edge='end'
                          onClick={handleClickShowConfirmPassword}
                          onMouseDown={e => e.preventDefault()}
                        >
                          <i className={isConfirmPasswordShown ? 'ri-eye-off-line' : 'ri-eye-line'} />
                        </IconButton>
                      </InputAdornment>
                    )
                  }}
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formData.privacyPolicies}
                      onChange={handleChange('privacyPolicies')}
                      color={errors.privacyPolicies ? 'error' : 'primary'}
                    />
                  }
                  label={
                    <>
                      <span>Acepto </span>
                      <Link className='text-primary'>políticas de privacidad y términos</Link>
                    </>
                  }
                />
                {errors.privacyPolicies && (
                  <Typography color='error' variant='body2'>
                    {errors.privacyPolicies}
                  </Typography>
                )}
                {errors.submit && (
                  <Alert severity='error'>
                    {errors.submit}
                  </Alert>
                )}
                <Button
                  fullWidth
                  variant='contained'
                  type='submit'
                  disabled={isLoading}
                >
                  {isLoading ? 'Registrando...' : 'Registrarse'}
                </Button>
                <div className='flex justify-center items-center flex-wrap gap-2'>
                  <Typography>¿Ya tienes una cuenta?</Typography>
                  <Typography component={Link} href='/login' color='primary'>
                    Inicia sesión aquí
                  </Typography>
                </div>
                <Divider className='gap-3'>o</Divider>
                <div className='flex justify-center items-center gap-2'>
                  <IconButton size='small' className='text-facebook'>
                    <i className='ri-facebook-fill' />
                  </IconButton>
                  <IconButton size='small' className='text-twitter'>
                    <i className='ri-twitter-fill' />
                  </IconButton>
                  <IconButton size='small' className='text-github'>
                    <i className='ri-github-fill' />
                  </IconButton>
                  <IconButton size='small' className='text-googlePlus'>
                    <i className='ri-google-fill' />
                  </IconButton>
                </div>
              </form>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default Register