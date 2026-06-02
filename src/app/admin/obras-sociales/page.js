// TODO P5: ABM obras sociales (CRUD + planes + coberturas)
'use client';
import { useEffect, useState } from 'react';
import { useToast } from '@/context/ToastContext';
import { getObrasSociales, crearObraSocial, actualizarObraSocial, eliminarObraSocial } from '@/services/obraSocial';
import { getEspecialidades, getPracticas } from '@/services/catalogo';
import Card, { CardBody, CardHeader } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Modal from '@/components/ui/Modal';
import Badge from '@/components/ui/Badge';
import { SkeletonCard } from '@/components/ui/Skeleton';

const NIVELES_COBERTURA = [
  { value: 'TOTAL',       label: 'Total (100%)' },
  { value: 'PARCIAL',     label: 'Parcial' },
  { value: 'NO_CUBIERTA', label: 'No cubierta' },
];

const NIVEL_BADGE = { TOTAL: 'success', PARCIAL: 'warning', NO_CUBIERTA: 'danger' };

export default function AdminObrasSocialesPage() {
  const { addToast } = useToast();
  const [obrasSociales, setObrasSociales] = useState([]);
  const [especialidades, setEspecialidades] = useState([]);
  const [practicas, setPracticas] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal crear
  const [modalCrear, setModalCrear] = useState(false);
  const [formNombre, setFormNombre] = useState('');
  const [errNombre, setErrNombre] = useState('');
  const [loadingCrear, setLoadingCrear] = useState(false);
  const [planesNuevos, setPlanesNuevos] = useState([]);
  const [inputPlan, setInputPlan] = useState('');

  // Modal coberturas
  const [obraActiva, setObraActiva] = useState(null);
  const [planes, setPlanes] = useState([]);
  const [loadingCob, setLoadingCob] = useState(false);

  const cargar = async () => {
    setLoading(true);
    try {
      const [os, esp, prac] = await Promise.all([getObrasSociales(), getEspecialidades(), getPracticas()]);
      setObrasSociales(Array.isArray(os) ? os : (os?.data ?? []));
      setEspecialidades(Array.isArray(esp) ? esp : []);
      setPracticas(Array.isArray(prac) ? prac : []);
    } catch {
      addToast('Error al cargar.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { cargar(); }, []);

  //para agregar/quitar un plan a la obra social
  const handleAgregarPlan = () => {
    const nombre = inputPlan.trim();
    if (!nombre) return;
    if (planesNuevos.find(p => p.nombre.toLowerCase() === nombre.toLowerCase())) return;
    setPlanesNuevos(prev => [...prev, { nombre }]);
    setInputPlan('');
  };
 
  const handleQuitarPlan = (nombre) => {
    setPlanesNuevos(prev => prev.filter(p => p.nombre !== nombre));
  };

  const handleCrear = async () => {
    if (!formNombre.trim()) { setErrNombre('El nombre es obligatorio.'); return; }
    setLoadingCrear(true);
    try {
      await crearObraSocial({ nombre: formNombre, planes: planesNuevos });
      addToast('Obra social creada.', 'success');
      setModalCrear(false);
      setFormNombre('');
      setPlanesNuevos([]);
      setInputPlan('');
      cargar();
    } catch (err) {
      addToast(err.message || 'Error al crear.', 'error');
    } finally {
      setLoadingCrear(false);
    }
  };

  const handleEliminar = async (os) => {
    if (!confirm(`¿Eliminar "${os.nombre}"?`)) return;
    try {
      await eliminarObraSocial(os._id);
      addToast('Obra social eliminada.', 'success');
      if (obraActiva?._id === os._id) setObraActiva(null);
      cargar();
    } catch (err) {
      addToast(err.message || 'No se pudo eliminar. Puede tener pacientes asociados.', 'error');
    }
  };

  const abrirCoberturas = (os) => {
    setObraActiva(os);
    setPlanes(JSON.parse(JSON.stringify(os.planes ?? [])));
  };

  const setNivelCob = (planIdx, tipo, entidadId, nivel) => {
    setPlanes(prev => {
      const nuevos = prev.map((p, i) => {
        if (i !== planIdx) return p;
        const key = tipo === 'especialidad' ? 'coberturasEspecialidad' : 'coberturasPractica';
        const refKey = tipo === 'especialidad' ? 'especialidad' : 'practica';
        const coberturas = [...(p[key] ?? [])];
        const idx = coberturas.findIndex(c => (c[refKey]?._id ?? c[refKey]) === entidadId);
        if (idx >= 0) {
          coberturas[idx] = { ...coberturas[idx], nivel };
        } else {
          coberturas.push({ [refKey]: entidadId, nivel });
        }
        return { ...p, [key]: coberturas };
      });
      return nuevos;
    });
  };

  const getNivelCob = (plan, tipo, entidadId) => {
    const key = tipo === 'especialidad' ? 'coberturasEspecialidad' : 'coberturasPractica';
    const refKey = tipo === 'especialidad' ? 'especialidad' : 'practica';
    const cob = (plan[key] ?? []).find(c => (c[refKey]?._id ?? c[refKey]) === entidadId);
    return cob?.nivel ?? '';
  };

  const handleGuardarCoberturas = async () => {
    setLoadingCob(true);
    try {
      await actualizarObraSocial(obraActiva._id, { planes });
      addToast('Coberturas actualizadas.', 'success');
      setObraActiva(null);
      cargar();
    } catch (err) {
      addToast(err.message || 'Error al guardar coberturas.', 'error');
    } finally {
      setLoadingCob(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Obras Sociales</h1>
        <Button onClick={() => { setFormNombre(''); setErrNombre(''); setPlanesNuevos([]); setInputPlan(''); setModalCrear(true); }}>
          + Nueva obra social
        </Button>
      </div>

      <div className="mt-6 space-y-3">
        {loading ? (
          Array.from({ length: 2 }).map((_, i) => <SkeletonCard key={i} />)
        ) : obrasSociales.length === 0 ? (
          <p className="text-gray-500 text-sm">No hay obras sociales registradas.</p>
        ) : (
          obrasSociales.map(os => (
            <Card key={os._id}>
              <CardBody>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-gray-900">{os.nombre}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {os.planes?.length ?? 0} plan{os.planes?.length !== 1 ? 'es' : ''}
                    </p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button variant="secondary" size="sm" onClick={() => abrirCoberturas(os)}
                      aria-label={`Editar coberturas de ${os.nombre}`}>
                      Coberturas
                    </Button>
                    <Button variant="danger" size="sm" onClick={() => handleEliminar(os)}
                      aria-label={`Eliminar ${os.nombre}`}>
                      Eliminar
                    </Button>
                  </div>
                </div>
              </CardBody>
            </Card>
          ))
        )}
      </div>

      {/* Modal crear */}
      <Modal
        isOpen={modalCrear}
        onClose={() => { setModalCrear(false); setPlanesNuevos([]); setInputPlan(''); }}
        title="Nueva obra social"
        footer={
          <>
            <Button variant="ghost" onClick={() => setModalCrear(false)}>Cancelar</Button>
            <Button loading={loadingCrear} onClick={handleCrear}>Crear</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input id="os-nombre" label="Nombre de la obra social *"
            value={formNombre}
            onChange={e => { setFormNombre(e.target.value); setErrNombre(''); }}
            error={errNombre}
            placeholder="Ej: OSDE" />
 
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Planes</p>
            <div className="flex gap-2">
              <input
                type="text"
                value={inputPlan}
                onChange={e => setInputPlan(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAgregarPlan(); } }}
                placeholder="Ej: Plan 210"
                aria-label="Nombre del plan"
                className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900
                  focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <Button variant="secondary" size="sm" onClick={handleAgregarPlan} type="button">
                + Agregar
              </Button>
            </div>
 
            {planesNuevos.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {planesNuevos.map(p => (
                  <span
                    key={p.nombre}
                    className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700"
                  >
                    {p.nombre}
                    <button
                      onClick={() => handleQuitarPlan(p.nombre)}
                      aria-label={`Quitar plan ${p.nombre}`}
                      className="ml-0.5 hover:text-red-600 focus-visible:outline-none"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
            {planesNuevos.length === 0 && (
              <p className="mt-1 text-xs text-gray-400">Sin planes — podés agregarlos ahora o después desde "Coberturas".</p>
            )}
          </div>
        </div>
      </Modal>

      {/* Modal coberturas */}
      <Modal
        isOpen={!!obraActiva}
        onClose={() => setObraActiva(null)}
        title={`Coberturas — ${obraActiva?.nombre}`}
        footer={
          <>
            <Button variant="ghost" onClick={() => setObraActiva(null)}>Cancelar</Button>
            <Button loading={loadingCob} onClick={handleGuardarCoberturas}>Guardar coberturas</Button>
          </>
        }
      >
        {planes.length === 0 ? (
          <p className="text-sm text-gray-500">Esta obra social no tiene planes definidos.</p>
        ) : (
          <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-1">
            {planes.map((plan, planIdx) => (
              <fieldset key={planIdx} className="rounded-lg border border-gray-200 p-4">
                <legend className="px-2 text-sm font-semibold text-gray-800">{plan.nombre}</legend>
 
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Especialidades</p>
                <div className="space-y-2 mb-4">
                  {especialidades.map(esp => (
                    <div key={esp._id} className="flex items-center justify-between gap-2">
                      <label
                        htmlFor={`cob-esp-${planIdx}-${esp._id}`}
                        className="text-sm text-gray-700 flex-1"
                      >
                        {esp.nombre}
                      </label>
                      <select
                        id={`cob-esp-${planIdx}-${esp._id}`}
                        value={getNivelCob(plan, 'especialidad', esp._id)}
                        onChange={e => setNivelCob(planIdx, 'especialidad', esp._id, e.target.value)}
                        aria-label={`Cobertura de ${esp.nombre} en plan ${plan.nombre}`}
                        className="rounded-lg border border-gray-300 px-2 py-1.5 text-xs text-gray-900
                          focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">— sin definir —</option>
                        {NIVELES_COBERTURA.map(n => (
                          <option key={n.value} value={n.value}>{n.label}</option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
 
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Prácticas</p>
                <div className="space-y-2">
                  {practicas.map(prac => (
                    <div key={prac._id} className="flex items-center justify-between gap-2">
                      <label
                        htmlFor={`cob-prac-${planIdx}-${prac._id}`}
                        className="text-sm text-gray-700 flex-1"
                      >
                        {prac.nombre}
                      </label>
                      <select
                        id={`cob-prac-${planIdx}-${prac._id}`}
                        value={getNivelCob(plan, 'practica', prac._id)}
                        onChange={e => setNivelCob(planIdx, 'practica', prac._id, e.target.value)}
                        aria-label={`Cobertura de ${prac.nombre} en plan ${plan.nombre}`}
                        className="rounded-lg border border-gray-300 px-2 py-1.5 text-xs text-gray-900
                          focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">— sin definir —</option>
                        {NIVELES_COBERTURA.map(n => (
                          <option key={n.value} value={n.value}>{n.label}</option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              </fieldset>
            ))}
          </div>
        )}
      </Modal>
    </div>
  );
}