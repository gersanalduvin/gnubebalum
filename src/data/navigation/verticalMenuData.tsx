'use client'

// React Imports
import { useParams } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'

// Type Imports
import type { VerticalMenuDataType } from '@/types/menuTypes'

// Hook Imports
import { i18n } from '@/configs/i18n'
import AvisoBadge from '@/features/avisos/components/AvisoBadge'
import MensajeriaBadge from '@/features/mensajeria/components/MensajeriaBadge'
import { usePermissions } from '@/hooks/usePermissions'

const useVerticalMenuData = (): VerticalMenuDataType[] => {
  const { hasPermission, user } = usePermissions()
  const params = useParams()
  const locale = (params?.lang as string) || i18n.defaultLocale
  const lang = i18n.locales.includes(locale as any) ? locale : i18n.defaultLocale

  // State for children
  const [children, setChildren] = useState<any[]>([])

  useEffect(() => {
    if (user?.tipo_usuario === 'familia') {
      import('@/services/parentAccessService').then(({ ParentAccessService }) => {
        ParentAccessService.getChildren()
          .then(data => {
            setChildren(data)
          })
          .catch(console.error)
      })
    }
  }, [user])

  return useMemo(() => {
    const menuItems: VerticalMenuDataType[] = [
      {
        label: 'Inicio',
        href: '/home',
        icon: 'ri-home-smile-line'
      }
    ]

    // 1.5 Mis Hijos (Familia)
    // 1.5 Mis Hijos (Familia) - MENÚ PLANO
    if (user?.tipo_usuario === 'familia') {
      const studentId = params?.studentId // Get selected student from URL

      if (studentId) {
        // Si hay un estudiante seleccionado, mostramos SU menú específico
        menuItems.push(
          { label: 'General', href: `/${lang}/portal/familia/hijo/${studentId}`, icon: 'ri-user-line' },
          {
            label: 'Calificaciones',
            href: `/${lang}/portal/familia/hijo/${studentId}?tab=grades`,
            icon: 'ri-article-line'
          },
          {
            label: 'Asistencia',
            href: `/${lang}/portal/familia/hijo/${studentId}?tab=attendance`,
            icon: 'ri-calendar-check-line'
          },
          {
            label: 'Horario',
            href: `/${lang}/portal/familia/hijo/${studentId}?tab=schedule`,
            icon: 'ri-calendar-event-line'
          },
          {
            label: 'Pagos',
            href: `/${lang}/portal/familia/hijo/${studentId}?tab=billing`,
            icon: 'ri-money-dollar-circle-line'
          },
          { label: 'Mensajes', href: `/${lang}/portal/familia/hijo/${studentId}?tab=messages`, icon: 'ri-mail-line' }
        )
      }
    }

    // ... Rest of the menu remains the same ...
    // 2. Agenda
    if (hasPermission('agenda.eventos.ver')) {
      menuItems.push({
        label: 'Agenda',
        href: '/agenda',
        icon: 'ri-calendar-event-line'
      })
    }

    // 2.5 Avisos
    if (hasPermission('avisos.ver')) {
      menuItems.push({
        label: 'Avisos',
        href: '/avisos',
        icon: 'ri-broadcast-line',
        suffix: <AvisoBadge />
      })
    }

    // 3. Mensajería
    menuItems.push({
      label: 'Mensajería',
      href: '/mensajeria',
      icon: 'ri-mail-line',
      suffix: <MensajeriaBadge />
    })

    // 4. Planes de Clases
    if (hasPermission('agenda.planes_clases.ver')) {
      menuItems.push({
        label: 'Planes de Clases',
        href: '/planes-clases',
        icon: 'ri-book-2-line'
      })
    }

    // 5. Mis materias / Dashboard Docente
    if (hasPermission('operaciones.docentes') && user?.tipo_usuario === 'docente') {
      menuItems.push({
        label: 'Mis materias',
        href: '/docente/dashboard',
        icon: 'ri-dashboard-line'
      })

      menuItems.push({
        label: 'Observaciones',
        href: '/docente/observaciones',
        icon: 'ri-chat-quote-line'
      })
    }

    // Submenú de Asistencias para Docente
    if (hasPermission('operaciones.docentes') && user?.tipo_usuario === 'docente') {
      menuItems.push({
        label: 'Asistencias',
        icon: 'ri-calendar-check-line',
        children: [
          {
            label: 'Registrar',
            href: '/docente/asistencias/registrar'
          },
          {
            label: 'Reportes',
            href: '/docente/asistencias/reportes'
          }
        ]
      })
    }

    // Sección de Usuarios
    const usuariosChildren: VerticalMenuDataType[] = []

    if (hasPermission('usuarios.alumnos.ver')) {
      usuariosChildren.push({
        label: 'Alumnos',
        href: '/usuarios/alumnos'
      })
    }

    if (hasPermission('usuarios.administrativos.ver')) {
      usuariosChildren.push({
        label: 'Administrativos',
        href: '/usuarios/administrativos'
      })
    }

    if (hasPermission('usuarios.docentes.ver')) {
      usuariosChildren.push({
        label: 'Docentes',
        href: '/usuarios/docentes'
      })
    }

    if (hasPermission('usuarios.familias.ver')) {
      usuariosChildren.push({
        label: 'Familias',
        href: '/usuarios/familias'
      })
    }

    if (hasPermission('usuarios.familias.envio_masivo')) {
      usuariosChildren.push({
        label: 'Envío Masivo',
        href: '/usuarios/familias/envio-masivo'
      })
    }

    if (usuariosChildren.length > 0) {
      menuItems.push({
        label: 'Usuarios',
        icon: 'ri-user-line',
        children: usuariosChildren
      })
    }

    // Sección Académica
    const academicoChildren: VerticalMenuDataType[] = []

    // HEURISTIC: Hide "Académico" menu for Teachers who are not Admins
    // This is because Teachers might have underlying read permissions for data loading (periods, groups)
    // but should not see the administrative menu for them.
    const isDocente = hasPermission('operaciones.docentes')
    const isAdmin = hasPermission('usuarios.administrativos.ver') || (user as any)?.superadmin

    // Only show Academic menu if User is Admin OR NOT a Docente (to handle other staff)
    // If user is BOTH, show it (Super users). If User is just Docente, HIDE it.
    const showAcademico = isAdmin || !isDocente

    if (showAcademico) {
      if (hasPermission('conf_periodo_lectivo.index')) {
        academicoChildren.push({
          label: 'Periodos Lectivos',
          href: '/periodo-lectivo'
        })
      }

      if (hasPermission('config_grado.index')) {
        academicoChildren.push({
          label: 'Grados',
          href: '/config/grados'
        })
      }

      if (hasPermission('config_seccion.index')) {
        academicoChildren.push({
          label: 'Secciones',
          href: '/config/secciones'
        })
      }

      if (hasPermission('config_modalidad.index')) {
        academicoChildren.push({
          label: 'Modalidades',
          href: '/config/modalidades'
        })
      }

      if (hasPermission('config_turnos.index')) {
        academicoChildren.push({
          label: 'Turnos',
          href: '/config/turnos'
        })
      }

      if (hasPermission('config_grupos.index')) {
        academicoChildren.push({
          label: 'Grupos',
          href: '/config/grupos'
        })
      }

      if (hasPermission('organizar.lista')) {
        academicoChildren.push({
          label: 'Organizar Listas',
          href: '/academico/organizar-listas'
        })
      }

      // Escalas de notas
      if (hasPermission('config_not_escala.index')) {
        academicoChildren.push({
          label: 'Escalas',
          href: '/academico/escalas'
        })
      }

      // Cortes Lectivos
      if (hasPermission('config_not_semestre.index')) {
        academicoChildren.push({
          label: 'Cortes Lectivos',
          href: '/academico/cortes-lectivos'
        })
      }

      // Asignaturas
      if (hasPermission('not_materias.index')) {
        academicoChildren.push({
          label: 'Asignaturas',
          href: '/academico/asignaturas'
        })
      }

      // Áreas de asignaturas (categorías)
      if (hasPermission('not_materias_areas.index')) {
        academicoChildren.push({
          label: 'Áreas de asignaturas',
          href: '/academico/areas-asignaturas'
        })
      }

      // Asignaturas por Grado
      if (hasPermission('not_asignatura_grado.index')) {
        academicoChildren.push({
          label: 'Asignaturas por Grado',
          href: '/academico/asignaturas-por-grado'
        })
      }

      if (hasPermission('configuracion_academica.permisos.ver')) {
        academicoChildren.push({
          label: 'Permisos',
          href: '/academico/permisos'
        })
      }

      if (hasPermission('observaciones.ver')) {
        academicoChildren.push({
          label: 'Observaciones Alumnos',
          href: '/academico/observaciones'
        })
      }
    }

    if (academicoChildren.length > 0) {
      menuItems.push({
        label: 'Académico',
        icon: 'ri-book-open-line',
        children: academicoChildren
      })
    }

    // Sección de Horarios
    const horariosChildren: VerticalMenuDataType[] = []

    if (hasPermission('configuracion_academica.horarios.generar')) {
      horariosChildren.push({
        label: 'Generar Horario',
        href: '/horarios/generar'
      })
    }

    if (hasPermission('configuracion_academica.horarios.configurar')) {
      horariosChildren.push({
        label: 'Gestionar Aulas',
        href: '/horarios/aulas'
      })
    }

    if (hasPermission('horarios.asignaturas.index')) {
      horariosChildren.push({
        label: 'Configurar Asignaturas',
        href: '/horarios/asignaturas'
      })
    }

    if (hasPermission('configuracion_academica.horarios.ver')) {
      horariosChildren.push({
        label: 'Ver Horarios',
        href: '/horarios/vista'
      })
    }

    if (hasPermission('configuracion_academica.horarios.editar')) {
      horariosChildren.push({
        label: 'Disponibilidad Docente',
        href: '/horarios/disponibilidad'
      })
    }

    if (horariosChildren.length > 0) {
      menuItems.push({
        label: 'Horarios',
        icon: 'ri-calendar-todo-line',
        children: horariosChildren
      })
    }

    // Sección Asistencias (Admin)
    const asistenciasChildren: VerticalMenuDataType[] = []
    if (hasPermission('asistencias.registrar')) {
      asistenciasChildren.push({
        label: 'Registrar',
        href: '/academico/asistencias/registrar'
      })
    }
    if (hasPermission('asistencias.ver')) {
      asistenciasChildren.push({
        label: 'Reportes',
        href: '/academico/asistencias/reportes'
      })
    }
    if (asistenciasChildren.length > 0) {
      menuItems.push({
        label: 'Asistencias',
        icon: 'ri-calendar-check-line',
        children: asistenciasChildren
      })
    }

    // Sección de Inventario
    const inventarioChildren: VerticalMenuDataType[] = []

    if (hasPermission('inventario_categorias.index')) {
      inventarioChildren.push({
        label: 'Categorías',
        href: '/inventario/categorias'
      })
    }

    if (hasPermission('inventario_productos.index')) {
      inventarioChildren.push({
        label: 'Productos',
        href: '/inventario/productos'
      })
    }

    if (inventarioChildren.length > 0) {
      // Entrada Masiva
      if (hasPermission('inventario_movimientos.create')) {
        inventarioChildren.push({
          label: 'Entrada Masiva',
          href: '/inventario/entrada-masiva'
        })
      }

      // Reporte de Utilidad
      if (hasPermission('inventario.reportes_utilidad.ver')) {
        inventarioChildren.push({
          label: 'Reporte de Utilidad',
          href: '/inventario/reporte-utilidad'
        })
      }

      // Reporte de Stock
      if (hasPermission('inventario.reporte_stock.ver')) {
        inventarioChildren.push({
          label: 'Reporte de Stock',
          href: '/inventario/reporte-stock'
        })
      }

      menuItems.push({
        label: 'Inventario',
        icon: 'ri-archive-line',
        children: inventarioChildren
      })
    }

    // Sección de Caja
    const cajaChildren: VerticalMenuDataType[] = []

    if (hasPermission('config_parametros.show')) {
      cajaChildren.push({
        label: 'Parámetros',
        href: '/caja/parametros'
      })
    }

    if (hasPermission('config_formas_pago.index')) {
      cajaChildren.push({
        label: 'Formas de Pago',
        href: '/caja/formas-pago'
      })
    }

    if (hasPermission('config_arqueo_moneda.index')) {
      cajaChildren.push({
        label: 'Denominación de Monedas',
        href: '/caja/arqueo-moneda'
      })
    }

    if (hasPermission('config_aranceles.index')) {
      cajaChildren.push({
        label: 'Aranceles',
        href: '/caja/aranceles'
      })
    }

    if (hasPermission('config_plan_pagos.index')) {
      cajaChildren.push({
        label: 'Plan de Pagos',
        href: '/caja/plan-pagos'
      })
    }

    if (hasPermission('recibos.index')) {
      cajaChildren.push({
        label: 'Recibos',
        href: '/caja/recibos'
      })
    }

    if (hasPermission('buscar_recibo')) {
      cajaChildren.push({
        label: 'Buscar Recibo',
        href: '/caja/buscar-recibos'
      })
    }

    if (hasPermission('arqueo_caja')) {
      cajaChildren.push({
        label: 'Arqueo de Caja',
        href: '/caja/arqueo-caja'
      })
    }

    if (cajaChildren.length > 0) {
      menuItems.push({
        label: 'Caja',
        icon: 'ri-money-dollar-box-line',
        children: cajaChildren
      })
    }

    // Sección de Reportes
    const reportesChildren: VerticalMenuDataType[] = []

    // Agregar "Estadística de Matrícula" si el usuario tiene permisos
    if (hasPermission('reportes.estadistica_matricula')) {
      reportesChildren.push({
        label: 'Estadística de Matrícula',
        href: '/reportes/estadistica-matricula'
      })
    }

    // Agregar "Alumnos Nuevo Ingreso" si el usuario tiene permisos
    if (hasPermission('repote.nuevoingreso')) {
      reportesChildren.push({
        label: 'Alumnos Nuevo Ingreso',
        href: '/reportes/alumnos-nuevo-ingreso'
      })
    }

    // Agregar "Alumnos Retirados"
    if (hasPermission('usuarios.alumnos.retirados')) {
      reportesChildren.push({
        label: 'Alumnos Retirados',
        href: '/reportes/alumnos-retirados'
      })
    }

    // Agregar "Carga Académica"
    if (hasPermission('reportes.carga_academica.ver')) {
      reportesChildren.push({
        label: 'Carga Académica',
        href: '/reportes/carga-academica'
      })
    }

    // Agregar "Listas por Grupo" si el usuario tiene permisos
    if (hasPermission('ver_listas_grupo')) {
      reportesChildren.push({
        label: 'Listas por Grupo',
        href: '/reportes/listas-por-grupo'
      })
    }

    // Agregar "Cierre de Caja" si el usuario tiene permisos
    if (hasPermission('reporte_cierre_caja.ver')) {
      reportesChildren.push({
        label: 'Cierre de Caja',
        href: '/reportes/cierre-caja'
      })
    }

    if (hasPermission('reporte_cuenta_x_cobrar.ver')) {
      reportesChildren.push({
        label: 'Cuentas por Cobrar',
        href: '/reportes/cuentas-x-cobrar'
      })
    }

    // Exportar Alumnos (Nuevo)
    if (hasPermission('exportar.alumnos')) {
      reportesChildren.push({
        label: 'Exportar Alumnos',
        href: '/reportes/exportar-alumnos',
        icon: 'ri-file-excel-2-line' // Optional icon if supported in children, usually sidebar cleans it
      })
    }

    // Agregar "Notas por Asignatura"
    if (
      hasPermission('notas.por.asignatura') ||
      (hasPermission('operaciones.docentes') && user?.tipo_usuario === 'docente')
    ) {
      reportesChildren.push({
        label: 'Notas por Asignatura',
        href: '/reportes/notas-por-asignatura'
      })
    }

    // Agregar "Actividades por semana"
    if (hasPermission('ver.actividades_semana')) {
      reportesChildren.push({
        label: 'Actividades por semana',
        href: '/reportes/actividades-semana'
      })
    }

    // Agregar "Boletín Escolar"
    if (hasPermission('generar.boletin')) {
      reportesChildren.push({
        label: 'Boletín Escolar',
        href: '/reportes/boletin-escolar'
      })
    }

    // Agregar "Consolidado de Notas"
    if (hasPermission('generar.consolidado_notas')) {
      reportesChildren.push({
        label: 'Consolidado de Notas',
        href: '/reportes/consolidado-notas'
      })
    }

    if (reportesChildren.length > 0) {
      menuItems.push({
        label: 'Reportes',
        icon: 'ri-file-chart-line',
        children: reportesChildren
      })
    }

    // Sección de Auditoría
    const auditoriaChildren: VerticalMenuDataType[] = []

    if (hasPermission('login_logs.ver')) {
      auditoriaChildren.push({
        label: 'Registro de Accesos',
        href: '/auditoria/login-logs'
      })
    }

    if (auditoriaChildren.length > 0) {
      menuItems.push({
        label: 'Auditoría',
        icon: 'ri-shield-keyhole-line',
        children: auditoriaChildren
      })
    }

    // Sección de Configuración
    const configuracionChildren: VerticalMenuDataType[] = []

    if (hasPermission('roles.ver')) {
      configuracionChildren.push({
        label: 'Roles',
        href: '/roles'
      })
    }

    if (hasPermission('config_catalogo_cuentas.index')) {
      configuracionChildren.push({
        label: 'Catálogo de Cuentas',
        href: '/config/catalogo-cuentas'
      })
    }

    if (configuracionChildren.length > 0) {
      menuItems.push({
        label: 'Configuración',
        icon: 'ri-settings-3-line',
        children: configuracionChildren
      })
    }

    return menuItems
  }, [hasPermission, user, lang, children])
}

// Función wrapper para mantener compatibilidad
const verticalMenuData = (): VerticalMenuDataType[] => {
  // Esta función ahora es solo un placeholder
  // El hook real se debe usar en el componente
  return []
}

export default verticalMenuData
export { useVerticalMenuData }
