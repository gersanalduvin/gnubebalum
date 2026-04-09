import { httpClient } from '@/utils/httpClient';
import type {
    Contadores,
    FiltroMensaje,
    Mensaje,
    MensajeFormData,
    MensajeRespuesta,
    RespuestaFormData,
    Usuario
} from '../types';

export const mensajeriaService = {
  /**
   * Obtener mensajes con filtros
   */
  async getMensajes(params?: {
    filtro?: FiltroMensaje;
    tipo_mensaje?: string;
    estado?: string;
    per_page?: number;
    page?: number;
  }) {
    const queryParams = new URLSearchParams();
    if (params) {
      if (params.filtro) queryParams.append('filtro', params.filtro);
      if (params.tipo_mensaje) queryParams.append('tipo_mensaje', params.tipo_mensaje);
      if (params.estado) queryParams.append('estado', params.estado);
      if (params.per_page) queryParams.append('per_page', String(params.per_page));
      if (params.page) queryParams.append('page', String(params.page));
    }

    const endpoint = queryParams.toString() ? `/bk/v1/mensajes?${queryParams.toString()}` : '/bk/v1/mensajes';
    const response = await httpClient.get<{
      success: boolean;
      data: Mensaje[];
      meta: {
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
      };
    }>(endpoint);
    // Devolver el objeto completo con data y meta para paginación
    return {
      data: response.data,
      meta: response.meta
    };
  },

  /**
   * Obtener contadores
   */
  async getContadores() {
    const response = await httpClient.get<{
      success: boolean;
      data: Contadores;
    }>('/bk/v1/mensajes/contadores');
    return response.data;
  },

  /**
   * Obtener destinatarios permitidos según rol
   */
  /**
   * Obtener destinatarios permitidos según rol
   */
  async getDestinatariosPermitidos(search?: string) {
    const query = search ? `?search=${encodeURIComponent(search)}` : '';
    const response = await httpClient.get<{
      success: boolean;
      data: Usuario[];
    }>(`/bk/v1/mensajes/destinatarios-permitidos${query}`);
    return response.data;
  },

  /**
   * Crear nuevo mensaje
   */
  async crearMensaje(formData: MensajeFormData) {
    const form = new FormData();
    
    form.append('asunto', formData.asunto);
    form.append('contenido', formData.contenido);
    form.append('tipo_mensaje', formData.tipo_mensaje);
    
    if (formData.tipo_destinatario) {
      form.append('tipo_destinatario', formData.tipo_destinatario);
    }

    formData.destinatarios.forEach((id) => {
      form.append('destinatarios[]', id.toString());
    });
    
    if (formData.grupos && formData.grupos.length > 0) {
      formData.grupos.forEach((id) => {
        form.append('grupos[]', id.toString());
      });
    }
    
    if (formData.plazo_confirmacion) {
      form.append('plazo_confirmacion', formData.plazo_confirmacion);
    }
    
    if (formData.permitir_cambio_respuesta !== undefined) {
      form.append('permitir_cambio_respuesta', formData.permitir_cambio_respuesta ? '1' : '0');
    }
    

    
    if (formData.adjuntos && formData.adjuntos.length > 0) {
      formData.adjuntos.forEach((file) => {
        form.append('adjuntos[]', file);
      });
    }
    
    // HttpClient headers handling might be different, but typically FormData identifies itself.
    // However, if httpClient automatically sets JSON content type, we might need to override.
    // For now assuming existing httpClient handles FormData or we just pass it.
    const response = await httpClient.post<{
      success: boolean;
      message: string;
      data: Mensaje;
    }>('/bk/v1/mensajes', form);
    
    return response.data;
  },

  /**
   * Obtener mensaje por ID
   */
  async getMensaje(id: string) {
    const response = await httpClient.get<{
      success: boolean;
      data: Mensaje;
    }>(`/bk/v1/mensajes/${id}`);
    return response.data;
  },

  /**
   * Obtener estadísticas detalladas del mensaje
   */
  async getEstadisticas(id: string) {
    const response = await httpClient.get<{
      success: boolean;
      data: {
        total_destinatarios: number;
        total_leidos: number;
        total_no_leidos: number;
        porcentaje_lectura: number;
        usuarios_leidos: Array<{
          id: number;
          nombre_completo: string;
          email: string;
          fecha_lectura: string | null;
          ip: string | null;
          user_agent: string | null;
        }>;
        usuarios_no_leidos: Array<{
          id: number;
          nombre_completo: string;
          email: string;
        }>;
      };
    }>(`/bk/v1/mensajes/${id}/estadisticas`);
    return response.data;
  },

  /**
   * Confirmar mensaje (SI/NO)
   */
  async confirmarMensaje(id: string, respuesta: 'SI' | 'NO', razon?: string) {
    const response = await httpClient.post<{
      success: boolean;
      message: string;
    }>(`/bk/v1/mensajes/${id}/confirmar`, {
      respuesta,
      razon
    });
    return response.data;
  },

  /**
   * Responder mensaje
   */
  async responderMensaje(mensajeId: string, formData: RespuestaFormData) {
    const form = new FormData();
    
    form.append('contenido', formData.contenido);
    
    if (formData.reply_to_id) {
      form.append('reply_to_id', formData.reply_to_id);
    }
    
    if (formData.menciones && formData.menciones.length > 0) {
      formData.menciones.forEach((id) => {
        form.append('menciones[]', id.toString());
      });
    }
    
    if (formData.adjuntos && formData.adjuntos.length > 0) {
      formData.adjuntos.forEach((file) => {
        form.append('adjuntos[]', file);
      });
    }
    
    const response = await httpClient.post<{
      success: boolean;
      message: string;
      data: MensajeRespuesta;
    }>(`/bk/v1/mensajes/${mensajeId}/responder`, form);
    
    return response.data;
  },

  /**
   * Agregar reacción a respuesta
   */
  async agregarReaccion(respuestaId: string, emoji: string) {
    const response = await httpClient.post<{
      success: boolean;
      message: string;
    }>(`/bk/v1/mensajes/respuestas/${respuestaId}/reaccionar`, { emoji });
    return response.data;
  },

  /**
   * Quitar reacción de respuesta
   */
  async quitarReaccion(respuestaId: string, emoji: string) {
    const response = await httpClient.delete<{
      success: boolean;
      message: string;
    }>(`/bk/v1/mensajes/respuestas/${respuestaId}/reaccionar`, { 
        data: { emoji } 
    } as any); // Type assertion if delete doesn't support body in types
    return response.data;
  },

  /**
   * Obtener grupos disponibles
   */
  async getGrupos() {
    const response = await httpClient.get<{
      success: boolean;
      data: Array<{ id: number; nombre_completo: string }>;
    }>('/bk/v1/mensajes/grupos');
    return response.data;
  },

  /**
   * Obtener usuarios de un grupo
   */
  async getUsuariosGrupo(grupoId: number) {
    const response = await httpClient.get<{
      success: boolean;
      data: Usuario[];
    }>(`/bk/v1/mensajes/grupos/${grupoId}/usuarios`);
    return response.data;
  }
};
