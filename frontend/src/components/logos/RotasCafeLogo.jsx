export default function RotasCafeLogo({ size = 48 }) {
  const cream = "#F2E8D5";
  const bg = "#9B2335";
  const w1 = "M 31 47 C 27 37 18 27 22 15 C 26 6 32 3 29 0";
  const w2 = "M 41 46 C 38 36 36 25 39 14 C 42 5 46 3 44 0";
  const w3 = "M 50 45 C 51 37 54 28 57 20 C 59 13 61 8 58 5";
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none"
         xmlns="http://www.w3.org/2000/svg" aria-label="Logo Rotas Café">
      <circle cx="50" cy="50" r="50" fill={bg}/>

      {/* wisp esquerdo — espesso com marcação de estrada */}
      <path d={w1} stroke={cream} strokeWidth="9" fill="none" strokeLinecap="round"/>
      <path d={w1} stroke={bg} strokeWidth="3" fill="none" strokeLinecap="butt" strokeDasharray="7 6"/>

      {/* wisp central — espesso com marcação de estrada */}
      <path d={w2} stroke={cream} strokeWidth="8" fill="none" strokeLinecap="round"/>
      <path d={w2} stroke={bg} strokeWidth="2.5" fill="none" strokeLinecap="butt" strokeDasharray="7 6"/>

      {/* wisp direito — menor, sem marcação */}
      <path d={w3} stroke={cream} strokeWidth="7" fill="none" strokeLinecap="round"/>

      {/* xícara — outline largo */}
      <path d="M 7 47 L 13 79 Q 14 84 20 84 L 65 84 Q 71 84 72 79 L 78 47 Z"
            stroke={cream} strokeWidth="6" fill="none" strokeLinejoin="round"/>
      {/* café ondulado */}
      <path d="M 16 70 Q 28 62 40 68 Q 52 74 64 67 L 72 79 Q 71 84 65 84 L 20 84 Q 14 84 13 79 Z"
            fill={cream}/>
      {/* alça */}
      <path d="M 76 57 Q 90 57 90 67 Q 90 77 76 77"
            stroke={cream} strokeWidth="6" fill="none" strokeLinecap="round"/>
      {/* pires */}
      <rect x="14" y="86" width="58" height="5" rx="2.5" fill={cream}/>
    </svg>
  );
}
