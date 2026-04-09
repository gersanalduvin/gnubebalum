import { AlumnosService } from './alumnosService'

export interface EmailCheckResponse {
  exists: boolean
  suggested_email?: string
}

export class EmailGeneratorService {
  /**
   * Genera un correo electrónico basado en el primer nombre y primer apellido
   */
  static generateEmail(primerNombre: string, primerApellido: string): string {
    if (!primerNombre?.trim() || !primerApellido?.trim()) {
      return ''
    }

    // Limpiar y normalizar los nombres
    const nombre = this.normalizeString(primerNombre.trim())
    const apellido = this.normalizeString(primerApellido.trim())

    return `${nombre}.${apellido}@cempp.com`.toLowerCase()
  }

  /**
   * Normaliza una cadena removiendo acentos y caracteres especiales
   */
  private static normalizeString(str: string): string {
    return str
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remover acentos
      .replace(/[^a-zA-Z0-9]/g, '') // Remover caracteres especiales
      .toLowerCase()
  }

  /**
   * Verifica si un correo electrónico ya existe en el sistema
   */
  static async checkEmailExists(email: string, excludeId?: number): Promise<EmailCheckResponse> {
    try {
      const response = await AlumnosService.checkEmailExists(email, excludeId)
      return {
        exists: response.exists
      }
    } catch (error: any) {
      console.error('Error checking email:', error)
      throw new Error('Error al verificar la disponibilidad del correo')
    }
  }

  /**
   * Genera un correo único verificando disponibilidad y agregando consecutivos si es necesario
   */
  static async generateUniqueEmail(
    primerNombre: string, 
    primerApellido: string,
    excludeId?: number
  ): Promise<string> {
    const baseEmail = this.generateEmail(primerNombre, primerApellido)
    
    if (!baseEmail) {
      throw new Error('Debe proporcionar el primer nombre y primer apellido para generar el correo')
    }

    let currentEmail = baseEmail
    let counter = 0
    const maxAttempts = 100 // Evitar bucles infinitos

    while (counter < maxAttempts) {
      try {
        const checkResult = await this.checkEmailExists(currentEmail, excludeId)
        
        // Si no existe, podemos usar este correo
        if (!checkResult.exists) {
          return currentEmail
        }

        // Si existe, generar el siguiente consecutivo
        counter++
        const [localPart, domain] = baseEmail.split('@')
        currentEmail = `${localPart}${counter}@${domain}`
        
      } catch (error) {
        console.error('Error generating unique email:', error)
        throw new Error('Error al generar un correo único')
      }
    }

    throw new Error('No se pudo generar un correo único después de múltiples intentos')
  }

  /**
   * Valida el formato de un correo electrónico
   */
  static validateEmailFormat(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }
}
