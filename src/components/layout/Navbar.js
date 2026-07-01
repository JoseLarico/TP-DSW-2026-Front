'use client';
import Link from 'next/link';
import Logo from '@/components/ui/Logo';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getNotifSinLeer } from '@/services/notificacion';
import { usePreseleccion } from '@/context/PreseleccionContext';

const NAV_LINKS_PACIENTE = [
  { href: '/buscar', label: 'Buscar turnos' },
  { href: '/mis-turnos', label: 'Mis turnos' },
];

const NAV_LINKS_MEDICO = [
  { href: '/medico/turnos', label: 'Mis turnos' },
  { href: '/medico/agenda', label: 'Mi agenda' },
];

const NAV_LINKS_ADMIN = [
  { href: '/admin/medicos',        label: 'Médicos' },
  { href: '/admin/especialidades', label: 'Especialidades' },
  { href: '/admin/practicas',      label: 'Prácticas' },
  { href: '/admin/sedes',          label: 'Sedes' },
  { href: '/admin/obras-sociales', label: 'Obras Sociales' },
];

export default function Navbar() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const { turnos } = usePreseleccion();
  const { usuario, logout, loading: authLoading } = useAuth();
  const router = useRouter();
  const [cantidadNotif, setCantidadNotif] = useState(0);

  const links = usuario?.rol === 'medico' ? NAV_LINKS_MEDICO : NAV_LINKS_PACIENTE;

  useEffect(() => {
    if (!usuario?._id) return;
    const fetchNotif = async () => {
      try {
        const data = await getNotifSinLeer(usuario.usuario?._id || usuario._id);
        const arr = Array.isArray(data) ? data : (data?.notificaciones ?? []);
        setCantidadNotif(arr.length);
      } catch { /* silencioso */ }
    };
    fetchNotif();
    const interval = setInterval(fetchNotif, 30000);
    window.addEventListener('notif-actualizada', fetchNotif);
    return () => {
      clearInterval(interval);
      window.removeEventListener('notif-actualizada', fetchNotif);
    };
  }, [usuario?._id]);

  const linkClass = (href) =>
    `rounded-lg px-3 py-2 text-sm font-medium transition-colors cursor-pointer
     focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral-dark
     ${pathname === href ? 'bg-primary-light text-[#C83444]' : 'text-gray-600 hover:bg-primary-light hover:text-coral-dark'}`;

  if (authLoading) {
    return <header className="border-b border-gray-200 bg-white shadow-sm h-[57px]" aria-hidden="true" />;
  }

  if (!usuario) {
    return (
      <header className="border-b border-gray-200 bg-white shadow-sm">
        <nav aria-label="Navegación principal" className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <Link href="/" className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral-dark rounded">
            <Logo height={40} />
          </Link>
          <Link href="/login" className={linkClass('/login')}>Iniciar sesión</Link>
        </nav>
      </header>
    );
  }

  return (
    <header className="border-b border-gray-200 bg-white shadow-sm">
      <nav
        aria-label="Navegación principal"
        className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8"
      >
        {/* Logo */}
        <Link
          href="/"
          className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral-dark rounded"
        >
          <Logo height={40} />
        </Link>

        {/* Desktop links */}
        <ul className="hidden md:flex items-center gap-1" role="list">
          {[...links, ...(usuario?.rol === 'admin' ? NAV_LINKS_ADMIN : [])].map(({ href, label }) => (
            <li key={href}>
              <Link href={href} aria-current={pathname === href ? 'page' : undefined} className={linkClass(href)}>
                {label}
              </Link>
            </li>
          ))}
        </ul>

        {/* Cart + notificaciones + perfil */}
        <div className="hidden md:flex items-center gap-2">
          <Link
            href="/notificaciones"
            aria-label={`Notificaciones${cantidadNotif > 0 ? `, ${cantidadNotif} sin leer` : ''}`}
            className={`relative rounded-lg p-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral-dark
              ${pathname === '/notificaciones' ? 'bg-primary-light text-coral-dark' : 'text-gray-600 hover:bg-primary-light hover:text-coral-dark'}`}
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            {cantidadNotif > 0 && (
              <span aria-hidden="true" className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-white text-[10px] font-bold">
                {cantidadNotif > 9 ? '9+' : cantidadNotif}
              </span>
            )}
          </Link>

          {usuario?.rol !== 'medico' && <Link
            href="/preseleccion"
            aria-label={`Ver turnos preseleccionados${turnos.length > 0 ? ` (${turnos.length})` : ''}`}
            className={`relative rounded-lg p-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral-dark
              ${pathname === '/preseleccion' ? 'bg-primary-light text-coral-dark' : 'text-gray-600 hover:bg-primary-light hover:text-coral-dark'}`}
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            {turnos.length > 0 && (
              <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-coral-dark text-white text-xs flex items-center justify-center" aria-hidden="true">
                {turnos.length}
              </span>
            )}
          </Link>}

          <Link
            href="/perfil"
            aria-label="Mi perfil"
            className={`rounded-lg p-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral-dark
              ${pathname === '/perfil' ? 'bg-primary-light text-coral-dark' : 'text-gray-600 hover:bg-primary-light hover:text-coral-dark'}`}
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </Link>

          <button
            onClick={() => { logout(); router.push('/login'); }}
            aria-label="Cerrar sesión"
            className="rounded-lg p-2 text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>

        {/* Mobile menu button */}
        <button
          className="md:hidden rounded-lg p-2 text-gray-600 hover:bg-gray-100 transition-colors
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral-dark"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-expanded={menuOpen}
          aria-controls="mobile-menu"
          aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
        >
          {menuOpen ? (
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </nav>

      {/* Mobile menu */}
      {menuOpen && (
        <div id="mobile-menu" className="md:hidden border-t border-gray-200 bg-white px-4 py-2">
          <ul role="list" className="flex flex-col gap-1">
            {[...links, ...(usuario?.rol === 'admin' ? NAV_LINKS_ADMIN : [])].map(({ href, label }) => (
              <li key={href}>
                <Link
                  href={href}
                  onClick={() => setMenuOpen(false)}
                  aria-current={pathname === href ? 'page' : undefined}
                  className={`block rounded-lg px-3 py-2 text-sm font-medium transition-colors
                    ${pathname === href ? 'bg-primary-light text-[#C83444]' : 'text-gray-600 hover:bg-gray-100'}`}
                >
                  {label}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/preseleccion" onClick={() => setMenuOpen(false)}
                className="block rounded-lg px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100">
                Turnos preseleccionados
              </Link>
            </li>
            <li>
              <Link href="/perfil" onClick={() => setMenuOpen(false)}
                className="block rounded-lg px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100">
                Mi perfil
              </Link>
            </li>
            <li>
              <button
                onClick={() => { setMenuOpen(false); logout(); router.push('/login'); }}
                className="w-full text-left rounded-lg px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
              >
                Cerrar sesión
              </button>
            </li>
          </ul>
        </div>
      )}
    </header>
  );
}
