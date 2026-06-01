// TODO: crear agenda (POST /medicos/:id/agenda) + ver disponibilidad
'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { getDisponibilidad, crearAgenda } from '@/services/medico';
import { getEspecialidades, getSedes, getPracticas } from '@/services/catalogo';
import Card, { CardBody, CardHeader } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Badge from '@/components/ui/Badge';
import { SkeletonCard } from '@/components/ui/Skeleton';

const DIAS = ['LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO', 'DOMINGO'];

const FORM_INICIAL = {
  tipo: 'especialidad',
  especialidadId: '',
  practicaId: '',
  sedeId: '',
  diaSemana: '',
  horaInicio: '',
  horaFin: '',
};

export default function MedicoAgendaPage() {
  const usuario = useAuth();
  const { addToast } = useToast();

  const [turnos, setTurnos] = useState([]);
  const [especialidades, setEspecialidades] = useState([]);
  const [practicas, setPracticas] = useState([]);
  const [sedes, setSedes] = useState([]);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState(FORM_INICIAL);
  const [errores, setErrores] = useState({});
  const [loadingForm, setLoadingForm] = useState(false);

  useEffect(() => {
    if (!usuario?._id) return;
    Promise.all([
      getDisponibilidad(usuario._id, {}).catch(() => []),
      getEspecialidades(),
      getPracticas(),
      getSedes(),
    ]).then(([disp, esp, prac, sed]) => {
      setTurnos(Array.isArray(disp) ? disp : (disp?.data ?? []));
      setEspecialidades(esp);
      setPracticas(prac);
      setSedes(sed);
    }).catch(() => {
      addToast('Error al cargar los datos de la agenda.', 'error');
    }).finally(() => setLoading(false));
  }, [usuario?._id]);

  const setField = (campo, valor) => {
    setForm(prev => ({ ...prev, [campo]: valor }));
    setErrores(prev => ({ ...prev, [campo]: '' }));
  };

  const validar = () => {
    const e = {};
    if (form.tipo === 'especialidad' && !form.especialidadId) e.especialidadId = 'Seleccioná una especialidad.';
    if (form.tipo === 'practica' && !form.practicaId) e.practicaId = 'Seleccioná una práctica.';
    if (!form.sedeId) e.sedeId = 'Seleccioná una sede.';
    if (!form.diaSemana) e.diaSemana = 'Seleccioná un día.';
    if (!form.horaInicio) e.horaInicio = 'Ingresá la hora de inicio.';
    if (!form.horaFin) e.horaFin = 'Ingresá la hora de fin.';
    if (form.horaInicio && form.horaFin && form.horaInicio >= form.horaFin) {
      e.horaFin = 'La hora de fin debe ser posterior al inicio.';
    }
    return e;
  };

  const handleCrear = async () => {
    const e = validar();
    if (Object.keys(e).length) { setErrores(e); return; }
    setLoadingForm(true);
    try {
      const payload = {
        sedeId: form.sedeId,
        disponibilidad: {
          diaSemana: form.diaSemana,
          horaInicio: form.horaInicio,
          horaFin: form.horaFin,
        },
        ...(form.tipo === 'especialidad'
          ? { especialidadId: form.especialidadId }
          : { practicaId: form.practicaId }),
      };
      await crearAgenda(usuario._id, payload);
      addToast('Agenda creada y turnos generados correctamente.', 'success');
      setForm(FORM_INICIAL);
      // Refrescar disponibilidad
      const disp = await getDisponibilidad(usuario._id, {}).catch(() => []);
      setTurnos(Array.isArray(disp) ? disp : (disp?.data ?? []));
    } catch (err) {
      addToast(err.message || 'Error al crear la agenda.', 'error');
    } finally {
      setLoadingForm(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold text-gray-900">Mi agenda</h1>
      <p className="mt-1 text-sm text-gray-500">Definí tu disponibilidad horaria y generá turnos automáticamente</p>

      {/* Formulario nueva agenda */}
      <Card className="mt-6">
        <CardHeader>
          <h2 className="text-base font-semibold text-gray-900">Nueva disponibilidad</h2>
        </CardHeader>
        <CardBody>
          <fieldset className="space-y-4">
            <legend className="sr-only">Tipo de servicio</legend>

            {/* Tipo: especialidad o práctica */}
            <div role="group" aria-label="Tipo de servicio" className="flex gap-4">
              {['especialidad', 'practica'].map(tipo => (
                <label key={tipo} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="tipo-servicio"
                    value={tipo}
                    checked={form.tipo === tipo}
                    onChange={() => setField('tipo', tipo)}
                    className="accent-blue-600"
                  />
                  <span className="text-sm font-medium text-gray-700 capitalize">{tipo}</span>
                </label>
              ))}
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {form.tipo === 'especialidad' ? (
                <Select
                  id="especialidad-agenda"
                  label="Especialidad *"
                  value={form.especialidadId}
                  onChange={e => setField('especialidadId', e.target.value)}
                  options={especialidades.map(e => ({ value: e._id, label: e.nombre }))}
                  error={errores.especialidadId}
                />
              ) : (
                <Select
                  id="practica-agenda"
                  label="Práctica *"
                  value={form.practicaId}
                  onChange={e => setField('practicaId', e.target.value)}
                  options={practicas.map(p => ({ value: p._id, label: p.nombre }))}
                  error={errores.practicaId}
                />
              )}

              <Select
                id="sede-agenda"
                label="Sede *"
                value={form.sedeId}
                onChange={e => setField('sedeId', e.target.value)}
                options={sedes.map(s => ({ value: s._id, label: s.nombre }))}
                error={errores.sedeId}
              />

              <Select
                id="dia-agenda"
                label="Día de la semana *"
                value={form.diaSemana}
                onChange={e => setField('diaSemana', e.target.value)}
                options={DIAS.map(d => ({ value: d, label: d.charAt(0) + d.slice(1).toLowerCase() }))}
                error={errores.diaSemana}
              />

              <div className="grid grid-cols-2 gap-3">
                <Input
                  id="hora-inicio"
                  label="Hora inicio *"
                  type="time"
                  value={form.horaInicio}
                  onChange={e => setField('horaInicio', e.target.value)}
                  error={errores.horaInicio}
                />
                <Input
                  id="hora-fin"
                  label="Hora fin *"
                  type="time"
                  value={form.horaFin}
                  onChange={e => setField('horaFin', e.target.value)}
                  error={errores.horaFin}
                />
              </div>
            </div>

            <Button onClick={handleCrear} loading={loadingForm} className="w-full sm:w-auto">
              Crear disponibilidad y generar turnos
            </Button>
          </fieldset>
        </CardBody>
      </Card>

      {/* Turnos disponibles actuales */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold text-gray-900">Turnos disponibles generados</h2>
        <div className="mt-4 space-y-3" aria-live="polite">
          {loading ? (
            Array.from({ length: 2 }).map((_, i) => <SkeletonCard key={i} />)
          ) : turnos.length === 0 ? (
            <p className="text-sm text-gray-500">No tenés turnos disponibles generados todavía.</p>
          ) : (
            turnos.slice(0, 10).map(t => (
              <Card key={t._id}>
                <CardBody className="py-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {new Date(t.fechaHora).toLocaleString('es-AR', { dateStyle: 'medium', timeStyle: 'short' })}
                      </p>
                      <p className="text-xs text-gray-500">{t.sede?.nombre}</p>
                    </div>
                    <Badge variant="default">disponible</Badge>
                  </div>
                </CardBody>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}