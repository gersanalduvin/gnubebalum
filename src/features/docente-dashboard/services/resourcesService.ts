import { httpClient } from '@/utils/httpClient';

export interface Resource {
    id: number;
    uuid: string;
    titulo: string;
    descripcion?: string;
    tipo: 'archivo' | 'enlace';
    contenido: string; // URL or Path
    full_url?: string;
    publicado: boolean;
    corte_id?: number;
    created_at: string;
    archivos?: {
        id: number;
        path: string;
        nombre_original: string;
        size: number;
        url: string;
    }[];
}

export const getResources = async (assignmentId: number, corteId?: number) => {
    let url = `/bk/v1/recursos/asignacion/${assignmentId}`
    if (corteId) {
        url += `?corte_id=${corteId}`
    }
    const response = await httpClient.get<Resource[]>(url)
    return response
}

export const createResource = async (assignmentId: number, formData: FormData) => {
    // Note: FormData is needed for file upload
    const response = await httpClient.post<Resource>(`/bk/v1/recursos/asignacion/${assignmentId}`, formData)
    return response
}

export const updateResource = async (id: number, formData: FormData) => {
    const response = await httpClient.post<Resource>(`/bk/v1/recursos/${id}`, formData)
    return response
}

export const deleteResource = async (id: number) => {
    const response = await httpClient.delete<any>(`/bk/v1/recursos/${id}`)
    return response
}

export const deleteResourceFile = async (fileId: number) => {
    const response = await httpClient.delete<any>(`/bk/v1/recursos/archivo/${fileId}`)
    return response
}
