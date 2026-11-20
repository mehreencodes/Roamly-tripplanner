export default function Logo({ light = false }: { light?: boolean }) {
  return (
    <span className="flex items-center gap-2.5">
      <svg width="34" height="34" viewBox="0 0 36 36" fill="none" aria-hidden="true">
        <rect width="36" height="36" rx="11" className={light ? 'fill-white' : 'fill-forest'} />
        <path
          d="M9 24c4-1 5-8 9-8s4 6 9 3"
          stroke="#d9693f"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeDasharray="1 4.2"
        />
        <circle cx="9" cy="24" r="2.4" fill="#d9693f" />
        <circle cx="27" cy="19" r="3.2" className={light ? 'fill-forest' : 'fill-cream'} />
      </svg>
      <span
        className={`font-display text-2xl font-semibold tracking-tight ${
          light ? 'text-white' : 'text-forest'
        }`}
      >
        Roamly
      </span>
    </span>
  )
}