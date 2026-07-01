"use client";
import React, { useState } from 'react';
import { usePreseleccion } from '@/context/PreseleccionContext';
import { useAuth } from '@/context/AuthContext';
import { reservarTurno } from '@/services/turnos';
import { useToast } from '@/context/ToastContext';

export default function TurnoCard({ turno, onReservado }) {
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
      await reservarTurno(turno._id || turno.id, pacienteId);
      addToast('Turno reservado correctamente', 'success');
      setReservado(true);
      setTimeout(() => onReservado?.(turno._id || turno.id), 1200);
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setReserving(false);
    }
  };

  const nombreMedico = turno.medico?.apellido
    ? `${turno.medico.apellido}, ${turno.medico.nombre || ''}`
    : turno.medico?.nombre || '—';

  const servicio = turno.practica?.nombre || turno.especialidad?.nombre || '—';
  const sede = turno.sede?.nombre || '—';
  const fecha = new Date(turno.fecha || turno.fechaHora);
  const fechaStr = fecha.toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short' });
  const horaStr = fecha.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
  const costo = turno.costo ?? turno.costos?.costoPaciente;

  if (reservado) {
    return (
      <article className="relative flex items-center justify-center gap-3 rounded-2xl border border-green-100 bg-green-50 p-5 shadow-sm transition-all overflow-hidden" style={{ minHeight: '120px' }}>
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-green-500">
          <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12.7l4.3 4.3L19 7.2" />
          </svg>
        </span>
        <div>
          <p className="font-semibold text-green-800">Turno reservado</p>
          <p className="text-sm text-green-600">Dr. {nombreMedico}</p>
        </div>
      </article>
    );
  }

  return (
    <article className="relative flex flex-col gap-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm
      hover:shadow-md hover:border-primary-light transition-all overflow-hidden">

      {/* left accent bar */}
      <span className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl bg-gradient-to-b from-coral-light to-coral-dark" />

      <div className="pl-3">
        {/* header */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-semibold text-gray-900 leading-tight">Dr. {nombreMedico}</h3>
            <p className="mt-0.5 text-sm text-coral-dark font-medium">{servicio}</p>
          </div>
          {costo != null && (
            <span className="shrink-0 rounded-full bg-primary-light px-3 py-1 text-xs font-bold text-coral-dark">
              $ {costo}
            </span>
          )}
        </div>

        {/* meta */}
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-sm text-gray-500">
          <span className="flex items-center gap-1.5">
            <svg className="h-3.5 w-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="capitalize">{fechaStr}</span>
          </span>
          <span className="flex items-center gap-1.5">
            <svg className="h-3.5 w-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {horaStr}
          </span>
          <span className="flex items-center gap-1.5">
            <svg className="h-3.5 w-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {sede}
          </span>
        </div>

        {/* actions */}
        <div className="mt-4 flex gap-2">
          <button
            onClick={() => !estaPreseleccionado && addTurno({ id: turnoId, ...turno })}
            aria-label={estaPreseleccionado ? 'Ya preseleccionado' : `Preseleccionar turno con ${turno.medico?.nombre ?? 'médico'}`}
            aria-pressed={estaPreseleccionado}
            className={`flex-1 rounded-xl border px-3 py-2 text-sm font-medium transition-all
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral-dark
              ${estaPreseleccionado
                ? 'border-green-200 bg-green-50 text-green-700 cursor-default'
                : 'border-gray-200 text-gray-600 hover:border-coral-dark hover:text-coral-dark hover:bg-primary-light cursor-pointer'
              }`}
          >
            {estaPreseleccionado ? (
              <span className="flex items-center justify-center gap-1.5">
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12.7l4.3 4.3L19 7.2" />
                </svg>
                Preseleccionado
              </span>
            ) : 'Preseleccionar'}
          </button>
          <button
            onClick={handleReservar}
            disabled={reserving}
            aria-label={`Reservar turno con ${turno.medico?.nombre ?? 'médico'}`}
            className="flex-1 rounded-xl bg-coral-dark px-3 py-2 text-sm font-semibold text-white
              hover:bg-[#C83444] active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed
              transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral-dark focus-visible:ring-offset-1"
          >
            {reserving ? (
              <span className="flex items-center justify-center gap-2">
                <span className="h-3.5 w-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                Reservando…
              </span>
            ) : 'Reservar'}
          </button>
        </div>
      </div>
    </article>
  );
}
