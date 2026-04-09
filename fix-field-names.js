const fs = require('fs');
const path = require('path');

// Mapeo de nombres incorrectos a nombres correctos
const fieldMappings = {
  // Campos que necesitan corrección
  'telefono_principal': 'telefono_padre',
  'telefono_claro': 'telefono_claro_padre',
  'telefono_tigo': 'telefono_tigo_padre',
  'direccion_de_residencia': 'direccion_padre',
  'barrio': 'barrio_padre',
  'ocupacion': 'ocupacion_padre',
  'lugar_de_trabajo': 'lugar_trabajo_padre',
  'telefono_del_trabajo': 'telefono_trabajo_padre',
  'pasatiempos_del_estudiante': 'pasatiempos',
  'preocupaciones_de_los_padres': 'preocupaciones',
  '¿que_genera_la_fobia?': 'generador_fobia',
  'detalle_de_patologias': 'patologias_detalle',
  'detalle_de_medicamentos': 'farmacos_detalle',
  'causas_de_las_alergias': 'causas_alergia',
  'alteraciones_del_apetito': 'alteraciones_apetito_detalle',
  'alimentos_que_rechaza': 'aversion_alimentos',
  'presenta_reflujo': 'reflujo',
  'alimentos_favoritos': 'alimentos_favoritos',
  'especificacion_de_alteraciones_de_los_sentidos': 'especifique_alteraciones_sentidos',
  'especifique_por_que_evita_contacto_con_personas': 'especifique_evita_personas',
  'especifique_que_lugares_o_situaciones_evita': 'especifique_evita_lugares',
  'especifique_las_dificultades_para_expresarse': 'especifique_dificultad_expresarse',
  'especifique_las_dificultades_para_comprender': 'especifique_dificultad_comprender',
  'motivo_del_retiro': 'motivo_retiro',
  'informacion_adicional_del_retiro': 'informacion_retiro_adicional'
};

const filePath = path.join(__dirname, 'src', 'features', 'alumnos', 'components', 'AlumnoFormTabs.tsx');

try {
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Aplicar todas las correcciones
  Object.entries(fieldMappings).forEach(([incorrect, correct]) => {
    // Corregir hasFieldError
    const hasFieldErrorRegex = new RegExp(`hasFieldError\\('${incorrect.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}'\\)`, 'g');
    content = content.replace(hasFieldErrorRegex, `hasFieldError('${correct}')`);
    
    // Corregir getFieldError
    const getFieldErrorRegex = new RegExp(`getFieldError\\('${incorrect.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}'\\)`, 'g');
    content = content.replace(getFieldErrorRegex, `getFieldError('${correct}')`);
  });
  
  // Correcciones específicas adicionales
  // Corregir error en FormControl para estado civil madre
  content = content.replace(/error={hasFieldError\('cedula_madre'\)}>[\s\S]*?<InputLabel>Estado Civil<\/InputLabel>/g, 
    `error={hasFieldError('estado_civil_madre')}>
                    <InputLabel>Estado Civil</InputLabel>`);
  
  // Corregir error en FormControl para estado civil padre
  content = content.replace(/error={hasFieldError\('cedula_padre'\)}>[\s\S]*?<InputLabel>Estado Civil<\/InputLabel>/g, 
    `error={hasFieldError('estado_civil_padre')}>
                    <InputLabel>Estado Civil</InputLabel>`);
  
  // Corregir error en FormControl para parto
  content = content.replace(/error={hasFieldError\('parto'\)}>[\s\S]*?<InputLabel>Tipo de Parto<\/InputLabel>/g, 
    `error={hasFieldError('parto')}>
                    <InputLabel>Tipo de Parto</InputLabel>`);
  
  // Corregir error en FormControl para tipo_agresividad
  content = content.replace(/error={hasFieldError\('tipo_agresividad'\)}>[\s\S]*?<InputLabel>Tipo de Agresividad<\/InputLabel>/g, 
    `error={hasFieldError('tipo_agresividad')}>
                    <InputLabel>Tipo de Agresividad</InputLabel>`);
  
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Correcciones aplicadas exitosamente');
} catch (error) {
  console.error('Error al aplicar correcciones:', error);
}