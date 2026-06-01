// TODO: ABM médicos (CRUD + asignar especialidades/prácticas/sedes)
'use client';
import { useEffect, useState } from 'react';
import { useToast } from '@/context/ToastContext';
import {
  getMedicos, crearMedico, actualizarMedico, eliminarMedico,
  agregarEspecialidad, quitarEspecialidad,
  agregarPractica, quitarPractica,
  agregarSede, quitarSede,
} from '@/services/medico';
import { getEspecialidades, getPracticas, getSedes } from '@/services/catalogo';
import Card, { CardBody, CardHeader } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Modal from '@/components/ui/Modal';
import Badge from '@/components/ui/Badge';
import { SkeletonCard } from '@/components/ui/Skeleton';

// Subcomponente: chip de asignación con botón de quitar
function ChipAsignacion({ label, onQuitar, cargando }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700">
      {label}
      <button
        onClick={onQuitar}
        disabled={cargando}
        aria-label={`Quitar ${label}`}
        className="ml-0.5 rounded-full hover:text-red-600 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500"
      >
        ×
      </button>
    </span>
  );
}

export default function AdminMedicosPage() {
  const { addToast } = useToast();
  const [medicos, setMedicos] = useState([]);
  const [especialidades, setEspecialidades] = useState([]);
  const [practicas, setPracticas] = useState([]);
  const [sedes, setSedes] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal crear/editar
  const [modal, setModal] = useState(null); // null | { modo: 'crear' | 'editar', medico?: {} }
  const [formNombre, setFormNombre] = useState('');
  const [formMatricula, setFormMatricula] = useState('');
  const [formUsuario, setFormUsuario] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [erroresForm, setErroresForm] = useState({});
  const [loadingForm, setLoadingForm] = useState(false);

  // Selects para asignar
  const [espSeleccionada, setEspSeleccionada] = useState('');
  const [pracSeleccionada, setPracSeleccionada] = useState('');
  const [sedeSeleccionada, setSedeSeleccionada] = useState('');
  const [loadingAsig, setLoadingAsig] = useState(false);

  // Médico en panel de asignaciones (lateral)
  const [medicoActivo, setMedicoActivo] = useState(null);

  const cargar = async () => {
    setLoading(true);
    try {
      const [m, e, p, s] = await Promise.all([getMedicos(), getEspecialidades(), getPracticas(), getSedes()]);
      setMedicos(Array.isArray(m) ? m : (m?.data ?? []));
      setEspecialidades(Array.isArray(e) ? e : []);
      setPracticas(Array.isArray(p) ? p : []);
      setSedes(Array.isArray(s) ? s : []);
    } catch {
      addToast('Error al cargar los datos.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { cargar(); }, []);

  const abrirCrear = () => {
    setFormNombre(''); setFormMatricula(''); setFormUsuario(''); setFormPassword('');
    setErroresForm({});
    setModal({ modo: 'crear' });
  };

  const abrirEditar = (medico) => {
    setFormNombre(medico.nombre); setFormMatricula(medico.matricula);
    setFormUsuario(''); setFormPassword('');
    setErroresForm({});
    setModal({ modo: 'editar', medico });
  };

  const handleGuardar = async () => {
    const e = {};
    if (!formNombre.trim()) e.nombre = 'El nombre es obligatorio.';
    if (!formMatricula.trim()) e.matricula = 'La matrícula es obligatoria.';
    if (modal.modo === 'crear') {
      if (!formUsuario.trim()) e.usuario = 'El usuario es obligatorio.';
      if (!formPassword.trim()) e.password = 'La contraseña es obligatoria.';
    }
    if (Object.keys(e).length) { setErroresForm(e); return; }
    setLoadingForm(true);
    try {
      if (modal.modo === 'crear') {
        await crearMedico({ nombreUsuario: formUsuario, password: formPassword, nombre: formNombre, matricula: formMatricula });
        addToast('Médico creado correctamente.', 'success');
      } else {
        await actualizarMedico(modal.medico._id, { nombre: formNombre, matricula: formMatricula });
        addToast('Médico actualizado.', 'success');
      }
      setModal(null);
      cargar();
    } catch (err) {
      addToast(err.message || 'Error al guardar.', 'error');
    } finally {
      setLoadingForm(false);
    }
  };

  const handleEliminar = async (medico) => {
    if (!confirm(`¿Eliminar al médico ${medico.nombre}? Esta acción no se puede deshacer.`)) return;
    try {
      await eliminarMedico(medico._id);
      addToast('Médico eliminado.', 'success');
      if (medicoActivo?._id === medico._id) setMedicoActivo(null);
      cargar();
    } catch (err) {
      addToast(err.message || 'No se pudo eliminar. El médico puede tener turnos futuros.', 'error');
    }
  };

  // Asignaciones
  const asignar = async (tipo, id) => {
    if (!id || !medicoActivo) return;
    setLoadingAsig(true);
    try {
      if (tipo === 'especialidad') { await agregarEspecialidad(medicoActivo._id, id); setEspSeleccionada(''); }
      if (tipo === 'practica')    { await agregarPractica(medicoActivo._id, id);    setPracSeleccionada(''); }
      if (tipo === 'sede')        { await agregarSede(medicoActivo._id, id);         setSedeSeleccionada(''); }
      addToast(`${tipo.charAt(0).toUpperCase() + tipo.slice(1)} asignada.`, 'success');
      const updated = await getMedicos();
      const lista = Array.isArray(updated) ? updated : (updated?.data ?? []);
      setMedicos(lista);
      setMedicoActivo(lista.find(m => m._id === medicoActivo._id) ?? medicoActivo);
    } catch (err) {
      addToast(err.message || `Error al asignar ${tipo}.`, 'error');
    } finally {
      setLoadingAsig(false);
    }
  };

  const desasignar = async (tipo, entidadId) => {
    if (!medicoActivo) return;
    setLoadingAsig(true);
    try {
      if (tipo === 'especialidad') await quitarEspecialidad(medicoActivo._id, entidadId);
      if (tipo === 'practica')     await quitarPractica(medicoActivo._id, entidadId);
      if (tipo === 'sede')         await quitarSede(medicoActivo._id, entidadId);
      addToast(`${tipo} desasignada.`, 'success');
      const updated = await getMedicos();
      const lista = Array.isArray(updated) ? updated : (updated?.data ?? []);
      setMedicos(lista);
      setMedicoActivo(lista.find(m => m._id === medicoActivo._id) ?? medicoActivo);
    } catch (err) {
      addToast(err.message || `No se pudo desasignar. Puede haber turnos futuros asociados.`, 'error');
    } finally {
      setLoadingAsig(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Médicos</h1>
        <Button onClick={abrirCrear}>+ Nuevo médico</Button>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Tabla de médicos */}
        <div className="lg:col-span-2 space-y-3" aria-label="Lista de médicos">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)
          ) : medicos.length === 0 ? (
            <p className="text-gray-500 text-sm">No hay médicos registrados.</p>
          ) : (
            medicos.map(m => (
              <Card
                key={m._id}
                className={medicoActivo?._id === m._id ? 'ring-2 ring-blue-500' : ''}
              >
                <CardBody>
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1 min-w-0">
                      <p className="font-semibold text-gray-900 truncate">{m.nombre}</p>
                      <p className="text-xs text-gray-500">Mat. {m.matricula}</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {m.especialidades?.slice(0, 3).map(e => (
                          <Badge key={e._id} variant="primary">{e.nombre}</Badge>
                        ))}
                        {m.especialidades?.length > 3 && (
                          <Badge variant="default">+{m.especialidades.length - 3}</Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col gap-1 shrink-0">
                      <Button
                        variant="ghost" size="sm"
                        onClick={() => setMedicoActivo(medicoActivo?._id === m._id ? null : m)}
                        aria-expanded={medicoActivo?._id === m._id}
                        aria-label={`${medicoActivo?._id === m._id ? 'Cerrar' : 'Gestionar'} asignaciones de ${m.nombre}`}
                      >
                        {medicoActivo?._id === m._id ? 'Cerrar' : 'Asignaciones'}
                      </Button>
                      <Button variant="secondary" size="sm" onClick={() => abrirEditar(m)}
                        aria-label={`Editar médico ${m.nombre}`}>
                        Editar
                      </Button>
                      <Button variant="danger" size="sm" onClick={() => handleEliminar(m)}
                        aria-label={`Eliminar médico ${m.nombre}`}>
                        Eliminar
                      </Button>
                    </div>
                  </div>
                </CardBody>
              </Card>
            ))
          )}
        </div>

        {/* Panel de asignaciones */}
        {medicoActivo && (
          <aside aria-label={`Asignaciones de ${medicoActivo.nombre}`}>
            <Card className="sticky top-4">
              <CardHeader>
                <h2 className="text-sm font-semibold text-gray-900">
                  Asignaciones — {medicoActivo.nombre}
                </h2>
              </CardHeader>
              <CardBody className="space-y-6">
                {/* Especialidades */}
                <section aria-label="Especialidades asignadas">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">
                    Especialidades
                  </h3>
                  <div className="flex flex-wrap gap-1 mb-2 min-h-[24px]">
                    {medicoActivo.especialidades?.length === 0 && (
                      <span className="text-xs text-gray-400">Sin especialidades</span>
                    )}
                    {medicoActivo.especialidades?.map(e => (
                      <ChipAsignacion
                        key={e._id} label={e.nombre}
                        onQuitar={() => desasignar('especialidad', e._id)}
                        cargando={loadingAsig}
                      />
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Select
                      id="esp-asignar"
                      value={espSeleccionada}
                      onChange={ev => setEspSeleccionada(ev.target.value)}
                      options={especialidades
                        .filter(e => !medicoActivo.especialidades?.some(a => a._id === e._id))
                        .map(e => ({ value: e._id, label: e.nombre }))}
                      placeholder="Agregar..."
                      className="flex-1"
                      aria-label="Seleccionar especialidad para agregar"
                    />
                    <Button size="sm" onClick={() => asignar('especialidad', espSeleccionada)}
                      disabled={!espSeleccionada || loadingAsig}>
                      +
                    </Button>
                  </div>
                </section>

                {/* Prácticas */}
                <section aria-label="Prácticas asignadas">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">Prácticas</h3>
                  <div className="flex flex-wrap gap-1 mb-2 min-h-[24px]">
                    {medicoActivo.practicas?.length === 0 && (
                      <span className="text-xs text-gray-400">Sin prácticas</span>
                    )}
                    {medicoActivo.practicas?.map(p => (
                      <ChipAsignacion
                        key={p._id} label={p.nombre}
                        onQuitar={() => desasignar('practica', p._id)}
                        cargando={loadingAsig}
                      />
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Select
                      id="prac-asignar"
                      value={pracSeleccionada}
                      onChange={ev => setPracSeleccionada(ev.target.value)}
                      options={practicas
                        .filter(p => !medicoActivo.practicas?.some(a => a._id === p._id))
                        .map(p => ({ value: p._id, label: p.nombre }))}
                      placeholder="Agregar..."
                      className="flex-1"
                      aria-label="Seleccionar práctica para agregar"
                    />
                    <Button size="sm" onClick={() => asignar('practica', pracSeleccionada)}
                      disabled={!pracSeleccionada || loadingAsig}>
                      +
                    </Button>
                  </div>
                </section>

                {/* Sedes */}
                <section aria-label="Sedes asignadas">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">Sedes</h3>
                  <div className="flex flex-wrap gap-1 mb-2 min-h-[24px]">
                    {medicoActivo.sedes?.length === 0 && (
                      <span className="text-xs text-gray-400">Sin sedes</span>
                    )}
                    {medicoActivo.sedes?.map(s => (
                      <ChipAsignacion
                        key={s._id} label={s.nombre}
                        onQuitar={() => desasignar('sede', s._id)}
                        cargando={loadingAsig}
                      />
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Select
                      id="sede-asignar"
                      value={sedeSeleccionada}
                      onChange={ev => setSedeSeleccionada(ev.target.value)}
                      options={sedes
                        .filter(s => !medicoActivo.sedes?.some(a => a._id === s._id))
                        .map(s => ({ value: s._id, label: s.nombre }))}
                      placeholder="Agregar..."
                      className="flex-1"
                      aria-label="Seleccionar sede para agregar"
                    />
                    <Button size="sm" onClick={() => asignar('sede', sedeSeleccionada)}
                      disabled={!sedeSeleccionada || loadingAsig}>
                      +
                    </Button>
                  </div>
                </section>
              </CardBody>
            </Card>
          </aside>
        )}
      </div>

      {/* Modal crear/editar */}
      <Modal
        isOpen={!!modal}
        onClose={() => setModal(null)}
        title={modal?.modo === 'crear' ? 'Nuevo médico' : 'Editar médico'}
        footer={
          <>
            <Button variant="ghost" onClick={() => setModal(null)}>Cancelar</Button>
            <Button loading={loadingForm} onClick={handleGuardar}>
              {modal?.modo === 'crear' ? 'Crear' : 'Guardar'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input id="med-nombre" label="Nombre completo *" value={formNombre}
            onChange={e => { setFormNombre(e.target.value); setErroresForm(p => ({...p, nombre: ''})); }}
            error={erroresForm.nombre} placeholder="Ej: Dra. María García" />
          <Input id="med-matricula" label="Matrícula *" value={formMatricula}
            onChange={e => { setFormMatricula(e.target.value); setErroresForm(p => ({...p, matricula: ''})); }}
            error={erroresForm.matricula} placeholder="Ej: MN12345" />
          {modal?.modo === 'crear' && (
            <>
              <Input id="med-usuario" label="Nombre de usuario *" value={formUsuario}
                onChange={e => { setFormUsuario(e.target.value); setErroresForm(p => ({...p, usuario: ''})); }}
                error={erroresForm.usuario} placeholder="Ej: dr.garcia" />
              <Input id="med-password" label="Contraseña *" type="password" value={formPassword}
                onChange={e => { setFormPassword(e.target.value); setErroresForm(p => ({...p, password: ''})); }}
                error={erroresForm.password} />
            </>
          )}
        </div>
      </Modal>
    </div>
  );
}