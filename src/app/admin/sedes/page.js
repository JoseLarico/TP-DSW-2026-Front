'use client';
import AbmGenerico from '@/components/abm/AbmGenerico';
import api from '@/services/api';

const sedesApi = {
  obtenerTodos: () => api.get('/sedes').then(r => r.data),
  crear: (data) => api.post('/sedes', data).then(r => r.data),
  actualizar: (id, data) => api.patch(`/sedes/${id}`, data).then(r => r.data),
  eliminar: (id) => api.delete(`/sedes/${id}`).then(r => r.data),
};

export default function AdminSedesPage() {
  return (
    <AbmGenerico
      titulo="Sedes" singular="Sede"
      api={sedesApi}
      campos={[
        { name: 'nombre', label: 'Nombre de la sede', placeholder: 'Ej: Sede Centro' },
        { name: 'direccion', label: 'Dirección', placeholder: 'Ej: Av. Corrientes 1234, CABA' },
      ]}
      columnas={[
        { key: 'nombre', label: 'Nombre' },
        { key: 'direccion', label: 'Dirección' },
      ]}
    />
  );
}
