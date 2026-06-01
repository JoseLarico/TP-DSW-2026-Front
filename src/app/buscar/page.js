"use client";
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getEspecialidades, getPracticas, getMedicos, getSedes } from '@/services/catalogo';
import { buscarTurnos } from '@/services/turnos';
import SearchFilters from '@/components/buscar/SearchFilters';
import TurnoCard from '@/components/buscar/TurnoCard';
import SkeletonCard from '@/components/buscar/SkeletonCard';
import Pagination from '@/components/buscar/Pagination';

export default function BuscarPage() {
  const user = useAuth();
  const pacienteId = user?._id;

  const [options, setOptions] = useState({ especialidades: [], practicas: [], medicos: [], sedes: [] });
  const [values, setValues] = useState({ especialidad: '', practica: '', medico: '', sede: '', fechaDesde: '', fechaHasta: '' });

  const [loadingOptions, setLoadingOptions] = useState(true);
  const [loadingResults, setLoadingResults] = useState(false);
  const [error, setError] = useState(null);
  const [results, setResults] = useState([]);
  const [lastRequest, setLastRequest] = useState(null);
  const [lastResponse, setLastResponse] = useState(null);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
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
        setLoadingOptions(false);
      }
    }
    loadOptions();
    return () => { mounted = false; };
  }, []);

  // auto-fetch results once options are loaded
  useEffect(() => {
    if (!loadingOptions) {
      fetchResults(1).catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadingOptions]);

  const fetchResults = async (p = 1) => {
    setError(null);
    setLoadingResults(true);
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
      const paginaActual = data.paginacion?.pagina || data.page || p;
      setPage(paginaActual);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Error al buscar turnos');
    } finally {
      setLoadingResults(false);
    }
  };

  const handleChange = (field, value) => setValues(prev => ({ ...prev, [field]: value }));

  const handleSubmit = () => fetchResults(1);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold text-gray-900">Buscar turnos</h1>

      <section className="mt-6">
        {loadingOptions ? (
          <div className="space-y-2">
            <div className="h-10 w-full bg-gray-200 animate-pulse rounded" />
            <div className="h-10 w-full bg-gray-200 animate-pulse rounded" />
          </div>
        ) : (
          <SearchFilters options={options} values={values} onChange={handleChange} onSubmit={handleSubmit} loading={loadingResults} />
        )}
      </section>

      <section className="mt-8">
          {error && <div className="text-red-600">{error}</div>}

        {loadingResults ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : (
          <>
            {results.length === 0 ? (
              <div className="text-gray-600">No hay resultados. Probá con otros filtros.</div>
            ) : (
              <div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {results.map(t => <TurnoCard key={t.id} turno={t} />)}
                </div>
                <Pagination page={page} totalPages={totalPages} onChange={(p) => fetchResults(p)} />
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}

