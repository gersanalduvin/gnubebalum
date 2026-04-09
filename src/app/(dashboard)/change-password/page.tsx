'use client'

// React Imports
import { useState } from 'react'

// MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import InputAdornment from '@mui/material/InputAdornment'
import Alert from '@mui/material/Alert'
import CircularProgress from '@mui/material/CircularProgress'

// Third-party Imports
import { toast } from 'react-hot-toast'

// Hook Imports
import { useAuth } from '@/hooks/useAuth'

// Service Imports
import { changePassword } from '@/features/auth/services/authService'

// Type Imports
interface ChangePasswordForm {
  current_password: string
  new_password: string
  new_password_confirmation: string
}

interface FormErrors {
  current_password?: string[]
  new_password?: string[]
  new_password_confirmation?: string[]
}

const ChangePasswordPage = () => {
  // States
  const [formData, setFormData] = useState<ChangePasswordForm>({
    current_password: '',
    new_password: '',
    new_password_confirmation: ''
  })

  const [errors, setErrors] = useState<FormErrors>({})
  const [loading, setLoading] = useState(false)
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  // Hooks
  const { user } = useAuth()

  const handleInputChange = (field: keyof ChangePasswordForm) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value
    }))
    
    // Clear specific field error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined
      }))
    }
  }

  // Validación en tiempo real para nueva contraseña
  const validateNewPassword = (password: string) => {
    // Solo validar si hay contenido y no hay errores del servidor
    if (!password || errors.new_password) return ''
    
    if (password.length < 8) {
      return 'La contraseña debe tener al menos 8 caracteres'
    }

    if (password === formData.current_password && formData.current_password.length > 0) {
      return 'La nueva contraseña debe ser diferente a la actual'
    }

    return ''
  }

  // Validación en tiempo real para confirmación
  const validatePasswordConfirmation = (confirmation: string) => {
    // Solo validar si hay contenido y no hay errores del servidor
    if (!confirmation || errors.new_password_confirmation) return ''
    
    if (confirmation !== formData.new_password) {
      return 'Las contraseñas no coinciden'
    }

    return ''
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setLoading(true)
    setErrors({})

    try {
      await changePassword(formData)
      
      // Mostrar toast de éxito según las reglas del proyecto
      toast.success('Contraseña cambiada exitosamente')
      
      // Limpiar formulario
      setFormData({
        current_password: '',
        new_password: '',
        new_password_confirmation: ''
      })
    } catch (error: any) {
      // Procesar errores del backend según las reglas del proyecto
      const errorData = error.data || {}
      
      if (error.status === 422) {
        // Errores de validación - mostrar en los campos correspondientes
        if (errorData.errors) {
          setErrors(errorData.errors)
        } else {
          toast.error(errorData.message || 'Error de validación')
        }
      } else if (error.status === 401) {
        // Error de autenticación - mostrar toast y redirigir
        toast.error('Sesión expirada. Por favor, inicie sesión nuevamente.')
        window.location.href = '/auth/login'
      } else {
        // Otros errores - mostrar toast
        const message = errorData.message || 'Error al cambiar la contraseña. Intente nuevamente.'
        toast.error(message)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className='flex flex-col gap-6'>
      <div>
        <Typography variant='h4' className='mb-1'>
          Cambiar Contraseña
        </Typography>
        <Typography variant='body2' color='text.secondary'>
          Actualiza tu contraseña para mantener tu cuenta segura
        </Typography>
      </div>

      <Card>
        <CardHeader
          title='Cambiar Contraseña'
          subheader='Ingresa tu contraseña actual y la nueva contraseña'
        />
        <CardContent>
          <form onSubmit={handleSubmit} className='flex flex-col gap-3'>
             <TextField
               fullWidth
               size="small"
               label='Contraseña Actual'
               type={showCurrentPassword ? 'text' : 'password'}
               value={formData.current_password}
               onChange={handleInputChange('current_password')}
               error={!!errors.current_password}
               helperText={errors.current_password?.[0]}
               required
               sx={{
                 '& .MuiOutlinedInput-root': {
                   '&.Mui-error': {
                     '& fieldset': {
                       borderColor: '#f44336',
                       borderWidth: '2px',
                     },
                   },
                 },
                 '& .MuiInputLabel-root.Mui-error': {
                   color: '#f44336',
                 },
                 '& .MuiFormHelperText-root.Mui-error': {
                   color: '#f44336',
                   fontWeight: 500,
                 },
               }}
               InputProps={{
                 endAdornment: (
                   <InputAdornment position='end'>
                     <IconButton
                       onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                       edge='end'
                       size="small"
                     >
                       <i className={showCurrentPassword ? 'ri-eye-off-line' : 'ri-eye-line'} />
                     </IconButton>
                   </InputAdornment>
                 )
               }}
             />

             <TextField
               fullWidth
               size="small"
               label='Nueva Contraseña'
               type={showNewPassword ? 'text' : 'password'}
               value={formData.new_password}
               onChange={handleInputChange('new_password')}
               error={!!errors.new_password || Boolean(formData.new_password && validateNewPassword(formData.new_password) !== '')}
               helperText={
                 errors.new_password?.[0] || 
                 (formData.new_password ? validateNewPassword(formData.new_password) : '') || 
                 'Mínimo 8 caracteres'
               }
               required
               sx={{
                 '& .MuiOutlinedInput-root': {
                   '&.Mui-error': {
                     '& fieldset': {
                       borderColor: '#f44336',
                       borderWidth: '2px',
                     },
                   },
                 },
                 '& .MuiInputLabel-root.Mui-error': {
                   color: '#f44336',
                 },
                 '& .MuiFormHelperText-root.Mui-error': {
                   color: '#f44336',
                   fontWeight: 500,
                 },
               }}
               InputProps={{
                 endAdornment: (
                   <InputAdornment position='end'>
                     <IconButton
                       onClick={() => setShowNewPassword(!showNewPassword)}
                       edge='end'
                       size="small"
                     >
                       <i className={showNewPassword ? 'ri-eye-off-line' : 'ri-eye-line'} />
                     </IconButton>
                   </InputAdornment>
                 )
               }}
             />

             <TextField
               fullWidth
               size="small"
               label='Confirmar Nueva Contraseña'
               type={showConfirmPassword ? 'text' : 'password'}
               value={formData.new_password_confirmation}
               onChange={handleInputChange('new_password_confirmation')}
               error={!!errors.new_password_confirmation || Boolean(formData.new_password_confirmation && validatePasswordConfirmation(formData.new_password_confirmation) !== '')}
               helperText={
                 errors.new_password_confirmation?.[0] || 
                 (formData.new_password_confirmation ? validatePasswordConfirmation(formData.new_password_confirmation) : '') || 
                 'Debe coincidir con la nueva contraseña'
               }
               required
               sx={{
                 '& .MuiOutlinedInput-root': {
                   '&.Mui-error': {
                     '& fieldset': {
                       borderColor: '#f44336',
                       borderWidth: '2px',
                     },
                   },
                 },
                 '& .MuiInputLabel-root.Mui-error': {
                   color: '#f44336',
                 },
                 '& .MuiFormHelperText-root.Mui-error': {
                   color: '#f44336',
                   fontWeight: 500,
                 },
               }}
               InputProps={{
                 endAdornment: (
                   <InputAdornment position='end'>
                     <IconButton
                       onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                       edge='end'
                       size="small"
                     >
                       <i className={showConfirmPassword ? 'ri-eye-off-line' : 'ri-eye-line'} />
                     </IconButton>
                   </InputAdornment>
                 )
               }}
             />

             <div className='flex gap-4 mt-3'>
               <Button
                 type='submit'
                 variant='contained'
                 size="small"
                 disabled={loading}
                 startIcon={loading ? <CircularProgress size={16} /> : <i className='ri-lock-password-line' />}
               >
                 {loading ? 'Cambiando...' : 'Cambiar Contraseña'}
               </Button>
               <Button
                 type='button'
                 variant='outlined'
                 size="small"
                 onClick={() => {
                   setFormData({
                     current_password: '',
                     new_password: '',
                     new_password_confirmation: ''
                   })
                   setErrors({})
                 }}
               >
                 Limpiar
               </Button>
             </div>
           </form>
        </CardContent>
      </Card>
    </div>
  )
}

export default ChangePasswordPage