export interface Usuario {
  id: number;
  nombre_completo: string;
  email: string;
  tipo_usuario?: string;
}

export interface Adjunto {
  nombre: string;
  s3_key: string;
  s3_url: string;
  tipo: string;
  mime: string;
  size: number;
  fecha: string;
}

export interface Destinatario {
  user_id: number;
  usuario_nombre?: string;
  estado: 'no_leido' | 'leido' | 'archivado';
  fecha_lectura: string | null;
  orden: number;
  ip?: string | null;
  user_agent?: string | null;
}

export interface Confirmacion {
  user_id: number;
  usuario_nombre?: string;
  respuesta: 'SI' | 'NO';
  razon: string | null;
  fecha: string;
  fecha_cambio: string | null;
}

export interface Mensaje {
  id: string;
  remitente: Usuario;
  asunto: string;
  contenido: string;
  tipo_mensaje: 'GENERAL' | 'LECTURA' | 'CONFIRMACION';
  estado: 'borrador' | 'enviado' | 'archivado';
  destinatarios: Destinatario[];
  confirmaciones: Confirmacion[] | null;
  plazo_confirmacion: string | null;
  permitir_cambio_respuesta: boolean;
  adjuntos: Adjunto[];
  total_destinatarios: number;
  leidos_count: number;
  no_leidos_count: number;
  confirmaciones_si: number;
  confirmaciones_no: number;
  respuestas?: MensajeRespuesta[];
  created_at: string;
  updated_at: string;
}

export interface Reaccion {
  user_id: number;
  emoji: string;
  fecha: string;
}

export interface MensajeRespuesta {
  id: string;
  mensaje_id: string;
  usuario: Usuario;
  contenido: string;
  reply_to_id: string | null;
  reacciones: Reaccion[];
  menciones: number[];
  adjuntos: Adjunto[];
  created_at: string;
  updated_at: string;
}

export interface Contadores {
  enviados: number;
  recibidos: number;
  no_leidos: number;
  leidos: number;
}

export interface MensajeFormData {
  asunto: string;
  contenido: string;
  tipo_mensaje: 'GENERAL' | 'LECTURA' | 'CONFIRMACION';
  destinatarios: number[];
  grupos?: number[];
  plazo_confirmacion?: string;
  permitir_cambio_respuesta?: boolean;
  adjuntos?: File[];
  tipo_destinatario?: 'usuarios' | 'grupos' | 'familias' | 'docentes' | 'administrativos';
}

export interface RespuestaFormData {
  contenido: string;
  reply_to_id?: string;
  menciones?: number[];
  adjuntos?: File[];
}

export type FiltroMensaje = 'todos' | 'enviados' | 'recibidos' | 'no_leidos' | 'leidos';
