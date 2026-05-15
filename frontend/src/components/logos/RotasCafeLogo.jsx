export default function RotasCafeLogo({ size = 48 }) {
  const cream = "#F2E8D5";
  const road = "M 50 41 L 50 37 C 50 33 64 30 68 30 L 70 30 C 74 30 76 27 76 23 L 76 20 C 76 16 72 14 66 14 L 34 14 C 28 14 24 12 24 9";
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg"
         aria-label="Logo Rotas Café" style={{overflow:"hidden"}}>
      <defs>
        <clipPath id="circle-clip">
          <circle cx="50" cy="50" r="50"/>
        </clipPath>
      </defs>
      <circle cx="50" cy="50" r="50" fill="#9B2335"/>

      <g clipPath="url(#circle-clip)">
        {/* estrada serpentina — traço grosso estilo WindingRoad */}
        <path d={road} stroke={cream} strokeWidth="6" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
        {/* faixa central tracejada */}
        <path d={road} stroke="#9B2335" strokeWidth="1.4" fill="none" strokeLinecap="round" strokeDasharray="3 2.5"/>

        {/* xícara — outline */}
        <path d="M22 42 L26 72 Q27 76 31 76 L63 76 Q67 76 68 72 L72 42 Z"
              stroke={cream} strokeWidth="3.5" fill="none" strokeLinejoin="round"/>
        {/* café ondulado */}
        <path d="M28 64 Q37 58 47 63 Q57 68 66 62 L68 72 Q67 76 63 76 L31 76 Q27 76 26 72 Z"
              fill={cream}/>
        {/* alça */}
        <path d="M70 50 Q84 50 84 61 Q84 72 70 72"
              stroke={cream} strokeWidth="4" fill="none" strokeLinecap="round"/>
        {/* pires */}
        <rect x="16" y="78" width="62" height="4.5" rx="2.2" fill={cream}/>
      </g>
    </svg>
  );
}
