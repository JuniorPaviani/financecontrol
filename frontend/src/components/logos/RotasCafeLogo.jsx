export default function RotasCafeLogo({ size = 48 }) {
  const cream = "#F2E8D5";
  const bg = "#9B2335";
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none"
         xmlns="http://www.w3.org/2000/svg" aria-label="Logo FinanceControl">
      <circle cx="50" cy="50" r="50" fill={bg}/>

      {/* eixos */}
      <line x1="15" y1="78" x2="87" y2="78" stroke={cream} strokeWidth="2" strokeLinecap="round" opacity="0.45"/>
      <line x1="15" y1="20" x2="15" y2="79" stroke={cream} strokeWidth="2" strokeLinecap="round" opacity="0.45"/>

      {/* área sob a linha */}
      <polygon points="22,68 40,52 60,40 78,25 78,78 22,78" fill={cream} opacity="0.12"/>

      {/* linha do gráfico */}
      <polyline points="22,68 40,52 60,40 78,25"
                stroke={cream} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>

      {/* pontos */}
      <circle cx="22" cy="68" r="4.5" fill={bg} stroke={cream} strokeWidth="3"/>
      <circle cx="40" cy="52" r="4.5" fill={bg} stroke={cream} strokeWidth="3"/>
      <circle cx="60" cy="40" r="4.5" fill={bg} stroke={cream} strokeWidth="3"/>
      <circle cx="78" cy="25" r="4.5" fill={bg} stroke={cream} strokeWidth="3"/>
    </svg>
  );
}
