'use client';
import { useState, useRef, useEffect } from 'react';

const DIAS_SEMANA = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

const parseDate = (str) => {
  if (!str) return null;
  const [y, m, d] = str.split('-').map(Number);
  return new Date(y, m - 1, d);
};

const toStr = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const isSameDay = (a, b) =>
  a && b && a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

export default function DatePicker({
  id,
  label,
  value,
  onChange,
  placeholder = 'Seleccioná una fecha',
  minDate,
  error,
}) {
  const selected = parseDate(value);
  const min = parseDate(minDate);
  const today = new Date(); today.setHours(0,0,0,0);

  const [open, setOpen] = useState(false);
  const [view, setView] = useState(() => {
    const base = selected || today;
    return new Date(base.getFullYear(), base.getMonth(), 1);
  });

  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (!ref.current?.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const prevMonth = () => setView(v => new Date(v.getFullYear(), v.getMonth() - 1, 1));
  const nextMonth = () => setView(v => new Date(v.getFullYear(), v.getMonth() + 1, 1));

  const daysInMonth = new Date(view.getFullYear(), view.getMonth() + 1, 0).getDate();
  const firstDow = new Date(view.getFullYear(), view.getMonth(), 1).getDay();

  const select = (day) => {
    const d = new Date(view.getFullYear(), view.getMonth(), day);
    const isDisabled = (min && d < min) || d < today;
    if (isDisabled) return;
    onChange(toStr(d));
    setOpen(false);
  };

  const displayValue = selected
    ? selected.toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })
    : null;

  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-gray-700">{label}</label>
      )}
      <div ref={ref} className="relative">
        {/* Trigger */}
        <button
          type="button"
          id={id}
          onClick={() => setOpen(o => !o)}
          className={[
            'w-full flex items-center justify-between rounded-lg border px-3 py-2 text-sm bg-white text-left',
            'focus:outline-none focus:ring-2 focus:ring-coral-dark focus:border-coral-dark transition-colors',
            error ? 'border-red-500 bg-red-50' : 'border-gray-300 hover:border-gray-400',
          ].join(' ')}
        >
          <span className={displayValue ? 'text-gray-900' : 'text-gray-400'}>
            {displayValue || placeholder}
          </span>
          <svg className={`h-4 w-4 shrink-0 text-gray-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </button>

        {/* Calendar popup */}
        {open && (
          <div className="absolute z-50 mt-1.5 w-72 rounded-xl border border-gray-200 bg-white shadow-lg p-3">

            {/* Header nav */}
            <div className="flex items-center justify-between mb-3">
              <button
                type="button"
                onClick={prevMonth}
                className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-500 hover:text-gray-900"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <span className="text-sm font-semibold text-gray-800 select-none">
                {MESES[view.getMonth()]} {view.getFullYear()}
              </span>
              <button
                type="button"
                onClick={nextMonth}
                className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-500 hover:text-gray-900"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            {/* Day names */}
            <div className="grid grid-cols-7 mb-1">
              {DIAS_SEMANA.map(d => (
                <div key={d} className="text-center text-xs font-medium text-gray-400 py-1">
                  {d}
                </div>
              ))}
            </div>

            {/* Day grid */}
            <div className="grid grid-cols-7 gap-y-0.5">
              {Array.from({ length: firstDow }).map((_, i) => <div key={`e-${i}`} />)}
              {Array.from({ length: daysInMonth }, (_, i) => {
                const day = i + 1;
                const date = new Date(view.getFullYear(), view.getMonth(), day);
                const isDisabled = (min && date < min) || date < today;
                const isSel = isSameDay(date, selected);
                const isToday = isSameDay(date, today);

                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => select(day)}
                    disabled={isDisabled}
                    className={[
                      'flex items-center justify-center h-8 w-8 mx-auto text-xs rounded-full transition-colors',
                      isDisabled
                        ? 'text-gray-300 cursor-not-allowed'
                        : isSel
                        ? 'bg-coral-dark text-white font-semibold'
                        : isToday
                        ? 'ring-1 ring-coral-dark text-coral-dark font-medium hover:bg-gray-100'
                        : 'text-gray-700 hover:bg-gray-100',
                    ].join(' ')}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
      {error && <p role="alert" className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
