'use client'

import { Add as IconAdd, Campaign as IconAviso } from '@mui/icons-material'
import { TabContext, TabList, TabPanel } from '@mui/lab'
import { Box, Button, Card, Tab, Typography } from '@mui/material'
import React, { useState } from 'react'
import AvisoForm from './AvisoForm'
import AvisoList from './AvisoList'

import { useAuth } from '@/hooks/useAuth'

export default function AvisosView() {
  const { user } = useAuth()
  const isFamily = user?.tipo_usuario === 'familia'
  const [view, setView] = useState<'list' | 'create' | 'edit'>('list')
  const [tabValue, setTabValue] = useState('recientes')
  const [avisoToEdit, setAvisoToEdit] = useState<any>(null)

  const handleTabChange = (event: React.SyntheticEvent, newValue: string) => {
    setTabValue(newValue)
  }

  const handleEdit = (aviso: any) => {
    setAvisoToEdit(aviso)
    setView('edit')
  }

  const handleCancelForm = () => {
    setAvisoToEdit(null)
    setView('list')
  }

  const handleSuccessForm = () => {
    setAvisoToEdit(null)
    setView('list')
  }

  return (
    <Box>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconAviso sx={{ fontSize: 32, color: 'primary.main' }} />
          <Typography variant='h4'>Avisos y Comunicados</Typography>
        </Box>
        {view === 'list' && !isFamily && (
          <Button variant='contained' startIcon={<IconAdd />} onClick={() => setView('create')}>
            Nuevo Aviso
          </Button>
        )}
      </Box>

      {view === 'list' ? (
        <Card>
          <TabContext value={tabValue}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <TabList onChange={handleTabChange} aria-label='avisos tabs'>
                <Tab label='Recientes' value='recientes' />
                {!isFamily && <Tab label='Mis Avisos Enviados' value='enviados' />}
              </TabList>
            </Box>
            <TabPanel value='recientes' sx={{ p: 0 }}>
              {tabValue === 'recientes' && <AvisoList type='recientes' onEdit={handleEdit} />}
            </TabPanel>
            {!isFamily && (
              <TabPanel value='enviados' sx={{ p: 0 }}>
                {tabValue === 'enviados' && <AvisoList type='enviados' onEdit={handleEdit} />}
              </TabPanel>
            )}
          </TabContext>
        </Card>
      ) : (
        <AvisoForm onCancel={handleCancelForm} onSuccess={handleSuccessForm} aviso={avisoToEdit} />
      )}
    </Box>
  )
}
