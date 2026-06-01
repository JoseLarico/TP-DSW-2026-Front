import api from './api';

export const getEspecialidades = () => api.get('/especialidades').then(r => r.data);
export const getPracticas = () => api.get('/practicas').then(r => r.data);
export const getMedicos = () => api.get('/medicos').then(r => r.data);
export const getSedes = () => api.get('/sedes').then(r => r.data);
