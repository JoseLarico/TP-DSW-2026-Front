'use client';
import { createContext, useContext, useState, useCallback, useRef } from 'react';

const ToastContext = createContext(null);

const DURATION = 3000;

const TYPES = {
  success: { c1: '#54CFA0', c2: '#2FA579' },
  error:   { c1: '#EE6B76', c2: '#E0414F' },
  warning: { c1: '#F8C25A', c2: '#EE9E22' },
  info:    { c1: '#8FB3E0', c2: '#5E84C2' },
};

const STYLES = `
  @keyframes sm-toast-in {
    from { opacity: 0; transform: translateY(-16px) scale(.95); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
  }
  @keyframes sm-toast-out {
    to { opacity: 0; transform: translateY(-10px) scale(.95); }
  }
  @keyframes sm-progress {
    from { transform: scaleX(1); }
    to   { transform: scaleX(0); }
  }
  .sm-toast-enter { animation: sm-toast-in .42s cubic-bezier(.21,1.1,.4,1) both; }
  .sm-toast-leave { animation: sm-toast-out .3s ease forwards; }
  @media (prefers-reduced-motion: reduce) {
    .sm-toast-enter, .sm-toast-leave { animation: none; }
  }
`;

function Glyph({ type }) {
  const s = { fill: 'none', stroke: '#fff', strokeWidth: 2.4, strokeLinecap: 'round', strokeLinejoin: 'round' };
  if (type === 'success')
    return <svg viewBox="0 0 24 24" width={18} height={18}><path d="M5 12.7l4.3 4.3L19 7.2" {...s} /></svg>;
  if (type === 'warning')
    return <svg viewBox="0 0 24 24" width={18} height={18}><path d="M12 6.2v7.2" {...s} /><circle cx="12" cy="17.6" r="1.5" fill="#fff" /></svg>;
  if (type === 'error')
    return <svg viewBox="0 0 24 24" width={18} height={18}><path d="M7 7l10 10M17 7L7 17" {...s} /></svg>;
  return <svg viewBox="0 0 24 24" width={18} height={18}><circle cx="12" cy="7.4" r="1.5" fill="#fff" /><path d="M12 11.2v6.6" {...s} /></svg>;
}

function Toast({ toast, onClose }) {
  const t = TYPES[toast.type] || TYPES.info;
  return (
    <div
      role="alert"
      aria-live="polite"
      className={toast.leaving ? 'sm-toast-leave' : 'sm-toast-enter'}
      style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        width: '100%',
        maxWidth: '360px',
        background: '#FFFFFF',
        borderRadius: '14px',
        padding: '11px 12px 11px 14px',
        boxShadow: '0 1px 0 rgba(255,255,255,.9) inset, 0 8px 24px -8px rgba(74,61,66,.22), 0 2px 8px -4px rgba(74,61,66,.12)',
        overflow: 'hidden',
        fontFamily: "'Quicksand', sans-serif",
        pointerEvents: 'auto',
      }}
    >
      {/* left color bar */}
      <span style={{
        position: 'absolute', left: 0, top: 0, bottom: 0, width: '4px',
        background: `linear-gradient(180deg, ${t.c1}, ${t.c2})`,
        borderRadius: '14px 0 0 14px',
      }} />

      {/* candy-tile icon */}
      <span style={{
        flexShrink: 0,
        width: '34px', height: '34px',
        borderRadius: '10px',
        position: 'relative',
        overflow: 'hidden',
        background: `linear-gradient(150deg, ${t.c1} 0%, ${t.c2} 100%)`,
        boxShadow: `inset 0 2px 2px rgba(255,255,255,.45), inset 0 -4px 7px rgba(0,0,0,.12), 0 3px 7px -3px ${t.c2}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <span style={{
          position: 'absolute', left: '8%', top: '6%', width: '84%', height: '46%',
          borderRadius: '50%',
          background: 'linear-gradient(180deg,rgba(255,255,255,.5),rgba(255,255,255,0))',
          filter: 'blur(1px)', pointerEvents: 'none',
        }} />
        <Glyph type={toast.type} />
      </span>

      {/* body */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontWeight: 700, fontSize: '13.5px', lineHeight: 1.25, margin: toast.title ? '0 0 2px' : 0, color: '#4A3D42' }}>
          {toast.title || toast.message}
        </p>
        {toast.title && (
          <p style={{ fontWeight: 500, fontSize: '12.5px', lineHeight: 1.35, color: '#8A7B81', margin: 0 }}>
            {toast.message}
          </p>
        )}
      </div>

      {/* close */}
      <button
        onClick={onClose}
        aria-label="Cerrar"
        style={{
          flexShrink: 0, border: 'none', background: 'transparent',
          color: '#8A7B81', width: '22px', height: '22px',
          borderRadius: '7px', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(74,61,66,.08)'; e.currentTarget.style.color = '#4A3D42'; }}
        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#8A7B81'; }}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" width={13} height={13}>
          <path d="M6 6l12 12M18 6L6 18" />
        </svg>
      </button>

      {/* progress bar */}
      <span style={{
        position: 'absolute', left: 0, right: 0, bottom: 0, height: '3px',
        background: `linear-gradient(90deg, ${t.c1}, ${t.c2})`,
        transformOrigin: 'left',
        animation: `sm-progress ${DURATION / 1000}s linear forwards`,
      }} />
    </div>
  );
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const idRef = useRef(0);

  const dismiss = useCallback((id) => {
    setToasts(list => list.map(x => x.id === id ? { ...x, leaving: true } : x));
    setTimeout(() => setToasts(list => list.filter(x => x.id !== id)), 320);
  }, []);

  const addToast = useCallback((message, type = 'success', title = null) => {
    const id = ++idRef.current;
    setToasts(prev => [...prev, { id, message, type, title, leaving: false }]);
    setTimeout(() => dismiss(id), DURATION);
  }, [dismiss]);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <style>{STYLES}</style>
      <div
        aria-live="polite"
        aria-atomic="false"
        style={{
          position: 'fixed',
          top: '73px', right: '18px',
          zIndex: 9998,
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          width: 'min(440px, calc(100vw - 36px))',
          alignItems: 'flex-end',
          pointerEvents: 'none',
        }}
      >
        {toasts.map(toast => (
          <Toast key={toast.id} toast={toast} onClose={() => dismiss(toast.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside ToastProvider');
  return ctx;
}
