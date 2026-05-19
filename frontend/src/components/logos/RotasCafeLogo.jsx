export default function RotasCafeLogo({ size = 48 }) {
  const bg     = "#1E100A";
  const maroon = "#8B1A1A";
  const gold   = "#8B6914";
  const cream  = "#F0E8D8";
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none"
         xmlns="http://www.w3.org/2000/svg" aria-label="Logo Rotas Café">
      <circle cx="50" cy="50" r="50" fill={bg}/>
      {/* bar chart bars */}
      <rect x="14" y="62" width="16" height="22" rx="3" fill={maroon} opacity="0.6"/>
      <rect x="36" y="44" width="16" height="40" rx="3" fill={maroon}/>
      <rect x="58" y="30" width="16" height="54" rx="3" fill={gold}/>
      {/* trend line */}
      <polyline points="22,58 44,40 66,26 80,18" stroke={cream} strokeWidth="3.5"
        strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.9"/>
      {/* dot at top */}
      <circle cx="80" cy="18" r="4.5" fill={cream} opacity="0.95"/>
      {/* baseline */}
      <line x1="12" y1="86" x2="88" y2="86" stroke={cream} strokeWidth="2.5"
        strokeLinecap="round" opacity="0.25"/>
    </svg>
  );
}
