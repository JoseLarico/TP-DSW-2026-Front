// TODO: panel del médico — historial turnos, cancelar, proponer cambio, marcar realizado
'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { getTurnosMedico } from '@/services/medico';
import { cancelarTurnoMedico, proponerCambioFecha, marcarRealizado } from '@/services/turnos';
import Card, { CardBody } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import { SkeletonCard } from '@/components/ui/Skeleton';

const ESTADO_BADGE = {
  disponible:  'default',
  reservado:   'warning',
  confirmado:  'primary',
  cancelado:   'danger',
  realizado:   'success',
};

function FiltroEstado({ valor, onChange }) {
  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrar turnos por estado">
      {['todos', 'reservado', 'confirmado', 'cancelado', 'realizado'].map(e => (
        <button
          key={e}
          onClick={() => onChange(e)}
          aria-pressed={valor === e}
          className={`rounded-full px-3 py-1 text-xs font-medium capitalize transition-colors
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500
            ${valor === e
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
        >
          {e === 'todos' ? 'Todos' : e}
        </button>
      ))}
    </div>
  );
}

export default function MedicoTurnosPage() {
  const usuario = useAuth();
  const { addToast } = useToast();
  const [turnos, setTurnos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtroEstado, setFiltroEstado] = useState('todos');

  // Modal cancelar
  const [modalCancelar, setModalCancelar] = useState(null); // { turnoId }
  const [motivo, setMotivo] = useState('');
  const [errorMotivo, setErrorMotivo] = useState('');
  const [loadingCancelar, setLoadingCancelar] = useState(false);

  // Modal proponer cambio
  const [modalCambio, setModalCambio] = useState(null); // { turnoId }
  const [nuevaFecha, setNuevaFecha] = useState('');
  const [errorFecha, setErrorFecha] = useState('');
  const [loadingCambio, setLoadingCambio] = useState(false);

  const cargarTurnos = async () => {
    if (!usuario?._id) return;
    setLoading(true);
    try {
      const data = await getTurnosMedico(usuario._id);
      setTurnos(Array.isArray(data) ? data : (data.data ?? []));
    } catch (e) {
      addToast(e.message || 'Error al cargar los turnos', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { cargarTurnos(); }, [usuario?._id]);

  const turnosFiltrados = filtroEstado === 'todos'
    ? turnos
    : turnos.filter(t => t.estado === filtroEstado);

  // Cancelar
  const handleCancelar = async () => {
    if (!motivo.trim()) { setErrorMotivo('El motivo es obligatorio.'); return; }
    setLoadingCancelar(true);
    try {
      await cancelarTurnoMedico(modalCancelar.turnoId, motivo);
      addToast('Turno cancelado correctamente.', 'success');
      setModalCancelar(null);
      setMotivo('');
      cargarTurnos();
    } catch (e) {
      addToast(e.message || 'No se pudo cancelar el turno.', 'error');
    } finally {
      setLoadingCancelar(false);
    }
  };

  // Proponer cambio
  const handleProponerCambio = async () => {
    if (!nuevaFecha) { setErrorFecha('Seleccioná una fecha y hora.'); return; }
    if (new Date(nuevaFecha) <= new Date()) { setErrorFecha('La fecha debe ser futura.'); return; }
    setLoadingCambio(true);
    try {
      await proponerCambioFecha(modalCambio.turnoId, new Date(nuevaFecha).toISOString());
      addToast('Propuesta de cambio enviada al paciente.', 'success');
      setModalCambio(null);
      setNuevaFecha('');
      cargarTurnos();
    } catch (e) {
      addToast(e.message || 'Error al proponer el cambio.', 'error');
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
      addToast(e.message || 'Error al marcar el turno.', 'error');
    }
  };

  const minFecha = new Date();
  minFecha.setHours(minFecha.getHours() + 1);
  const minFechaStr = minFecha.toISOString().slice(0, 16);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold text-gray-900">Mis turnos</h1>
      <p className="mt-1 text-sm text-gray-500">Gestioná tus turnos como médico</p>

      <div className="mt-4">
        <FiltroEstado valor={filtroEstado} onChange={setFiltroEstado} />
      </div>

      <div className="mt-6 space-y-4" aria-live="polite" aria-label="Lista de turnos">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)
        ) : turnosFiltrados.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 bg-white px-6 py-12 text-center">
            <p className="text-gray-500">No tenés turnos{filtroEstado !== 'todos' ? ` con estado "${filtroEstado}"` : ''}.</p>
          </div>
        ) : (
          turnosFiltrados.map(turno => {
            const pacienteNombre = turno.paciente?.nombre ?? 'Paciente sin nombre';
            const fechaStr = turno.fechaHora
              ? new Date(turno.fechaHora).toLocaleString('es-AR', { dateStyle: 'medium', timeStyle: 'short' })
              : '—';
            const esCancelable = ['reservado', 'confirmado'].includes(turno.estado);
            const esRealizable = turno.estado === 'confirmado';

            return (
              <Card key={turno._id}>
                <CardBody>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-gray-900">{pacienteNombre}</p>
                        <Badge variant={ESTADO_BADGE[turno.estado] ?? 'default'}>
                          {turno.estado}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600">
                        📅 {fechaStr}
                      </p>
                      {turno.sede && (
                        <p className="text-sm text-gray-600">📍 {turno.sede.nombre}</p>
                      )}
                      {(turno.especialidad || turno.practica) && (
                        <p className="text-sm text-gray-500">
                          {turno.especialidad?.nombre ?? turno.practica?.nombre}
                        </p>
                      )}
                    </div>

                    <div
                      className="flex flex-wrap gap-2 sm:flex-col sm:items-end"
                      role="group"
                      aria-label={`Acciones para turno con ${pacienteNombre}`}
                    >
                      {esCancelable && (
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => { setModalCancelar({ turnoId: turno._id }); setErrorMotivo(''); setMotivo(''); }}
                          aria-label={`Cancelar turno con ${pacienteNombre} el ${fechaStr}`}
                        >
                          Cancelar
                        </Button>
                      )}
                      {esCancelable && (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => { setModalCambio({ turnoId: turno._id }); setErrorFecha(''); setNuevaFecha(''); }}
                          aria-label={`Proponer cambio de fecha para turno con ${pacienteNombre}`}
                        >
                          Proponer cambio
                        </Button>
                      )}
                      {esRealizable && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleMarcarRealizado(turno._id, pacienteNombre)}
                          aria-label={`Marcar como realizado el turno con ${pacienteNombre}`}
                        >
                          ✓ Realizado
                        </Button>
                      )}
                    </div>
                  </div>
                </CardBody>
              </Card>
            );
          })
        )}
      </div>

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
              focus:outline-none focus:ring-2 focus:ring-blue-500
              ${errorMotivo ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
            placeholder="Ej: Emergencia médica personal"
          />
          {errorMotivo && (
            <p id="motivo-error" role="alert" className="text-xs text-red-600">{errorMotivo}</p>
          )}
        </div>
      </Modal>

      {/* Modal proponer cambio */}
      <Modal
        isOpen={!!modalCambio}
        onClose={() => setModalCambio(null)}
        title="Proponer cambio de fecha"
        footer={
          <>
            <Button variant="ghost" onClick={() => setModalCambio(null)}>Volver</Button>
            <Button variant="primary" loading={loadingCambio} onClick={handleProponerCambio}>
              Enviar propuesta
            </Button>
          </>
        }
      >
        <p className="mb-4 text-sm text-gray-600">
          Seleccioná una nueva fecha y hora. El paciente podrá aceptarla o rechazarla.
        </p>
        <Input
          id="nueva-fecha-cambio"
          label="Nueva fecha y hora *"
          type="datetime-local"
          value={nuevaFecha}
          min={minFechaStr}
          onChange={e => { setNuevaFecha(e.target.value); setErrorFecha(''); }}
          error={errorFecha}
          aria-required="true"
        />
      </Modal>
    </div>
  );
}