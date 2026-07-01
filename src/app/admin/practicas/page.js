'use client';
import AbmGenerico from '@/components/abm/AbmGenerico';
import api from '@/services/api';

const practicasApi = {
  obtenerTodos: () => api.get('/practicas').then(r => r.data),
  crear: (data) => api.post('/practicas', data).then(r => r.data),
  actualizar: (id, data) => api.patch(`/practicas/${id}`, data).then(r => r.data),
  eliminar: (id) => api.delete(`/practicas/${id}`).then(r => r.data),
};

export default function AdminPracticasPage() {
  return (
    <AbmGenerico
      titulo="Prácticas" singular="Práctica"
      api={practicasApi}
      campos={[
        { name: 'codigo', label: 'Código', placeholder: 'Ej: ECO-001' },
        { name: 'nombre', label: 'Nombre', placeholder: 'Ej: Ecografía abdominal' },
        { name: 'duracionTurnoEnMins', label: 'Duración (min)', type: 'number', placeholder: '45', min: 1 },
        { name: 'costo', label: 'Costo ($)', type: 'number', placeholder: '8000', min: 0, step: '0.01' },
      ]}
      columnas={[
        { key: 'codigo', label: 'Código' },
        { key: 'nombre', label: 'Nombre' },
        { key: 'duracionTurnoEnMins', label: 'Duración', render: i => `${i.duracionTurnoEnMins} min` },
        { key: 'costo', label: 'Costo', render: i => `$${i.costo?.toLocaleString('es-AR')}` },
      ]}
    />
  );
}
