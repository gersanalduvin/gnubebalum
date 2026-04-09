'use client'

import {
    Business as BusinessIcon,
    Description as DescriptionIcon,
    ExpandMore as ExpandMoreIcon,
    Person as PersonIcon,
    School as SchoolIcon
} from '@mui/icons-material'
import {
    Accordion,
    AccordionDetails,
    AccordionSummary,
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    Grid,
    Typography
} from '@mui/material'
import { useState } from 'react'
import type { UserProfessionalProfile } from '../types'

interface Props {
  profile: UserProfessionalProfile
}

export default function ProfessionalProfileView({ profile }: Props) {
  const [expandedSections, setExpandedSections] = useState<string[]>([
    'datos-personales',
    'presentacion'
  ])

  const toggleSection = (section: string) => {
    setExpandedSections(prev =>
      prev.includes(section) ? prev.filter(s => s !== section) : [...prev, section]
    )
  }

  const formatDate = (date: string | null) => {
    if (!date) return 'Presente'
    return new Date(date).toLocaleDateString('es-ES', { year: 'numeric', month: 'long' })
  }

  return (
    <Box>
      {/* Datos del Usuario (desde tabla users) */}
      {profile.user && (
        <Card sx={{ mb: 2, bgcolor: 'primary.50' }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Información Personal (del Sistema)
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">
                  Nombre Completo
                </Typography>
                <Typography variant="body1">
                  {profile.user.primer_nombre} {profile.user.segundo_nombre} {profile.user.primer_apellido}{' '}
                  {profile.user.segundo_apellido}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">
                  Email
                </Typography>
                <Typography variant="body1">{profile.user.email}</Typography>
              </Grid>
              {profile.user.fecha_nacimiento && (
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Fecha de Nacimiento
                  </Typography>
                  <Typography variant="body1">
                    {new Date(profile.user.fecha_nacimiento).toLocaleDateString('es-ES')}
                  </Typography>
                </Grid>
              )}
              {profile.user.sexo && (
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Sexo
                  </Typography>
                  <Typography variant="body1">{profile.user.sexo === 'M' ? 'Masculino' : 'Femenino'}</Typography>
                </Grid>
              )}
              {profile.user.pais_nacimiento && (
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    País de Nacimiento
                  </Typography>
                  <Typography variant="body1">{profile.user.pais_nacimiento}</Typography>
                </Grid>
              )}
              {profile.user.ciudad_nacimiento && (
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Ciudad de Nacimiento
                  </Typography>
                  <Typography variant="body1">{profile.user.ciudad_nacimiento}</Typography>
                </Grid>
              )}
              {profile.user.departamento && (
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Departamento
                  </Typography>
                  <Typography variant="body1">{profile.user.departamento}</Typography>
                </Grid>
              )}
              {profile.user.direccion_domicilio && (
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary">
                    Dirección
                  </Typography>
                  <Typography variant="body1">{profile.user.direccion_domicilio}</Typography>
                </Grid>
              )}
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Sección 1: Datos Personales */}
      <Accordion
        expanded={expandedSections.includes('datos-personales')}
        onChange={() => toggleSection('datos-personales')}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6">1. Datos Personales</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={2}>
            {profile.cedula && (
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">
                  Cédula
                </Typography>
                <Typography variant="body1">{profile.cedula}</Typography>
              </Grid>
            )}
            {profile.estado_civil && (
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">
                  Estado Civil
                </Typography>
                <Typography variant="body1">{profile.estado_civil}</Typography>
              </Grid>
            )}
            {profile.nacionalidad && (
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">
                  Nacionalidad
                </Typography>
                <Typography variant="body1">{profile.nacionalidad}</Typography>
              </Grid>
            )}
          </Grid>
        </AccordionDetails>
      </Accordion>

      {/* Sección 2: Presentación */}
      <Accordion
        expanded={expandedSections.includes('presentacion')}
        onChange={() => toggleSection('presentacion')}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6">2. Presentación Profesional</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={2}>
            {profile.presentacion && (
              <Grid item xs={12}>
                <Typography variant="body2" color="text.secondary">
                  Presentación
                </Typography>
                <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                  {profile.presentacion}
                </Typography>
              </Grid>
            )}
            {profile.telefono_profesional && (
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">
                  Teléfono Profesional
                </Typography>
                <Typography variant="body1">{profile.telefono_profesional}</Typography>
              </Grid>
            )}
            {profile.email_profesional && (
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">
                  Email Profesional
                </Typography>
                <Typography variant="body1">{profile.email_profesional}</Typography>
              </Grid>
            )}
            {profile.linkedin_url && (
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">
                  LinkedIn
                </Typography>
                <Button href={profile.linkedin_url} target="_blank" rel="noopener noreferrer" size="small">
                  Ver Perfil
                </Button>
              </Grid>
            )}
            {profile.sitio_web && (
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">
                  Sitio Web
                </Typography>
                <Button href={profile.sitio_web} target="_blank" rel="noopener noreferrer" size="small">
                  Visitar
                </Button>
              </Grid>
            )}
          </Grid>
        </AccordionDetails>
      </Accordion>

      {/* Sección 3: Experiencia Laboral */}
      <Accordion
        expanded={expandedSections.includes('experiencia')}
        onChange={() => toggleSection('experiencia')}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6">3. Experiencia Laboral ({profile.experiencia_laboral.length})</Typography>
        </AccordionSummary>
        <AccordionDetails>
          {profile.experiencia_laboral.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              No hay experiencia laboral registrada
            </Typography>
          ) : (
            <Box>
              {profile.experiencia_laboral.map((exp, index) => (
                <Card key={index} sx={{ mb: 2 }}>
                  <CardContent>
                    <Box display="flex" alignItems="center" gap={1} mb={1}>
                      <BusinessIcon color="primary" />
                      <Typography variant="h6">{exp.cargo}</Typography>
                    </Box>
                    <Typography variant="subtitle1" color="text.secondary" gutterBottom>
                      {exp.empresa}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {formatDate(exp.fecha_inicio)} - {exp.actualmente ? 'Presente' : formatDate(exp.fecha_fin)}
                    </Typography>
                    {exp.descripcion && (
                      <Typography variant="body2" sx={{ mt: 1, whiteSpace: 'pre-wrap' }}>
                        {exp.descripcion}
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              ))}
            </Box>
          )}
        </AccordionDetails>
      </Accordion>

      {/* Sección 4: Formación Académica */}
      <Accordion
        expanded={expandedSections.includes('formacion')}
        onChange={() => toggleSection('formacion')}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6">4. Formación Académica ({profile.formacion_academica.length})</Typography>
        </AccordionSummary>
        <AccordionDetails>
          {profile.formacion_academica.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              No hay formación académica registrada
            </Typography>
          ) : (
            <Box>
              {profile.formacion_academica.map((form, index) => (
                <Card key={index} sx={{ mb: 2 }}>
                  <CardContent>
                    <Box display="flex" alignItems="center" gap={1} mb={1}>
                      <SchoolIcon color="primary" />
                      <Typography variant="h6">{form.titulo}</Typography>
                    </Box>
                    <Typography variant="subtitle1" color="text.secondary" gutterBottom>
                      {form.nivel} - {form.institucion}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {form.anio_inicio} - {form.en_curso ? 'En curso' : form.anio_fin || 'N/A'}
                    </Typography>
                    {form.documento_url && (
                      <Box mt={1}>
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<DescriptionIcon />}
                          href={form.documento_url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Ver Documento
                        </Button>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              ))}
            </Box>
          )}
        </AccordionDetails>
      </Accordion>

      {/* Sección 5: Habilidades Blandas */}
      <Accordion
        expanded={expandedSections.includes('habilidades')}
        onChange={() => toggleSection('habilidades')}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6">5. Habilidades Blandas ({profile.habilidades_blandas.length})</Typography>
        </AccordionSummary>
        <AccordionDetails>
          {profile.habilidades_blandas.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              No hay habilidades registradas
            </Typography>
          ) : (
            <Box display="flex" flexWrap="wrap" gap={1}>
              {profile.habilidades_blandas.map((habilidad, index) => (
                <Chip key={index} label={habilidad} color="primary" />
              ))}
            </Box>
          )}
        </AccordionDetails>
      </Accordion>

      {/* Sección 6: Referencias */}
      <Accordion
        expanded={expandedSections.includes('referencias')}
        onChange={() => toggleSection('referencias')}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6">6. Referencias Profesionales ({profile.referencias.length})</Typography>
        </AccordionSummary>
        <AccordionDetails>
          {profile.referencias.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              No hay referencias registradas
            </Typography>
          ) : (
            <Box>
              {profile.referencias.map((ref, index) => (
                <Card key={index} sx={{ mb: 2 }}>
                  <CardContent>
                    <Box display="flex" alignItems="center" gap={1} mb={1}>
                      <PersonIcon color="primary" />
                      <Typography variant="h6">{ref.nombre}</Typography>
                    </Box>
                    <Typography variant="subtitle1" color="text.secondary" gutterBottom>
                      {ref.cargo}
                      {ref.empresa && ` - ${ref.empresa}`}
                    </Typography>
                    <Grid container spacing={2} mt={1}>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" color="text.secondary">
                          Teléfono
                        </Typography>
                        <Typography variant="body2">{ref.telefono}</Typography>
                      </Grid>
                      {ref.email && (
                        <Grid item xs={12} sm={6}>
                          <Typography variant="body2" color="text.secondary">
                            Email
                          </Typography>
                          <Typography variant="body2">{ref.email}</Typography>
                        </Grid>
                      )}
                    </Grid>
                  </CardContent>
                </Card>
              ))}
            </Box>
          )}
        </AccordionDetails>
      </Accordion>
    </Box>
  )
}
