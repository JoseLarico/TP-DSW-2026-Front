"use client";
import React, { useState, useEffect } from 'react';
import Select from '@/components/ui/Select';
import DateRangePicker from '@/components/ui/DateRangePicker';

function StepBadge({ n }) {
  return (
    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-coral-dark text-xs font-bold text-white">
      {n}
    </span>
  );
}

function Reveal({ visible, delay = 0, children }) {
  const [overflow, setOverflow] = useState('hidden');

  useEffect(() => {
    if (visible) {
      const t = setTimeout(() => setOverflow('visible'), 420 + delay);
      return () => clearTimeout(t);
    } else {
      setOverflow('hidden');
    }
  }, [visible, delay]);

  return (
    <div
      style={{
        maxHeight: visible ? '500px' : '0px',
        overflow,
        opacity: visible ? 1 : 0,
        transitionProperty: 'max-height, opacity',
        transitionDuration: '420ms, 300ms',
        transitionTimingFunction: 'cubic-bezier(0.4,0,0.2,1), ease',
        transitionDelay: visible ? `${delay}ms` : '0ms',
        pointerEvents: visible ? 'auto' : 'none',
      }}
    >
      <div className="pt-5">{children}</div>
    </div>
  );
}

function DateSelects({ label, dia, mes, anio, onDia, onMes, onAnio }) {
  return (
    <div>
      <p className="text-xs font-medium text-gray-400 mb-1.5">{label}</p>
      <div className="grid grid-cols-3 gap-2">
        <Select
          value={dia}
          onValueChange={onDia}
          placeholder="Día"
          options={Array.from({ length: diasEnMes(mes, anio) }, (_, i) => ({
            value: String(i + 1).padStart(2, '0'),
            label: String(i + 1),
          }))}
        />
        <Select
          value={mes}
          onValueChange={onMes}
          placeholder="Mes"
          options={MESES}
        />
        <Select
          value={anio}
          onValueChange={onAnio}
          placeholder="Año"
          options={ANIOS}
        />
      </div>
    </div>
  );
}

export default function SearchFilters({ options, values, onChange, onSubmit, loading }) {
  const { especialidades = [], practicas = [], sedes = [], medicos = [] } = options;
  const [tipo, setTipo] = useState('');
  const [avanzados, setAvanzados] = useState(false);

  const itemVal = tipo === 'especialidad' ? values.especialidad : tipo === 'practica' ? values.practica : '';
  const showStep2 = !!tipo;
  const showStep3 = showStep2 && !!itemVal;
  const showStep4 = showStep3 && !!values.sede;

  const medicosFiltrados = medicos.filter(m => {
    if (values.especialidad) {
      const tieneEsp = m.especialidades?.some(e => (e._id || e) === values.especialidad);
      if (!tieneEsp) return false;
    }
    if (values.practica) {
      const tienePrac = m.practicas?.some(p => (p._id || p) === values.practica);
      if (!tienePrac) return false;
    }
    if (values.sede) {
      const tieneSede = m.sedes?.some(s => (s._id || s) === values.sede);
      if (!tieneSede) return false;
    }
    return true;
  });

  const changeTipo = (t) => {
    setTipo(t);
    onChange('especialidad', '');
    onChange('practica', '');
    onChange('sede', '');
    onChange('fechaDesde', '');
    onChange('fechaHasta', '');
    onChange('medico', '');
  };


  return (
    <div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-6">
      <form onSubmit={e => { e.preventDefault(); onSubmit(); }}>

        {/* Paso 1: tipo */}
        <div>
          <div className="flex items-center gap-2.5 mb-3">
            <StepBadge n="1" />
            <span className="text-sm font-semibold text-gray-700">Seleccionar turno para:</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[{ v: 'especialidad', l: 'Especialidad' }, { v: 'practica', l: 'Práctica' }].map(({ v, l }) => (
              <button
                key={v}
                type="button"
                onClick={() => changeTipo(v)}
                className={[
                  'rounded-xl border-2 px-4 py-3 text-sm font-semibold transition-all',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral-dark',
                  tipo === v
                    ? 'border-coral-dark bg-coral-dark text-white shadow-sm'
                    : 'border-gray-200 text-gray-600 hover:border-coral-dark hover:text-coral-dark',
                ].join(' ')}
              >
                {l}
              </button>
            ))}
          </div>
        </div>

        {/* Paso 2: especialidad o práctica */}
        <Reveal visible={showStep2}>
          <div className="flex items-center gap-2.5 mb-3">
            <StepBadge n="2" />
            <span className="text-sm font-semibold text-gray-700">
              {tipo === 'practica' ? 'Ingresá la práctica' : 'Ingresá la especialidad'}
            </span>
          </div>
          <Select
            value={itemVal}
            onValueChange={val => { onChange(tipo, val); onChange('medico', ''); }}
            placeholder="Seleccioná una opción…"
            options={(tipo === 'especialidad' ? especialidades : practicas).map(item => ({
              value: item._id || item.id,
              label: item.nombre,
            }))}
          />
        </Reveal>

        {/* Paso 3: sede */}
        <Reveal visible={showStep3} delay={0}>
          <div className="flex items-center gap-2.5 mb-3">
            <StepBadge n="3" />
            <span className="text-sm font-semibold text-gray-700">Lugar de atención</span>
          </div>
          <Select
            value={values.sede}
            onValueChange={val => { onChange('sede', val); onChange('medico', ''); }}
            placeholder="Seleccioná una sede…"
            options={sedes.map(s => ({ value: s._id || s.id, label: s.nombre }))}
          />
        </Reveal>

        {/* Paso 4: Filtros avanzados (toggle) */}
        <Reveal visible={showStep4} delay={0}>
          <div className="flex items-center gap-2.5 mb-3">
            <StepBadge n="4" />
            <span className="text-sm font-semibold text-gray-700">Filtros avanzados</span>
            <button
              type="button"
              role="switch"
              aria-checked={avanzados}
              onClick={() => setAvanzados(v => !v)}
              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral-dark focus-visible:ring-offset-2 ${avanzados ? 'bg-coral-dark' : 'bg-gray-200'}`}
            >
              <span className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow transition-transform duration-200 ${avanzados ? 'translate-x-4' : 'translate-x-0'}`} />
            </button>
          </div>

          <Reveal visible={avanzados} delay={0}>
            <div className="rounded-xl bg-gray-50 border border-gray-100 p-4 space-y-4">
              {medicosFiltrados.length === 0 ? (
                <div className="flex flex-col gap-1">
                  <span className="text-sm font-medium text-gray-700">Médico</span>
                  <p className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-400">
                    No hay médicos disponibles para los filtros seleccionados
                  </p>
                </div>
              ) : (
                <Select
                  id="medico"
                  label="Médico"
                  value={values.medico || ''}
                  onValueChange={val => onChange('medico', val)}
                  placeholder="Cualquier médico"
                  options={medicosFiltrados.map(m => ({
                    value: m._id || m.id,
                    label: `Dr. ${m.nombre || m.usuario?.nombre || ''}`,
                  }))}
                />
              )}
              <DateRangePicker
                id="rango-buscar"
                label="Rango de fechas"
                desde={values.fechaDesde || ''}
                hasta={values.fechaHasta || ''}
                onChangeDates={(d, h) => { onChange('fechaDesde', d); onChange('fechaHasta', h); }}
                minDate={new Date().toISOString().split('T')[0]}
                placeholder="Seleccioná fechas"
              />
            </div>
          </Reveal>
        </Reveal>

        {/* Botón buscar */}
        <Reveal visible={showStep4} delay={0}>
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-white
              bg-coral-dark hover:bg-[#C83444] active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed
              transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral-dark focus-visible:ring-offset-2"
          >
            {loading ? (
              <>
                <span className="inline-block h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                Buscando…
              </>
            ) : (
              <>
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" />
                </svg>
                Buscar turnos
              </>
            )}
          </button>
        </Reveal>

      </form>
    </div>
  );
}
