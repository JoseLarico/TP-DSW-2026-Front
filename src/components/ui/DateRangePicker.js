'use client';
import { useState, useRef, useEffect } from 'react';

const DIAS  = ['L','M','X','J','V','S','D'];
const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

const parseDate = (str) => {
  if (!str) return null;
  const [y, m, d] = str.split('-').map(Number);
  return new Date(y, m - 1, d);
};
const toStr = (d) =>
  `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
const sameDay = (a, b) =>
  a && b && a.getFullYear()===b.getFullYear() && a.getMonth()===b.getMonth() && a.getDate()===b.getDate();
const startOf = (d) => { const r = new Date(d); r.setHours(0,0,0,0); return r; };
// Monday-based day offset (Mon=0 … Sun=6)
const mondayOffset = (dow) => (dow + 6) % 7;

function MonthGrid({ year, month, desde, hasta, hovered, minDate, onHover, onClick }) {
  const today    = startOf(new Date());
  const minD     = parseDate(minDate);
  const days     = new Date(year, month+1, 0).getDate();
  const firstDow = mondayOffset(new Date(year, month, 1).getDay());

  return (
    <div className="flex-1">
      {/* Month name */}
      <p className="text-center text-sm font-semibold text-gray-800 select-none mb-3">
        {MESES[month]} de {year}
      </p>
      {/* Day-of-week header */}
      <div className="grid grid-cols-7 mb-2">
        {DIAS.map(d => (
          <div key={d} className="text-center text-xs font-medium text-gray-400 py-1">{d}</div>
        ))}
      </div>

      {/* Day grid */}
      <div className="grid grid-cols-7">
        {Array.from({ length: firstDow }).map((_,i) => <div key={`e${i}`} />)}
        {Array.from({ length: days }, (_, i) => {
          const day  = i + 1;
          const date = new Date(year, month, day);
          const isDisabled = (minD && date < minD) || date < today;

          const isStart = sameDay(date, desde);
          const isEnd   = sameDay(date, hasta);
          const effectiveEnd = hasta || hovered;
          const inRange  = desde && effectiveEnd && date > desde && date < effectiveEnd;
          const isHoverEnd = !hasta && sameDay(date, hovered);
          const circled  = isStart || isEnd || isHoverEnd;

          const halfRight = isStart && effectiveEnd && !sameDay(desde, effectiveEnd);
          const halfLeft  = (isEnd || isHoverEnd) && desde && !sameDay(desde, date);

          const dow            = mondayOffset(date.getDay());
          const isMonthEdgeStart = day === 1;
          const isMonthEdgeEnd   = day === days;
          const isRowStart     = inRange && (dow === 0 || isMonthEdgeStart);
          const isRowEnd       = inRange && (dow === 6 || isMonthEdgeEnd);

          return (
            <div key={day} className="relative flex items-center justify-center py-0.5">
              {/* Range fill */}
              {inRange    && <div className={[
                'absolute inset-x-0 top-[1px] bottom-[1px]',
                isMonthEdgeStart ? 'bg-gradient-to-r from-transparent to-primary-light' :
                isMonthEdgeEnd   ? 'bg-gradient-to-r from-primary-light to-transparent' :
                'bg-primary-light',
                isRowStart && !isMonthEdgeStart ? 'rounded-l-xl' : '',
                isRowEnd   && !isMonthEdgeEnd   ? 'rounded-r-xl' : '',
              ].filter(Boolean).join(' ')} />}
              {halfRight  && <div className="absolute top-[1px] bottom-[1px] left-1/2 right-0 bg-primary-light rounded-l-xl" />}
              {halfLeft   && <div className="absolute top-[1px] bottom-[1px] left-0 right-1/2 bg-primary-light rounded-r-xl" />}

              <button
                type="button"
                disabled={isDisabled}
                onClick={() => !isDisabled && onClick(date)}
                onMouseEnter={() => !isDisabled && onHover(date)}
                onMouseLeave={() => onHover(null)}
                className={[
                  'relative z-10 flex items-center justify-center h-8 w-8 mx-auto shrink-0 text-xs rounded-full',
                  'transition-colors select-none focus:outline-none',
                  isDisabled
                    ? 'text-gray-300 cursor-not-allowed'
                    : circled
                    ? 'bg-coral-dark text-white font-semibold cursor-pointer'
                    : sameDay(date, today)
                    ? 'ring-1 ring-coral-dark text-coral-dark font-medium hover:bg-gray-100 cursor-pointer'
                    : 'text-gray-700 hover:bg-gray-100 cursor-pointer',
                ].join(' ')}
              >
                {day}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function DateRangePicker({
  id, label, desde, hasta, onChangeDates, minDate,
  placeholder = 'Seleccioná fechas',
}) {
  const desdeDate = parseDate(desde);
  const hastaDate = parseDate(hasta);
  const today     = startOf(new Date());

  const [open,    setOpen]    = useState(false);
  const [hovered, setHovered] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 560);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);
  const [view,    setView]    = useState(() => {
    const base = desdeDate || today;
    return new Date(base.getFullYear(), base.getMonth(), 1);
  });

  const ref = useRef(null);
  useEffect(() => {
    const h = (e) => { if (!ref.current?.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const month1 = view;
  const month2 = new Date(view.getFullYear(), view.getMonth()+1, 1);

  const handleClick = (date) => {
    if (!desdeDate || (desdeDate && hastaDate)) {
      onChangeDates(toStr(date), '');
    } else {
      if (date < desdeDate) {
        onChangeDates(toStr(date), '');
      } else if (sameDay(date, desdeDate)) {
        onChangeDates('', '');
      } else {
        onChangeDates(desde, toStr(date));
        setOpen(false);
        setHovered(null);
      }
    }
  };

  const displayValue = desdeDate && hastaDate
    ? `${desdeDate.toLocaleDateString('es-AR',{day:'numeric',month:'short',year:'numeric'})} – ${hastaDate.toLocaleDateString('es-AR',{day:'numeric',month:'short',year:'numeric'})}`
    : desdeDate
    ? `${desdeDate.toLocaleDateString('es-AR',{day:'numeric',month:'short',year:'numeric'})} – ...`
    : null;

  const NavBtn = ({ onClick: cb, children }) => (
    <button type="button" onClick={cb}
      className="p-2 rounded-full hover:bg-gray-100 text-gray-500 hover:text-gray-900 transition-colors flex-shrink-0">
      {children}
    </button>
  );

  const ChevLeft  = () => <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/></svg>;
  const ChevRight = () => <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/></svg>;

  return (
    <div className="flex flex-col gap-1">
      {label && <label htmlFor={id} className="text-sm font-medium text-gray-700">{label}</label>}
      <div ref={ref} className="relative">

        {/* Trigger */}
        <button type="button" id={id} onClick={() => setOpen(o => !o)}
          className="w-full flex items-center justify-between rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white text-left
            hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-coral-dark transition-colors">
          <span className={displayValue ? 'text-gray-900' : 'text-gray-400'}>
            {displayValue || placeholder}
          </span>
          <svg className="h-4 w-4 shrink-0 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
          </svg>
        </button>

        {/* Popup */}
        {open && (
          <div className="absolute z-[200] mt-2 rounded-xl border border-gray-200 bg-white shadow-lg p-4"
            style={{ left: '50%', transform: 'translateX(-50%)', width: isMobile ? 'calc(100vw - 2rem)' : '560px' }}>

            {/* Two month grids with nav buttons absolutely positioned */}
            <div className="relative flex gap-6">
              <button type="button"
                onClick={() => setView(v => new Date(v.getFullYear(), v.getMonth()-1, 1))}
                className="absolute top-0 left-0 z-10 p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-900 transition-colors">
                <ChevLeft />
              </button>
              <button type="button"
                onClick={() => setView(v => new Date(v.getFullYear(), v.getMonth()+1, 1))}
                className="absolute top-0 right-0 z-10 p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-900 transition-colors">
                <ChevRight />
              </button>
              <MonthGrid
                year={month1.getFullYear()} month={month1.getMonth()}
                desde={desdeDate} hasta={hastaDate} hovered={hovered}
                minDate={minDate} onHover={setHovered} onClick={handleClick}
              />
              {!isMobile && <div className="w-px bg-gray-100 self-stretch" />}
              {!isMobile && <MonthGrid
                year={month2.getFullYear()} month={month2.getMonth()}
                desde={desdeDate} hasta={hastaDate} hovered={hovered}
                minDate={minDate} onHover={setHovered} onClick={handleClick}
              />}
            </div>

            {/* Footer */}
            <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
              <p className="text-xs text-gray-400">
                {!desdeDate ? 'Seleccioná la fecha de inicio' : !hastaDate ? 'Seleccioná la fecha de fin' : ''}
              </p>
              {(desdeDate || hastaDate) && (
                <button type="button"
                  onClick={() => { onChangeDates('', ''); setHovered(null); }}
                  className="text-xs text-gray-500 hover:text-coral-dark transition-colors">
                  Limpiar
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
