export default function RotasCafeLogo({ size = 48 }) {
  const bg     = "#1E3A5F";
  const accent = "#2563EB";
  const light  = "#93C5FD";
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none"
         xmlns="http://www.w3.org/2000/svg" aria-label="Logo Rotas Café">
      <circle cx="50" cy="50" r="50" fill={bg}/>
      {/* bar chart bars */}
      <rect x="14" y="58" width="16" height="26" rx="3" fill={light} opacity="0.7"/>
      <rect x="36" y="40" width="16" height="44" rx="3" fill={accent}/>
      <rect x="58" y="28" width="16" height="56" rx="3" fill={light}/>
      {/* trend line */}
      <polyline points="22,54 44,36 66,24 80,18" stroke="#FFFFFF" strokeWidth="3.5"
        strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.85"/>
      {/* dot at top */}
      <circle cx="80" cy="18" r="4.5" fill="#FFFFFF" opacity="0.9"/>
      {/* baseline */}
      <line x1="12" y1="86" x2="88" y2="86" stroke="#FFFFFF" strokeWidth="3"
        strokeLinecap="round" opacity="0.3"/>
    </svg>
  );
}
