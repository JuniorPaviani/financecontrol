export default function FinanceControlLogo({ size = 48 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="FinanceControl Logo">
      <circle cx="50" cy="50" r="50" fill="#4B7A28"/>
      {/* Bar chart */}
      <rect x="18" y="54" width="15" height="30" rx="3" fill="white" opacity="0.85"/>
      <rect x="42" y="38" width="15" height="46" rx="3" fill="white"/>
      <rect x="66" y="24" width="15" height="60" rx="3" fill="white" opacity="0.85"/>
      {/* Trend line */}
      <polyline points="25,56 50,40 74,26" stroke="rgba(255,255,255,0.45)" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="25" cy="56" r="3" fill="white" opacity="0.7"/>
      <circle cx="50" cy="40" r="3" fill="white" opacity="0.7"/>
      <circle cx="74" cy="26" r="3.5" fill="white"/>
    </svg>
  );
}
