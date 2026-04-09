'use client'

// React Imports
import { useRef, useState } from 'react'
import type { MouseEvent } from 'react'

// Next Imports
import { useRouter } from 'next/navigation'

// MUI Imports
import { styled } from '@mui/material/styles'
import Badge from '@mui/material/Badge'
import Avatar from '@mui/material/Avatar'
import Popper from '@mui/material/Popper'
import Fade from '@mui/material/Fade'
import Paper from '@mui/material/Paper'
import ClickAwayListener from '@mui/material/ClickAwayListener'
import MenuList from '@mui/material/MenuList'
import Typography from '@mui/material/Typography'
import Divider from '@mui/material/Divider'
import MenuItem from '@mui/material/MenuItem'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'

// Hook Imports
import { useSettings } from '@core/hooks/useSettings'
import { useAuth } from '@/hooks/useAuth'

// Styled component for badge content
const BadgeContentSpan = styled('span')({
  width: 8,
  height: 8,
  borderRadius: '50%',
  cursor: 'pointer',
  backgroundColor: 'var(--mui-palette-success-main)',
  boxShadow: '0 0 0 2px var(--mui-palette-background-paper)'
})

const UserDropdown = () => {
  // States
  const [open, setOpen] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  // Refs
  const anchorRef = useRef<HTMLDivElement>(null)

  // Hooks
  const router = useRouter()
  const { logout, user } = useAuth()
  const { settings } = useSettings()

  // Generate initials from user name
  const getInitials = (name: string) => {
    if (!name) return 'U'
    const names = name.split(' ')
    if (names.length >= 2) {
      return `${names[0][0]}${names[1][0]}`.toUpperCase()
    }
    return name[0].toUpperCase()
  }

  // Get display name
  const getDisplayName = () => {
    if (user?.name) {
      return user.name
    }
    return 'Usuario'
  }

  const handleDropdownOpen = () => {
    !open ? setOpen(true) : setOpen(false)
  }

  const handleDropdownClose = (event?: MouseEvent<HTMLLIElement> | (MouseEvent | TouchEvent), url?: string) => {
    if (url) {
      router.push(url)
    }

    if (anchorRef.current && anchorRef.current.contains(event?.target as HTMLElement)) {
      return
    }

    setOpen(false)
  }

  const handleUserLogout = async () => {
    setIsLoggingOut(true)

    try {
      await logout()
    } catch (error) {
      console.error('Error during logout:', error)

      // Fallback: redirect to login even if logout fails
      router.push('/login')
    } finally {
      setIsLoggingOut(false)
    }
  }

  return (
    <>
      <Badge
        ref={anchorRef}
        overlap='circular'
        badgeContent={<BadgeContentSpan onClick={handleDropdownOpen} />}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        className='mis-2'
      >
        <Avatar
          ref={anchorRef}
          alt={getDisplayName()}
          src={user?.foto_url || undefined}
          onClick={handleDropdownOpen}
          className='cursor-pointer bs-[38px] is-[38px]'
        >
          {getInitials(getDisplayName())}
        </Avatar>
      </Badge>
      <Popper
        open={open}
        transition
        disablePortal
        placement='bottom-end'
        anchorEl={anchorRef.current}
        className='min-is-[240px] !mbs-4 z-[1]'
      >
        {({ TransitionProps, placement }) => (
          <Fade
            {...TransitionProps}
            style={{
              transformOrigin: placement === 'bottom-end' ? 'right top' : 'left top'
            }}
          >
            <Paper
              elevation={settings?.skin === 'bordered' ? 0 : 8}
      {...(settings?.skin === 'bordered' && { className: 'border' })}
            >
              <ClickAwayListener onClickAway={e => handleDropdownClose(e as MouseEvent | TouchEvent)}>
                <MenuList>
                  <div className='flex items-center plb-2 pli-4 gap-2' tabIndex={-1}>
                    <Avatar alt={getDisplayName()} src={user?.foto_url || undefined}>
                      {getInitials(getDisplayName())}
                    </Avatar>
                    <div className='flex items-start flex-col'>
                      <Typography variant='body2' className='font-medium' color='text.primary'>
                        {getDisplayName()}
                      </Typography>
                      <Typography variant='caption'>
                        {user?.email || 'usuario@ejemplo.com'}
                      </Typography>
                    </div>
                  </div>
                  <Divider className='mlb-1' />
                  <MenuItem className='gap-3 pli-4' onClick={e => handleDropdownClose(e, '/change-password')}>
                    <i className='ri-lock-password-line' />
                    <Typography color='text.primary'>Cambiar contraseña</Typography>
                  </MenuItem>
                  <div className='flex items-center plb-1.5 pli-4'>
                    <Button
                      fullWidth
                      variant='contained'
                      color='error'
                      size='small'
                      disabled={isLoggingOut}
                      endIcon={
                        isLoggingOut ? (
                          <CircularProgress size={16} color='inherit' />
                        ) : (
                          <i className='ri-logout-box-r-line' />
                        )
                      }
                      onClick={handleUserLogout}
                    >
                      {isLoggingOut ? 'Cerrando...' : 'Cerrar Sesión'}
                    </Button>
                  </div>
                </MenuList>
              </ClickAwayListener>
            </Paper>
          </Fade>
        )}
      </Popper>
    </>
  )
}

export default UserDropdown
