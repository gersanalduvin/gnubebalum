'use client'

// React Imports
import { useEffect, useState } from 'react'

// Next Imports
import { useRouter, useSearchParams } from 'next/navigation'

// MUI Imports
import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'
import Checkbox from '@mui/material/Checkbox'
import CircularProgress from '@mui/material/CircularProgress'
import FormControlLabel from '@mui/material/FormControlLabel'
import IconButton from '@mui/material/IconButton'
import InputAdornment from '@mui/material/InputAdornment'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'

// Third-party Imports
// Eliminado uso de next-auth; login directo contra backend
import { valibotResolver } from '@hookform/resolvers/valibot'
import classnames from 'classnames'
import type { SubmitHandler } from 'react-hook-form'
import { Controller, useForm } from 'react-hook-form'
import { toast } from 'react-toastify'
import type { InferInput } from 'valibot'
import { email, minLength, nonEmpty, object, pipe, string } from 'valibot'

import { authAPI } from '@/utils/httpClient'



// Utils Imports
// CSRF no requerido para flujo con Bearer token

// Component Imports
import Logo from '@components/layout/shared/Logo'

// Hook Imports
import { useSettings } from '@core/hooks/useSettings'

type ErrorType = {
  message: string[]
  field?: string
}

type FormData = InferInput<typeof schema>

const schema = object({
  email: pipe(string(), minLength(1, 'Este campo es requerido'), email('Por favor ingresa un email válido')),
  password: pipe(
    string(),
    nonEmpty('Este campo es requerido'),
    minLength(5, 'La contraseña debe tener al menos 5 caracteres')
  )
})

const Login = () => {
  // States
  const [isPasswordShown, setIsPasswordShown] = useState(false)
  const [errorState, setErrorState] = useState<ErrorType | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  // Images
  const portadaImg = '/images/pages/portada.jpg'

  // Hooks
  const router = useRouter()
  const searchParams = useSearchParams()
  const { settings } = useSettings()

  // Redirect if already logged in
  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
    const user = typeof window !== 'undefined' ? localStorage.getItem('user') : null
    
    if (token && user) {
      router.replace('/home')
    }
  }, [router])

  const {
    control,
    handleSubmit,
    formState: { errors }
  } = useForm<FormData>({
    resolver: valibotResolver(schema),
    defaultValues: {
      email: '',
      password: ''
    }
  })

  const handleClickShowPassword = () => setIsPasswordShown(show => !show)

  const onSubmit: SubmitHandler<FormData> = async (data: FormData) => {
    try {
      setIsLoading(true)
      setIsPasswordShown(false)
      setErrorState(null)
      setFieldErrors({})

      try {
        const resp: any = await authAPI.login({ email: data.email, password: data.password })
        const payload = resp?.data ?? resp
        const token = payload?.token ?? payload?.access_token ?? payload?.accessToken
        const user = payload?.user ?? payload?.usuario ?? null
        const rawPerms = payload?.permissions ?? payload?.permisos?.permisos ?? []
        const permNames = Array.isArray(rawPerms)
          ? rawPerms.map((p: any) => (typeof p === 'string' ? p : p?.name)).filter(Boolean)
          : []

        if (token) {
          try {
            localStorage.setItem('token', token)
            if (user) localStorage.setItem('user', JSON.stringify(user))
            if (permNames.length) localStorage.setItem('permissions', JSON.stringify(permNames))
          } catch {}

          const redirectURL = searchParams.get('redirectTo') ?? '/home'
          toast.success('¡Inicio de sesión exitoso! Bienvenido de vuelta.')
          router.replace(redirectURL)
          return
        }
      } catch (err: any) {
        const errorData = err?.data || {}
        const message = errorData?.message || 'Credenciales incorrectas'
        toast.error(message)
        setErrorState({ message: [message] })
        return
      }

      toast.error('Credenciales incorrectas')
      setErrorState({ message: ['Credenciales incorrectas'] })
    } catch (error) {
      const errorMessage = 'Error de conexión. Verifica tu conexión a internet e intenta de nuevo.'
      toast.error(errorMessage)
      setErrorState({ message: [errorMessage] })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className='flex bs-full justify-center relative'>
      <div className='absolute top-5 sm:top-[33px] start-6 sm:start-[38px] z-[1]'>
        <Logo />
      </div>
      <div
        className={classnames(
          'flex bs-full items-center justify-center relative p-6 max-md:hidden',
          {
            'border-ie': settings?.skin === 'bordered'
          }
        )}
        style={{ flex: 'none', width: '450px' }}
      >
        <div style={{ width: '100%', maxWidth: '380px' }}>
          <img
            src={portadaImg}
            alt='portada'
            style={{ width: '100%', height: 'auto', borderRadius: '1.5rem', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
          />
        </div>
      </div>
      <div className='flex justify-center items-center bs-full bg-backgroundPaper w-full p-6 md:p-12 md:w-[600px]'>

        <div className='flex flex-col gap-5 w-full'>
          {/* Logo PP centrado y antes del título */}
          <div className='flex justify-center mb-4 bg-transparent'>
            <img 
              src="/images/logos/logopp.jpg" 
              alt="Logo PP" 
              className="h-36 w-auto bg-transparent"
            />
          </div>
          
          <div>
            <Typography variant='h4'>¡Bienvenido a GNube!</Typography>
          </div>

          {/* Error Alert - Only show if there's a general error message */}
          {errorState && errorState.message && errorState.message.length > 0 && errorState.message[0] && (
            <Alert severity='error' className='mb-4'>
              <Typography variant='body2'>
                {errorState.message[0]}
              </Typography>
            </Alert>
          )}

          <form
            noValidate
            action={() => {}}
            autoComplete='off'
            onSubmit={handleSubmit(onSubmit)}
            className='flex flex-col gap-5'
          >
            <Controller
              name='email'
              control={control}
              rules={{ required: true }}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  autoFocus
                  type='email'
                  label='Email'
                  disabled={isLoading}
                  onChange={e => {
                    field.onChange(e.target.value)

                    // Clear errors when user starts typing

                    if (errorState !== null) setErrorState(null)

                    if (fieldErrors.email) {
                      setFieldErrors(prev => ({ ...prev, email: '' }))
                    }
                  }}
                  {...((errors.email || fieldErrors.email) && {
                    error: true,
                    helperText: errors?.email?.message || fieldErrors.email
                  })}
                />
              )}
            />
            <Controller
              name='password'
              control={control}
              rules={{ required: true }}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  label='Contraseña'
                  id='login-password'
                  type={isPasswordShown ? 'text' : 'password'}
                  disabled={isLoading}
                  onChange={e => {
                    field.onChange(e.target.value)

                    // Clear errors when user starts typing

                    if (errorState !== null) setErrorState(null)

                    if (fieldErrors.password) {
                      setFieldErrors(prev => ({ ...prev, password: '' }))
                    }
                  }}
                  slotProps={{
                    input: {
                      endAdornment: (
                        <InputAdornment position='end'>
                          <IconButton
                            edge='end'
                            onClick={handleClickShowPassword}
                            onMouseDown={e => e.preventDefault()}
                            aria-label='toggle password visibility'
                            disabled={isLoading}
                          >
                            <i className={isPasswordShown ? 'ri-eye-off-line' : 'ri-eye-line'} />
                          </IconButton>
                        </InputAdornment>
                      )
                    }
                  }}
                  {...((errors.password || fieldErrors.password) && {
                    error: true,
                    helperText: errors?.password?.message || fieldErrors.password
                  })}
                />
              )}
            />
            <div className='flex justify-between items-center flex-wrap gap-x-3 gap-y-1'>
              <FormControlLabel control={<Checkbox defaultChecked />} label='Recordarme' />

            </div>
            <Button 
              fullWidth 
              variant='contained' 
              type='submit'
              disabled={isLoading}
              startIcon={isLoading ? <CircularProgress size={20} color='inherit' /> : null}
            >
              {isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
            </Button>
            
            {/* Texto de desarrollado por */}
            <div className='flex justify-center mt-4'>
              <Typography variant='body2' color='text.secondary'>
                Desarrollado por{' '}
                <a 
                  href="https://gsoftnic.net" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  GSOFTNIC
                </a>
              </Typography>
            </div>
           </form>
        </div>
      </div>
    </div>
  )
}

export default Login
