const BRAND = import.meta.env.VITE_BRAND || "financecontrol";
export const IS_ROTAS_CAFE = BRAND === "rotas-cafe";
export const APP_NAME = IS_ROTAS_CAFE ? "Rotas Café" : "FinanceControl";
export const APP_SUB  = IS_ROTAS_CAFE ? "Gestão Financeira · Café" : "Gestão Financeira · IFRS";

/* Military Green theme — FinanceControl */
const FC = {
  bg:"#080D06",surface:"#0C1509",card:"#112010",cardB:"#162814",
  border:"#294020",borderL:"#3A5A2C",accent:"#4B7A28",accentSft:"rgba(75,122,40,0.15)",
  gold:"#8B8A2A",goldSft:"rgba(139,138,42,0.14)",green:"#2AAD60",greenSft:"rgba(42,173,96,0.12)",
  red:"#DC3545",redSft:"rgba(220,53,69,0.12)",purple:"#6B8A42",teal:"#3A8A52",
  text:"#E6F2DC",muted:"#789060",faint:"#3A5428",
};

/* Warm Maroon theme — Rotas Café */
const RC = {
  bg:"#0D0805",surface:"#160C08",card:"#1E100A",cardB:"#261408",
  border:"#4A1A0E",borderL:"#6A2418",accent:"#8B1A1A",accentSft:"rgba(139,26,26,0.15)",
  gold:"#8B6914",goldSft:"rgba(139,105,20,0.14)",green:"#5A8A3A",greenSft:"rgba(90,138,58,0.12)",
  red:"#DC3545",redSft:"rgba(220,53,69,0.12)",purple:"#8A4260",teal:"#3A6A5A",
  text:"#F0E8D8",muted:"#907868",faint:"#4A2820",
};

export const C = IS_ROTAS_CAFE ? RC : FC;

export const fmt = n => `R$ ${Number(n||0).toLocaleString("pt-BR",{minimumFractionDigits:2,maximumFractionDigits:2})}`;
export const fmtD = d => d ? new Date(d+"T12:00").toLocaleDateString("pt-BR") : "—";
export const card = (x={}) => ({background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:"20px 24px",...x});
export const pill = c => ({display:"inline-flex",alignItems:"center",gap:4,padding:"2px 10px",borderRadius:20,fontSize:11,fontWeight:600,background:c+"22",color:c,letterSpacing:"0.02em"});
export const inpSt = (err) => ({width:"100%",padding:"9px 12px",borderRadius:7,background:C.card,border:`1px solid ${err?C.red:C.border}`,color:C.text,fontSize:13,outline:"none",boxSizing:"border-box",transition:"border-color 0.15s ease"});
export const selSt = {background:C.card,border:`1px solid ${C.border}`,borderRadius:6,color:C.text,fontSize:12,padding:"6px 10px",cursor:"pointer",outline:"none"};
export const btn = (bg, extra={}) => ({display:"flex",alignItems:"center",justifyContent:"center",gap:8,padding:"10px 18px",borderRadius:8,border:"none",cursor:"pointer",background:bg,color:"#fff",fontSize:13,fontWeight:600,transition:"opacity 0.15s ease, transform 0.1s ease",...extra});
