export default function RotasCafeLogo({ size = 48 }) {
  const cream = "#F2E8D5";
  const bg = "#9B2335";
  const w1 = "M 36 43 C 34 37 28 30 26 22 C 24 14 28 9 30 6";
  const w2 = "M 44 42 C 43 36 40 28 41 20 C 42 13 46 9 45 6";
  const w3 = "M 51 42 C 51 37 52 30 54 23 C 56 16 58 12 57 9";
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none"
         xmlns="http://www.w3.org/2000/svg" aria-label="Logo Rotas Café">
      <circle cx="50" cy="50" r="50" fill={bg}/>

      {/* 3 wisps — estradas com tracinhos de faixa central */}
      <path d={w1} stroke={cream} strokeWidth="4.5" fill="none" strokeLinecap="round"/>
      <path d={w1} stroke={bg} strokeWidth="1.3" fill="none" strokeLinecap="round" strokeDasharray="2.5 2.5"/>
      <path d={w2} stroke={cream} strokeWidth="4" fill="none" strokeLinecap="round"/>
      <path d={w2} stroke={bg} strokeWidth="1.2" fill="none" strokeLinecap="round" strokeDasharray="2.5 2.5"/>
      <path d={w3} stroke={cream} strokeWidth="3.5" fill="none" strokeLinecap="round"/>
      <path d={w3} stroke={bg} strokeWidth="1.1" fill="none" strokeLinecap="round" strokeDasharray="2.5 2.5"/>

      {/* xícara — outline */}
      <path d="M20 44 L24 74 Q25 78 30 78 L64 78 Q69 78 70 74 L74 44 Z"
            stroke={cream} strokeWidth="4" fill="none" strokeLinejoin="round"/>
      {/* café ondulado */}
      <path d="M26 66 Q37 60 47 65 Q57 70 68 64 L70 74 Q69 78 64 78 L30 78 Q25 78 24 74 Z"
            fill={cream}/>
      {/* alça */}
      <path d="M72 53 Q84 53 84 63 Q84 73 72 73"
            stroke={cream} strokeWidth="4.5" fill="none" strokeLinecap="round"/>
      {/* pires */}
      <rect x="14" y="80" width="66" height="5" rx="2.5" fill={cream}/>
    </svg>
  );
}
