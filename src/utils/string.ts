export const ensurePrefix = (str: string, prefix: string) => (str.startsWith(prefix) ? str : `${prefix}${str}`)
export const withoutSuffix = (str: string, suffix: string) =>
  str.endsWith(suffix) ? str.slice(0, -suffix.length) : str
export const withoutPrefix = (str: string, prefix: string) => (str.startsWith(prefix) ? str.slice(prefix.length) : str)

/**
 * Convierte una fecha ISO (2010-05-03T06:00:00.000000Z) al formato YYYY-MM-DD
 * @param isoDate - Fecha en formato ISO string
 * @returns Fecha en formato YYYY-MM-DD o string vacío si la fecha es inválida
 */
export const formatDateForInput = (isoDate: string | null | undefined): string => {
  if (!isoDate) return ''
  
  try {
    // Crear objeto Date desde la fecha ISO
    const date = new Date(isoDate)
    
    // Verificar que la fecha sea válida
    if (isNaN(date.getTime())) return ''
    
    // Formatear a YYYY-MM-DD
    return date.toISOString().split('T')[0]
  } catch (error) {
    console.warn('Error al formatear fecha:', isoDate, error)
    return ''
  }
}
