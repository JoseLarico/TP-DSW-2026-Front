export default function FiltroPills({ opciones, valor, onChange, ariaLabel }) {
  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label={ariaLabel}>
      {opciones.map(({ key, label, color }) => (
        <button
          key={key}
          onClick={() => onChange(key)}
          aria-pressed={valor === key}
          className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral-dark
            ${color} ${valor === key ? 'ring-2 ring-offset-1 ring-current' : 'opacity-75 hover:opacity-90'}`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
