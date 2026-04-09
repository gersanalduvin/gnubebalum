'use client'

import {
  Inbox as IconInbox,
  Mail as IconMail,
  MarkEmailRead as IconMailOpened,
  Add as IconPlus,
  Send as IconSend
} from '@mui/icons-material'
import { TabContext, TabList, TabPanel } from '@mui/lab'
import { Box, Button, Card, CardContent, CardHeader, Chip, Grid, Tab, Typography } from '@mui/material'
import Link from 'next/link'
import React, { useEffect, useState } from 'react'

import { useNotifications } from '@/contexts/NotificationsContext'
import { useAuth } from '@/hooks/useAuth'
import type { FiltroMensaje } from '../types'
import MensajeList from './MensajeList'

export default function MensajeriaPage() {
  const { user, accessToken } = useAuth()
  const { contadores, refreshContadores, echo } = useNotifications()
  const [filtroActivo, setFiltroActivo] = useState<FiltroMensaje>('todos')
  const filtroActivoRef = React.useRef(filtroActivo)

  const [canCreateMessage, setCanCreateMessage] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    // Check permissions on mount
    const permsStr = localStorage.getItem('permissions')
    if (user?.superadmin) {
      setCanCreateMessage(true)
      return
    }

    if (permsStr) {
      try {
        const p = JSON.parse(permsStr)
        // Helper to check standard array or object-values
        const hasPermissionInCollection = (collection: any) => {
          if (collection === 'todos') return true
          if (Array.isArray(collection)) return collection.includes('redactar_mensaje')
          if (typeof collection === 'object' && collection !== null) {
            return Object.values(collection).includes('redactar_mensaje')
          }
          return false
        }

        // Check wrapping structure or direct structure
        if (p.permisos && hasPermissionInCollection(p.permisos)) {
          setCanCreateMessage(true)
        } else if (hasPermissionInCollection(p)) {
          setCanCreateMessage(true)
        }
      } catch (e) {
        console.error('Error parsing permissions', e)
      }
    }
  }, [user])

  useEffect(() => {
    refreshContadores()
  }, [refreshContadores])

  // Echo Listener
  useEffect(() => {
    if (user && echo) {
      const channel = echo.private(`App.Models.User.${user.id}`)

      // Listen for message events with dot prefix
      channel.listen('.MensajeEnviado', (e: any) => {
        setRefreshKey(prev => prev + 1)
        refreshContadores()
      })

      channel.listen('.MensajeLeido', (e: any) => {
        // Solo actualizamos los contadores para no reiniciar la paginación ni causar parpadeo
        refreshContadores()
      })

      // No llamamos a echo.leave() aquí porque es una instancia global
      // El NotificationsProvider se encarga de la limpieza
    }
  }, [user?.id, echo, refreshContadores])

  const handleTabChange = (event: React.SyntheticEvent, newValue: FiltroMensaje) => {
    setFiltroActivo(newValue)
    filtroActivoRef.current = newValue
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant='h4' sx={{ fontWeight: 'bold' }}>
            Mensajería
          </Typography>
          <Typography variant='body1' color='text.secondary'>
            Gestiona tus mensajes y comunicaciones
          </Typography>
        </Box>
        {canCreateMessage && (
          <Button
            component={Link}
            href='/mensajeria/nuevo'
            variant='contained'
            color='primary'
            startIcon={<IconPlus />}
          >
            Nuevo Mensaje
          </Button>
        )}
      </Box>

      {/* Contadores */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardHeader
              title={<Typography variant='subtitle2'>No Leídos</Typography>}
              action={<IconMail />}
              sx={{ pb: 0 }}
            />
            <CardContent>
              <Typography variant='h4'>{contadores?.no_leidos || 0}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardHeader
              title={<Typography variant='subtitle2'>Recibidos</Typography>}
              action={<IconInbox />}
              sx={{ pb: 0 }}
            />
            <CardContent>
              <Typography variant='h4'>{contadores?.recibidos || 0}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardHeader
              title={<Typography variant='subtitle2'>Enviados</Typography>}
              action={<IconSend />}
              sx={{ pb: 0 }}
            />
            <CardContent>
              <Typography variant='h4'>{contadores?.enviados || 0}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardHeader
              title={<Typography variant='subtitle2'>Leídos</Typography>}
              action={<IconMailOpened />}
              sx={{ pb: 0 }}
            />
            <CardContent>
              <Typography variant='h4'>{contadores?.leidos || 0}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Card>
        <TabContext value={filtroActivo}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <TabList onChange={handleTabChange} aria-label='filtros mensajeria' variant='scrollable'>
              <Tab label='Todos' value='todos' />
              <Tab
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    No Leídos
                    {contadores && contadores.no_leidos > 0 && (
                      <Chip label={contadores.no_leidos} color='error' size='small' />
                    )}
                  </Box>
                }
                value='no_leidos'
              />
              <Tab label='Recibidos' value='recibidos' />
              <Tab label='Enviados' value='enviados' />
              <Tab label='Leídos' value='leidos' />
            </TabList>
          </Box>
          <TabPanel value={filtroActivo} sx={{ p: 0 }} suppressHydrationWarning>
            <MensajeList filtro={filtroActivo} refreshKey={refreshKey} />
          </TabPanel>
        </TabContext>
      </Card>
    </Box>
  )
}
