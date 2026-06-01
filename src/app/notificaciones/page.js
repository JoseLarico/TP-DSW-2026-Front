// TODO: notificaciones (GET /notificaciones/sin-leer/:id, marcar como leída)
'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { getNotifSinLeer, getNotifLeidas, marcarLeida } from '@/services/notificacion';
import Card, { CardBody } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { SkeletonCard } from '@/components/ui/Skeleton';

export default function NotificacionesPage() {
  const usuario = useAuth();
  const { addToast } = useToast();
  const [sinLeer, setSinLeer] = useState([]);
  const [leidas, setLeidas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('sin-leer');
  const [marcando, setMarcando] = useState(null); // id de notif en proceso

  const cargar = async () => {
    if (!usuario?._id) return;
    setLoading(true);
    try {
      const [sl, l] = await Promise.all([
        getNotifSinLeer(usuario._id),
        getNotifLeidas(usuario._id),
      ]);
      setSinLeer(Array.isArray(sl) ? sl : []);
      setLeidas(Array.isArray(l) ? l : []);
    } catch {
      addToast('Error al cargar las notificaciones.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { cargar(); }, [usuario?._id]);

  const handleMarcarLeida = async (notifId) => {
    setMarcando(notifId);
    try {
      await marcarLeida(notifId);
      setSinLeer(prev => prev.filter(n => n._id !== notifId));
      cargar(); // refrescar leídas
    } catch {
      addToast('No se pudo marcar la notificación.', 'error');
    } finally {
      setMarcando(null);
    }
  };

  const actual = tab === 'sin-leer' ? sinLeer : leidas;

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold text-gray-900">Notificaciones</h1>

      {/* Tabs */}
      <div
        role="tablist"
        aria-label="Filtrar notificaciones"
        className="mt-4 flex border-b border-gray-200"
      >
        {[
          { id: 'sin-leer', label: 'Sin leer', count: sinLeer.length },
          { id: 'leidas',   label: 'Leídas',   count: null },
        ].map(({ id, label, count }) => (
          <button
            key={id}
            role="tab"
            aria-selected={tab === id}
            aria-controls={`panel-${id}`}
            id={`tab-${id}`}
            onClick={() => setTab(id)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-inset
              ${tab === id
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
          >
            {label}
            {count !== null && count > 0 && (
              <span
                className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-700"
                aria-label={`${count} sin leer`}
              >
                {count}
              </span>
            )}
          </button>
        ))}
      </div>

      <div
        id={`panel-${tab}`}
        role="tabpanel"
        aria-labelledby={`tab-${tab}`}
        className="mt-4 space-y-3"
        aria-live="polite"
      >
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)
        ) : actual.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 bg-white px-6 py-12 text-center">
            <p className="text-gray-500">
              {tab === 'sin-leer' ? 'No tenés notificaciones sin leer.' : 'No tenés notificaciones leídas.'}
            </p>
          </div>
        ) : (
          actual.map(notif => (
            <Card key={notif._id}>
              <CardBody>
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <p className="text-sm text-gray-900">{notif.mensaje}</p>
                    <p className="text-xs text-gray-400">
                      {notif.fechaHoraCreacion
                        ? new Date(notif.fechaHoraCreacion).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' })
                        : ''}
                    </p>
                  </div>
                  {tab === 'sin-leer' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      loading={marcando === notif._id}
                      onClick={() => handleMarcarLeida(notif._id)}
                      aria-label={`Marcar como leída: ${notif.mensaje}`}
                    >
                      ✓ Leída
                    </Button>
                  )}
                </div>
              </CardBody>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}