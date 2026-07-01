// TODO: panel del médico — historial turnos, cancelar, proponer cambio, marcar realizado
'use client';
import { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { getTurnosMedico, getDisponibilidad } from '@/services/medico';
import { cancelarTurnoMedico, proponerCambioFecha, marcarRealizado } from '@/services/turnos';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import DateRangePicker from '@/components/ui/DateRangePicker';
import Loader from '@/components/ui/Loader';
import Pagination from '@/components/buscar/Pagination';
import FiltroPills from '@/components/turnos/FiltroPills';
import { ESTADO_BADGE_VARIANT, ESTADO_LABEL } from '@/lib/estadoTurno';

function formatDia(fecha) {
  const weekday = fecha.toLocaleDateString('es-AR', { weekday: 'long' });
  const resto = fecha.toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' });
  return weekday.charAt(0).toUpperCase() + weekday.slice(1) + ' ' + resto;
}

function AccionesMenu({ acciones }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const btnRef = useRef(null);
  const menuRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (!menuRef.current?.contains(e.target) && !btnRef.current?.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, []);

  if (!acciones.length) return null;

  const handleOpen = () => {
    if (btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setPos({
        top: rect.bottom + window.scrollY + 4,
        left: rect.right + window.scrollX - 176,
      });
    }
    setOpen(o => !o);
  };

  return (
    <div className="relative">
      <button
        ref={btnRef}
        type="button"
        onClick={handleOpen}
        className="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 text-gray-500
          hover:border-coral-dark hover:text-coral-dark hover:bg-primary-light transition-colors
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral-dark"
        aria-label="Acciones"
      >
        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
          <circle cx="12" cy="5" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="12" cy="19" r="1.5" />
        </svg>
      </button>
      {open && createPortal(
        <ul
          ref={menuRef}
          style={{ position: 'absolute', top: pos.top, left: pos.left }}
          className="z-[9999] w-44 rounded-xl border border-gray-200 bg-white shadow-lg py-1"
        >
          {acciones.map(({ label, onClick, color }) => (
            <li key={label}>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onClick(); setOpen(false); }}
                className={`w-full text-left px-3 py-2 text-xs font-medium transition-colors hover:bg-gray-50 ${color}`}
              >
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

const FILTROS_MEDICO = [
  { key: 'todos',       label: 'Todos',        color: 'bg-gray-200 text-gray-700' },
  { key: 'disponible',  label: 'Disponible',   color: 'bg-teal-100 text-teal-700' },
  { key: 'reservado',   label: 'Reservado',    color: 'bg-amber-100 text-amber-700' },
  { key: 'cancelado',   label: 'Cancelado',    color: 'bg-red-100 text-red-700' },
  { key: 'realizado',   label: 'Realizado',    color: 'bg-green-100 text-green-700' },
  { key: 'cambio_pend', label: 'Cambio pend.', color: 'bg-sky-100 text-sky-700' },
];

export default function MedicoTurnosPage() {
  const { usuario, loading: authLoading } = useAuth();
  const { addToast } = useToast();
  const [turnos, setTurnos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [sortDia, setSortDia] = useState('asc');
  const [sortHora, setSortHora] = useState('asc');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  // Modal cancelar
  const [modalCancelar, setModalCancelar] = useState(null); // { turnoId }
  const [motivo, setMotivo] = useState('');
  const [errorMotivo, setErrorMotivo] = useState('');
  const [loadingCancelar, setLoadingCancelar] = useState(false);

  // Modal ver propuesta
  const [modalVerPropuesta, setModalVerPropuesta] = useState(null); // { turno }

  // Modal cambiar fecha
  const [modalCambio, setModalCambio] = useState(null);
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  const [resultadosCambio, setResultadosCambio] = useState(null);
  const [seleccionado, setSeleccionado] = useState(null);
  const [buscandoCambio, setBuscandoCambio] = useState(false);
  const [nuevoTurnoId, setNuevoTurnoId] = useState('');
  const [errorTurno, setErrorTurno] = useState('');
  const [loadingCambio, setLoadingCambio] = useState(false);

  const cargarTurnos = async () => {
    if (!usuario?._id) return;
    setLoading(true);
    try {
      const data = await getTurnosMedico(usuario._id);
      setTurnos(Array.isArray(data) ? data : (data.data ?? []));
    } catch (e) {
      addToast(e.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { cargarTurnos(); }, [usuario?._id]);

  const toggleSort = (col) => {
    if (col === 'Día') { setSortDia(d => d === 'asc' ? 'desc' : 'asc'); setPage(1); }
    if (col === 'Hora') { setSortHora(d => d === 'asc' ? 'desc' : 'asc'); setPage(1); }
  };

  const ahora = new Date();
  const turnosFiltrados = [...turnos.filter(t => {
    const esPasado = new Date(t.fechaHora) <= ahora;
    if (['todos', 'disponible', 'cambio_pend'].includes(filtroEstado) && esPasado) return false;
    if (filtroEstado === 'cambio_pend') return t.solicitudCambioFecha?.estado === 'PENDIENTE' && t.solicitudCambioFecha?.solicitante === 'MEDICO';
    if (filtroEstado !== 'todos' && t.estado !== filtroEstado) return false;
    return true;
  })]
    .sort((a, b) => {
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

  const totalPages = Math.max(1, Math.ceil(turnosFiltrados.length / limit));
  const turnosPagina = turnosFiltrados.slice((page - 1) * limit, page * limit);

  // Cancelar
  const handleCancelar = async () => {
    if (!motivo.trim()) { setErrorMotivo('El motivo es obligatorio.'); return; }
    setLoadingCancelar(true);
    try {
      await cancelarTurnoMedico(modalCancelar.turnoId, motivo, usuario._id);
      addToast('Turno cancelado correctamente.', 'success');
      setModalCancelar(null);
      setMotivo('');
      cargarTurnos();
    } catch (e) {
      addToast(e.message, 'error');
    } finally {
      setLoadingCancelar(false);
    }
  };

  // Cambiar fecha
  const abrirModalCambio = (turnoId) => {
    setModalCambio({ turnoId });
    setNuevoTurnoId('');
    setSeleccionado(null);
    setResultadosCambio(null);
    setFechaDesde('');
    setFechaHasta('');
    setErrorTurno('');
  };

  const handleBuscarCambio = async () => {
    if (!modalCambio) return;
    setBuscandoCambio(true);
    setResultadosCambio(null);
    setSeleccionado(null);
    try {
      const turnoActual = turnos.find(t => t._id === modalCambio.turnoId);
      const params = turnoActual?.especialidad
        ? { especialidadId: turnoActual.especialidad._id }
        : { practicaId: turnoActual?.practica?._id };
      const disp = await getDisponibilidad(usuario._id, { ...params, fechaDesde, fechaHasta, limit: 1000 });
      const disponibles = (disp?.turnos ?? disp?.data ?? (Array.isArray(disp) ? disp : []))
        .filter(t => t.estado === 'disponible' && t._id !== modalCambio.turnoId);
      setResultadosCambio(disponibles);
    } catch { setResultadosCambio([]); }
    finally { setBuscandoCambio(false); }
  };


  const handleProponerCambio = async () => {
    if (!seleccionado) { setErrorTurno('Seleccioná un turno disponible.'); return; }
    setLoadingCambio(true);
    try {
      await proponerCambioFecha(modalCambio.turnoId, seleccionado._id);
      addToast('Fecha cambiada correctamente.', 'success');
      setModalCambio(null);
      cargarTurnos();
    } catch (e) {
      addToast(e.message, 'error');
    } finally {
      setLoadingCambio(false);
    }
  };

  // Marcar realizado
  const handleMarcarRealizado = async (turnoId, nombrePaciente) => {
    try {
      await marcarRealizado(turnoId);
      addToast(`Turno con ${nombrePaciente} marcado como realizado.`, 'success');
      cargarTurnos();
    } catch (e) {
      addToast(e.message, 'error');
    }
  };

  const minFecha = new Date();
  minFecha.setHours(minFecha.getHours() + 1);
  const minFechaStr = minFecha.toISOString().slice(0, 16);

  if (authLoading) return <div className="flex justify-center items-center min-h-[50vh]"><Loader size="lg" /></div>;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8" style={{ animation: 'ticketIn 0.4s cubic-bezier(.21,1.1,.4,1) both' }}>
      <style>{`@keyframes ticketIn { from { opacity:0; transform:translateY(16px) scale(.98); } to { opacity:1; transform:translateY(0) scale(1); } }`}</style>
      <h1 className="text-2xl font-bold text-gray-900">Mis turnos</h1>
      <p className="mt-1 text-sm text-gray-500">Gestioná tus turnos como médico</p>

      <div className="mt-4">
        <FiltroPills opciones={FILTROS_MEDICO} valor={filtroEstado} onChange={v => { setFiltroEstado(v); setPage(1); }} ariaLabel="Filtrar turnos por estado" />
      </div>

      <div className="mt-6" aria-live="polite" aria-label="Lista de turnos">
        {loading ? (
          <div className="overflow-x-auto rounded-2xl border border-gray-100 bg-white shadow-sm">
            <table className="w-full min-w-[700px]">
              <thead>
                <tr className="border-b border-gray-100">
                  {['Fecha', 'Hora', 'Paciente', 'Sede', 'Servicio', 'Estado', 'Acciones'].map(h => (
                    <th key={h} className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} className="border-b border-gray-100">
                    {Array.from({ length: 7 }).map((_, j) => (
                      <td key={j} className="px-4 py-4"><div className="h-4 rounded bg-gray-100 animate-pulse" style={{ width: ['96px','48px','120px','96px','96px','60px','120px'][j] }} /></td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : turnosFiltrados.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 bg-white px-6 py-12 text-center">
            <p className="text-gray-500">No tenés turnos{filtroEstado !== 'todos' ? ` con estado "${filtroEstado}"` : ''}.</p>
          </div>
        ) : (
          <>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">
              {turnosFiltrados.length} resultado{turnosFiltrados.length !== 1 ? 's' : ''}
            </p>
          <div className="overflow-x-auto rounded-2xl border border-gray-100 bg-white shadow-sm">
            {(() => {
              const hayAcciones = turnosFiltrados.some(t =>
                ['reservado', 'confirmado'].includes(t.estado)
              );
              const headers = ['Día', 'Hora', 'Lugar', 'Paciente', 'Especialidad / Práctica', 'Estado', ...(hayAcciones ? ['Acciones'] : [])];
              return (
                <table className="w-full min-w-[700px]">
                  <thead>
                    <tr className="border-b border-gray-100">
                      {headers.map(h => (
                        <th
                          key={h}
                          onClick={SORTABLE.includes(h) ? () => toggleSort(h) : undefined}
                          className={[
                            'px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-400 select-none whitespace-nowrap',
                            SORTABLE.includes(h) ? 'cursor-pointer hover:text-coral-dark transition-colors' : '',
                          ].join(' ')}
                        >
                          {h}
                          {SORTABLE.includes(h) && <SortIcon dir={h === 'Día' ? sortDia : sortHora} />}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {turnosPagina.map(turno => {
                      const pacienteNombre = turno.paciente?.nombre ?? '—';
                      const fecha = turno.fechaHora ? new Date(turno.fechaHora) : null;
                      const esCancelable = ['reservado', 'confirmado'].includes(turno.estado);
                      const esRealizable = turno.estado === 'reservado';
                      const tienePropuesta = turno.solicitudCambioFecha?.estado === 'PENDIENTE' && turno.solicitudCambioFecha?.solicitante === 'MEDICO';
                      return (
                        <tr key={turno._id} className={`border-b last:border-0 transition-colors ${tienePropuesta ? 'bg-sky-50 border-sky-200 border-l-2 border-l-sky-400 hover:bg-sky-100/60' : 'border-gray-100 hover:bg-primary-light/40'}`}>
                          <td className="px-4 py-3.5 text-sm text-gray-700 whitespace-nowrap">
                            {fecha ? formatDia(fecha) : '—'}
                          </td>
                          <td className="px-4 py-3.5 text-sm font-semibold text-gray-900 whitespace-nowrap">
                            {fecha ? fecha.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false }) : '—'}
                          </td>
                          <td className="px-4 py-3.5 text-sm text-gray-600 whitespace-nowrap">{turno.sede?.nombre ?? '—'}</td>
                          <td className="px-4 py-3.5 text-sm text-gray-700 whitespace-nowrap">{pacienteNombre}</td>
                          <td className="px-4 py-3.5 text-sm font-medium text-coral-dark whitespace-nowrap">{turno.especialidad?.nombre ?? turno.practica?.nombre ?? '—'}</td>
                          <td className="px-4 py-3.5">
                            <div className="flex items-center gap-1.5">
                              <span className={tienePropuesta ? 'animate-pulse' : ''}>
                                <Badge variant={tienePropuesta ? 'info' : (ESTADO_BADGE_VARIANT[turno.estado.toUpperCase()] ?? 'default')}>
                                  {tienePropuesta ? 'Cambio pend.' : (ESTADO_LABEL[turno.estado.toUpperCase()] ?? turno.estado)}
                                </Badge>
                              </span>
                            </div>
                          </td>
                          {hayAcciones && (
                            <td className="px-4 py-3.5">
                              <AccionesMenu acciones={[
                                ...(esCancelable ? [{
                                  label: 'Cancelar',
                                  onClick: () => { setModalCancelar({ turnoId: turno._id }); setErrorMotivo(''); setMotivo(''); },
                                  color: 'text-red-600',
                                }] : []),
                                ...(esCancelable && !tienePropuesta ? [{
                                  label: 'Cambiar fecha',
                                  onClick: () => abrirModalCambio(turno._id),
                                  color: 'text-gray-700',
                                }] : []),
                                ...(tienePropuesta ? [{
                                  label: 'Ver propuesta',
                                  onClick: () => setModalVerPropuesta({ turno }),
                                  color: 'text-sky-700',
                                }] : []),
                                ...(esRealizable ? [{
                                  label: '✓ Realizado',
                                  onClick: () => handleMarcarRealizado(turno._id, pacienteNombre),
                                  color: 'text-green-700',
                                }] : []),
                              ]} />
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              );
            })()}
          </div>
            <Pagination
              page={page}
              totalPages={totalPages}
              limit={limit}
              onPageChange={setPage}
              onLimitChange={v => { setLimit(v); setPage(1); }}
            />
          </>
        )}
      </div>

      {/* Modal ver propuesta */}
      <Modal
        isOpen={!!modalVerPropuesta}
        onClose={() => setModalVerPropuesta(null)}
        title="Propuesta de cambio enviada"
        footer={
          <>
            <Button variant="ghost" onClick={() => setModalVerPropuesta(null)}>Cerrar</Button>
            <Button onClick={() => {
              const id = modalVerPropuesta?.turno._id;
              setModalVerPropuesta(null);
              abrirModalCambio(id);
            }}>
              Modificar
            </Button>
          </>
        }
      >
        {modalVerPropuesta && (() => {
          const t = modalVerPropuesta.turno;
          const fechaActual = t.fechaHora ? new Date(t.fechaHora) : null;
          const fechaPropuesta = t.solicitudCambioFecha?.nuevaFechaHora ? new Date(t.solicitudCambioFecha.nuevaFechaHora) : null;
          return (
            <div className="flex flex-col gap-4 text-sm">
              <div className="rounded-lg bg-sky-50 border border-sky-200 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-sky-600 mb-2">Pendiente de respuesta del paciente</p>
                <div className="flex flex-col gap-2">
                  <div>
                    <p className="text-xs text-gray-400">Fecha actual</p>
                    <p className="font-semibold text-gray-800">{fechaActual ? `${formatDia(fechaActual)} — ${fechaActual.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false })}` : '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Fecha propuesta</p>
                    <p className="font-semibold text-coral-dark">{fechaPropuesta ? `${formatDia(fechaPropuesta)} — ${fechaPropuesta.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false })}` : '—'}</p>
                  </div>
                </div>
              </div>
              <p className="text-xs text-gray-400">"Modificar" cancela esta propuesta y te permite seleccionar una nueva fecha.</p>
            </div>
          );
        })()}
      </Modal>

      {/* Modal cancelar */}
      <Modal
        isOpen={!!modalCancelar}
        onClose={() => setModalCancelar(null)}
        title="Cancelar turno"
        footer={
          <>
            <Button variant="ghost" onClick={() => setModalCancelar(null)}>Volver</Button>
            <Button variant="danger" loading={loadingCancelar} onClick={handleCancelar}>
              Confirmar cancelación
            </Button>
          </>
        }
      >
        <p className="mb-4 text-sm text-gray-600">
          Ingresá el motivo de cancelación. El paciente recibirá una notificación.
        </p>
        <div className="flex flex-col gap-1">
          <label htmlFor="motivo-cancelar" className="text-sm font-medium text-gray-700">
            Motivo *
          </label>
          <textarea
            id="motivo-cancelar"
            value={motivo}
            onChange={e => { setMotivo(e.target.value); setErrorMotivo(''); }}
            rows={3}
            aria-required="true"
            aria-describedby={errorMotivo ? 'motivo-error' : undefined}
            aria-invalid={!!errorMotivo}
            className={`w-full rounded-lg border px-3 py-2 text-sm text-gray-900
              focus:outline-none focus:ring-2 focus:ring-coral-dark
              ${errorMotivo ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
            placeholder="Ej: Emergencia médica personal"
          />
          {errorMotivo && (
            <p id="motivo-error" role="alert" className="text-xs text-red-600">{errorMotivo}</p>
          )}
        </div>
      </Modal>

      {/* Modal cambiar fecha */}
      <Modal
        isOpen={!!modalCambio}
        onClose={() => setModalCambio(null)}
        title="Cambiar fecha del turno"
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => setModalCambio(null)}>Cancelar</Button>
            <Button loading={loadingCambio} disabled={!seleccionado} onClick={handleProponerCambio}>
              Confirmar cambio
            </Button>
          </>
        }
      >
        <p className="text-sm text-gray-500 mb-4">Buscá un slot disponible y seleccioná el nuevo horario.</p>
        <div className="mb-3">
          <DateRangePicker
            id="rango-fecha-medico"
            label="Rango de fechas"
            desde={fechaDesde}
            hasta={fechaHasta}
            onChangeDates={(d, h) => { setFechaDesde(d); setFechaHasta(h); }}
            minDate={new Date().toISOString().split('T')[0]}
            placeholder="Seleccioná fechas"
          />
        </div>
        <Button variant="secondary" className="w-full mb-4" onClick={handleBuscarCambio} loading={buscandoCambio}>
          Buscar disponibilidad
        </Button>
        {resultadosCambio !== null && (
          <div className="max-h-60 overflow-y-auto flex flex-col gap-2">
            {resultadosCambio.length === 0
              ? <p className="text-sm text-gray-500 text-center py-4">No hay turnos disponibles en ese rango.</p>
              : resultadosCambio.map(t => (
                <button key={t._id} onClick={() => { setSeleccionado(t); setErrorTurno(''); }}
                  aria-pressed={seleccionado?._id === t._id}
                  className={`w-full text-left rounded-lg border p-3 text-sm transition-colors
                    ${seleccionado?._id === t._id ? 'border-coral-dark bg-primary-light' : 'border-gray-200 hover:border-gray-300'}`}>
                  <div className="font-medium text-gray-900">{formatDia(new Date(t.fechaHora))}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{new Date(t.fechaHora).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false })}</div>
                </button>
              ))
            }
          </div>
        )}
        {errorTurno && <p role="alert" className="mt-1 text-xs text-red-600">{errorTurno}</p>}
      </Modal>
    </div>
  );
}