/* Paleta derivada da identidade visual do Rotas Café (@rotascafejb) */
export const C = {
  bg:"#0D0805",surface:"#140D07",card:"#1C110A",cardB:"#231509",
  border:"#3D2415",borderL:"#5A3520",accent:"#9B2335",accentSft:"rgba(155,35,53,0.15)",
  gold:"#C97B3C",goldSft:"rgba(201,123,60,0.14)",green:"#2A9D6E",greenSft:"rgba(42,157,110,0.12)",
  red:"#DC3545",redSft:"rgba(220,53,69,0.12)",purple:"#8B6DB5",teal:"#C97B3C",
  text:"#F5E6D3",muted:"#9E826A",faint:"#5A3D28",
};

export const fmt = n => `R$ ${Number(n||0).toLocaleString("pt-BR",{minimumFractionDigits:2,maximumFractionDigits:2})}`;
export const fmtD = d => d ? new Date(d+"T12:00").toLocaleDateString("pt-BR") : "—";
export const card = (x={}) => ({background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:"20px 24px",...x});
export const pill = c => ({display:"inline-flex",alignItems:"center",gap:4,padding:"2px 10px",borderRadius:20,fontSize:11,fontWeight:600,background:c+"22",color:c,letterSpacing:"0.02em"});
export const inpSt = (err) => ({width:"100%",padding:"9px 12px",borderRadius:7,background:C.card,border:`1px solid ${err?C.red:C.border}`,color:C.text,fontSize:13,outline:"none",boxSizing:"border-box",transition:"border-color 0.15s ease"});
export const selSt = {background:C.card,border:`1px solid ${C.border}`,borderRadius:6,color:C.text,fontSize:12,padding:"6px 10px",cursor:"pointer",outline:"none"};
export const btn = (bg, extra={}) => ({display:"flex",alignItems:"center",justifyContent:"center",gap:8,padding:"10px 18px",borderRadius:8,border:"none",cursor:"pointer",background:bg,color:"#fff",fontSize:13,fontWeight:600,transition:"opacity 0.15s ease, transform 0.1s ease",...extra});
