'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { getPacienteById, actualizarPaciente, getObrasSociales } from '@/services/catalogo';
import { getMedicoById } from '@/services/medico';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Card, { CardBody } from '@/components/ui/Card';
import Loader from '@/components/ui/Loader';

function Avatar({ nombre }) {
  const iniciales = (nombre || '?').split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
  return (
    <div className="flex-shrink-0 flex h-16 w-16 items-center justify-center rounded-full
      bg-gradient-to-br from-[#EE6B76] to-[#E0414F] shadow-md shadow-[#E0414F]/20">
      <span className="text-xl font-bold text-white tracking-wide">{iniciales}</span>
    </div>
  );
}

function Campo({ label, value, readOnly }) {
  return (
    <div className={`flex flex-col gap-0.5 py-3 border-b border-gray-100 last:border-0 ${readOnly ? 'opacity-60' : ''}`}>
      <div className="flex items-center gap-1.5">
        <span className="text-xs font-medium uppercase tracking-wide text-gray-400">{label}</span>
        {readOnly && (
          <svg className="h-3 w-3 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        )}
      </div>
      <span className="text-sm font-medium text-gray-900">{value || '—'}</span>
    </div>
  );
}

function TagList({ label, items }) {
  return (
    <div className="flex flex-col gap-1.5 py-3 border-b border-gray-100 last:border-0">
      <span className="text-xs font-medium uppercase tracking-wide text-gray-400">{label}</span>
      {items?.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {items.map(item => (
            <span key={item._id || item}
              className="inline-flex items-center rounded-full bg-primary-light text-[#C83444] px-2.5 py-0.5 text-xs font-medium">
              {item.nombre || item}
            </span>
          ))}
        </div>
      ) : (
        <span className="text-sm text-gray-400">—</span>
      )}
    </div>
  );
}

// ── Perfil médico (solo lectura) ──────────────────────────────────────────────
function PerfilMedico({ paciente }) {
  const { addToast } = useToast();
  const [data, setData] = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    getMedicoById(paciente._id)
      .then(res => setData(res.medico || res))
      .catch(err => addToast(err.message, 'error'))
      .finally(() => setCargando(false));
  }, [paciente._id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (cargando || !data) return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="h-8 w-28 rounded-lg bg-gray-100 animate-pulse mb-6" />
      <div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-6">
        <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-100">
          <div className="h-16 w-16 rounded-full bg-gray-100 animate-pulse shrink-0" />
          <div className="flex flex-col gap-2">
            <div className="h-5 w-36 rounded bg-gray-100 animate-pulse" />
            <div className="h-3.5 w-24 rounded bg-gray-100 animate-pulse" />
          </div>
        </div>
        {[100, 80, 120, 140, 160, 110].map((w, i) => (
          <div key={i} className="py-3 border-b border-gray-100 last:border-0 flex flex-col gap-1.5">
            <div className="h-3 w-20 rounded bg-gray-100 animate-pulse" />
            <div className="h-4 rounded bg-gray-100 animate-pulse" style={{ width: w }} />
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8" style={{ animation: 'ticketIn 0.4s cubic-bezier(.21,1.1,.4,1) both' }}>
      <style>{`@keyframes ticketIn { from { opacity:0; transform:translateY(16px) scale(.98); } to { opacity:1; transform:translateY(0) scale(1); } }`}</style>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Mi perfil</h1>
      <Card>
        <CardBody>
          <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-100">
            <Avatar nombre={data.nombre} />
            <div>
              <p className="text-lg font-bold text-gray-900">{data.nombre || '—'}</p>
              <p className="text-sm text-gray-400">@{data.usuario?.nombreUsuario}</p>
            </div>
          </div>
          <Campo label="Nombre"          value={data.nombre}                                                readOnly />
          <Campo label="Matrícula"       value={data.matricula}                                             readOnly />
          <Campo label="Usuario"         value={data.usuario?.nombreUsuario}                                readOnly />
          <Campo label="Especialidades"  value={data.especialidades?.map(e => e.nombre).join(', ')}        readOnly />
          <Campo label="Prácticas"       value={data.practicas?.map(p => p.nombre).join(', ')}             readOnly />
          <Campo label="Sedes"           value={data.sedes?.map(s => s.nombre).join(', ')}                 readOnly />
        </CardBody>
      </Card>
    </div>
  );
}

// ── Perfil paciente ───────────────────────────────────────────────────────────
export default function PerfilPage() {
  const { paciente, usuario, updateUsuario, loading: authLoading } = useAuth();
  const { addToast } = useToast();
  const router = useRouter();
  const [data, setData] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [editando, setEditando] = useState(false);
  const [saving, setSaving] = useState(false);
  const [obrasSociales, setObrasSociales] = useState([]);
  const [planes, setPlanes] = useState([]);
  const [form, setForm] = useState({ nombre: '', obraSocialId: '', planId: '' });

  useEffect(() => {
    if (!authLoading && !paciente) router.push('/login');
  }, [paciente, authLoading]);

  useEffect(() => {
    if (authLoading || !paciente?._id || usuario?.rol === 'medico') return;
    setCargando(true);
    Promise.all([getPacienteById(paciente._id), getObrasSociales()])
      .then(([pd, osd]) => {
        const p = pd.paciente || pd;
        setData(p);
        setObrasSociales(osd.obrasSociales || osd || []);
        setForm({ nombre: p.nombre || '', obraSocialId: p.obraSocial?._id || '', planId: p.plan?._id || '' });
      })
      .catch(err => addToast(err.message, 'error'))
      .finally(() => setCargando(false));
  }, [paciente?._id, authLoading]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const os = obrasSociales.find(o => o._id === form.obraSocialId);
    setPlanes(os?.planes || []);
  }, [form.obraSocialId, obrasSociales]);

  const handleChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleGuardar = async () => {
    setSaving(true);
    try {
      const res = await actualizarPaciente(paciente._id, form);
      const updated = res.paciente || res;
      setData(updated);
      updateUsuario({ ...paciente, ...updated });
      setEditando(false);
      addToast('Perfil actualizado', 'success');
    } catch (err) {
      addToast(err.message, 'error');
    } finally { setSaving(false); }
  };

  if (authLoading) return <div className="flex justify-center items-center min-h-[50vh]"><Loader size="lg" /></div>;

  if (usuario?.rol === 'medico') return <PerfilMedico paciente={paciente} />;

  if (cargando || !data) return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="h-8 w-28 rounded-lg bg-gray-100 animate-pulse mb-6" />
      <div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-6">
        <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-100">
          <div className="h-16 w-16 rounded-full bg-gray-100 animate-pulse shrink-0" />
          <div className="flex flex-col gap-2">
            <div className="h-5 w-36 rounded bg-gray-100 animate-pulse" />
            <div className="h-3.5 w-24 rounded bg-gray-100 animate-pulse" />
          </div>
        </div>
        {[100, 80, 120, 90, 110].map((w, i) => (
          <div key={i} className="py-3 border-b border-gray-100 last:border-0 flex flex-col gap-1.5">
            <div className="h-3 w-20 rounded bg-gray-100 animate-pulse" />
            <div className="h-4 rounded bg-gray-100 animate-pulse" style={{ width: w }} />
          </div>
        ))}
      </div>
    </div>
  );

  const osOptions = obrasSociales.map(o => ({ value: o._id, label: o.nombre }));
  const planOptions = planes.map(p => ({ value: p._id, label: p.nombre }));

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8" style={{ animation: 'ticketIn 0.4s cubic-bezier(.21,1.1,.4,1) both' }}>
      <style>{`@keyframes ticketIn { from { opacity:0; transform:translateY(16px) scale(.98); } to { opacity:1; transform:translateY(0) scale(1); } }`}</style>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Mi perfil</h1>
      <Card>
        <CardBody>
          <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-100">
            <Avatar nombre={data.nombre} />
            <div>
              <p className="text-lg font-bold text-gray-900">{data.nombre || '—'}</p>
              <p className="text-sm text-gray-400">@{data.usuario?.nombreUsuario}</p>
            </div>
          </div>

          {editando ? (
            <div className="flex flex-col gap-4">
              <Input id="nombre" name="nombre" label="Nombre"
                value={form.nombre} onChange={handleChange} />
              <Select id="obraSocialId" name="obraSocialId" label="Obra Social"
                options={osOptions} value={form.obraSocialId} onChange={handleChange}
                placeholder="Sin obra social" />
              {planOptions.length > 0 && (
                <Select id="planId" name="planId" label="Plan"
                  options={planOptions} value={form.planId} onChange={handleChange}
                  placeholder="Sin plan" />
              )}
              <div className="flex justify-end gap-2 mt-2">
                <Button variant="ghost" onClick={() => setEditando(false)} disabled={saving}>Cancelar</Button>
                <Button onClick={handleGuardar} loading={saving}>Guardar cambios</Button>
              </div>
            </div>
          ) : (
            <div>
              <Campo label="Nombre"      value={data.nombre} />
              <Campo label="DNI"         value={data.dni}                    readOnly />
              <Campo label="Usuario"     value={data.usuario?.nombreUsuario} readOnly />
              <Campo label="Obra Social" value={data.obraSocial?.nombre} />
              <Campo label="Plan"        value={data.plan?.nombre} />
              <div className="pt-4 flex justify-end">
                <Button variant="secondary" size="sm" onClick={() => setEditando(true)}>Editar</Button>
              </div>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
