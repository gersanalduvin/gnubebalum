// Plantillas predefinidas para planes de clase

export interface Campo {
  nombre: string
  valor: string
  archivos?: (string | File)[] // Array of URLs or pending File objects
}

export interface Section {
  id: string
  titulo: string
  tipo: 'simple' | 'tabla'
  campos: Campo[]
}

export interface LessonPlanContent {
  objetivo: string // Aprendizajes Esperado for Initial
  contenido_principal: string
  valor?: string // New field for Initial
  tema_motivador?: string // New field for Initial
  secciones: Section[]
}

export const getInicialTemplate = (): LessonPlanContent => ({
  objetivo: '',
  contenido_principal: '',
  valor: '',
  tema_motivador: '',
  secciones: [
    {
      id: 'inicial-contenido',
      titulo: 'Contenido',
      tipo: 'tabla', // Editable labels
      campos: [
        { nombre: 'Lenguaje oral', valor: '', archivos: [] },
        { nombre: 'Lectoescritura', valor: '', archivos: [] },
        { nombre: 'Apresto', valor: '', archivos: [] },
        { nombre: 'Desarrollo lógico', valor: '', archivos: [] },
        { nombre: 'Motora gruesa', valor: '', archivos: [] }
      ]
    },
    {
      id: 'inicial-actividades-iniciales',
      titulo: 'Actividades iniciales e iniciación',
      tipo: 'simple',
      campos: [
          { nombre: 'Hora', valor: '', archivos: [] },
          { nombre: 'Actividades', valor: '', archivos: [] }
      ]
    },
    {
      id: 'inicial-desarrollo-logico',
      titulo: 'Desarrollo lógico',
      tipo: 'simple',
      campos: [
          { nombre: 'Hora', valor: '', archivos: [] },
          { nombre: 'Actividades', valor: '', archivos: [] }
      ]
    },
    {
      id: 'inicial-lectoescritura',
      titulo: 'Lectoescritura',
      tipo: 'simple',
      campos: [
          { nombre: 'Hora', valor: '', archivos: [] },
          { nombre: 'Actividades', valor: '', archivos: [] }
      ]
    },
    {
      id: 'inicial-lenguaje-oral',
      titulo: 'Lenguaje oral',
      tipo: 'simple',
      campos: [
          { nombre: 'Hora', valor: '', archivos: [] },
          { nombre: 'Actividades', valor: '', archivos: [] }
      ]
    },
    {
      id: 'inicial-merienda',
      titulo: 'Merienda/receso',
      tipo: 'simple',
      campos: [
          { nombre: 'Hora', valor: '', archivos: [] },
          { nombre: 'Actividades', valor: '', archivos: [] }
      ]
    },
    {
      id: 'inicial-apresto',
      titulo: 'Apresto',
      tipo: 'simple',
      campos: [
          { nombre: 'Hora', valor: '', archivos: [] },
          { nombre: 'Actividades', valor: '', archivos: [] }
      ]
    },
    {
      id: 'inicial-motora-fina',
      titulo: 'Motora fina',
      tipo: 'simple',
      campos: [
          { nombre: 'Hora', valor: '', archivos: [] },
          { nombre: 'Actividades', valor: '', archivos: [] }
      ]
    },
    {
      id: 'inicial-motora-gruesa',
      titulo: 'Motora gruesa',
      tipo: 'simple',
      campos: [
          { nombre: 'Hora', valor: '', archivos: [] },
          { nombre: 'Actividades', valor: '', archivos: [] }
      ]
    },
    {
      id: 'inicial-actividades-finales',
      titulo: 'Actividades Finales',
      tipo: 'simple',
      campos: [
          { nombre: 'Hora', valor: '', archivos: [] },
          { nombre: 'Actividades', valor: '', archivos: [] }
      ]
    },
    {
      id: 'inicial-evidencias',
      titulo: 'Evidencias de aprendizaje',
      tipo: 'simple',
      campos: [
          { nombre: 'Contenido', valor: '', archivos: [] }
      ]
    },
    {
      id: 'inicial-tarea',
      titulo: 'Tarea en casa',
      tipo: 'simple',
      campos: [
          { nombre: 'Descripción', valor: '', archivos: [] }
      ]
    }
  ]
})

export const getGeneralTemplate = (): LessonPlanContent => ({
  objetivo: '',
  contenido_principal: '',
  secciones: [
    {
      id: 'general-unidad',
      titulo: 'Unidad e Indicadores',
      tipo: 'tabla',
      campos: [
        { nombre: 'Nº y Nombre de la Unidad', valor: '' },
        { nombre: 'Indicador de Logro', valor: '' },
        { nombre: 'Contenido', valor: '' },
        { nombre: 'Criterios de Evaluación', valor: '' }
      ]
    },
    {
      id: 'general-iniciacion',
      titulo: 'Actividades de iniciación',
      tipo: 'simple',
      campos: [
        { nombre: 'Actividades', valor: '', archivos: [] }
      ]
    },
    {
      id: 'general-desarrollo',
      titulo: 'Actividades de Desarrollo',
      tipo: 'simple',
      campos: [
        { nombre: 'Actividades', valor: '', archivos: [] }
      ]
    },
    {
      id: 'general-culminacion',
      titulo: 'Actividades de Culminación',
      tipo: 'simple',
      campos: [
        { nombre: 'Actividades', valor: '', archivos: [] }
      ]
    },
    {
      id: 'general-diferenciadas',
      titulo: 'Actividades diferenciadas',
      tipo: 'simple',
      campos: [
        { nombre: 'Actividades', valor: '', archivos: [] }
      ]
    },
      {
      id: 'general-tareas',
      titulo: 'Tareas',
      tipo: 'simple',
      campos: [
        { nombre: 'Actividades', valor: '', archivos: [] }
      ]
    }
  ]
})

export const getPrimariaTemplate = (): LessonPlanContent => ({
  objetivo: '',
  contenido_principal: '',
  secciones: [
    {
      id: 'primaria-unidad',
      titulo: 'Unidad e Indicadores',
      tipo: 'tabla',
      campos: [
        { nombre: 'Nº y Nombre de la Unidad', valor: '' },
        { nombre: 'Indicador de Logro', valor: '' },
        { nombre: 'Criterios de Evaluación', valor: '' },
        { nombre: 'Aprendizaje esperado', valor: '' }
      ]
    },
    {
      id: 'primaria-contenidos',
      titulo: 'Contenidos',
      tipo: 'simple',
      campos: [
        { nombre: 'Contenido', valor: '', archivos: [] }
      ]
    }
  ]
})

export const getEmptyTemplate = (): LessonPlanContent => ({
  objetivo: '',
  contenido_principal: '',
  secciones: []
})
