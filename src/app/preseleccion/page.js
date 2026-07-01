'use client';
import Link from 'next/link';
import { useState } from 'react';
import { usePreseleccion } from '@/context/PreseleccionContext';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { reservarMultiple } from '@/services/turnos';
import Loader from '@/components/ui/Loader';

function formatFecha(fechaHora) {
  const d = new Date(fechaHora);
  const dia = d.toLocaleDateString('es-AR', { weekday: 'long' });
  const fecha = d.toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' });
  const hora = d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false });
  return { dia: dia.charAt(0).toUpperCase() + dia.slice(1), fecha, hora };
}

function CoberturaChip({ cobertura }) {
  if (!cobertura) return null;
  const nivel = cobertura.nivel;
  if (nivel === 'total') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-1 text-xs font-semibold text-emerald-700">
        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
        Cobertura total
      </span>
    );
  }
  if (nivel === 'parcial') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200 px-2.5 py-1 text-xs font-semibold text-amber-700">
        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z" />
        </svg>
        {cobertura.descripcion}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 border border-gray-200 px-2.5 py-1 text-xs font-medium text-gray-500">
      Sin cobertura
    </span>
  );
}

function TurnoTicket({ turno, index, onRemove }) {
  const { dia, fecha, hora } = formatFecha(turno.fechaHora);
  const costoPaciente = turno.costos?.costoPaciente ?? turno.costo ?? 0;
  const costoBase = turno.costos?.costoBase ?? costoPaciente;
  const ahorro = costoBase - costoPaciente;
  const tieneDescuento = ahorro > 0;

  return (
    <li
      className="group relative"
      style={{
        animation: `ticketIn 0.4s cubic-bezier(.21,1.1,.4,1) both`,
        animationDelay: `${index * 80}ms`,
      }}
    >
      {/* Ticket shell */}
      <div className="relative overflow-hidden rounded-2xl bg-white shadow-[0_2px_12px_-4px_rgba(74,61,66,.12),0_1px_3px_-1px_rgba(74,61,66,.08)] border border-gray-100 transition-shadow group-hover:shadow-[0_4px_20px_-4px_rgba(224,65,79,.15),0_1px_4px_-1px_rgba(74,61,66,.10)]">

        {/* Top accent stripe */}
        <div className="h-1 w-full bg-gradient-to-r from-coral-light via-coral-dark to-[#C83444]" />

        <div className="flex flex-col sm:flex-row">

          {/* ── Left: main info ───────────────────────────── */}
          <div className="flex-1 px-5 py-4">

            {/* Doctor */}
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-0.5">Profesional</p>
                <p className="text-base font-bold text-gray-900 leading-tight">
                  Dr/a. {turno.medico?.nombre ?? '—'}
                </p>
                {turno.medico?.matricula && (
                  <p className="text-xs text-gray-400 mt-0.5">Mat. {turno.medico.matricula}</p>
                )}
              </div>
              {/* Service pill */}
              <span className="shrink-0 mt-0.5 rounded-full bg-primary-light px-3 py-1 text-xs font-bold text-coral-dark">
                {turno.practica?.nombre || turno.especialidad?.nombre || '—'}
              </span>
            </div>

            {/* Divider dots */}
            <div className="my-3 flex items-center gap-1" aria-hidden>
              {Array.from({ length: 28 }).map((_, i) => (
                <span key={i} className="h-[3px] w-[3px] rounded-full bg-gray-200 flex-shrink-0" />
              ))}
            </div>

            {/* Date + sede row */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              {/* Date block */}
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 shrink-0 flex-col items-center justify-center rounded-xl bg-primary-light">
                  <svg className="h-4 w-4 text-coral-dark" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs text-gray-400">{dia}</p>
                  <p className="text-sm font-semibold text-gray-800">{fecha}</p>
                </div>
              </div>

              {/* Time block */}
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-light">
                  <svg className="h-4 w-4 text-coral-dark" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Horario</p>
                  <p className="text-sm font-bold text-gray-800">{hora}</p>
                </div>
              </div>

              {/* Sede block */}
              {turno.sede?.nombre && (
                <div className="flex items-center gap-2">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-light">
                    <svg className="h-4 w-4 text-coral-dark" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a2 2 0 01-2.828 0l-4.243-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Sede</p>
                    <p className="text-sm font-semibold text-gray-800">{turno.sede.nombre}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Coverage chip */}
            {turno.cobertura && (
              <div className="mt-3">
                <CoberturaChip cobertura={turno.cobertura} />
              </div>
            )}
          </div>

          {/* ── Ticket notch divider (desktop) ─────────────── */}
          <div className="hidden sm:flex flex-col items-center justify-center w-6 relative">
            <div className="absolute -top-3 h-6 w-6 rounded-full bg-gray-50 border border-gray-100" style={{ boxShadow: 'inset 0 1px 3px rgba(0,0,0,.06)' }} />
            <div className="flex-1 border-l-2 border-dashed border-gray-200 mx-auto" style={{ width: 0 }} />
            <div className="absolute -bottom-3 h-6 w-6 rounded-full bg-gray-50 border border-gray-100" style={{ boxShadow: 'inset 0 1px 3px rgba(0,0,0,.06)' }} />
          </div>
          <div className="sm:hidden mx-5 border-t-2 border-dashed border-gray-200" />

          {/* ── Right: price ─────────────────────────────── */}
          <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-3 px-5 py-4 sm:min-w-[140px]">
            <div className="text-right">
              {tieneDescuento && (
                <p className="text-xs text-gray-400 line-through mb-0.5">
                  ${costoBase.toLocaleString('es-AR')}
                </p>
              )}
              <p className="text-2xl font-extrabold text-gray-900 leading-none">
                ${costoPaciente.toLocaleString('es-AR')}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">a pagar</p>

              {tieneDescuento && (
                <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-1">
                  <svg className="h-3 w-3 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                  <span className="text-xs font-bold text-emerald-700">
                    −${ahorro.toLocaleString('es-AR')}
                  </span>
                </div>
              )}
            </div>

            <button
              onClick={onRemove}
              aria-label={`Eliminar turno con ${turno.medico?.nombre ?? 'médico'}`}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-gray-200 text-gray-400
                hover:border-red-200 hover:bg-red-50 hover:text-red-500 transition-all
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral-dark"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </li>
  );
}

function EmptyState() {
  return (
    <div
      className="flex flex-col items-center justify-center px-6 py-20 text-center"
      style={{ animation: 'ticketIn 0.5s cubic-bezier(.21,1.1,.4,1) both' }}
    >
      {/* Illustration */}
      <div className="relative mb-8">
        <div className="h-24 w-24 rounded-3xl bg-primary-light flex items-center justify-center mx-auto shadow-[0_8px_32px_-8px_rgba(224,65,79,.25)]">
          <svg className="h-12 w-12 text-coral-dark opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        </div>
        {/* Floating dots */}
        <span className="absolute -top-2 -right-2 h-4 w-4 rounded-full bg-rosa-light opacity-60" style={{ animation: 'float 3s ease-in-out infinite' }} />
        <span className="absolute -bottom-1 -left-3 h-3 w-3 rounded-full bg-coral-light opacity-40" style={{ animation: 'float 3s ease-in-out infinite 1s' }} />
      </div>

      <h2 className="text-xl font-bold text-gray-900 mb-2">Sin turnos preseleccionados</h2>
      <p className="text-sm text-gray-500 max-w-xs mb-8">
        Buscá turnos disponibles, preseleccioná los que te interesan y confirmálos todos juntos.
      </p>

      <Link
        href="/buscar"
        className="inline-flex items-center gap-2 rounded-xl bg-coral-dark px-6 py-3 text-sm font-bold text-white
          hover:bg-[#C83444] active:scale-95 transition-all shadow-[0_4px_14px_-4px_rgba(224,65,79,.5)]
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral-dark focus-visible:ring-offset-2"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" />
        </svg>
        Buscar turnos
      </Link>
    </div>
  );
}

export default function PreseleccionPage() {
  const { turnos, removeTurno, clearTurnos } = usePreseleccion();
  const { usuario, loading: authLoading } = useAuth();
  const { addToast } = useToast();
  const [loading, setLoading] = useState(false);

  const pacienteId = usuario?._id;

  if (authLoading) return <div className="flex justify-center items-center min-h-[50vh]"><Loader size="lg" /></div>;

  if (usuario?.rol === 'medico') {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 sm:px-6 text-center">
        <p className="text-gray-500">El carrito de preselección es solo para pacientes.</p>
      </div>
    );
  }

  const totalPaciente = turnos.reduce(
    (sum, t) => sum + (t.costos?.costoPaciente ?? t.costo ?? 0),
    0
  );
  const totalBase = turnos.reduce(
    (sum, t) => sum + (t.costos?.costoBase ?? t.costos?.costoPaciente ?? t.costo ?? 0),
    0
  );
  const totalAhorro = totalBase - totalPaciente;

  const handleConfirmar = async () => {
    if (!pacienteId) return addToast('Usuario no autenticado', 'error');
    if (turnos.length === 0) return;

    try {
      setLoading(true);
      const turnoIds = turnos.map(t => t.id);
      const { resultados } = await reservarMultiple(turnoIds, pacienteId);

      resultados.forEach(r => {
        const turno = turnos.find(t => t.id === r.turnoId);
        const label = turno?.medico?.nombre ? `Dr/a. ${turno.medico.nombre}` : 'turno';
        if (r.ok) {
          addToast(`Turno con ${label} reservado exitosamente`, 'success');
        } else {
          addToast(`No se pudo reservar el turno con ${label}: ${r.error}`, 'error');
        }
      });

      clearTurnos();
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @keyframes ticketIn {
          from { opacity: 0; transform: translateY(16px) scale(.98); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
      `}</style>

      <div className="mx-auto max-w-2xl px-4 pb-36 pt-8 sm:px-6 lg:px-8 sm:pb-12">

        {/* ── Header ─────────────────────────────────────── */}
        <div
          className="mb-8"
        >
            <h1 className="text-2xl font-bold text-gray-900">Turnos preseleccionados</h1>
          {turnos.length > 0 && (
            <p className="mt-1 text-sm text-gray-500">
              {turnos.length} {turnos.length === 1 ? 'turno' : 'turnos'} en el carrito
            </p>
          )}
        </div>

        {/* ── Content ────────────────────────────────────── */}
        {turnos.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            <ul className="flex flex-col gap-4">
              {turnos.map((turno, i) => (
                <TurnoTicket
                  key={turno.id}
                  turno={turno}
                  index={i}
                  onRemove={() => removeTurno(turno.id)}
                />
              ))}
            </ul>

            {/* ── Summary card (desktop) ────────────────── */}
            <div
              className="mt-6 hidden sm:block"
            >
              <div className="rounded-2xl border border-gray-100 bg-white shadow-[0_2px_12px_-4px_rgba(74,61,66,.08)] overflow-hidden">
                <div className="h-1 w-full bg-gradient-to-r from-coral-light via-coral-dark to-[#C83444]" />
                <div className="px-6 py-5">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm text-gray-500">
                      {turnos.length} turno{turnos.length !== 1 ? 's' : ''} · Tu cobertura ya está aplicada
                    </span>
                    {totalAhorro > 0 && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs font-bold text-emerald-700">
                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                        </svg>
                        Ahorrás ${totalAhorro.toLocaleString('es-AR')}
                      </span>
                    )}
                  </div>

                  <div className="flex items-end justify-between">
                    <div>
                      {totalAhorro > 0 && (
                        <p className="text-sm text-gray-400 line-through">${totalBase.toLocaleString('es-AR')}</p>
                      )}
                      <div className="flex items-baseline gap-2">
                        <span className="text-xs text-gray-400 mb-0.5">Total</span>
                        <span className="text-4xl font-extrabold text-gray-900 leading-none">
                          ${totalPaciente.toLocaleString('es-AR')}
                        </span>
                        <span className="text-sm text-gray-400 mb-0.5">ARS</span>
                      </div>
                    </div>

                    <button
                      onClick={handleConfirmar}
                      disabled={loading}
                      className="flex items-center gap-2 rounded-xl bg-coral-dark px-8 py-3.5 text-sm font-bold text-white
                        hover:bg-[#C83444] active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed
                        transition-all shadow-[0_4px_14px_-4px_rgba(224,65,79,.5)]
                        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral-dark focus-visible:ring-offset-2"
                    >
                      {loading ? (
                        <>
                          <span className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                          Confirmando…
                        </>
                      ) : (
                        <>
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                          Confirmar {turnos.length} {turnos.length === 1 ? 'turno' : 'turnos'}
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ── Sticky footer (mobile) ──────────────────────── */}
      {turnos.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-40 sm:hidden bg-white/95 backdrop-blur-md border-t border-gray-100 shadow-[0_-4px_24px_-4px_rgba(74,61,66,.12)] px-4 pt-3 pb-safe-4"
          style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}
        >
          <div className="flex items-center justify-between mb-2.5">
            <div>
              {totalAhorro > 0 && (
                <p className="text-xs text-gray-400 line-through leading-none">${totalBase.toLocaleString('es-AR')}</p>
              )}
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-extrabold text-gray-900">${totalPaciente.toLocaleString('es-AR')}</span>
                {totalAhorro > 0 && (
                  <span className="text-xs font-bold text-emerald-600">−${totalAhorro.toLocaleString('es-AR')}</span>
                )}
              </div>
              <p className="text-xs text-gray-400">{turnos.length} turno{turnos.length !== 1 ? 's' : ''} · cobertura aplicada</p>
            </div>

            <button
              onClick={handleConfirmar}
              disabled={loading}
              className="flex items-center gap-2 rounded-xl bg-coral-dark px-6 py-3 text-sm font-bold text-white
                hover:bg-[#C83444] active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed
                transition-all shadow-[0_4px_14px_-4px_rgba(224,65,79,.45)]
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral-dark"
            >
              {loading ? (
                <span className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
              ) : (
                <>
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  Confirmar
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
