export default function RotasCafeLogo({ size = 48 }) {
  const maroon = "#8B1A1A";
  const cream  = "#F0EAD0";
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none"
         xmlns="http://www.w3.org/2000/svg" aria-label="Logo Rotas Café">
      <circle cx="50" cy="50" r="50" fill={cream}/>
      {/* steam */}
      <path d="M36 32 C33 26 37 20 34 14" stroke={maroon} strokeWidth="3.5" strokeLinecap="round" fill="none"/>
      <path d="M50 30 C47 23 51 16 48 9"  stroke={maroon} strokeWidth="3.5" strokeLinecap="round" fill="none"/>
      {/* cup outer */}
      <path d="M18 40 L22 78 Q50 86 78 78 L82 40 Z" fill={maroon}/>
      {/* cup inner / cream fill */}
      <path d="M25 44 L28 74 Q50 80 72 74 L75 44 Z" fill={cream}/>
      {/* coffee surface inside */}
      <ellipse cx="50" cy="52" rx="22" ry="7" fill={maroon} opacity="0.55"/>
      {/* handle */}
      <path d="M82 48 Q96 48 96 60 Q96 72 82 72" stroke={maroon} strokeWidth="7" strokeLinecap="round" fill="none"/>
    </svg>
  );
}
