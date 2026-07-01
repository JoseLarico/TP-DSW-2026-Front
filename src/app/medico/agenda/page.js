'use client';
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { getDisponibilidad, crearAgenda } from '@/services/medico';
import { getEspecialidades, getSedes, getPracticas } from '@/services/catalogo';
import Button from '@/components/ui/Button';
import Pagination from '@/components/buscar/Pagination';
import Select from '@/components/ui/Select';
import DateRangePicker from '@/components/ui/DateRangePicker';
import TimeRangePicker from '@/components/ui/TimeRangePicker';
import Badge from '@/components/ui/Badge';
import Loader from '@/components/ui/Loader';

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

function formatDia(fecha) {
  const weekday = fecha.toLocaleDateString('es-AR', { weekday: 'long' });
  const resto = fecha.toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' });
  return weekday.charAt(0).toUpperCase() + weekday.slice(1) + ' ' + resto;
}

const DIAS = [
  { value: 'LUNES',     label: 'Lunes' },
  { value: 'MARTES',    label: 'Martes' },
  { value: 'MIERCOLES', label: 'Miércoles' },
  { value: 'JUEVES',    label: 'Jueves' },
  { value: 'VIERNES',   label: 'Viernes' },
  { value: 'SABADO',    label: 'Sábado' },
  { value: 'DOMINGO',   label: 'Domingo' },
];

function StepBadge({ n }) {
  return (
    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-coral-dark text-xs font-bold text-white">
      {n}
    </span>
  );
}

function Reveal({ visible, children }) {
  const [overflow, setOverflow] = useState('hidden');
  useEffect(() => {
    if (visible) {
      const t = setTimeout(() => setOverflow('visible'), 420);
      return () => clearTimeout(t);
    } else {
      setOverflow('hidden');
    }
  }, [visible]);

  return (
    <div style={{
      maxHeight: visible ? '600px' : '0px',
      overflow,
      opacity: visible ? 1 : 0,
      transitionProperty: 'max-height, opacity',
      transitionDuration: '420ms, 300ms',
      transitionTimingFunction: 'cubic-bezier(0.4,0,0.2,1), ease',
      pointerEvents: visible ? 'auto' : 'none',
    }}>
      <div className="pt-5">{children}</div>
    </div>
  );
}

export default function MedicoAgendaPage() {
  const { usuario, loading: authLoading } = useAuth();
  const { addToast } = useToast();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !usuario) router.push('/login');
  }, [authLoading, usuario]);

  const [especialidades, setEspecialidades] = useState([]);
  const [practicas, setPracticas] = useState([]);
  const [sedes, setSedes] = useState([]);
  const [turnos, setTurnos] = useState([]);
  const [sortDia, setSortDia] = useState('asc');
  const [sortHora, setSortHora] = useState('asc');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const toggleSort = (col) => {
    if (col === 'Día') { setSortDia(d => d === 'asc' ? 'desc' : 'asc'); setPage(1); }
    if (col === 'Hora') { setSortHora(d => d === 'asc' ? 'desc' : 'asc'); setPage(1); }
  };

  const turnosOrdenados = [...turnos].sort((a, b) => {
    const da = new Date(a.fechaHora), db = new Date(b.fechaHora);
    const diffDia = new Date(da.getFullYear(), da.getMonth(), da.getDate())
                  - new Date(db.getFullYear(), db.getMonth(), db.getDate());
    if (diffDia !== 0) return sortDia === 'asc' ? diffDia : -diffDia;
    const diffHora = (da.getHours() * 60 + da.getMinutes()) - (db.getHours() * 60 + db.getMinutes());
    return sortHora === 'asc' ? diffHora : -diffHora;
  });
  const totalPagesTurnos = Math.max(1, Math.ceil(turnosOrdenados.length / limit));
  const turnosPagina = turnosOrdenados.slice((page - 1) * limit, page * limit);
  const [loading, setLoading] = useState(false);
  const [loadingForm, setLoadingForm] = useState(false);

  const [tipo, setTipo] = useState('');
  const [servicioId, setServicioId] = useState('');
  const [sedeId, setSedeId] = useState('');
  const [diaSemana, setDiaSemana] = useState('');
  const [horaInicio, setHoraInicio] = useState('');
  const [horaFin, setHoraFin] = useState('');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [errores, setErrores] = useState({});

  const showStep2 = !!tipo;
  const showStep3 = showStep2 && !!servicioId;
  const showStep4 = showStep3 && !!sedeId;
  const showStep5 = showStep4 && !!diaSemana;

  useEffect(() => {
    if (!usuario?._id) return;
    setLoading(true);
    Promise.all([getEspecialidades(), getPracticas(), getSedes()])
      .then(([esp, prac, sed]) => {
        setEspecialidades(Array.isArray(esp) ? esp : []);
        setPracticas(Array.isArray(prac) ? prac : []);
        setSedes(Array.isArray(sed) ? sed : []);
      })
      .catch(err => addToast(err.message, 'error'))
      .finally(() => setLoading(false));
  }, [usuario?._id]);

  const changeTipo = (t) => {
    setTipo(t);
    setServicioId('');
    setSedeId('');
    setDiaSemana('');
    setHoraInicio('');
    setHoraFin('');
    setFechaInicio('');
    setFechaFin('');
    setErrores({});
  };

  const validar = () => {
    const e = {};
    if (!servicioId) e.servicio = 'Seleccioná una opción.';
    if (!sedeId) e.sedeId = 'Seleccioná una sede.';
    if (!diaSemana) e.diaSemana = 'Seleccioná un día.';
    if (!horaInicio) e.horaInicio = 'Ingresá la hora de inicio.';
    if (!horaFin) e.horaFin = 'Ingresá la hora de fin.';
    if (horaInicio && horaFin && horaInicio >= horaFin) e.horaFin = 'Hora fin debe ser posterior al inicio.';
    if (!fechaInicio) e.fechaFin = 'Seleccioná el rango de fechas.';
    if (!fechaFin) e.fechaFin = 'Seleccioná la fecha de fin.';
    if (fechaFin && new Date(fechaFin) <= new Date()) e.fechaFin = 'La fecha de fin debe ser futura.';
    return e;
  };

  const handleCrear = async () => {
    const e = validar();
    if (Object.keys(e).length) { setErrores(e); return; }
    setLoadingForm(true);
    try {
      const payload = {
        sedeId,
        ...(tipo === 'especialidad' ? { especialidadId: servicioId } : { practicaId: servicioId }),
        disponibilidad: {
          diaSemana,
          horaInicio,
          horaFin,
          fechaInicio: new Date(fechaInicio).toISOString(),
          fechaFin: new Date(fechaFin).toISOString(),
        },
      };

      const result = await crearAgenda(usuario._id, payload);
      const nuevosTurnos = Array.isArray(result) ? result : (result?.turnos ?? result?.data ?? []);
      setTurnos(nuevosTurnos);
      addToast('Agenda creada y turnos generados correctamente.', 'success');
      setTipo('');
      setServicioId('');
      setSedeId('');
      setDiaSemana('');
      setHoraInicio('');
      setHoraFin('');
      setFechaFin('');
        setErrores({});
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setLoadingForm(false);
    }
  };

  const servicioOptions = (tipo === 'especialidad' ? especialidades : practicas)
    .map(x => ({ value: x._id, label: x.nombre }));

  if (authLoading) return <div className="flex justify-center items-center min-h-[50vh]"><Loader size="lg" /></div>;

  if (loading) return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="h-8 w-28 rounded-lg bg-gray-100 animate-pulse mb-1" />
      <div className="h-4 w-72 rounded bg-gray-100 animate-pulse mb-6" />
      <div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-6">
        <div className="flex items-center gap-2.5 mb-3">
          <div className="h-6 w-6 rounded-full bg-gray-100 animate-pulse" />
          <div className="h-4 w-32 rounded bg-gray-100 animate-pulse" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="h-12 rounded-xl bg-gray-100 animate-pulse" />
          <div className="h-12 rounded-xl bg-gray-100 animate-pulse" />
        </div>
      </div>
    </div>
  );

  return (
    <div className={`mx-auto px-4 py-8 sm:px-6 lg:px-8 transition-all ${turnos.length > 0 ? 'max-w-5xl' : 'max-w-2xl'}`} style={{ animation: 'ticketIn 0.4s cubic-bezier(.21,1.1,.4,1) both' }}>
      <style>{`@keyframes ticketIn { from { opacity:0; transform:translateY(16px) scale(.98); } to { opacity:1; transform:translateY(0) scale(1); } }`}</style>
      <h1 className="text-2xl font-bold text-gray-900">Mi agenda</h1>
      <p className="mt-1 text-sm text-gray-500">Definí tu disponibilidad horaria y generá turnos automáticamente</p>

      <div className="mt-6 rounded-2xl border border-gray-100 bg-white shadow-sm p-6">

        {/* Paso 1: tipo */}
        <div>
          <div className="flex items-center gap-2.5 mb-3">
            <StepBadge n="1" />
            <span className="text-sm font-semibold text-gray-700">Tipo de servicio</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[{ v: 'especialidad', l: 'Especialidad' }, { v: 'practica', l: 'Práctica' }].map(({ v, l }) => (
              <button
                key={v}
                type="button"
                onClick={() => changeTipo(v)}
                className={[
                  'rounded-xl border-2 px-4 py-3 text-sm font-semibold transition-all',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral-dark',
                  tipo === v
                    ? 'border-coral-dark bg-coral-dark text-white shadow-sm'
                    : 'border-gray-200 text-gray-600 hover:border-coral-dark hover:text-coral-dark',
                ].join(' ')}
              >
                {l}
              </button>
            ))}
          </div>
        </div>

        {/* Paso 2: especialidad/práctica */}
        <Reveal visible={showStep2}>
          <div className="flex items-center gap-2.5 mb-3">
            <StepBadge n="2" />
            <span className="text-sm font-semibold text-gray-700">
              {tipo === 'practica' ? 'Práctica' : 'Especialidad'}
            </span>
          </div>
          <Select
            id="servicio-agenda"
            value={servicioId}
            onValueChange={val => { setServicioId(val); setErrores(p => ({ ...p, servicio: '' })); }}
            placeholder="Seleccioná una opción…"
            options={servicioOptions}
            error={errores.servicio}
          />
        </Reveal>

        {/* Paso 3: sede */}
        <Reveal visible={showStep3}>
          <div className="flex items-center gap-2.5 mb-3">
            <StepBadge n="3" />
            <span className="text-sm font-semibold text-gray-700">Sede</span>
          </div>
          <Select
            id="sede-agenda"
            value={sedeId}
            onValueChange={val => { setSedeId(val); setErrores(p => ({ ...p, sedeId: '' })); }}
            placeholder="Seleccioná una sede…"
            options={sedes.map(s => ({ value: s._id, label: s.nombre }))}
            error={errores.sedeId}
          />
        </Reveal>

        {/* Paso 4: día */}
        <Reveal visible={showStep4}>
          <div className="flex items-center gap-2.5 mb-3">
            <StepBadge n="4" />
            <span className="text-sm font-semibold text-gray-700">Día de atención</span>
          </div>
          <Select
            id="dia-agenda"
            value={diaSemana}
            onValueChange={val => { setDiaSemana(val); setErrores(p => ({ ...p, diaSemana: '' })); }}
            placeholder="Seleccioná un día…"
            options={DIAS.map(({ value, label }) => ({ value, label }))}
            error={errores.diaSemana}
          />
        </Reveal>

        {/* Paso 5: horarios y fecha fin */}
        <Reveal visible={showStep5}>
          <div className="flex items-center gap-2.5 mb-3">
            <StepBadge n="5" />
            <span className="text-sm font-semibold text-gray-700">Horario y período</span>
          </div>
          <div className="space-y-4">
            <TimeRangePicker
              id="horario"
              label="Horario *"
              inicio={horaInicio}
              fin={horaFin}
              onChangeTimes={(i, f) => {
                setHoraInicio(i);
                setHoraFin(f);
                setErrores(p => ({ ...p, horaInicio: '', horaFin: '' }));
              }}
              error={errores.horaInicio || errores.horaFin}
            />
            <DateRangePicker
              id="rango-agenda"
              label="Período de disponibilidad *"
              desde={fechaInicio}
              hasta={fechaFin}
              onChangeDates={(d, h) => {
                setFechaInicio(d);
                setFechaFin(h);
                setErrores(p => ({ ...p, fechaFin: '' }));
              }}
              minDate={new Date().toISOString().split('T')[0]}
              placeholder="Seleccioná el rango"
            />
            {errores.fechaFin && <p className="text-xs text-red-600 -mt-1">{errores.fechaFin}</p>}
            <Button onClick={handleCrear} loading={loadingForm} className="w-full">
              Generar turnos
            </Button>
          </div>
        </Reveal>

      </div>

      {/* Turnos generados */}
      {turnos.length > 0 && (
        <div className="mt-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-gray-900">Turnos generados</h2>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
              {turnos.length} resultado{turnos.length !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="rounded-2xl border border-gray-100 bg-white shadow-sm" aria-live="polite">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  {['Día', 'Hora', 'Lugar', 'Especialidad / Práctica', 'Estado'].map(h => (
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
                {turnosPagina.map(t => {
                  const fecha = new Date(t.fechaHora);
                  return (
                    <tr key={t._id} className="border-b border-gray-100 last:border-0 hover:bg-primary-light/40 transition-colors">
                      <td className="px-4 py-3.5 text-sm text-gray-700 whitespace-nowrap">
                        {formatDia(fecha)}
                      </td>
                      <td className="px-4 py-3.5 text-sm font-semibold text-gray-900 whitespace-nowrap">
                        {fecha.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false })}
                      </td>
                      <td className="px-4 py-3.5 text-sm text-gray-600 whitespace-nowrap">{t.sede?.nombre ?? '—'}</td>
                      <td className="px-4 py-3.5 text-sm font-medium text-coral-dark whitespace-nowrap">
                        {t.especialidad?.nombre ?? t.practica?.nombre ?? '—'}
                      </td>
                      <td className="px-4 py-3.5">
                        <Badge variant="teal">Disponible</Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <Pagination
            page={page}
            totalPages={totalPagesTurnos}
            limit={limit}
            onPageChange={setPage}
            onLimitChange={v => { setLimit(v); setPage(1); }}
          />
        </div>
      )}
    </div>
  );
}
