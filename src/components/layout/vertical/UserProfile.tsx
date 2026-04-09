'use client'

// React Imports
import { useState } from 'react'

// MUI Imports
import { Avatar, Box, Typography, styled } from '@mui/material'

// Hook Imports
import useVerticalNav from '@menu/hooks/useVerticalNav'
import { useAuth } from '@/hooks/useAuth'

// Component Imports
import PhotoUpload from '@/components/common/PhotoUpload'

type StyledUserProfileProps = {
  isHovered?: boolean
  isCollapsed?: boolean
  collapsedWidth?: number
  transitionDuration?: number
}

const StyledUserProfile = styled(Box, {
  shouldForwardProp: (prop) => !['isHovered', 'isCollapsed', 'collapsedWidth', 'transitionDuration'].includes(prop as string)
})<StyledUserProfileProps>`
  padding: 16px 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  transition: ${({ transitionDuration }) => `all ${transitionDuration}ms ease-in-out`};
  border-bottom: 1px solid var(--mui-palette-divider);
  margin-bottom: 8px;

  ${({ isHovered, isCollapsed, collapsedWidth }) =>
    isCollapsed && !isHovered && `
      padding-inline: calc((${collapsedWidth}px - 1px - 40px) / 2);
      
      .user-name, .user-email {
        opacity: 0;
        visibility: hidden;
      }
    `}

  ${({ isHovered, isCollapsed }) =>
    isCollapsed && isHovered && `
      .user-name, .user-email {
        opacity: 1;
        visibility: visible;
      }
    `}
`

const UserProfile = () => {
  // Hooks
  const { isHovered, isCollapsed, collapsedWidth, transitionDuration } = useVerticalNav()
  const { user } = useAuth()
  
  // State for user photo
  const [userPhoto, setUserPhoto] = useState<string | null>(user?.foto_url || null)

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

  // Handle photo update
  const handlePhotoUpdate = (newPhotoUrl: string | null) => {
    setUserPhoto(newPhotoUrl)
    // La función PhotoUpload ya maneja el reload de la página
  }

  return (
    <StyledUserProfile
      isHovered={isHovered}
      isCollapsed={isCollapsed}
      collapsedWidth={collapsedWidth}
      transitionDuration={transitionDuration}
    >
      <PhotoUpload
        userId={Number(user?.id) || 0}
        currentPhotoUrl={userPhoto}
        displayName={getDisplayName()}
        size={isCollapsed && !isHovered ? 48 : 120}
        showMenu={!isCollapsed || isHovered}
        onPhotoUpdate={handlePhotoUpdate}
      />
      
      <Typography
        variant="body2"
        className="user-name"
        sx={{
          color: 'text.primary',
          fontWeight: 500,
          textAlign: 'center',
          transition: `all ${transitionDuration}ms ease-in-out`,
          opacity: isCollapsed && !isHovered ? 0 : 1,
          visibility: isCollapsed && !isHovered ? 'hidden' : 'visible',
          mt: isCollapsed && !isHovered ? 0 : 1
        }}
      >
        Hola, {getDisplayName()}
      </Typography>
    </StyledUserProfile>
  )
}

export default UserProfile