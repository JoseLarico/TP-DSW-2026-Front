"use client";
import React, { useState } from 'react';
import { usePreseleccion } from '@/context/PreseleccionContext';
import { useAuth } from '@/context/AuthContext';
import { reservarTurno } from '@/services/turnos';
import { useToast } from '@/context/ToastContext';

export default function TurnoCard({ turno }) {
  const { addTurno } = usePreseleccion();
  const { _id: pacienteId } = useAuth();
  const { addToast } = useToast();
  const [reserving, setReserving] = useState(false);

  const handleReservar = async () => {
    if (!pacienteId) return addToast('Usuario no autenticado', 'error');
    try {
      setReserving(true);
      await reservarTurno(turno.id, pacienteId);
      addToast('Turno reservado correctamente', 'success');
    } catch (err) {
      addToast(err.message || 'Error al reservar turno', 'error');
    } finally {
      setReserving(false);
    }
  };

  return (
    <div className="rounded-lg border bg-white p-4 shadow-sm">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-semibold text-gray-900">{(turno.medico?.apellido ? `${turno.medico.apellido} ${turno.medico.nombre}` : turno.medico?.nombre) || '—'} • {turno.practica?.nombre || (turno.practica) || '—'}</h3>
          <p className="text-sm text-gray-600">{turno.sede?.nombre || '—'} — {new Date(turno.fecha || turno.fechaHora).toLocaleString()}</p>
        </div>
        <div className="text-right">
          <div className="text-lg font-medium text-gray-900">{(turno.costo ?? turno.costos?.costoPaciente) ? `$ ${turno.costo ?? turno.costos?.costoPaciente}` : '—'}</div>
          <div className="flex flex-col items-end gap-2">
            <button className="btn btn-secondary" onClick={() => addTurno({ id: turno.id || turno._id, ...turno })}>Preseleccionar</button>
            <button className="btn btn-primary" onClick={handleReservar} disabled={reserving}>{reserving ? 'Reservando...' : 'Reservar'}</button>
          </div>
        </div>
      </div>
    </div>
  );
}
