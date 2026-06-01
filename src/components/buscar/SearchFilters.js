"use client";
import React from 'react';

export default function SearchFilters({ options, values, onChange, onSubmit, loading }) {
  const { especialidades, practicas, medicos, sedes } = options;

  return (
    <div className="filters-bar rounded-lg">
      <form onSubmit={(e) => { e.preventDefault(); onSubmit(); }} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <select name="especialidad" className="input" value={values.especialidad || ''} onChange={e => onChange('especialidad', e.target.value)}>
            <option value="">Todas las especialidades</option>
            {especialidades?.map(s => <option key={s._id || s.id} value={s._id || s.id}>{s.nombre}</option>)}
          </select>

          <select name="practica" className="input" value={values.practica || ''} onChange={e => onChange('practica', e.target.value)}>
            <option value="">Todas las prácticas</option>
            {practicas?.map(p => <option key={p._id || p.id} value={p._id || p.id}>{p.nombre}</option>)}
          </select>

          <select name="medico" className="input" value={values.medico || ''} onChange={e => onChange('medico', e.target.value)}>
            <option value="">Todos los médicos</option>
            {medicos?.map(m => <option key={m._id || m.id} value={m._id || m.id}>{(m.apellido ? `${m.apellido} ` : '') + (m.nombre || m.nombreCompleto || '')}</option>)}
          </select>

          <select name="sede" className="input" value={values.sede || ''} onChange={e => onChange('sede', e.target.value)}>
            <option value="">Todas las sedes</option>
            {sedes?.map(s => <option key={s._id || s.id} value={s._id || s.id}>{s.nombre}</option>)}
          </select>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex gap-2 items-center">
            <input name="fechaDesde" type="date" className="input date-input" value={values.fechaDesde || ''} onChange={e => onChange('fechaDesde', e.target.value)} />
            <input name="fechaHasta" type="date" className="input date-input" value={values.fechaHasta || ''} onChange={e => onChange('fechaHasta', e.target.value)} />
          </div>

          <div className="ml-auto">
            <button className="btn btn-primary search-button" type="submit" disabled={loading}>
              {loading ? 'Buscando...' : 'Buscar'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
