export default function RotasCafeLogo({ size = 48 }) {
  const cream = "#F2E8D5";
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Logo Rotas Café">
      <circle cx="50" cy="50" r="50" fill="#9B2335"/>

      {/* vapores — 3 wisps curvos como na logo */}
      <path d="M33 34 C31 30 33 26 31 22" stroke={cream} strokeWidth="3" fill="none" strokeLinecap="round"/>
      <path d="M43 32 C41 27 44 23 42 18" stroke={cream} strokeWidth="3" fill="none" strokeLinecap="round"/>
      <path d="M53 34 C51 30 53 26 51 22" stroke={cream} strokeWidth="3" fill="none" strokeLinecap="round"/>

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
