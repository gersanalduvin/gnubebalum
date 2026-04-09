'use client'

import React, { useState, useRef } from 'react'

import {
  Avatar,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  CircularProgress,
  Box,
  Typography
} from '@mui/material'
import {
  PhotoCamera,
  Delete as DeleteIcon,
  MoreVert as MoreVertIcon
} from '@mui/icons-material'

import { toast } from 'react-hot-toast'

import UserPhotoService from '@/services/userPhotoService'

interface PhotoUploadProps {
  userId: number
  currentPhotoUrl?: string | null
  displayName: string
  size?: number
  showMenu?: boolean
  onPhotoUpdate?: (photoUrl: string | null) => void
}

export default function PhotoUpload({
  userId,
  currentPhotoUrl,
  displayName,
  size = 40,
  showMenu = true,
  onPhotoUpdate
}: PhotoUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
  }

  const handleUploadClick = () => {
    fileInputRef.current?.click()
    handleMenuClose()
  }

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validar archivo
    const validation = UserPhotoService.validateFile(file)
    if (!validation.isValid) {
      toast.error(validation.error || 'Archivo no válido')
      return
    }

    setIsUploading(true)
    try {
      const response = await UserPhotoService.uploadPhoto(userId, file)
      const newPhotoUrl = response.foto_info?.url || response.user?.foto_url
      
      if (onPhotoUpdate) {
        onPhotoUpdate(newPhotoUrl)
        // Forzar re-render del componente padre
        window.location.reload()
      }
      
      toast.success('Foto actualizada exitosamente')
    } catch (error: any) {
      const errorData = error.data || {}
      
      // Manejar errores de validación
      if (errorData.errors && errorData.errors.foto_file) {
        toast.error(errorData.errors.foto_file[0])
      } else {
        toast.error(errorData.message || 'Error al subir la foto')
      }
    } finally {
      setIsUploading(false)
      // Limpiar el input para permitir subir el mismo archivo nuevamente
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleDeletePhoto = async () => {
    if (!currentPhotoUrl) {
      toast.error('No hay foto para eliminar')
      return
    }

    setIsUploading(true)
    try {
      await UserPhotoService.deletePhoto(userId)
      
      if (onPhotoUpdate) {
        onPhotoUpdate(null)
      }
      
      toast.success('Foto eliminada exitosamente')
    } catch (error: any) {
      const errorData = error.data || {}
      toast.error(errorData.message || 'Error al eliminar la foto')
    } finally {
      setIsUploading(false)
    }
    
    handleMenuClose()
  }

  return (
    <Box position="relative" display="inline-block">
      <Avatar
        src={currentPhotoUrl || undefined}
        alt={displayName}
        sx={{ 
          width: size, 
          height: size,
          cursor: showMenu ? 'pointer' : 'default'
        }}
        onClick={showMenu ? handleMenuOpen : undefined}
      >
        {!currentPhotoUrl && getInitials(displayName)}
      </Avatar>

      {isUploading && (
        <Box
          position="absolute"
          top={0}
          left={0}
          right={0}
          bottom={0}
          display="flex"
          alignItems="center"
          justifyContent="center"
          bgcolor="rgba(0, 0, 0, 0.5)"
          borderRadius="50%"
        >
          <CircularProgress size={size * 0.4} sx={{ color: 'white' }} />
        </Box>
      )}

      {showMenu && (
        <>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/jpeg,image/jpg,image/png,image/webp"
            style={{ display: 'none' }}
          />

          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'right',
            }}
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
          >
            <MenuItem onClick={handleUploadClick} disabled={isUploading}>
              <ListItemIcon>
                <PhotoCamera fontSize="small" />
              </ListItemIcon>
              <ListItemText>
                {currentPhotoUrl ? 'Cambiar foto' : 'Subir foto'}
              </ListItemText>
            </MenuItem>

            {currentPhotoUrl && (
              <MenuItem onClick={handleDeletePhoto} disabled={isUploading}>
                <ListItemIcon>
                  <DeleteIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText>Eliminar foto</ListItemText>
              </MenuItem>
            )}
          </Menu>
        </>
      )}
    </Box>
  )
}