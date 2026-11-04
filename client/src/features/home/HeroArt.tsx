/** Simple original product illustrations for the hero slides (no photos needed). */

export function ChargerArt() {
  return (
    <svg viewBox="0 0 320 320" className="h-full w-full" aria-hidden>
      <circle cx="160" cy="170" r="130" fill="currentColor" opacity="0.08" />
      {/* folding pins */}
      <rect x="128" y="40" width="14" height="46" rx="5" fill="#C9D2E3" />
      <rect x="178" y="40" width="14" height="46" rx="5" fill="#C9D2E3" />
      {/* body, seen at a slight angle */}
      <rect x="92" y="80" width="136" height="186" rx="34" fill="#F4F6FA" />
      <rect x="92" y="80" width="136" height="186" rx="34" fill="url(#chargerShade)" />
      <rect x="92" y="80" width="18" height="186" rx="9" fill="#000" opacity="0.06" />
      {/* port column on the narrow face: 2 x USB-C, 1 x USB-A */}
      <rect x="148" y="150" width="40" height="11" rx="5.5" fill="#1B2230" />
      <rect x="148" y="174" width="40" height="11" rx="5.5" fill="#1B2230" />
      <rect x="144" y="198" width="48" height="16" rx="3" fill="#1B2230" />
      <rect x="150" y="203" width="36" height="5" rx="1" fill="#3A4356" />
      {/* brand mark */}
      <path d="M172 100 156 124h11l-4 17 18-25h-11l4-16z" fill="#2440E6" />
      <text x="168" y="246" textAnchor="middle" fontFamily="Onest, sans-serif" fontSize="15" fontWeight="700" fill="#8A93A3">65W</text>
      <defs>
        <linearGradient id="chargerShade" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0.9" />
          <stop offset="1" stopColor="#B8C3D9" stopOpacity="0.45" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export function PowerBankArt() {
  return (
    <svg viewBox="0 0 320 320" className="h-full w-full" aria-hidden>
      <circle cx="160" cy="165" r="130" fill="#F5B544" opacity="0.10" />
      <path d="M210 262c40 0 58-30 58-62" stroke="#3A4356" strokeWidth="10" fill="none" strokeLinecap="round" />
      <rect x="96" y="44" width="128" height="232" rx="30" fill="#2B3344" />
      <rect x="96" y="44" width="128" height="232" rx="30" fill="url(#bankShade)" />
      <rect x="120" y="78" width="80" height="6" rx="3" fill="#3A4356" />
      {[0, 1, 2, 3].map((i) => (
        <circle key={i} cx={130 + i * 20} cy="236" r="5" fill={i < 3 ? '#F5B544' : '#4B5468'} />
      ))}
      <rect x="140" y="258" width="40" height="10" rx="5" fill="#141922" />
      <defs>
        <linearGradient id="bankShade" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0.12" />
          <stop offset="1" stopColor="#000" stopOpacity="0.2" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export function EarbudsArt() {
  return (
    <svg viewBox="0 0 320 320" className="h-full w-full" aria-hidden>
      <circle cx="160" cy="170" r="130" fill="#1B2230" opacity="0.05" />
      <rect x="70" y="150" width="180" height="120" rx="56" fill="#1B2230" />
      <path d="M70 196h180" stroke="#2E3647" strokeWidth="3" />
      <circle cx="160" cy="236" r="4" fill="#5EE1A3" />
      <g transform="translate(96 54) rotate(-14)">
        <circle cx="34" cy="34" r="34" fill="#1B2230" />
        <circle cx="34" cy="34" r="14" fill="#3A4356" />
        <rect x="22" y="56" width="24" height="70" rx="12" fill="#1B2230" />
      </g>
      <g transform="translate(178 46) rotate(12)">
        <circle cx="34" cy="34" r="34" fill="#1B2230" />
        <circle cx="34" cy="34" r="14" fill="#3A4356" />
        <rect x="22" y="56" width="24" height="70" rx="12" fill="#1B2230" />
      </g>
    </svg>
  );
}
