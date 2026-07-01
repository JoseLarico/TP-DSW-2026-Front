'use client';
import { useState, useRef, useEffect } from 'react';

const HORARIOS = Array.from({ length: 32 }, (_, i) => {
  const totalMins = 7 * 60 + i * 30;
  const h = String(Math.floor(totalMins / 60)).padStart(2, '0');
  const m = String(totalMins % 60).padStart(2, '0');
  return `${h}:${m}`;
});

export default function TimeRangePicker({
  id,
  label,
  inicio,
  fin,
  onChangeTimes,
  error,
  placeholder = 'Seleccioná horario',
}) {
  const [open, setOpen] = useState(false);
  const [step, setStep]  = useState('inicio'); // 'inicio' | 'fin'
  const ref = useRef(null);
  const finRef = useRef(null);

  useEffect(() => {
    const h = (e) => { if (!ref.current?.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  // Scroll selected item into view
  useEffect(() => {
    if (!open) return;
    ['inicio-list', 'fin-list'].forEach(id => {
      const el = document.getElementById(id);
      const sel = el?.querySelector('[data-selected="true"]');
      if (sel) sel.scrollIntoView({ block: 'center' });
    });
  }, [open]);

  const handleSelect = (time, col) => {
    if (col === 'inicio') {
      onChangeTimes(time, fin && fin > time ? fin : '');
      setStep('fin');
    } else {
      onChangeTimes(inicio, time);
      setOpen(false);
      setStep('inicio');
    }
  };

  const displayValue = inicio && fin
    ? `${inicio} – ${fin}`
    : inicio
    ? `${inicio} – ...`
    : null;

  const finOptions = inicio ? HORARIOS.filter(h => h > inicio) : HORARIOS;

  const ColHeader = ({ label: lbl, active }) => (
    <div className={`text-xs font-semibold uppercase tracking-wide mb-2 pb-1.5 border-b border-gray-100
      ${active ? 'text-coral-dark' : 'text-gray-400'}`}>
      {lbl}
    </div>
  );

  const TimeList = ({ options, selected, onSelect, listId }) => (
    <div id={listId} className="h-48 overflow-y-auto flex flex-col gap-0.5 pr-1
      scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
      {options.map(t => (
        <button
          key={t}
          type="button"
          data-selected={t === selected}
          onClick={() => onSelect(t)}
          className={[
            'w-full text-left px-2.5 py-1.5 text-xs rounded-lg transition-colors',
            t === selected
              ? 'bg-coral-dark text-white font-semibold'
              : 'text-gray-700 hover:bg-gray-100',
          ].join(' ')}
        >
          {t}
        </button>
      ))}
    </div>
  );

  return (
    <div className="flex flex-col gap-1">
      {label && <label htmlFor={id} className="text-sm font-medium text-gray-700">{label}</label>}
      <div ref={ref} className="relative">
        <button
          type="button"
          id={id}
          onClick={() => { setOpen(o => !o); setStep('inicio'); }}
          className={[
            'w-full flex items-center justify-between rounded-lg border px-3 py-2 text-sm bg-white text-left',
            'focus:outline-none focus:ring-2 focus:ring-coral-dark focus:border-coral-dark transition-colors',
            error ? 'border-red-500 bg-red-50' : 'border-gray-300 hover:border-gray-400',
          ].join(' ')}
        >
          <span className={displayValue ? 'text-gray-900' : 'text-gray-400'}>
            {displayValue || placeholder}
          </span>
          <svg className="h-4 w-4 shrink-0 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </button>

        {open && (
          <div className="absolute z-[200] mt-2 rounded-xl border border-gray-200 bg-white shadow-lg p-4"
            style={{ left: '50%', transform: 'translateX(-50%)', width: '240px' }}>

            <div className="flex gap-4">
              {/* Inicio */}
              <div className="flex-1">
                <ColHeader label="Inicio" active={step === 'inicio'} />
                <TimeList
                  listId="inicio-list"
                  options={HORARIOS}
                  selected={inicio}
                  onSelect={t => handleSelect(t, 'inicio')}
                />
              </div>
              <div className="w-px bg-gray-100" />
              {/* Fin */}
              <div className="flex-1">
                <ColHeader label="Fin" active={step === 'fin'} />
                <TimeList
                  listId="fin-list"
                  options={finOptions}
                  selected={fin}
                  onSelect={t => handleSelect(t, 'fin')}
                />
              </div>
            </div>

            {/* Hint */}
            <p className="mt-3 pt-2.5 border-t border-gray-100 text-xs text-gray-400">
              {step === 'inicio' ? 'Seleccioná la hora de inicio' : 'Seleccioná la hora de fin'}
            </p>
          </div>
        )}
      </div>
      {error && <p role="alert" className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
