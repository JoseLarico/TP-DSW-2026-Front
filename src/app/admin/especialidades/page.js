'use client';
import AbmGenerico from '@/components/abm/AbmGenerico';
import api from '@/services/api';

const especialidadesApi = {
  obtenerTodos: () => api.get('/especialidades').then(r => r.data),
  crear: (data) => api.post('/especialidades', data).then(r => r.data),
  actualizar: (id, data) => api.patch(`/especialidades/${id}`, data).then(r => r.data),
  eliminar: (id) => api.delete(`/especialidades/${id}`).then(r => r.data),
};

export default function AdminEspecialidadesPage() {
  return (
    <AbmGenerico
      titulo="Especialidades" singular="Especialidad"
      api={especialidadesApi}
      campos={[
        { name: 'nombre', label: 'Nombre', placeholder: 'Ej: Cardiología' },
        { name: 'duracionTurnoEnMins', label: 'Duración del turno (min)', type: 'number', placeholder: '30', min: 1 },
        { name: 'costoConsulta', label: 'Costo de consulta ($)', type: 'number', placeholder: '5000', min: 0, step: '0.01' },
      ]}
      columnas={[
        { key: 'nombre', label: 'Nombre' },
        { key: 'duracionTurnoEnMins', label: 'Duración', render: i => `${i.duracionTurnoEnMins} min` },
        { key: 'costoConsulta', label: 'Costo', render: i => `$${i.costoConsulta?.toLocaleString('es-AR')}` },
      ]}
    />
  );
}
