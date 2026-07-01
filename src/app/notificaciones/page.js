'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { getNotificacionesSinLeer, getNotificacionesLeidas, marcarNotificacionLeida } from '@/services/catalogo';
import Button from '@/components/ui/Button';
import Spinner from '@/components/ui/Spinner';
import Loader from '@/components/ui/Loader';
import Pagination from '@/components/buscar/Pagination';

function tiempoRelativo(fecha) {
  const ahora = new Date();
  const d = new Date(fecha);
  const diff = Math.floor((ahora - d) / 1000);
  if (diff < 60) return 'hace un momento';
  if (diff < 3600) return `hace ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `hace ${Math.floor(diff / 3600)} h`;
  if (diff < 172800) return 'ayer';
  return d.toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' });
}

function NotifCard({ notif, sinLeer, onMarcar, marcando }) {
  return (
    <div
      className={`group relative rounded-2xl border transition-all duration-200
        ${sinLeer
          ? 'bg-white border-gray-100 shadow-[0_2px_12px_-4px_rgba(224,65,79,.08)] hover:shadow-[0_4px_16px_-4px_rgba(224,65,79,.14)] hover:border-primary-light'
          : 'bg-gray-50/70 border-gray-100 hover:bg-gray-50'
        }`}
    >
      {/* Unread dot indicator */}
      {sinLeer && (
        <span className="absolute top-4 right-4 h-2 w-2 rounded-full bg-coral-dark shadow-[0_0_0_3px_rgba(224,65,79,.15)]" aria-hidden />
      )}

      <div className="flex items-start gap-3.5 px-4 py-4">
        {/* Icon bubble */}
        <div className={`shrink-0 flex h-9 w-9 items-center justify-center rounded-xl mt-0.5
          ${sinLeer ? 'bg-primary-light' : 'bg-gray-100'}`}>
          <svg
            className={`h-4 w-4 ${sinLeer ? 'text-coral-dark' : 'text-gray-400'}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className={`text-sm leading-snug ${sinLeer ? 'font-semibold text-gray-900' : 'font-normal text-gray-600'}`}>
            {notif.mensaje}
          </p>
          <p className={`mt-1.5 text-xs ${sinLeer ? 'text-coral-dark font-medium' : 'text-gray-400'}`}>
            {tiempoRelativo(notif.fechaHoraCreacion)}
          </p>
        </div>

        {/* Mark as read button */}
        {sinLeer && (
          <button
            onClick={() => onMarcar(notif._id)}
            disabled={marcando === notif._id}
            aria-label="Marcar como leída"
            className="shrink-0 flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200
              text-gray-400 hover:border-coral-dark hover:text-coral-dark hover:bg-primary-light
              disabled:opacity-50 disabled:cursor-not-allowed transition-all
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral-dark"
          >
            {marcando === notif._id
              ? <Spinner size="sm" />
              : (
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )
            }
          </button>
        )}
      </div>
    </div>
  );
}

function EmptyState({ tab }) {
  const esSinLeer = tab === 'sinLeer';
  return (
    <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
      <div className="relative mb-8">
        <div className={`h-24 w-24 rounded-3xl flex items-center justify-center mx-auto
          ${esSinLeer
            ? 'bg-emerald-50 shadow-[0_8px_32px_-8px_rgba(16,185,129,.25)]'
            : 'bg-primary-light shadow-[0_8px_32px_-8px_rgba(224,65,79,.25)]'
          }`}>
          {esSinLeer ? (
            <svg className="h-12 w-12 text-emerald-500 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ) : (
            <svg className="h-12 w-12 text-coral-dark opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          )}
        </div>
        <span className="absolute -top-2 -right-2 h-4 w-4 rounded-full bg-rosa-light opacity-60" style={{ animation: 'float 3s ease-in-out infinite' }} />
        <span className="absolute -bottom-1 -left-3 h-3 w-3 rounded-full bg-coral-light opacity-40" style={{ animation: 'float 3s ease-in-out infinite 1s' }} />
      </div>
      <h2 className="text-xl font-bold text-gray-900 mb-2">
        {esSinLeer ? 'Todo al día' : 'Sin notificaciones leídas'}
      </h2>
      <p className="text-sm text-gray-500 max-w-xs">
        {esSinLeer
          ? 'No tenés notificaciones pendientes.'
          : 'Las notificaciones que marques como leídas aparecerán acá.'}
      </p>
    </div>
  );
}

export default function NotificacionesPage() {
  const { paciente, loading: authLoading } = useAuth();
  const { addToast } = useToast();
  const router = useRouter();
  const [sinLeer, setSinLeer] = useState([]);
  const [leidas, setLeidas] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [errorNotif, setErrorNotif] = useState(false);
  const [tab, setTab] = useState('sinLeer');
  const [marcando, setMarcando] = useState(null);

  useEffect(() => {
    if (!authLoading && !paciente) router.push('/login');
  }, [paciente, authLoading]);

  const fetchNotifs = useCallback(async () => {
    if (!paciente?._id) return;
    setCargando(true);
    setErrorNotif(false);
    const usuarioId = paciente.usuario?._id || paciente._id;
    try {
      const [r1, r2] = await Promise.all([
        getNotificacionesSinLeer(usuarioId),
        getNotificacionesLeidas(usuarioId),
      ]);
      setSinLeer(r1.notificaciones || r1 || []);
      setLeidas(r2.notificaciones || r2 || []);
    } catch { setErrorNotif(true); }
    finally { setCargando(false); }
  }, [paciente?._id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { fetchNotifs(); }, [fetchNotifs]);

  const handleMarcar = async (id) => {
    setMarcando(id);
    try {
      await marcarNotificacionLeida(id);
      await fetchNotifs();
      window.dispatchEvent(new Event('notif-actualizada'));
      addToast('Notificación marcada como leída', 'success');
    } catch (err) {
      addToast(err.message, 'error');
    } finally { setMarcando(null); }
  };

  const handleMarcarTodas = async () => {
    for (const n of sinLeer) {
      try { await marcarNotificacionLeida(n._id); } catch { /* */ }
    }
    await fetchNotifs();
    window.dispatchEvent(new Event('notif-actualizada'));
    addToast('Todas marcadas como leídas', 'success');
  };

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [orden, setOrden] = useState('desc');
  useEffect(() => { setPage(1); }, [tab]);

  const listaRaw = tab === 'sinLeer' ? sinLeer : leidas;
  const lista = [...listaRaw].sort((a, b) => {
    const diff = new Date(a.fechaHoraCreacion) - new Date(b.fechaHoraCreacion);
    return orden === 'desc' ? -diff : diff;
  });
  const totalPages = Math.ceil(lista.length / pageSize);
  const listaPage = lista.slice((page - 1) * pageSize, page * pageSize);

  if (authLoading) return <div className="flex justify-center items-center min-h-[50vh]"><Loader size="lg" /></div>;

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
        @keyframes ticketIn {
          from { opacity: 0; transform: translateY(16px) scale(.98); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        .notif-fade { animation: ticketIn 0.4s cubic-bezier(.21,1.1,.4,1) both; }
      `}</style>

      {/* ── Header ─────────────────────────────────────── */}
      <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notificaciones</h1>
          {sinLeer.length > 0 && (
            <p className="mt-1 text-sm text-gray-500">
              <span className="inline-flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-coral-dark" />
                {sinLeer.length} sin leer
              </span>
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setOrden(o => o === 'desc' ? 'asc' : 'desc')}
            className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600
              hover:border-coral-dark hover:text-coral-dark hover:bg-primary-light transition-colors
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral-dark"
            aria-label={orden === 'desc' ? 'Ordenar más antiguas primero' : 'Ordenar más recientes primero'}
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              {orden === 'desc'
                ? <path strokeLinecap="round" strokeLinejoin="round" d="M3 4h13M3 8h9M3 12h5m8 0l4-4m0 0l4 4m-4-4v12" />
                : <path strokeLinecap="round" strokeLinejoin="round" d="M3 4h13M3 8h9M3 12h5m8 4l4 4m0 0l4-4m-4 4V8" />}
            </svg>
            {orden === 'desc' ? 'Más recientes' : 'Más antiguas'}
          </button>
          {tab === 'sinLeer' && sinLeer.length > 1 && (
            <Button variant="secondary" size="sm" onClick={handleMarcarTodas}>
              Marcar todas como leídas
            </Button>
          )}
        </div>
      </div>

      {/* ── Tabs ───────────────────────────────────────── */}
      <div className="flex gap-1 rounded-xl bg-gray-100 p-1 mb-6">
        {[
          { key: 'sinLeer', label: 'Sin leer', count: sinLeer.length },
          { key: 'leidas',  label: 'Leídas',   count: null },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition-all
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral-dark
              ${tab === t.key
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
              }`}
          >
            {t.label}
            {t.count > 0 && (
              <span className={`inline-flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-xs font-bold
                ${tab === t.key ? 'bg-coral-dark text-white' : 'bg-gray-200 text-gray-600'}`}>
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Content ────────────────────────────────────── */}
      {errorNotif && !cargando && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          No se pudieron cargar las notificaciones. Verificá tu conexión e intentá de nuevo.
        </div>
      )}
      {cargando ? null : lista.length === 0 && !errorNotif ? (
        <div key="empty" className="notif-fade"><EmptyState tab={tab} /></div>
      ) : !errorNotif ? (
        <>
          <div key="list" className="notif-fade flex flex-col gap-2.5">
            {listaPage.map(n => (
              <NotifCard
                key={n._id}
                notif={n}
                sinLeer={tab === 'sinLeer'}
                onMarcar={handleMarcar}
                marcando={marcando}
              />
            ))}
          </div>
          {lista.length > pageSize && (
            <div className="mt-4">
              <Pagination
                page={page}
                totalPages={totalPages}
                onPageChange={setPage}
                limit={pageSize}
                onLimitChange={v => { setPageSize(v); setPage(1); }}
              />
            </div>
          )}
        </>
      ) : null}
    </div>
  );
}
