export default function RotasCafeLogo({ size = 48 }) {
  const cream = "#F2E8D5";
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Logo Rotas Café">
      <circle cx="50" cy="50" r="50" fill="#9B2335"/>

      {/* estrada sinuosa acima da xícara — borda esquerda */}
      <path d="M44 40 C40 34 34 30 36 22 C38 15 46 14 48 8"
            stroke={cream} strokeWidth="3.5" fill="none" strokeLinecap="round"/>
      {/* estrada sinuosa — borda direita */}
      <path d="M52 40 C48 34 42 30 44 22 C46 15 54 14 56 8"
            stroke={cream} strokeWidth="3.5" fill="none" strokeLinecap="round"/>
      {/* marcação central tracejada da estrada */}
      <path d="M48 38 C46 33 43 29 44.5 24 C46 19 51 17 52 12"
            stroke={cream} strokeWidth="1.5" fill="none" strokeLinecap="round"
            strokeDasharray="3 3"/>

      {/* corpo da xícara — outline estilo da logo */}
      <path d="M22 42 L26 72 Q27 76 31 76 L63 76 Q67 76 68 72 L72 42 Z"
            stroke={cream} strokeWidth="3.5" fill="none" strokeLinejoin="round"/>

      {/* café ondulado por dentro */}
      <path d="M28 64 Q37 58 47 63 Q57 68 66 62 L68 72 Q67 76 63 76 L31 76 Q27 76 26 72 Z"
            fill={cream}/>

      {/* alça direita */}
      <path d="M70 50 Q84 50 84 61 Q84 72 70 72"
            stroke={cream} strokeWidth="4" fill="none" strokeLinecap="round"/>

      {/* pires / linha */}
      <rect x="16" y="78" width="62" height="4.5" rx="2.2" fill={cream}/>
    </svg>
  );
}
