import api from './api';
    
// Funciones para manejar las obras sociales
export const getObrasSociales   = ()           => api.get('/obras-sociales').then(r => r.data);
export const getObraSocialById  = (id)         => api.get(`/obras-sociales/${id}`).then(r => r.data);
export const crearObraSocial    = (data)       => api.post('/obras-sociales', data).then(r => r.data);
export const actualizarObraSocial = (id, data) => api.patch(`/obras-sociales/${id}`, data).then(r => r.data);
export const eliminarObraSocial = (id)         => api.delete(`/obras-sociales/${id}`).then(r => r.data);