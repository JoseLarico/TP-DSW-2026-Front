'use client';
import { useEffect, useState } from 'react';
import { useToast } from '@/context/ToastContext';
import { getObrasSociales, crearObraSocial, actualizarObraSocial, eliminarObraSocial } from '@/services/obraSocial';
import { getEspecialidades, getPracticas } from '@/services/catalogo';
import Card, { CardBody } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import { SkeletonCard } from '@/components/ui/Skeleton';

const NIVELES_COBERTURA = [
  { value: 'total',       label: 'Total (100%)' },
  { value: 'parcial',     label: 'Parcial' },
  { value: 'no_cubierta', label: 'No cubierta' },
];

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

  // Modal editar nombre OS
  const [editNombreOs, setEditNombreOs] = useState(null);
  const [editNombreVal, setEditNombreVal] = useState('');
  const [editNombreErr, setEditNombreErr] = useState('');
  const [loadingEditNombre, setLoadingEditNombre] = useState(false);

  // Modal coberturas + planes
  const [obraActiva, setObraActiva] = useState(null);
  const [planes, setPlanes] = useState([]);
  const [loadingCob, setLoadingCob] = useState(false);
  const [inputNuevoPlan, setInputNuevoPlan] = useState('');

  const cargar = async () => {
    setLoading(true);
    try {
      const [os, esp, prac] = await Promise.all([getObrasSociales(), getEspecialidades(), getPracticas()]);
      setObrasSociales(Array.isArray(os) ? os : (os?.data ?? []));
      setEspecialidades(Array.isArray(esp) ? esp : []);
      setPracticas(Array.isArray(prac) ? prac : []);
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { cargar(); }, []);

  // ── Crear OS ──────────────────────────────────────────────────────────────
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
      addToast(err.message, 'error');
    } finally {
      setLoadingCrear(false);
    }
  };

  // ── Eliminar OS ───────────────────────────────────────────────────────────
  const handleEliminar = async (os) => {
    if (!confirm(`¿Eliminar "${os.nombre}"?`)) return;
    try {
      await eliminarObraSocial(os._id);
      addToast('Obra social eliminada.', 'success');
      if (obraActiva?._id === os._id) setObraActiva(null);
      cargar();
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  // ── Editar nombre OS ──────────────────────────────────────────────────────
  const abrirEditarNombre = (os) => {
    setEditNombreOs(os);
    setEditNombreVal(os.nombre);
    setEditNombreErr('');
  };

  const handleGuardarNombre = async () => {
    if (!editNombreVal.trim()) { setEditNombreErr('El nombre es obligatorio.'); return; }
    setLoadingEditNombre(true);
    try {
      await actualizarObraSocial(editNombreOs._id, { nombre: editNombreVal.trim() });
      addToast('Nombre actualizado.', 'success');
      setEditNombreOs(null);
      cargar();
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setLoadingEditNombre(false);
    }
  };

  // ── Coberturas + gestión de planes ────────────────────────────────────────
  const abrirCoberturas = (os) => {
    setObraActiva(os);
    setPlanes(JSON.parse(JSON.stringify(os.planes ?? [])));
    setInputNuevoPlan('');
  };

  const agregarPlanExistente = () => {
    const nombre = inputNuevoPlan.trim();
    if (!nombre) return;
    if (planes.find(p => p.nombre.toLowerCase() === nombre.toLowerCase())) return;
    setPlanes(prev => [...prev, { nombre, coberturasEspecialidad: [], coberturasPractica: [] }]);
    setInputNuevoPlan('');
  };

  const eliminarPlan = (planIdx) => {
    setPlanes(prev => prev.filter((_, i) => i !== planIdx));
  };

  const renombrarPlan = (planIdx, nombre) => {
    setPlanes(prev => prev.map((p, i) => i === planIdx ? { ...p, nombre } : p));
  };

  const getCob = (plan, tipo, entidadId) => {
    const key = tipo === 'especialidad' ? 'coberturasEspecialidad' : 'coberturasPractica';
    const refKey = tipo === 'especialidad' ? 'especialidad' : 'practica';
    return (plan[key] ?? []).find(c => (c[refKey]?._id ?? c[refKey]) === entidadId) ?? null;
  };

  const getNivelCob = (plan, tipo, entidadId) => getCob(plan, tipo, entidadId)?.nivel ?? '';
  const getPorcentajeCob = (plan, tipo, entidadId) => getCob(plan, tipo, entidadId)?.porcentaje ?? 0;

  const updateCob = (planIdx, tipo, entidadId, patch) => {
    setPlanes(prev => prev.map((p, i) => {
      if (i !== planIdx) return p;
      const key = tipo === 'especialidad' ? 'coberturasEspecialidad' : 'coberturasPractica';
      const refKey = tipo === 'especialidad' ? 'especialidad' : 'practica';
      const coberturas = [...(p[key] ?? [])];
      const idx = coberturas.findIndex(c => (c[refKey]?._id ?? c[refKey]) === entidadId);
      if (idx >= 0) {
        coberturas[idx] = { ...coberturas[idx], ...patch };
      } else {
        coberturas.push({ [refKey]: entidadId, ...patch });
      }
      return { ...p, [key]: coberturas };
    }));
  };

  const setNivelCob = (planIdx, tipo, entidadId, nivel) => {
    const esParcial = nivel.toLowerCase() === 'parcial';
    updateCob(planIdx, tipo, entidadId, {
      nivel,
      porcentaje: esParcial ? (getPorcentajeCob(planes[planIdx], tipo, entidadId) || 0) : 0,
    });
  };

  const setPorcentajeCob = (planIdx, tipo, entidadId, porcentaje) => {
    updateCob(planIdx, tipo, entidadId, { porcentaje: Math.min(100, Math.max(0, porcentaje)) });
  };

  const handleGuardarCoberturas = async () => {
    setLoadingCob(true);
    try {
      await actualizarObraSocial(obraActiva._id, { planes });
      addToast('Planes y coberturas actualizados.', 'success');
      setObraActiva(null);
      cargar();
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setLoadingCob(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────
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
                    <Button variant="secondary" size="sm" onClick={() => abrirEditarNombre(os)}
                      aria-label={`Editar nombre de ${os.nombre}`}>
                      Editar
                    </Button>
                    <Button variant="secondary" size="sm" onClick={() => abrirCoberturas(os)}
                      aria-label={`Editar planes y coberturas de ${os.nombre}`}>
                      Planes
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

      {/* Modal crear OS */}
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
                  focus:outline-none focus:ring-2 focus:ring-coral-dark"
              />
              <Button variant="secondary" size="sm" onClick={handleAgregarPlan} type="button">
                + Agregar
              </Button>
            </div>
            {planesNuevos.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {planesNuevos.map(p => (
                  <span key={p.nombre}
                    className="inline-flex items-center gap-1 rounded-full bg-primary-light px-2.5 py-0.5 text-xs font-medium text-[#C83444]">
                    {p.nombre}
                    <button onClick={() => handleQuitarPlan(p.nombre)}
                      aria-label={`Quitar plan ${p.nombre}`}
                      className="ml-0.5 hover:text-red-600 focus-visible:outline-none">×</button>
                  </span>
                ))}
              </div>
            )}
            {planesNuevos.length === 0 && (
              <p className="mt-1 text-xs text-gray-400">Sin planes — podés agregarlos después desde "Planes".</p>
            )}
          </div>
        </div>
      </Modal>

      {/* Modal editar nombre OS */}
      <Modal
        isOpen={!!editNombreOs}
        onClose={() => setEditNombreOs(null)}
        title="Editar nombre"
        footer={
          <>
            <Button variant="ghost" onClick={() => setEditNombreOs(null)}>Cancelar</Button>
            <Button loading={loadingEditNombre} onClick={handleGuardarNombre}>Guardar</Button>
          </>
        }
      >
        <Input
          id="edit-os-nombre"
          label="Nombre de la obra social"
          value={editNombreVal}
          onChange={e => { setEditNombreVal(e.target.value); setEditNombreErr(''); }}
          error={editNombreErr}
          placeholder="Ej: OSDE"
        />
      </Modal>

      {/* Modal planes + coberturas */}
      <Modal
        isOpen={!!obraActiva}
        onClose={() => setObraActiva(null)}
        title={`Planes y coberturas — ${obraActiva?.nombre}`}
        footer={
          <>
            <Button variant="ghost" onClick={() => setObraActiva(null)}>Cancelar</Button>
            <Button loading={loadingCob} onClick={handleGuardarCoberturas}>Guardar cambios</Button>
          </>
        }
      >
        <div className="space-y-4 max-h-[65vh] overflow-y-auto pr-1">

          {/* Agregar nuevo plan */}
          <div className="flex gap-2">
            <input
              type="text"
              value={inputNuevoPlan}
              onChange={e => setInputNuevoPlan(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); agregarPlanExistente(); } }}
              placeholder="Nombre del nuevo plan…"
              aria-label="Nombre del nuevo plan"
              className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900
                focus:outline-none focus:ring-2 focus:ring-coral-dark"
            />
            <Button variant="secondary" size="sm" onClick={agregarPlanExistente} type="button">
              + Plan
            </Button>
          </div>

          {planes.length === 0 ? (
            <p className="text-sm text-gray-500">Sin planes definidos. Agregá uno arriba.</p>
          ) : (
            planes.map((plan, planIdx) => (
              <fieldset key={planIdx} className="rounded-lg border border-gray-200 p-4">
                {/* Header del plan: nombre editable + botón eliminar */}
                <div className="flex items-center gap-2 mb-3">
                  <input
                    type="text"
                    value={plan.nombre}
                    onChange={e => renombrarPlan(planIdx, e.target.value)}
                    aria-label={`Nombre del plan ${planIdx + 1}`}
                    className="flex-1 rounded-lg border border-gray-300 px-2 py-1 text-sm font-semibold
                      text-gray-800 focus:outline-none focus:ring-2 focus:ring-coral-dark"
                  />
                  <button
                    onClick={() => eliminarPlan(planIdx)}
                    aria-label={`Eliminar plan ${plan.nombre}`}
                    className="text-xs text-red-500 hover:text-red-700 shrink-0 px-2 py-1 rounded
                      hover:bg-red-50 transition-colors"
                  >
                    Eliminar plan
                  </button>
                </div>

                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Especialidades</p>
                <div className="space-y-2 mb-4">
                  {especialidades.map(esp => {
                    const nivel = getNivelCob(plan, 'especialidad', esp._id);
                    const esParcial = nivel.toLowerCase() === 'parcial';
                    return (
                      <div key={esp._id} className="flex items-center justify-between gap-2">
                        <label htmlFor={`cob-esp-${planIdx}-${esp._id}`} className="text-sm text-gray-700 flex-1">
                          {esp.nombre}
                        </label>
                        <div className="flex items-center gap-2">
                          <select
                            id={`cob-esp-${planIdx}-${esp._id}`}
                            value={nivel}
                            onChange={e => setNivelCob(planIdx, 'especialidad', esp._id, e.target.value)}
                            aria-label={`Cobertura de ${esp.nombre} en plan ${plan.nombre}`}
                            className="rounded-lg border border-gray-300 px-2 py-1.5 text-xs text-gray-900
                              focus:outline-none focus:ring-2 focus:ring-coral-dark"
                          >
                            <option value="">— sin definir —</option>
                            {NIVELES_COBERTURA.map(n => (
                              <option key={n.value} value={n.value}>{n.label}</option>
                            ))}
                          </select>
                          {esParcial && (
                            <div className="flex items-center gap-1">
                              <input
                                type="number" min="0" max="100"
                                value={getPorcentajeCob(plan, 'especialidad', esp._id)}
                                onChange={e => setPorcentajeCob(planIdx, 'especialidad', esp._id, Number(e.target.value))}
                                aria-label={`Porcentaje de cobertura de ${esp.nombre}`}
                                className="w-16 rounded-lg border border-gray-300 px-2 py-1.5 text-xs text-center
                                  focus:outline-none focus:ring-2 focus:ring-coral-dark"
                              />
                              <span className="text-xs text-gray-400">%</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Prácticas</p>
                <div className="space-y-2">
                  {practicas.map(prac => {
                    const nivel = getNivelCob(plan, 'practica', prac._id);
                    const esParcial = nivel.toLowerCase() === 'parcial';
                    return (
                      <div key={prac._id} className="flex items-center justify-between gap-2">
                        <label htmlFor={`cob-prac-${planIdx}-${prac._id}`} className="text-sm text-gray-700 flex-1">
                          {prac.nombre}
                        </label>
                        <div className="flex items-center gap-2">
                          <select
                            id={`cob-prac-${planIdx}-${prac._id}`}
                            value={nivel}
                            onChange={e => setNivelCob(planIdx, 'practica', prac._id, e.target.value)}
                            aria-label={`Cobertura de ${prac.nombre} en plan ${plan.nombre}`}
                            className="rounded-lg border border-gray-300 px-2 py-1.5 text-xs text-gray-900
                              focus:outline-none focus:ring-2 focus:ring-coral-dark"
                          >
                            <option value="">— sin definir —</option>
                            {NIVELES_COBERTURA.map(n => (
                              <option key={n.value} value={n.value}>{n.label}</option>
                            ))}
                          </select>
                          {esParcial && (
                            <div className="flex items-center gap-1">
                              <input
                                type="number" min="0" max="100"
                                value={getPorcentajeCob(plan, 'practica', prac._id)}
                                onChange={e => setPorcentajeCob(planIdx, 'practica', prac._id, Number(e.target.value))}
                                aria-label={`Porcentaje de cobertura de ${prac.nombre}`}
                                className="w-16 rounded-lg border border-gray-300 px-2 py-1.5 text-xs text-center
                                  focus:outline-none focus:ring-2 focus:ring-coral-dark"
                              />
                              <span className="text-xs text-gray-400">%</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </fieldset>
            ))
          )}
        </div>
      </Modal>
    </div>
  );
}
