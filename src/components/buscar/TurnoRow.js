"use client";
import React, { useState } from 'react';
import { usePreseleccion } from '@/context/PreseleccionContext';
import { useAuth } from '@/context/AuthContext';
import { reservarTurno } from '@/services/turnos';
import { useToast } from '@/context/ToastContext';

function formatDia(fecha) {
  const weekday = fecha.toLocaleDateString('es-AR', { weekday: 'long' });
  const resto = fecha.toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' });
  return weekday.charAt(0).toUpperCase() + weekday.slice(1) + ' ' + resto;
}

export default function TurnoRow({ turno, onReservado }) {
  const { addTurno, turnos: preseleccionados } = usePreseleccion();
  const turnoId = turno._id || turno.id;
  const estaPreseleccionado = preseleccionados.some(t => t.id === turnoId || t._id === turnoId);
  const { usuario } = useAuth();
  const pacienteId = usuario?._id;
  const { addToast } = useToast();
  const [reserving, setReserving] = useState(false);
  const [reservado, setReservado] = useState(false);

  const handleReservar = async () => {
    if (!pacienteId) return addToast('Usuario no autenticado', 'error');
    try {
      setReserving(true);
      await reservarTurno(turnoId, pacienteId);
      addToast('Turno reservado correctamente', 'success');
      setReservado(true);
      setTimeout(() => onReservado?.(turnoId), 1200);
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setReserving(false);
    }
  };

  const fecha = new Date(turno.fecha || turno.fechaHora);
  const diaStr = formatDia(fecha);
  const horaStr = fecha.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false });

  const nombreMedico = turno.medico?.apellido
    ? `${turno.medico.apellido}, ${turno.medico.nombre || ''}`
    : turno.medico?.nombre || '—';

  const servicio = turno.practica?.nombre || turno.especialidad?.nombre || '—';
  const sede = turno.sede?.nombre || '—';

  if (reservado) {
    return (
      <tr className="bg-green-50">
        <td colSpan={6} className="px-4 py-3 text-center text-sm text-green-700 font-medium">
          <span className="inline-flex items-center gap-2">
            <svg className="h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12.7l4.3 4.3L19 7.2" />
            </svg>
            Turno reservado
          </span>
        </td>
      </tr>
    );
  }

  return (
    <tr className="border-b border-gray-100 hover:bg-primary-light/40 transition-colors">
      <td className="px-4 py-3.5 text-sm text-gray-700 whitespace-nowrap">{diaStr}</td>
      <td className="px-4 py-3.5 text-sm font-semibold text-gray-900 whitespace-nowrap">{horaStr}</td>
      <td className="px-4 py-3.5 text-sm text-gray-600 whitespace-nowrap">{sede}</td>
      <td className="px-4 py-3.5 text-sm text-gray-700 whitespace-nowrap">Dr. {nombreMedico}</td>
      <td className="px-4 py-3.5 text-sm font-medium text-coral-dark whitespace-nowrap">{servicio}</td>
      <td className="px-4 py-3.5 whitespace-nowrap">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => !estaPreseleccionado && addTurno({ id: turnoId, ...turno })}
            aria-label={estaPreseleccionado ? 'Ya preseleccionado' : 'Preseleccionar turno'}
            aria-pressed={estaPreseleccionado}
            className={[
              'rounded-lg border px-3 py-1.5 text-xs font-medium transition-all',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral-dark',
              estaPreseleccionado
                ? 'border-green-200 bg-green-50 text-green-700 cursor-default'
                : 'border-gray-200 text-gray-600 hover:border-coral-dark hover:text-coral-dark hover:bg-primary-light cursor-pointer',
            ].join(' ')}
          >
            {estaPreseleccionado ? (
              <span className="flex items-center gap-1">
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12.7l4.3 4.3L19 7.2" />
                </svg>
                Preseleccionado
              </span>
            ) : 'Preseleccionar'}
          </button>
          <button
            type="button"
            onClick={handleReservar}
            disabled={reserving}
            aria-label="Reservar turno"
            className="rounded-lg bg-coral-dark px-3 py-1.5 text-xs font-semibold text-white
              hover:bg-[#C83444] active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed
              transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral-dark"
          >
            {reserving ? (
              <span className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-full border-2 border-white border-t-transparent animate-spin" />
                Reservando…
              </span>
            ) : 'Reservar'}
          </button>
        </div>
      </td>
    </tr>
  );
}
