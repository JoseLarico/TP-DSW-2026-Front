import api from './api';
// Funciones para manejar las notificaciones del usuario
export const getNotifSinLeer = (usuarioId) => api.get(`/notificaciones/sin-leer/${usuarioId}`).then(r => r.data);
export const getNotifLeidas  = (usuarioId) => api.get(`/notificaciones/leidas/${usuarioId}`).then(r => r.data);
export const marcarLeida     = (notifId)   => api.patch(`/notificaciones/${notifId}/marcar-leida`).then(r => r.data);