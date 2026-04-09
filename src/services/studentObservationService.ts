import { httpClient } from '@/utils/httpClient';

export interface StudentObservation {
    id: number;
    nombre_completo: string;
    identificacion: string;
    observacion: string;
    observation_id: number | null;
    updated_at: string | null;
}

export interface ObservationsResponse {
    grupo: {
        id: number;
        nombre: string;
    };
    alumnos: StudentObservation[];
}

export const studentObservationService = {
    /**
     * Obtener observaciones
     * @param filters { grupo_id, periodo_lectivo_id, parcial_id }
     * @param isAdmin 
     */
    async getObservations(filters: any, isAdmin: boolean = false): Promise<ObservationsResponse> {
        const params = new URLSearchParams(filters).toString();
        const endpoint = isAdmin 
            ? `/bk/v1/observaciones-alumnos?${params}`
            : `/bk/v1/docente-portal/observaciones?${params}`;
        
        const response: any = await httpClient.get(endpoint);
        return response.data;
    },

    /**
     * Guardado masivo de observaciones
     */
    async saveBatch(data: {
        grupo_id: number;
        periodo_lectivo_id: number;
        parcial_id: number;
        observations: { user_id: number; observacion: string | null }[];
    }, isAdmin: boolean = false) {
        const endpoint = isAdmin 
            ? `/bk/v1/observaciones-alumnos/batch`
            : `/bk/v1/docente-portal/observaciones/batch`;
            
        const response: any = await httpClient.post(endpoint, data);
        return response.data;
    }
}
