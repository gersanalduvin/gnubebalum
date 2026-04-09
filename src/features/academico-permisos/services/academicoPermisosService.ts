import { httpClient } from '@/utils/httpClient'
import { AcademicoPermisosResponse, PermisoMasivoUpdate } from '../types'

const BASE_URL = '/bk/v1/academico/permisos'

export const academicoPermisosService = {
  getByGrupo: async (grupoId: number): Promise<AcademicoPermisosResponse> => {
    return httpClient.get(`${BASE_URL}?grupo_id=${grupoId}`) 
  },

  updateMasivo: async (data: PermisoMasivoUpdate): Promise<any> => {
    return httpClient.post(BASE_URL, data)
  }
}
