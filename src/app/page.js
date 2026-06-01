import Link from 'next/link';
import Button from '@/components/ui/Button';

const FEATURES = [
  {
    title: 'Buscá por especialidad',
    desc: 'Filtrá turnos por especialidad, práctica, médico o sede según tu cobertura.',
    icon: (
      <svg className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" />
      </svg>
    ),
  },
  {
    title: 'Reservá en segundos',
    desc: 'Preseleccioná los turnos que te interesan y confirmalos con un clic.',
    icon: (
      <svg className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    title: 'Seguí tus turnos',
    desc: 'Gestioná, cancelá o modificá tus turnos desde tu panel personal.',
    icon: (
      <svg className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
];

export default function HomePage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
          Sweet Medical
        </h1>
        <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
          Buscá y reservá turnos médicos de acuerdo a tu obra social. Rápido, simple y sin llamadas telefónicas.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/buscar">
            <Button size="lg">Buscar turno</Button>
          </Link>
          <Link href="/login">
            <Button size="lg" variant="secondary">Iniciar sesión</Button>
          </Link>
        </div>
      </div>

      <div className="mt-20 grid grid-cols-1 gap-6 sm:grid-cols-3">
        {FEATURES.map(({ title, desc, icon }) => (
          <div
            key={title}
            className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm text-center"
          >
            <div className="flex justify-center">{icon}</div>
            <h2 className="mt-3 font-semibold text-gray-900">{title}</h2>
            <p className="mt-1 text-sm text-gray-600">{desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
