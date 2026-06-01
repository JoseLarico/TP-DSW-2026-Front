import api from './api';

// Panel del médico
//lo que estoy haciendo es traer los turnos del medico, la disponibilidad y crear la agenda del medico
export const getTurnosMedico   = (medicoId)         => api.get(`/medicos/${medicoId}/turnos`).then(r => r.data);
export const getDisponibilidad = (medicoId, params) => api.get(`/medicos/${medicoId}/disponibilidad`, { params }).then(r => r.data);
export const crearAgenda       = (medicoId, data)   => api.post(`/medicos/${medicoId}/agenda`, data).then(r => r.data);

// CRUD médicos (ABM admin)
// aca lo que hago es el CRUD de médicos, que se puede usar tanto para el ABM de médicos como para mostrar la información del médico en el perfil del paciente o en la ficha del turno.
export const getMedicos       = ()         => api.get('/medicos').then(r => r.data);
export const getMedicoById    = (id)       => api.get(`/medicos/${id}`).then(r => r.data);
export const crearMedico      = (data)     => api.post('/medicos', data).then(r => r.data);
export const actualizarMedico = (id, data) => api.patch(`/medicos/${id}`, data).then(r => r.data);
export const eliminarMedico   = (id)       => api.delete(`/medicos/${id}`).then(r => r.data);

// Asignaciones del médico
// aca lo que hago es asignar o quitarle al medico una especialidad, una practica o una sede. Esto se puede usar tanto para el ABM de médicos como para mostrar 
// la información del médico en el perfil del paciente o en la ficha del turno
export const agregarEspecialidad = (medicoId, especialidadId) => api.post(`/medicos/${medicoId}/especialidades`, { especialidadId }).then(r => r.data);
export const quitarEspecialidad  = (medicoId, especialidadId) => api.delete(`/medicos/${medicoId}/especialidades/${especialidadId}`).then(r => r.data);
export const agregarPractica     = (medicoId, practicaId)     => api.post(`/medicos/${medicoId}/practicas`, { practicaId }).then(r => r.data);
export const quitarPractica      = (medicoId, practicaId)     => api.delete(`/medicos/${medicoId}/practicas/${practicaId}`).then(r => r.data);
export const agregarSede         = (medicoId, sedeId)         => api.post(`/medicos/${medicoId}/sedes`, { sedeId }).then(r => r.data);
export const quitarSede          = (medicoId, sedeId)         => api.delete(`/medicos/${medicoId}/sedes/${sedeId}`).then(r => r.data);