"use client";
import React, { useState, useEffect } from 'react';
import Select from '@/components/ui/Select';

const PER_PAGE_OPTIONS = [5, 10, 20, 50];

export default function Pagination({ page, totalPages, limit, onPageChange, onLimitChange }) {
  const total = totalPages || 1;
  const [inputVal, setInputVal] = useState(String(page));

  useEffect(() => { setInputVal(String(page)); }, [page]);

  const goTo = (p) => {
    const clamped = Math.max(1, Math.min(p, total));
    if (clamped !== page) onPageChange(clamped);
  };

  const handleCommit = () => {
    const n = parseInt(inputVal, 10);
    if (!isNaN(n)) goTo(n);
    else setInputVal(String(page));
  };

  /* ── shared styles ── */
  const segBase = `
    flex h-9 items-center justify-center border border-gray-200 bg-white
    text-sm text-gray-500 transition-colors
    hover:bg-primary-light hover:text-coral-dark hover:border-coral-dark hover:z-10
    disabled:text-gray-300 disabled:bg-gray-50 disabled:cursor-not-allowed disabled:hover:bg-gray-50
    disabled:hover:text-gray-300 disabled:hover:border-gray-200
    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral-dark focus-visible:z-10
  `;

  const ChevronDblLeft = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5"><path d="M11 17l-5-5 5-5M18 17l-5-5 5-5"/></svg>;
  const ChevronLeft   = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5"><path d="M15 18l-6-6 6-6"/></svg>;
  const ChevronRight  = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5"><path d="M9 18l6-6-6-6"/></svg>;
  const ChevronDblRight = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5"><path d="M13 17l5-5-5-5M6 17l5-5-5-5"/></svg>;

  return (
    <nav aria-label="Paginación" className="mt-10 flex flex-wrap items-center justify-between gap-4">

      {/* Por página */}
      <Select
        value={String(limit)}
        onValueChange={val => onLimitChange(Number(val))}
        options={PER_PAGE_OPTIONS.map(n => ({ value: String(n), label: `${n} por página` }))}
        className="w-36"
        dropUp
      />

      {/* Toolbar de navegación */}
      <div className="flex items-center">

        {/* Grupo izquierdo: primera + anterior */}
        <div className="flex">
          <button
            onClick={() => goTo(1)}
            disabled={page <= 1}
            aria-label="Primera página"
            className={`${segBase} w-9 rounded-l-lg border-r-0`}
          >
            <ChevronDblLeft />
          </button>
          <button
            onClick={() => goTo(page - 1)}
            disabled={page <= 1}
            aria-label="Página anterior"
            className={`${segBase} w-9 rounded-none border-r-0`}
          >
            <ChevronLeft />
          </button>
        </div>

        {/* Input de página */}
        <div className="flex items-center gap-1.5 border border-gray-200 bg-white px-3 h-9">
          <input
            type="number"
            min={1}
            max={total}
            value={inputVal}
            onChange={e => setInputVal(e.target.value)}
            onBlur={handleCommit}
            onKeyDown={e => e.key === 'Enter' && handleCommit()}
            aria-label="Número de página"
            className="w-8 border-none bg-transparent text-center text-sm font-bold text-coral-dark
              focus:outline-none
              [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          />
          <span className="text-sm text-gray-400">/ {total}</span>
        </div>

        {/* Grupo derecho: siguiente + última */}
        <div className="flex">
          <button
            onClick={() => goTo(page + 1)}
            disabled={page >= total}
            aria-label="Página siguiente"
            className={`${segBase} w-9 rounded-none border-l-0`}
          >
            <ChevronRight />
          </button>
          <button
            onClick={() => goTo(total)}
            disabled={page >= total}
            aria-label="Última página"
            className={`${segBase} w-9 rounded-r-lg border-l-0`}
          >
            <ChevronDblRight />
          </button>
        </div>

      </div>
    </nav>
  );
}
