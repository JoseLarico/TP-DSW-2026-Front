import api from './api';

export const buscarTurnos = (pacienteId, params) =>
  api.get(`/turnos/disponibles/${pacienteId}`, { params }).then(r => r.data);

export const reservarTurno = (turnoId, pacienteId) =>
  api.post('/turnos', { turnoId, pacienteId }).then(r => r.data);

// Acciones del médico sobre turnos
export const cancelarTurnoMedico = (turnoId, motivo) =>
  api.delete(`/turnos/${turnoId}/medico`, { data: { motivo } }).then(r => r.data);

export const proponerCambioFecha = (turnoId, nuevaFechaHora) =>
  api.post(`/turnos/${turnoId}/solicitud-cambio-fecha/medico`, { nuevaFechaHora }).then(r => r.data);

export const marcarRealizado = (turnoId) =>
  api.patch(`/turnos/${turnoId}/realizacion`).then(r => r.data);