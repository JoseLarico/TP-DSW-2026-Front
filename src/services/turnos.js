import api from './api';

export const buscarTurnos = (pacienteId, params) =>
  api.get(`/turnos/disponibles/${pacienteId}`, { params }).then(r => r.data);

export const reservarTurno = (turnoId, pacienteId) =>
  api.post('/turnos', { turnoId, pacienteId }).then(r => r.data);
