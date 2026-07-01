'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { getTurnosPaciente } from '@/services/catalogo';
import { buscarTurnos, cancelarTurnoPaciente, cambiarFechaTurno, responderSolicitudCambio } from '@/services/turnos';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import DateRangePicker from '@/components/ui/DateRangePicker';
import { SkeletonCard } from '@/components/ui/Skeleton';
import Pagination from '@/components/buscar/Pagination';
import Loader from '@/components/ui/Loader';
import FiltroPills from '@/components/turnos/FiltroPills';
import { ESTADO_BADGE_VARIANT, ESTADO_LABEL } from '@/lib/estadoTurno';

function formatDia(fecha) {
  const weekday = fecha.toLocaleDateString('es-AR', { weekday: 'long' });
  const resto = fecha.toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' });
  return weekday.charAt(0).toUpperCase() + weekday.slice(1) + ' ' + resto;
}

function formatHora(fecha) {
  return fecha.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false });
}

function formatFechaCorta(f) {
  return new Date(f).toLocaleString('es-AR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

// ── Acciones dropdown (portal) ────────────────────────────────────────────────
function AccionesMenu({ acciones }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const btnRef = useRef(null);
  const menuRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (!menuRef.current?.contains(e.target) && !btnRef.current?.contains(e.target)) setOpen(false);
    };
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, []);

  if (!acciones.length) return null;

  const handleOpen = () => {
    if (btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setPos({ top: rect.bottom + window.scrollY + 4, left: rect.right + window.scrollX - 176 });
    }
    setOpen(o => !o);
  };

  return (
    <div className="relative">
      <button ref={btnRef} type="button" onClick={handleOpen}
        className="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 text-gray-500
          hover:border-coral-dark hover:text-coral-dark hover:bg-primary-light transition-colors
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral-dark"
        aria-label="Acciones">
        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
          <circle cx="12" cy="5" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="12" cy="19" r="1.5" />
        </svg>
      </button>
      {open && createPortal(
        <ul ref={menuRef} style={{ position: 'absolute', top: pos.top, left: pos.left }}
          className="z-[9999] w-44 rounded-xl border border-gray-200 bg-white shadow-lg py-1">
          {acciones.map(({ label, onClick, color }) => (
            <li key={label}>
              <button type="button" onClick={(e) => { e.stopPropagation(); onClick(); setOpen(false); }}
                className={`w-full text-left px-3 py-2 text-xs font-medium transition-colors hover:bg-gray-50 ${color}`}>
                {label}
              </button>
            </li>
          ))}
        </ul>,
        document.body
      )}
    </div>
  );
}

// ── Modal cancelar ────────────────────────────────────────────────────────────
function ModalCancelar({ turno, pacienteId, onClose, onSuccess }) {
  const [motivo, setMotivo] = useState('');
  const [loading, setLoading] = useState(false);
  const { addToast } = useToast();

  const handleCancelar = async () => {
    setLoading(true);
    try {
      await cancelarTurnoPaciente(turno._id, { pacienteId, motivo });
      addToast('Turno cancelado correctamente', 'success');
      onSuccess();
    } catch (err) { addToast(err.message, 'error'); }
    finally { setLoading(false); }
  };

  return (
    <Modal isOpen onClose={onClose} title="Cancelar turno"
      footer={<>
        <Button variant="ghost" onClick={onClose} disabled={loading}>Volver</Button>
        <Button variant="danger" onClick={handleCancelar} loading={loading}>Confirmar cancelación</Button>
      </>}>
      <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
        ⚠️ Podés cancelar hasta <strong>1 hora antes</strong> del turno. Esta acción no se puede deshacer.
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="motivo" className="text-sm font-medium text-gray-700">Motivo (opcional)</label>
        <textarea id="motivo" rows={3}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-coral-dark resize-none"
          placeholder="Ej: No puedo asistir por trabajo"
          value={motivo} onChange={e => setMotivo(e.target.value)} />
      </div>
    </Modal>
  );
}

// ── Modal cambiar fecha ───────────────────────────────────────────────────────
function ModalCambiarFecha({ turno, pacienteId, onClose, onSuccess }) {
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  const [resultados, setResultados] = useState(null);
  const [buscando, setBuscando] = useState(false);
  const [seleccionado, setSeleccionado] = useState(null);
  const [confirmando, setConfirmando] = useState(false);
  const { addToast } = useToast();

  const handleBuscar = async () => {
    setBuscando(true); setResultados(null); setSeleccionado(null);
    try {
      const data = await buscarTurnos(pacienteId, { fechaDesde, fechaHasta, page: 1, limit: 10 });
      setResultados(data.turnos || data.resultado || []);
    } catch { setResultados([]); }
    finally { setBuscando(false); }
  };

  const handleConfirmar = async () => {
    if (!seleccionado) return;
    setConfirmando(true);
    try {
      await cambiarFechaTurno(turno._id, { pacienteId, nuevoTurnoId: seleccionado._id });
      addToast('Fecha cambiada correctamente', 'success');
      onSuccess();
    } catch (err) { addToast(err.message, 'error'); }
    finally { setConfirmando(false); }
  };

  return (
    <Modal isOpen onClose={onClose} title="Cambiar fecha del turno" size="lg"
      footer={<>
        <Button variant="ghost" onClick={onClose}>Cancelar</Button>
        <Button onClick={handleConfirmar} disabled={!seleccionado} loading={confirmando}>Confirmar cambio</Button>
      </>}>
      <p className="text-sm text-gray-500 mb-4">Buscá un slot disponible y seleccioná el nuevo horario.</p>
      <div className="mb-3">
        <DateRangePicker
          id="rango-fecha"
          label="Rango de fechas"
          desde={fechaDesde}
          hasta={fechaHasta}
          onChangeDates={(d, h) => { setFechaDesde(d); setFechaHasta(h); }}
          minDate={new Date().toISOString().split('T')[0]}
          placeholder="Seleccioná fechas"
        />
      </div>
      <Button variant="secondary" className="w-full mb-4" onClick={handleBuscar} loading={buscando}>Buscar disponibilidad</Button>
      {resultados !== null && (
        <div className="max-h-60 overflow-y-auto flex flex-col gap-2">
          {resultados.length === 0
            ? <p className="text-sm text-gray-500 text-center py-4">No hay turnos disponibles en ese rango.</p>
            : resultados.map(t => (
              <button key={t._id} onClick={() => setSeleccionado(t)} aria-pressed={seleccionado?._id === t._id}
                className={`w-full text-left rounded-lg border p-3 text-sm transition-colors
                  ${seleccionado?._id === t._id ? 'border-coral-dark bg-primary-light' : 'border-gray-200 hover:border-gray-300'}`}>
                <div className="font-medium text-gray-900">{formatDia(new Date(t.fechaHora))}</div>
                <div className="text-xs text-gray-500 mt-0.5">{formatHora(new Date(t.fechaHora))}</div>
              </button>
            ))
          }
        </div>
      )}
    </Modal>
  );
}

// ── Modal responder propuesta ─────────────────────────────────────────────────
function ModalPropuesta({ turno, pacienteId, onClose, onSuccess, onProponerOtraFecha }) {
  const [respondiendo, setRespondiendo] = useState(false);
  const { addToast } = useToast();

  const handleResponder = async (respuesta) => {
    setRespondiendo(true);
    try {
      await responderSolicitudCambio(turno._id, { pacienteId, estado: respuesta });
      addToast(respuesta === 'confirmado' ? 'Cambio aceptado' : 'Propuesta rechazada', 'success');
      onSuccess();
    } catch (err) { addToast(err.message, 'error'); }
    finally { setRespondiendo(false); }
  };

  const fechaActual   = turno.fechaHora ? new Date(turno.fechaHora) : null;
  const fechaPropuesta = turno.solicitudCambioFecha?.nuevaFechaHora ? new Date(turno.solicitudCambioFecha.nuevaFechaHora) : null;

  return (
    <Modal isOpen onClose={onClose} title="Propuesta de cambio de fecha"
      footer={<>
        <Button variant="ghost" onClick={onClose} disabled={respondiendo}>Cerrar</Button>
        <Button variant="secondary" onClick={() => handleResponder('rechazado')} disabled={respondiendo}>Rechazar</Button>
        <Button variant="secondary" onClick={onProponerOtraFecha} disabled={respondiendo}>Proponer otra fecha</Button>
        <Button onClick={() => handleResponder('confirmado')} loading={respondiendo}>Aceptar</Button>
      </>}>
      <div className="rounded-lg bg-sky-50 border border-sky-200 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-sky-600 mb-3">El médico propuso un cambio de fecha</p>
        <div className="flex flex-col gap-2">
          <div>
            <p className="text-xs text-gray-400">Fecha actual</p>
            <p className="text-sm font-semibold text-gray-800">
              {fechaActual ? `${formatDia(fechaActual)} — ${formatHora(fechaActual)}` : '—'}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Fecha propuesta</p>
            <p className="text-sm font-semibold text-coral-dark">
              {fechaPropuesta ? `${formatDia(fechaPropuesta)} — ${formatHora(fechaPropuesta)}` : '—'}
            </p>
          </div>
        </div>
      </div>
    </Modal>
  );
}

// ── Fila de turno ─────────────────────────────────────────────────────────────
function TurnoRow({ turno, pacienteId, onRefresh, hayAcciones }) {
  const [modalCancelar, setModalCancelar] = useState(false);
  const [modalCambio, setModalCambio] = useState(false);
  const [modalPropuesta, setModalPropuesta] = useState(false);

  const estado = turno.estado?.toUpperCase();
  const fecha = turno.fechaHora ? new Date(turno.fechaHora) : null;
  const esCancelable = ['RESERVADO', 'CONFIRMADO'].includes(estado);
  const solicitudPendiente = turno.solicitudCambioFecha?.estado === 'PENDIENTE' && turno.solicitudCambioFecha?.solicitante === 'MEDICO';

  const acciones = [
    ...(solicitudPendiente ? [{ label: 'Ver propuesta', onClick: () => setModalPropuesta(true), color: 'text-sky-700' }] : []),
    ...(esCancelable && !solicitudPendiente ? [{ label: 'Cambiar fecha', onClick: () => setModalCambio(true), color: 'text-gray-700' }] : []),
    ...(esCancelable ? [{ label: 'Cancelar turno', onClick: () => setModalCancelar(true), color: 'text-red-600' }] : []),
  ];

  return (
    <>
      <tr className={`border-b last:border-0 transition-colors ${solicitudPendiente ? 'bg-sky-50 border-sky-200 border-l-2 border-l-sky-400 hover:bg-sky-100/60' : 'border-gray-100 hover:bg-primary-light/40'}`}>
        <td className="px-4 py-3.5 text-sm text-gray-700 whitespace-nowrap">{fecha ? formatDia(fecha) : '—'}</td>
        <td className="px-4 py-3.5 text-sm font-semibold text-gray-900 whitespace-nowrap">{fecha ? formatHora(fecha) : '—'}</td>
        <td className="px-4 py-3.5 text-sm text-gray-600 whitespace-nowrap">{turno.sede?.nombre ?? '—'}</td>
        <td className="px-4 py-3.5 text-sm text-gray-700 whitespace-nowrap">
          {turno.medico?.nombre || turno.medico?.usuario?.nombre ? `Dr. ${turno.medico?.nombre || turno.medico?.usuario?.nombre}` : '—'}
        </td>
        <td className="px-4 py-3.5 text-sm font-medium text-coral-dark whitespace-nowrap">
          {turno.especialidad?.nombre ?? turno.practica?.nombre ?? '—'}
        </td>
        <td className="px-4 py-3.5">
          <div className="flex items-center gap-1.5">
            <span className={solicitudPendiente ? 'animate-pulse' : ''}>
              <Badge variant={solicitudPendiente ? 'info' : (ESTADO_BADGE_VARIANT[estado] ?? 'default')}>
                {solicitudPendiente ? 'Cambio pend.' : (ESTADO_LABEL[estado] ?? estado)}
              </Badge>
            </span>
          </div>
        </td>
        {hayAcciones && (
          <td className="px-4 py-3.5">
            <AccionesMenu acciones={acciones} />
          </td>
        )}
      </tr>

      {modalCancelar && <ModalCancelar turno={turno} pacienteId={pacienteId} onClose={() => setModalCancelar(false)} onSuccess={() => { setModalCancelar(false); onRefresh(); }} />}
      {modalCambio && <ModalCambiarFecha turno={turno} pacienteId={pacienteId} onClose={() => setModalCambio(false)} onSuccess={() => { setModalCambio(false); onRefresh(); }} />}
      {modalPropuesta && <ModalPropuesta turno={turno} pacienteId={pacienteId} onClose={() => setModalPropuesta(false)} onSuccess={() => { setModalPropuesta(false); onRefresh(); }} onProponerOtraFecha={() => { setModalPropuesta(false); setModalCambio(true); }} />}
    </>
  );
}

// ── Skeleton tabla ────────────────────────────────────────────────────────────
function TableSkeleton() {
  return (
    <div className="overflow-x-auto rounded-2xl border border-gray-100 bg-white shadow-sm">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-100">
            {['Día', 'Hora', 'Lugar', 'Médico', 'Especialidad / Práctica', 'Estado'].map(h => (
              <th key={h} className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {[1,2,3].map(i => (
            <tr key={i} className="border-b border-gray-100">
              {[160,48,96,120,96,60].map((w,j) => (
                <td key={j} className="px-4 py-4"><div className="h-4 rounded bg-gray-100 animate-pulse" style={{ width: w }} /></td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Filtros ───────────────────────────────────────────────────────────────────
const SORTABLE = ['Día', 'Hora'];

function SortIcon({ dir }) {
  return (
    <svg className="inline ml-1 h-3 w-3 text-coral-dark" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      {dir === 'asc'
        ? <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
        : <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />}
    </svg>
  );
}

const FILTROS = [
  { key: 'todos',       label: 'Todos',        color: 'bg-gray-200 text-gray-700' },
  { key: 'proximos',    label: 'Próximos',     color: 'bg-amber-100 text-amber-700' },
  { key: 'pasados',     label: 'Pasados',      color: 'bg-green-100 text-green-700' },
  { key: 'cancelados',  label: 'Cancelados',   color: 'bg-red-100 text-red-700' },
  { key: 'cambio_pend', label: 'Cambio pend.', color: 'bg-sky-100 text-sky-700' },
];

// ── Página principal ──────────────────────────────────────────────────────────
export default function MisTurnosPage() {
  const { paciente, loading: authLoading } = useAuth();
  const router = useRouter();
  const [turnos, setTurnos] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [filtro, setFiltro] = useState('todos');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => { if (!authLoading && !paciente) router.push('/login'); }, [paciente, authLoading]);
  useEffect(() => { setPage(1); }, [filtro]);

  const fetchTurnos = useCallback(async () => {
    if (!paciente?._id) return;
    setCargando(true);
    try {
      const data = await getTurnosPaciente(paciente._id);
      setTurnos(data.turnos || data || []);
    } catch { setTurnos([]); }
    finally { setCargando(false); }
  }, [paciente?._id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { fetchTurnos(); }, [fetchTurnos]);

  const ahora = new Date();
  const turnosFiltrados = turnos.filter(t => {
    const estado = t.estado?.toUpperCase();
    const futuro = new Date(t.fechaHora) >= ahora;
    if (filtro === 'proximos') return futuro && estado !== 'CANCELADO' && estado !== 'REALIZADO';
    if (filtro === 'pasados') return !futuro && estado !== 'CANCELADO';
    if (filtro === 'cancelados') return estado === 'CANCELADO';
    if (filtro === 'cambio_pend') return futuro && t.solicitudCambioFecha?.estado === 'PENDIENTE' && t.solicitudCambioFecha?.solicitante === 'MEDICO';
    return futuro;
  });

  const [sortDia, setSortDia] = useState('asc');
  const [sortHora, setSortHora] = useState('asc');

  const toggleSort = (col) => {
    if (col === 'Día') { setSortDia(d => d === 'asc' ? 'desc' : 'asc'); setPage(1); }
    if (col === 'Hora') { setSortHora(d => d === 'asc' ? 'desc' : 'asc'); setPage(1); }
  };

  const turnosOrdenados = [...turnosFiltrados].sort((a, b) => {
    const aPend = a.solicitudCambioFecha?.estado === 'PENDIENTE' && a.solicitudCambioFecha?.solicitante === 'MEDICO';
    const bPend = b.solicitudCambioFecha?.estado === 'PENDIENTE' && b.solicitudCambioFecha?.solicitante === 'MEDICO';
    if (aPend && !bPend) return -1;
    if (!aPend && bPend) return 1;
    const da = new Date(a.fechaHora), db = new Date(b.fechaHora);
    const diffDia = new Date(da.getFullYear(), da.getMonth(), da.getDate())
                  - new Date(db.getFullYear(), db.getMonth(), db.getDate());
    if (diffDia !== 0) return sortDia === 'asc' ? diffDia : -diffDia;
    const diffHora = (da.getHours() * 60 + da.getMinutes()) - (db.getHours() * 60 + db.getMinutes());
    return sortHora === 'asc' ? diffHora : -diffHora;
  });

  const hayAcciones = turnosFiltrados.some(t => ['RESERVADO', 'CONFIRMADO'].includes(t.estado?.toUpperCase()));
  const totalPages = Math.ceil(turnosOrdenados.length / pageSize) || 1;
  const turnosPagina = turnosOrdenados.slice((page - 1) * pageSize, page * pageSize);

  if (authLoading) return <div className="flex justify-center items-center min-h-[50vh]"><Loader size="lg" /></div>;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8" style={{ animation: 'ticketIn 0.4s cubic-bezier(.21,1.1,.4,1) both' }}>
      <style>{`@keyframes ticketIn { from { opacity:0; transform:translateY(16px) scale(.98); } to { opacity:1; transform:translateY(0) scale(1); } }`}</style>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Mis turnos</h1>
        <p className="text-sm text-gray-500">{turnos.length} turno{turnos.length !== 1 ? 's' : ''} en total</p>
      </div>

      <div className="mb-6">
        <FiltroPills opciones={FILTROS} valor={filtro} onChange={setFiltro} ariaLabel="Filtrar turnos" />
      </div>

      {cargando ? <TableSkeleton /> : turnosFiltrados.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-200 bg-white px-6 py-12 text-center">
          <p className="text-gray-500">
            No tenés turnos{filtro !== 'todos' ? ` ${filtro}` : ' registrados'}.
          </p>
        </div>
      ) : (
        <>
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">
            {turnosFiltrados.length} resultado{turnosFiltrados.length !== 1 ? 's' : ''}
          </p>
          <div className="overflow-x-auto rounded-2xl border border-gray-100 bg-white shadow-sm">
            <table className="w-full min-w-[700px]">
              <thead>
                <tr className="border-b border-gray-100">
                  {['Día', 'Hora', 'Lugar', 'Médico', 'Especialidad / Práctica', 'Estado', ...(hayAcciones ? ['Acciones'] : [])].map(h => (
                    <th key={h}
                      onClick={SORTABLE.includes(h) ? () => toggleSort(h) : undefined}
                      className={`px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-400 whitespace-nowrap select-none ${SORTABLE.includes(h) ? 'cursor-pointer hover:text-coral-dark transition-colors' : ''}`}>
                      {h}
                      {SORTABLE.includes(h) && <SortIcon dir={h === 'Día' ? sortDia : sortHora} />}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {turnosPagina.map(t => (
                  <TurnoRow key={t._id} turno={t} pacienteId={paciente?._id} onRefresh={fetchTurnos} hayAcciones={hayAcciones} />
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={page} totalPages={totalPages} limit={pageSize} onPageChange={setPage} onLimitChange={v => { setPageSize(v); setPage(1); }} />
        </>
      )}
    </div>
  );
}
