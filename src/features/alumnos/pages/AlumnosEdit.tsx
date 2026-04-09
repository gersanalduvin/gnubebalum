'use client'

import { useEffect, useRef, useState } from 'react'

import { useParams, useRouter } from 'next/navigation'

import { ArrowBack as BackIcon, Delete as DeleteIcon, Save as SaveIcon } from '@mui/icons-material'
import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Skeleton,
    Typography
} from '@mui/material'
import { toast } from 'react-hot-toast'

import { PermissionGuard } from '@/components/PermissionGuard'
import AuditoriaModal from '@/features/auditoria/components/AuditoriaModal'
import { usePermissions } from '@/hooks/usePermissions'
import { formatDateForInput } from '../../../utils/string'
import AlumnoFormTabs from '../components/AlumnoFormTabs'
import { AlumnosService } from '../services/alumnosService'
import type { Alumno, AlumnoFormData, ValidationErrors } from '../types'

export default function AlumnosEdit() {
  const router = useRouter()
  const params = useParams()
  const alumnoId = parseInt(params.id as string)
  const { hasPermission } = usePermissions()

  // Verificaciones de permisos
  const canEdit = hasPermission('usuarios.alumnos.editar')
  const canDelete = hasPermission('usuarios.alumnos.eliminar')
  const canDeletePhoto = hasPermission('usuarios.alumnos.eliminar_foto')

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showAuditoria, setShowAuditoria] = useState(false)
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false)
  const [isDeletingPhoto, setIsDeletingPhoto] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [errors, setErrors] = useState<ValidationErrors>({})
  const [alumno, setAlumno] = useState<Alumno | null>(null)
  const [isActive, setIsActive] = useState<boolean | null>(null)
  const [toggleLoading, setToggleLoading] = useState(false)
  const [formData, setFormData] = useState<AlumnoFormData>({
    primer_nombre: '',
    segundo_nombre: '',
    primer_apellido: '',
    segundo_apellido: '',
    email: '',
    tipo_usuario: 'alumno'
  })

  // Ref para evitar llamadas duplicadas
  const isLoadingRef = useRef(false)
  const lastLoadedIdRef = useRef<number | null>(null)

  // Estados para modales
  const [auditOpen, setAuditOpen] = useState(false)

  // Cargar datos del alumno
  useEffect(() => {
    const loadAlumno = async () => {
      if (!alumnoId) return
      if (lastLoadedIdRef.current === alumnoId) return
      lastLoadedIdRef.current = alumnoId

      try {
        isLoadingRef.current = true
        setLoading(true)
        const data = await AlumnosService.getAlumnoById(alumnoId)
        setAlumno(data)
        setIsActive(computeActive(data))

        // Mapear datos del alumno al formulario
        setFormData({
          id: data.id, // Agregar el ID para que esté disponible en los componentes hijos
          primer_nombre: data.primer_nombre || '',
          segundo_nombre: data.segundo_nombre || '',
          primer_apellido: data.primer_apellido || '',
          segundo_apellido: data.segundo_apellido || '',
          email: data.email || '',
          tipo_usuario: data.tipo_usuario || 'alumno',
          fecha_nacimiento: formatDateForInput(data.fecha_nacimiento),
          edad: data.edad || '',
          lugar_nacimiento: data.lugar_nacimiento || '',
          sexo: data.sexo || undefined,
          codigo_mined: data.codigo_mined || '',
          codigo_unico: data.codigo_unico || '',
          correo_notificaciones: data.correo_notificaciones || '',

          // Información familiar
          nombre_madre: data.nombre_madre || '',
          fecha_nacimiento_madre: formatDateForInput(data.fecha_nacimiento_madre),
          edad_madre: data.edad_madre || '',
          cedula_madre: data.cedula_madre || '',
          religion_madre: data.religion_madre || '',
          estado_civil_madre: data.estado_civil_madre || undefined,
          telefono_madre: data.telefono_madre || '',
          telefono_claro_madre: data.telefono_claro_madre || '',
          telefono_tigo_madre: data.telefono_tigo_madre || '',
          direccion_madre: data.direccion_madre || '',
          barrio_madre: data.barrio_madre || '',
          ocupacion_madre: data.ocupacion_madre || '',
          lugar_trabajo_madre: data.lugar_trabajo_madre || '',
          telefono_trabajo_madre: data.telefono_trabajo_madre || '',

          nombre_padre: data.nombre_padre || '',
          fecha_nacimiento_padre: formatDateForInput(data.fecha_nacimiento_padre),
          edad_padre: data.edad_padre || '',
          cedula_padre: data.cedula_padre || '',
          religion_padre: data.religion_padre || '',
          estado_civil_padre: data.estado_civil_padre || undefined,
          telefono_padre: data.telefono_padre || '',
          telefono_claro_padre: data.telefono_claro_padre || '',
          telefono_tigo_padre: data.telefono_tigo_padre || '',
          direccion_padre: data.direccion_padre || '',
          barrio_padre: data.barrio_padre || '',
          ocupacion_padre: data.ocupacion_padre || '',
          lugar_trabajo_padre: data.lugar_trabajo_padre || '',
          telefono_trabajo_padre: data.telefono_trabajo_padre || '',

          nombre_responsable: data.nombre_responsable || '',
          cedula_responsable: data.cedula_responsable || '',
          telefono_responsable: data.telefono_responsable || '',
          direccion_responsable: data.direccion_responsable || '',

          // Datos familiares
          cantidad_hijos: data.cantidad_hijos || undefined,
          lugar_en_familia: data.lugar_en_familia || '',
          personas_hogar: data.personas_hogar || '',
          encargado_alumno: data.encargado_alumno || '',
          contacto_emergencia: data.contacto_emergencia || '',
          telefono_emergencia: data.telefono_emergencia || '',
          metodos_disciplina: data.metodos_disciplina || '',
          pasatiempos_familiares: data.pasatiempos_familiares || '',

          // Área médica/psicológica
          personalidad: data.personalidad || '',
          parto: data.parto || undefined,
          sufrimiento_fetal: data.sufrimiento_fetal || false,
          edad_gateo: data.edad_gateo || undefined,
          edad_caminar: data.edad_caminar || undefined,
          edad_hablar: data.edad_hablar || undefined,
          habilidades: data.habilidades || '',
          pasatiempos: data.pasatiempos || '',
          preocupaciones: data.preocupaciones || '',
          juegos_preferidos: data.juegos_preferidos || '',

          // Área social
          se_relaciona_familiares: data.se_relaciona_familiares || false,
          establece_relacion_coetaneos: data.establece_relacion_coetaneos || false,
          evita_contacto_personas: data.evita_contacto_personas || false,
          especifique_evita_personas: data.especifique_evita_personas || '',
          evita_lugares_situaciones: data.evita_lugares_situaciones || false,
          especifique_evita_lugares: data.especifique_evita_lugares || '',
          respeta_figuras_autoridad: data.respeta_figuras_autoridad || false,

          // Área comunicativa
          atiende_cuando_llaman: data.atiende_cuando_llaman || false,
          es_capaz_comunicarse: data.es_capaz_comunicarse || false,
          comunica_palabras: data.comunica_palabras || false,
          comunica_señas: data.comunica_señas || false,
          comunica_llanto: data.comunica_llanto || false,
          dificultad_expresarse: data.dificultad_expresarse || false,
          especifique_dificultad_expresarse: data.especifique_dificultad_expresarse || '',
          dificultad_comprender: data.dificultad_comprender || false,
          especifique_dificultad_comprender: data.especifique_dificultad_comprender || '',
          atiende_orientaciones: data.atiende_orientaciones || false,

          // Área psicológica
          estado_animo_general: data.estado_animo_general || undefined,
          tiene_fobias: data.tiene_fobias || false,
          generador_fobia: data.generador_fobia || '',
          tiene_agresividad: data.tiene_agresividad || false,
          tipo_agresividad: data.tipo_agresividad || undefined,

          // Área médica detallada
          patologias_detalle: data.patologias_detalle || '',
          consume_farmacos: data.consume_farmacos || false,
          farmacos_detalle: data.farmacos_detalle || '',
          tiene_alergias: data.tiene_alergias || false,
          causas_alergia: data.causas_alergia || '',
          alteraciones_patron_sueño: data.alteraciones_patron_sueño || false,
          se_duerme_temprano: data.se_duerme_temprano || false,
          se_duerme_tarde: data.se_duerme_tarde || false,
          apnea_sueño: data.apnea_sueño || false,
          pesadillas: data.pesadillas || false,
          enuresis_secundaria: data.enuresis_secundaria || false,
          alteraciones_apetito_detalle: data.alteraciones_apetito_detalle || false,
          aversion_alimentos: data.aversion_alimentos || '',
          reflujo: data.reflujo || false,
          alimentos_favoritos: data.alimentos_favoritos || '',
          alteracion_vision: data.alteracion_vision || false,
          alteracion_audicion: data.alteracion_audicion || false,
          alteracion_tacto: data.alteracion_tacto || false,
          especifique_alteraciones_sentidos: data.especifique_alteraciones_sentidos || '',

          // Alteraciones físicas
          alteraciones_oseas: data.alteraciones_oseas || false,
          alteraciones_musculares: data.alteraciones_musculares || false,
          pie_plano: data.pie_plano || false,

          // Datos especiales
          diagnostico_medico: data.diagnostico_medico || '',
          referido_escuela_especial: data.referido_escuela_especial || false,
          trajo_epicrisis: data.trajo_epicrisis || false,
          presenta_diagnostico_matricula: data.presenta_diagnostico_matricula || false,

          // Información de retiro
          fecha_retiro: formatDateForInput(data.fecha_retiro),
          retiro_notificado: data.retiro_notificado || false,
          motivo_retiro: data.motivo_retiro || '',
          informacion_retiro_adicional: data.informacion_retiro_adicional || '',

          // Observaciones y firma
          observaciones: data.observaciones || '',
          nombre_persona_firma: data.nombre_persona_firma || '',
          cedula_firma: data.cedula_firma || ''
        })
      } catch (error: any) {
        console.error('Error loading alumno:', error)
        toast.error(error.message || 'Error al cargar los datos del alumno')
        router.push('/usuarios/alumnos')
      } finally {
        setLoading(false)
        isLoadingRef.current = false
      }
    }

    loadAlumno()
  }, [alumnoId, router])

  const handleFieldChange = (field: keyof AlumnoFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))

    // Limpiar error del campo cuando el usuario empiece a escribir
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: []
      }))
    }
  }

  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {}

    // Validaciones requeridas
    if (!formData.primer_nombre?.trim()) {
      newErrors.primer_nombre = ['El primer nombre es requerido']
    }

    if (!formData.primer_apellido?.trim()) {
      newErrors.primer_apellido = ['El primer apellido es requerido']
    }

    if (!formData.sexo) {
      newErrors.sexo = ['El sexo es requerido']
    }

    if (!formData.fecha_nacimiento) {
      newErrors.fecha_nacimiento = ['La fecha de nacimiento es requerida']
    }

    // Validación de email
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = ['El formato del email no es válido']
    }

    // Validación de correo de notificaciones
    if (formData.correo_notificaciones && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.correo_notificaciones)) {
      newErrors.correo_notificaciones = ['El formato del correo de notificaciones no es válido']
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validateForm()) {
      toast.error('Por favor, corrija los errores en el formulario')
      return
    }

    try {
      setSaving(true)

      const response = await AlumnosService.updateAlumno(alumnoId, formData)

      if (response.success) {
        setAlumno(response.data)
        toast.success('Alumno actualizado exitosamente')
      } else {
        // Manejar errores de validación del backend
        if (response.errors) {
          const backendErrors: ValidationErrors = {}
          Object.entries(response.errors).forEach(([field, messages]) => {
            backendErrors[field] = messages
          })
          setErrors(backendErrors)
          toast.error('Por favor, corrija los errores de validación')
        } else {
          toast.error(response.message || 'Error al actualizar el alumno')
        }
      }
    } catch (error: any) {
      console.error('Error updating alumno:', error)
      toast.error(error.message || 'Error al actualizar el alumno')
    } finally {
      setSaving(false)
    }
  }

  const handlePhotoUpload = async (file: File) => {
    if (!alumnoId) return

    try {
      setIsUploadingPhoto(true)
      const updatedAlumno = await AlumnosService.uploadPhoto(alumnoId, file)

      // Actualizar el estado del alumno con la nueva foto
      setAlumno(prev => (prev ? { ...prev, foto_url: updatedAlumno.foto_url } : null))

      toast.success('Foto subida exitosamente')
    } catch (error: any) {
      console.error('Error al subir foto:', error)
      toast.error(error.message || 'Error al subir la foto')
    } finally {
      setIsUploadingPhoto(false)
    }
  }

  const handlePhotoDelete = async () => {
    if (!canDeletePhoto) {
      toast.error('No tienes permisos para eliminar fotos de alumnos')
      return
    }

    if (!confirm('¿Está seguro de que desea eliminar la foto?')) {
      return
    }

    try {
      setIsDeletingPhoto(true)
      const updatedAlumno = await AlumnosService.deletePhoto(alumnoId)
      setAlumno(updatedAlumno)
      toast.success('Foto eliminada exitosamente')
    } catch (error: any) {
      toast.error(error.message || 'Error al eliminar la foto')
    } finally {
      setIsDeletingPhoto(false)
    }
  }

  const handleViewChanges = () => {
    setAuditOpen(true)
  }

  const handleDelete = async () => {
    if (!alumno) return

    try {
      setIsDeleting(true)
      await AlumnosService.deleteAlumno(alumno.id)
      toast.success('Alumno eliminado exitosamente')
      router.push('/usuarios/alumnos')
    } catch (error: any) {
      toast.error(error.message || 'Error al eliminar el alumno')
    } finally {
      setIsDeleting(false)
      setShowDeleteModal(false)
    }
  }

  const handleActivate = async () => {
    try {
      setToggleLoading(true)
      const res = await AlumnosService.activateAlumno(alumnoId)
      if (res?.success) {
        setIsActive(computeActive(res?.data) ?? true)
        toast.success(res?.message || 'Alumno activado exitosamente')
      } else {
        toast.error(res?.message || 'Error al activar el alumno')
      }
    } catch (error: any) {
      toast.error(error.message || 'Error al activar el alumno')
    } finally {
      setToggleLoading(false)
    }
  }

  const handleDeactivate = async () => {
    try {
      setToggleLoading(true)
      const res = await AlumnosService.deactivateAlumno(alumnoId)
      if (res?.success) {
        setIsActive(computeActive(res?.data) ?? false)
        toast.success(res?.message || 'Alumno desactivado exitosamente')
      } else {
        toast.error(res?.message || 'Error al desactivar el alumno')
      }
    } catch (error: any) {
      toast.error(error.message || 'Error al desactivar el alumno')
    } finally {
      setToggleLoading(false)
    }
  }

  const handleBack = () => {
    router.push('/usuarios/alumnos')
  }

  if (loading) {
    return (
      <div className='p-6'>
        <div className='flex justify-between items-center mb-6'>
          <div>
            <Skeleton variant='text' width={200} height={32} />
            <Skeleton variant='text' width={300} height={20} />
          </div>
          <div className='flex gap-2'>
            <Skeleton variant='rectangular' width={100} height={36} />
            <Skeleton variant='rectangular' width={120} height={36} />
          </div>
        </div>
        <Card>
          <CardContent>
            <Skeleton variant='rectangular' width='100%' height={400} />
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!alumno) {
    return (
      <div className='p-6'>
        <Alert severity='error'>No se pudo cargar la información del alumno.</Alert>
      </div>
    )
  }

  return (
    <div className='p-6'>
      <div className='flex justify-between items-center mb-6'>
        <div>
          <h1 className='text-2xl font-bold text-gray-900'>
            Editar Alumno: {alumno.primer_nombre} {alumno.primer_apellido}
          </h1>
          <p className='text-gray-600'>Modifica la información del estudiante</p>
        </div>

        <div className='flex gap-2'>
          <Button variant='outlined' startIcon={<BackIcon />} onClick={handleBack} disabled={saving}>
            Volver
          </Button>
          <PermissionGuard permission='usuarios.alumnos.editar'>
            <Button
              variant='contained'
              startIcon={saving ? <CircularProgress size={20} /> : <SaveIcon />}
              onClick={handleSubmit}
              disabled={saving}
            >
              {saving ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
          </PermissionGuard>
          {isActive === true ? (
            <PermissionGuard permission='usuarios.alumnos.desactivar'>
              <Button
                variant='contained'
                color='warning'
                startIcon={toggleLoading ? <CircularProgress size={20} /> : undefined}
                onClick={handleDeactivate}
                disabled={saving || toggleLoading}
              >
                Desactivar
              </Button>
            </PermissionGuard>
          ) : isActive === false ? (
            <PermissionGuard permission='usuarios.alumnos.activar'>
              <Button
                variant='contained'
                color='success'
                startIcon={toggleLoading ? <CircularProgress size={20} /> : undefined}
                onClick={handleActivate}
                disabled={saving || toggleLoading}
              >
                Activar
              </Button>
            </PermissionGuard>
          ) : null}
          <PermissionGuard permission='usuarios.alumnos.eliminar'>
            <Button
              variant='contained'
              color='error'
              startIcon={isDeleting ? <CircularProgress size={20} /> : <DeleteIcon />}
              onClick={() => setShowDeleteModal(true)}
              disabled={saving || isDeleting}
            >
              {isDeleting ? 'Eliminando...' : 'Eliminar'}
            </Button>
          </PermissionGuard>
        </div>
      </div>

      {/* Mostrar errores generales */}
      {Object.keys(errors).length > 0 && (
        <Alert severity='error' sx={{ mb: 3 }}>
          Por favor, corrija los errores en el formulario antes de continuar.
        </Alert>
      )}

      <Card>
        <CardContent>
          <AlumnoFormTabs
            formData={formData}
            onChange={handleFieldChange}
            errors={errors}
            photoUrl={alumno?.foto_url || undefined}
            onPhotoUpload={handlePhotoUpload}
            onPhotoDelete={canDeletePhoto ? handlePhotoDelete : undefined}
            onViewChanges={handleViewChanges}
            isEdit={true}
            isUploadingPhoto={isUploadingPhoto}
            isDeletingPhoto={isDeletingPhoto}
            isActive={isActive}
            readOnly={!canEdit}
          />
        </CardContent>
      </Card>

      {/* Botones de acción en la parte inferior */}
      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
        <Button variant='outlined' onClick={handleBack} disabled={saving}>
          Cancelar
        </Button>
        <PermissionGuard permission='usuarios.alumnos.editar'>
          <Button
            variant='contained'
            startIcon={saving ? <CircularProgress size={20} /> : <SaveIcon />}
            onClick={handleSubmit}
            disabled={saving}
          >
            {saving ? 'Guardando...' : 'Guardar Cambios'}
          </Button>
        </PermissionGuard>
      </Box>

      {/* Modal global de auditoría */}
      <AuditoriaModal open={auditOpen} model={'users'} id={alumnoId} onClose={() => setAuditOpen(false)} />

      {/* Modal de confirmación de eliminación */}
      <Dialog open={showDeleteModal} onClose={() => setShowDeleteModal(false)} maxWidth='sm' fullWidth>
        <DialogTitle>Confirmar Eliminación</DialogTitle>
        <DialogContent>
          <Typography>
            ¿Está seguro de que desea eliminar al alumno{' '}
            <strong>
              {alumno?.primer_nombre} {alumno?.primer_apellido}
            </strong>
            ?
          </Typography>
          <Typography variant='body2' color='text.secondary' sx={{ mt: 2 }}>
            Esta acción no se puede deshacer.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDeleteModal(false)} disabled={isDeleting}>
            Cancelar
          </Button>
          <Button
            onClick={handleDelete}
            color='error'
            variant='contained'
            disabled={isDeleting}
            startIcon={isDeleting ? <CircularProgress size={20} /> : <DeleteIcon />}
          >
            {isDeleting ? 'Eliminando...' : 'Eliminar'}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  )
}
const computeActive = (obj: any): boolean | null => {
  if (!obj) return null
  if (typeof obj.activo === 'boolean') return obj.activo
  if ('deleted_at' in obj) return obj.deleted_at === null
  return null
}
