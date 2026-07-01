'use client';
import { useState, useEffect } from 'react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import Card from '@/components/ui/Card';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { useToast } from '@/context/ToastContext';

export default function AbmGenerico({ titulo, singular, api, campos, columnas }) {
  const { addToast } = useToast();
  const [items, setItems] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState(null);
  const [modalForm, setModalForm] = useState(false);
  const [modalEliminar, setModalEliminar] = useState(null);
  const [editando, setEditando] = useState(null);
  const [saving, setSaving] = useState(false);
  const [eliminando, setEliminando] = useState(false);
  const [form, setForm] = useState({});

  const camposVacios = campos.reduce((acc, c) => ({ ...acc, [c.name]: '' }), {});

  const fetchItems = async () => {
    setCargando(true);
    setErrorCarga(null);
    try {
      const data = await api.obtenerTodos();
      const arr = Array.isArray(data) ? data : Object.values(data).find(Array.isArray) || [];
      setItems(arr);
    } catch (err) {
      setErrorCarga(err.message || 'No se pudieron cargar los datos');
      setItems([]);
    }
    finally { setCargando(false); }
  };

  useEffect(() => { fetchItems(); }, []);

  const abrirCrear = () => { setEditando(null); setForm(camposVacios); setModalForm(true); };
  const abrirEditar = (item) => {
    setEditando(item);
    setForm(campos.reduce((acc, c) => ({ ...acc, [c.name]: item[c.name] ?? '' }), {}));
    setModalForm(true);
  };

  const handleChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleGuardar = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = campos.reduce((acc, c) => ({
        ...acc, [c.name]: c.type === 'number' ? Number(form[c.name]) : form[c.name],
      }), {});
      if (editando) { await api.actualizar(editando._id, payload); addToast(`${singular} actualizada`, 'success'); }
      else { await api.crear(payload); addToast(`${singular} creada`, 'success'); }
      setModalForm(false);
      fetchItems();
    } catch (err) { addToast(err.message, 'error'); }
    finally { setSaving(false); }
  };

  const handleEliminar = async () => {
    setEliminando(true);
    try {
      await api.eliminar(modalEliminar._id);
      addToast(`${singular} eliminada`, 'success');
      setModalEliminar(null);
      fetchItems();
    } catch (err) { addToast(err.message, 'error'); }
    finally { setEliminando(false); }
  };

  return (
    <>
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">{titulo}</h1>
          <Button onClick={abrirCrear}>+ Nuevo</Button>
        </div>

        {errorCarga && !cargando && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {errorCarga}. Verificá tu conexión e intentá de nuevo.
          </div>
        )}
        <Card>
          {cargando ? (
            <div className="flex flex-col gap-3 py-2">{Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)}</div>
          ) : items.length === 0 ? (
            <div className="py-12 text-center text-gray-500">
              <p className="text-4xl mb-3">📋</p>
              <p className="font-medium">Sin {titulo.toLowerCase()}</p>
              <Button className="mt-4" variant="secondary" onClick={abrirCrear}>
                Agregar primera
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    {columnas.map(col => (
                      <th key={col.key} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                        {col.label}
                      </th>
                    ))}
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {items.map(item => (
                    <tr key={item._id} className="hover:bg-gray-50 transition-colors">
                      {columnas.map(col => (
                        <td key={col.key} className="px-4 py-3 text-gray-900">
                          {col.render ? col.render(item) : (item[col.key] ?? '—')}
                        </td>
                      ))}
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          <Button size="sm" variant="ghost" onClick={() => abrirEditar(item)}
                            aria-label={`Editar ${item.nombre || ''}`}>
                            Editar
                          </Button>
                          <Button size="sm" variant="danger" onClick={() => setModalEliminar(item)}
                            aria-label={`Eliminar ${item.nombre || ''}`}>
                            Eliminar
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>

      {/* Modal crear/editar */}
      <Modal isOpen={modalForm} onClose={() => setModalForm(false)}
        title={editando ? `Editar ${singular}` : `Nueva ${singular}`}
        footer={
          <>
            <Button variant="ghost" type="button" onClick={() => setModalForm(false)} disabled={saving}>Cancelar</Button>
            <Button type="submit" form="abm-form" loading={saving}>
              {editando ? 'Guardar cambios' : 'Crear'}
            </Button>
          </>
        }>
        <form id="abm-form" onSubmit={handleGuardar} className="flex flex-col gap-4">
          {campos.map(campo => (
            <Input key={campo.name} id={`abm-${campo.name}`} name={campo.name}
              type={campo.type || 'text'} label={campo.label}
              placeholder={campo.placeholder || ''} value={form[campo.name] ?? ''}
              onChange={handleChange} required={campo.required !== false}
              min={campo.min} step={campo.step} />
          ))}
        </form>
      </Modal>

      {/* Modal eliminar */}
      <Modal isOpen={!!modalEliminar} onClose={() => setModalEliminar(null)}
        title="Confirmar eliminación"
        footer={
          <>
            <Button variant="ghost" onClick={() => setModalEliminar(null)} disabled={eliminando}>Cancelar</Button>
            <Button variant="danger" onClick={handleEliminar} loading={eliminando}>Eliminar</Button>
          </>
        }>
        <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
          ¿Seguro que querés eliminar <strong>{modalEliminar?.nombre}</strong>? Esta acción no se puede deshacer.
        </div>
      </Modal>
    </>
  );
}
