export default function RotasCafeLogo({ size = 48 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Logo Rotas Café">
      <circle cx="50" cy="50" r="50" fill="#9B2335"/>
      {/* vapor esquerdo */}
      <path d="M36 33 C34 29 36 25 34 21" stroke="white" strokeWidth="3.2" fill="none" strokeLinecap="round"/>
      {/* vapor direito */}
      <path d="M50 31 C48 27 50 23 48 19" stroke="white" strokeWidth="3.2" fill="none" strokeLinecap="round"/>
      {/* corpo da xícara */}
      <path d="M26 42 L26 68 Q26 73 31 73 L63 73 Q68 73 68 68 L68 42 Z" fill="white"/>
      {/* alça */}
      <path d="M68 50 Q80 50 80 60 Q80 70 68 70" stroke="white" strokeWidth="4.5" fill="none" strokeLinecap="round"/>
      {/* pires */}
      <rect x="20" y="74" width="54" height="5" rx="2.5" fill="white" opacity="0.85"/>
    </svg>
  );
}
