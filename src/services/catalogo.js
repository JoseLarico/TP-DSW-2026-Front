import api from './api';

export const getEspecialidades = () => api.get('/especialidades').then(r => r.data);
export const getPracticas = () => api.get('/practicas').then(r => r.data);
export const getMedicos = () => api.get('/medicos').then(r => r.data);
export const getSedes = () => api.get('/sedes').then(r => r.data);

// Especialidades - ABM
export const crearEspecialidad     = (data) => api.post('/especialidades', data).then(r => r.data);
export const actualizarEspecialidad = (id, data) => api.patch(`/especialidades/${id}`, data).then(r => r.data);
export const eliminarEspecialidad  = (id)   => api.delete(`/especialidades/${id}`).then(r => r.data);

// Prácticas - ABM
export const crearPractica      = (data) => api.post('/practicas', data).then(r => r.data);
export const actualizarPractica = (id, data) => api.patch(`/practicas/${id}`, data).then(r => r.data);
export const eliminarPractica   = (id)   => api.delete(`/practicas/${id}`).then(r => r.data);

// Sedes - ABM
export const crearSede      = (data) => api.post('/sedes', data).then(r => r.data);
export const actualizarSede = (id, data) => api.patch(`/sedes/${id}`, data).then(r => r.data);
export const eliminarSede   = (id)   => api.delete(`/sedes/${id}`).then(r => r.data);