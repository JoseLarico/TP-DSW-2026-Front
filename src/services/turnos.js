import api from './api';

export const buscarTurnos = (pacienteId, params) =>
  api.get(`/turnos/disponibles/${pacienteId}`, { params }).then(r => r.data);

export const reservarTurno = (turnoId, pacienteId) =>
  api.post('/turnos', { turnoId, pacienteId }).then(r => r.data);

export const reservarMultiple = (turnoIds, pacienteId) =>
  api.post('/turnos/reservar-multiple', { turnoIds, pacienteId }).then(r => r.data);

export const cancelarTurnoPaciente = (turnoId, data) =>
  api.delete(`/turnos/${turnoId}/paciente`, { data }).then(r => r.data);

export const cambiarFechaTurno = (turnoId, data) =>
  api.patch(`/turnos/${turnoId}/cambio-fecha/paciente`, data).then(r => r.data);

export const responderSolicitudCambio = (turnoId, data) =>
  api.patch(`/turnos/${turnoId}/solicitud-cambio-fecha/paciente`, data).then(r => r.data);

export const cancelarTurnoMedico = (turnoId, motivo, medicoId) =>
  api.delete(`/turnos/${turnoId}/medico`, { data: { motivo, medicoId } }).then(r => r.data);

export const proponerCambioFecha = (turnoId, nuevoTurnoId) =>
  api.post(`/turnos/${turnoId}/solicitud-cambio-fecha/medico`, { nuevoTurnoId }).then(r => r.data);

export const marcarRealizado = (turnoId) =>
  api.patch(`/turnos/${turnoId}/realizacion`).then(r => r.data);
