'use client';
import { usePathname } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import Loader from '@/components/ui/Loader';

export default function NavigationProgress() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const timers = useRef([]);

  const clearTimers = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };

  useEffect(() => {
    // Pathname changed = navigation done, hide overlay
    setVisible(false);
    clearTimers();
  }, [pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const handleClick = (e) => {
      const link = e.target.closest('a[href]');
      if (!link) return;
      const href = link.getAttribute('href');
      if (!href || href.startsWith('#') || href.startsWith('http') || href.startsWith('mailto')) return;
      if (href === pathname) return;

      clearTimers();
      // Delay 150ms — don't flash for instant navigations
      const t = setTimeout(() => setVisible(true), 150);
      timers.current = [t];
    };

    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [pathname]);

  if (!visible) return null;

  return (
    <div
      role="status"
      aria-label="Navegando..."
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-white/70 backdrop-blur-sm pointer-events-none"
    >
      <Loader size="md" />
    </div>
  );
}
