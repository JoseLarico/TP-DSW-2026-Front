'use client';
import { useState, useRef, useEffect } from 'react';

export default function Select({
  label,
  id,
  name,
  options = [],
  placeholder = 'Seleccioná una opción',
  value = '',
  onChange,
  onValueChange,
  error,
  disabled,
  dropUp = false,
  className = '',
}) {
  const [open, setOpen] = useState(false);
  const [focusedIdx, setFocusedIdx] = useState(-1);
  const containerRef = useRef(null);
  const listRef = useRef(null);

  const selected = options.find(o => String(o.value) === String(value));

  useEffect(() => {
    const handler = (e) => {
      if (!containerRef.current?.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    if (open && focusedIdx >= 0 && listRef.current) {
      listRef.current.children[focusedIdx + 1]?.scrollIntoView({ block: 'nearest' });
    }
  }, [focusedIdx, open]);

  const select = (val) => {
    onChange?.({ target: { value: val, name } });
    onValueChange?.(val);
    setOpen(false);
    setFocusedIdx(-1);
  };

  const handleKeyDown = (e) => {
    if (!open) {
      if (['Enter', ' ', 'ArrowDown'].includes(e.key)) {
        e.preventDefault();
        setOpen(true);
        setFocusedIdx(value ? options.findIndex(o => String(o.value) === String(value)) : 0);
      }
      return;
    }
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setFocusedIdx(i => Math.min(i + 1, options.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setFocusedIdx(i => Math.max(i - 1, 0));
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (focusedIdx >= 0) select(options[focusedIdx].value);
        else select('');
        break;
      case 'Escape':
        e.preventDefault();
        setOpen(false);
        break;
    }
  };

  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      <div ref={containerRef} className="relative">
        <button
          type="button"
          id={id}
          disabled={disabled}
          onClick={() => {
            if (disabled) return;
            const next = !open;
            setOpen(next);
            if (next) setFocusedIdx(value ? options.findIndex(o => String(o.value) === String(value)) : -1);
          }}
          onKeyDown={handleKeyDown}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
          className={[
            'w-full flex items-center justify-between rounded-lg border px-3 py-2 text-sm bg-white text-left',
            'focus:outline-none focus:ring-2 focus:ring-coral-dark focus:border-coral-dark',
            'disabled:bg-gray-50 disabled:cursor-not-allowed transition-colors',
            error ? 'border-red-500 bg-red-50' : 'border-gray-300 hover:border-gray-400',
            className,
          ].join(' ')}
        >
          <span className={selected ? 'text-gray-900' : 'text-gray-400'}>
            {selected ? selected.label : placeholder}
          </span>
          <svg
            className={`h-4 w-4 shrink-0 text-gray-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 9l6 6 6-6" />
          </svg>
        </button>

        {open && (
          <ul
            ref={listRef}
            role="listbox"
            aria-label={label || placeholder}
            className={`absolute z-50 w-full max-h-56 overflow-auto rounded-xl border border-gray-200 bg-white shadow-lg py-1 ${dropUp ? 'bottom-full mb-1.5' : 'mt-1.5'}`}
          >
            <li
              role="option"
              aria-selected={!value}
              onClick={() => select('')}
              className={[
                'mx-1 px-3 py-2 text-sm rounded-lg cursor-pointer transition-colors',
                !value
                  ? 'bg-primary-light text-coral-dark font-medium'
                  : 'text-gray-400 hover:bg-gray-50 hover:text-gray-600',
              ].join(' ')}
            >
              {placeholder}
            </li>
            {options.map((opt, idx) => {
              const isSelected = String(opt.value) === String(value);
              const isFocused = focusedIdx === idx;
              return (
                <li
                  key={opt.value}
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => select(opt.value)}
                  onMouseEnter={() => setFocusedIdx(idx)}
                  className={[
                    'mx-1 px-3 py-2 text-sm rounded-lg cursor-pointer transition-colors',
                    isSelected
                      ? 'bg-primary-light text-coral-dark font-medium'
                      : isFocused
                      ? 'bg-gray-100 text-gray-900'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900',
                  ].join(' ')}
                >
                  {opt.label}
                </li>
              );
            })}
          </ul>
        )}
      </div>
      {error && (
        <p id={`${id}-error`} role="alert" className="text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
