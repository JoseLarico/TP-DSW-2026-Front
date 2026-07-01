"use client";
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getEspecialidades, getPracticas, getMedicos, getSedes } from '@/services/catalogo';
import { buscarTurnos } from '@/services/turnos';
import SearchFilters from '@/components/buscar/SearchFilters';
import TurnoRow from '@/components/buscar/TurnoRow';
import Loader from '@/components/ui/Loader';
import Pagination from '@/components/buscar/Pagination';

const TABLE_HEADERS = ['Día', 'Hora', 'Lugar', 'Profesional', 'Especialidad / Práctica', 'Acciones'];
const SORTABLE_COLS = ['Día', 'Hora'];

function SortIcon({ dir }) {
  return (
    <svg className="inline ml-1 h-3 w-3 text-coral-dark" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      {dir === 'asc'
        ? <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
        : <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />}
    </svg>
  );
}

function TableSkeleton() {
  return (
    <div className="overflow-x-auto rounded-2xl border border-gray-100 bg-white shadow-sm">
      <table className="w-full min-w-[760px]">
        <thead>
          <tr className="border-b border-gray-100">
            {TABLE_HEADERS.map(h => (
              <th key={h} className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: 6 }).map((_, i) => (
            <tr key={i} className="border-b border-gray-100">
              <td className="px-4 py-4"><div className="h-4 w-48 rounded bg-gray-100 animate-pulse" /></td>
              <td className="px-4 py-4"><div className="h-4 w-12 rounded bg-gray-100 animate-pulse" /></td>
              <td className="px-4 py-4"><div className="h-4 w-28 rounded bg-gray-100 animate-pulse" /></td>
              <td className="px-4 py-4"><div className="h-4 w-32 rounded bg-gray-100 animate-pulse" /></td>
              <td className="px-4 py-4"><div className="h-4 w-24 rounded bg-gray-100 animate-pulse" /></td>
              <td className="px-4 py-4"><div className="h-7 w-36 rounded bg-gray-100 animate-pulse" /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function BuscarPage() {
  const { usuario, rol, loading: authLoading } = useAuth();
  const pacienteId = rol === 'paciente' ? usuario?._id : null;

  const [options, setOptions] = useState({ especialidades: [], practicas: [], medicos: [], sedes: [] });
  const [values, setValues] = useState({ especialidad: '', practica: '', medico: '', sede: '', fechaDesde: '', fechaHasta: '' });

  const [loadingOptions, setLoadingOptions] = useState(false);
  const [loadingResults, setLoadingResults] = useState(false);
  const [error, setError] = useState(null);
  const [results, setResults] = useState([]);
  const [searched, setSearched] = useState(false);
  const [sortDia, setSortDia] = useState('asc');
  const [sortHora, setSortHora] = useState('asc');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalResults, setTotalResults] = useState(0);

  useEffect(() => {
    if (authLoading || !usuario) return;
    setLoadingOptions(true);
    let mounted = true;
    async function loadOptions() {
      try {
        const [especialidades, practicas, medicos, sedes] = await Promise.all([
          getEspecialidades(), getPracticas(), getMedicos(), getSedes()
        ]);
        if (!mounted) return;
        setOptions({ especialidades, practicas, medicos, sedes });
      } catch (err) {
        console.error(err);
        setError(err.message || 'No se pudieron cargar los catálogos');
      } finally {
        if (mounted) setLoadingOptions(false);
      }
    }
    loadOptions();
    return () => { mounted = false; };
  }, [authLoading, usuario]);

  const fetchResults = async (p = 1) => {
    setError(null);
    setLoadingResults(true);
    setSearched(true);
    try {
      const params = {};
      if (values.especialidad) params.especialidadId = values.especialidad;
      if (values.practica) params.practicaId = values.practica;
      if (values.medico) params.medicoId = values.medico;
      if (values.sede) params.sedeId = values.sede;
      if (values.fechaDesde) params.fechaDesde = values.fechaDesde;
      if (values.fechaHasta) params.fechaHasta = values.fechaHasta;
      params.page = p;
      params.limit = limit;

      const data = await buscarTurnos(pacienteId, params);
      const turnos = data.items || data.turnos || [];
      setResults(turnos);
      const paginas = data.paginacion?.paginas || data.totalPages || Math.ceil((data.total || 0) / limit) || 1;
      setTotalPages(paginas);
      setTotalResults(data.paginacion?.total ?? data.total ?? turnos.length);
      setPage(data.paginacion?.pagina || data.page || p);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Error al buscar turnos');
    } finally {
      setLoadingResults(false);
    }
  };

  const handleChange = (field, value) => setValues(prev => ({ ...prev, [field]: value }));
  const handleSubmit = () => fetchResults(1);

  const toggleSort = (col) => {
    if (col === 'Día') setSortDia(d => d === 'asc' ? 'desc' : 'asc');
    if (col === 'Hora') setSortHora(d => d === 'asc' ? 'desc' : 'asc');
  };

  const sortedResults = [...results].sort((a, b) => {
    const da = new Date(a.fecha || a.fechaHora);
    const db = new Date(b.fecha || b.fechaHora);
    if (sortDia) {
      const diff = new Date(da.getFullYear(), da.getMonth(), da.getDate())
                 - new Date(db.getFullYear(), db.getMonth(), db.getDate());
      if (diff !== 0) return sortDia === 'asc' ? diff : -diff;
    }
    if (sortHora) {
      const diff = (da.getHours() * 60 + da.getMinutes()) - (db.getHours() * 60 + db.getMinutes());
      if (diff !== 0) return sortHora === 'asc' ? diff : -diff;
    }
    return 0;
  });

  if (authLoading) return <div className="flex justify-center items-center min-h-[50vh]"><Loader size="lg" /></div>;

  if (!usuario) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <style>{`
          @keyframes ticketIn {
            from { opacity: 0; transform: translateY(16px) scale(.98); }
            to   { opacity: 1; transform: translateY(0) scale(1); }
          }
          @keyframes float {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-6px); }
          }
        `}</style>
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Buscar turnos</h1>
        </div>
        <div
          className="flex flex-col items-center justify-center px-6 py-16 text-center"
          style={{ animation: 'ticketIn 0.5s cubic-bezier(.21,1.1,.4,1) both' }}
        >
          <div className="relative mb-8">
            <div className="h-24 w-24 rounded-3xl bg-primary-light flex items-center justify-center mx-auto shadow-[0_8px_32px_-8px_rgba(224,65,79,.25)]">
              <svg className="h-12 w-12 text-coral-dark opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <span className="absolute -top-2 -right-2 h-4 w-4 rounded-full bg-rosa-light opacity-60" style={{ animation: 'float 3s ease-in-out infinite' }} />
            <span className="absolute -bottom-1 -left-3 h-3 w-3 rounded-full bg-coral-light opacity-40" style={{ animation: 'float 3s ease-in-out infinite 1s' }} />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Iniciá sesión para buscar turnos</h2>
          <p className="text-sm text-gray-500 max-w-xs mb-8">
            Necesitás una cuenta para ver disponibilidad y reservar turnos médicos.
          </p>
          <a
            href="/login"
            className="inline-flex items-center gap-2 rounded-xl bg-coral-dark px-6 py-3 text-sm font-bold text-white
              hover:bg-[#C83444] active:scale-95 transition-all shadow-[0_4px_14px_-4px_rgba(224,65,79,.5)]
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral-dark focus-visible:ring-offset-2"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
            </svg>
            Iniciar sesión
          </a>
        </div>
      </div>
    );
  }

  if (rol === 'medico') {
    return (
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 text-center">
        <h1 className="text-2xl font-bold text-gray-900">Buscar turnos</h1>
        <p className="mt-4 text-gray-500">Esta sección es solo para pacientes.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8" style={{ animation: 'ticketIn 0.4s cubic-bezier(.21,1.1,.4,1) both' }}>
      <style>{`@keyframes ticketIn { from { opacity:0; transform:translateY(16px) scale(.98); } to { opacity:1; transform:translateY(0) scale(1); } }`}</style>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Buscar turnos</h1>
        <p className="mt-1 text-sm text-gray-500">Encontrá el turno que necesitás según tu cobertura</p>
      </div>

      <section>
        {loadingOptions ? (
          <div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-6">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="h-6 w-6 rounded-full bg-gray-100 animate-pulse" />
              <div className="h-4 w-40 rounded bg-gray-100 animate-pulse" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="h-12 rounded-xl bg-gray-100 animate-pulse" />
              <div className="h-12 rounded-xl bg-gray-100 animate-pulse" />
            </div>
          </div>
        ) : (
          <SearchFilters
            options={options}
            values={values}
            onChange={handleChange}
            onSubmit={handleSubmit}
            loading={loadingResults}
          />
        )}
      </section>

      <section className="mt-8">
        {error && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {loadingResults ? (
          <TableSkeleton />
        ) : !searched ? null : results.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-white py-16 text-center">
            <svg className="h-10 w-10 text-gray-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" />
            </svg>
            <p className="text-sm font-medium text-gray-500">No se encontraron turnos disponibles</p>
            <p className="mt-1 text-xs text-gray-400">Probá ajustando los filtros o cambiando las fechas</p>
          </div>
        ) : (
          <>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">
              {totalResults} resultado{totalResults !== 1 ? 's' : ''}
            </p>
            <div className="overflow-x-auto rounded-2xl border border-gray-100 bg-white shadow-sm">
              <table className="w-full min-w-[760px] text-left">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/60">
                    {['Día', 'Hora', 'Lugar', 'Profesional', 'Especialidad / Práctica', 'Acciones'].map(h => (
                      <th
                        key={h}
                        onClick={SORTABLE_COLS.includes(h) ? () => toggleSort(h) : undefined}
                        className={[
                          'px-4 py-3.5 text-xs font-semibold uppercase tracking-wide text-gray-400 select-none',
                          SORTABLE_COLS.includes(h) ? 'cursor-pointer hover:text-coral-dark transition-colors' : '',
                        ].join(' ')}
                      >
                        {h}
                        {SORTABLE_COLS.includes(h) && (
                          <SortIcon dir={h === 'Día' ? sortDia : sortHora} />
                        )}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sortedResults.map(t => (
                    <TurnoRow
                      key={t._id || t.id}
                      turno={t}
                      onReservado={id => setResults(prev => prev.filter(r => (r._id || r.id) !== id))}
                    />
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination
              page={page}
              totalPages={totalPages}
              limit={limit}
              onPageChange={p => fetchResults(p)}
              onLimitChange={newLimit => { setLimit(newLimit); fetchResults(1); }}
            />
          </>
        )}
      </section>
    </div>
  );
}
