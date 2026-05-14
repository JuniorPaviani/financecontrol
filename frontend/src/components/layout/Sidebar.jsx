import { useState, useEffect } from "react";
import { LayoutDashboard, CreditCard, Upload, Tag, BarChart2, LogOut, Users } from "lucide-react";
import { C } from "../../styles/theme";
import RotasCafeLogo from "../logos/RotasCafeLogo";
import WindingRoad from "../logos/WindingRoad";

export default function Sidebar({active, set, user, onLogout}) {
  const nav = [
    {id:"dashboard",    icon:LayoutDashboard, label:"Dashboard"},
    {id:"transactions", icon:CreditCard,      label:"Lançamentos"},
    {id:"import",       icon:Upload,          label:"Importar"},
    {id:"cards",        icon:CreditCard,      label:"Cartões"},
    {id:"categories",   icon:Tag,             label:"Categorias"},
    {id:"reports",      icon:BarChart2,       label:"Relatórios"},
    ...(user?.role === "admin" ? [{id:"employees", icon:Users, label:"Funcionários"}] : []),
  ];

  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(()=>{
    const h=()=>setIsMobile(window.innerWidth<768);
    window.addEventListener("resize",h); return ()=>window.removeEventListener("resize",h);
  },[]);

  const roleLabel = user?.role === "admin" ? "Administrador" : "Usuário";

  if(isMobile) return (
    <div style={{position:"fixed",bottom:0,left:0,right:0,background:C.surface,
      borderTop:`1px solid ${C.border}`,
      display:"flex",alignItems:"center",justifyContent:"space-around",
      padding:"6px 0 env(safe-area-inset-bottom, 6px)",zIndex:999,
      fontFamily:"'Outfit','Segoe UI',sans-serif",
      backdropFilter:"blur(12px)"}}>
      {nav.map(({id,icon:Icon,label})=>{
        const on=active===id;
        return (
          <button key={id} onClick={()=>set(id)} style={{display:"flex",flexDirection:"column",alignItems:"center",
            gap:3,padding:"6px 8px",border:"none",cursor:"pointer",background:"transparent",
            color:on?C.accent:C.muted,fontSize:9,fontWeight:on?700:400,
            transition:"color 0.15s ease",borderRadius:8,minWidth:44,minHeight:44,justifyContent:"center"}}>
            <Icon size={18}/>{label}
          </button>
        );
      })}
      <button onClick={onLogout} style={{display:"flex",flexDirection:"column",alignItems:"center",
        gap:3,padding:"6px 8px",border:"none",cursor:"pointer",background:"transparent",color:C.muted,
        fontSize:9,transition:"color 0.15s ease",borderRadius:8,minWidth:44,minHeight:44,justifyContent:"center"}}>
        <LogOut size={18}/>Sair
      </button>
    </div>
  );

  return (
    <div style={{width:220,height:"100vh",background:C.surface,borderRight:`1px solid ${C.border}`,
      display:"flex",flexDirection:"column",flexShrink:0,fontFamily:"'Outfit','Segoe UI',sans-serif",
      position:"relative",overflow:"hidden"}}>
      {/* estrada decorativa na sidebar */}
      <div style={{position:"absolute",bottom:-20,right:-30,pointerEvents:"none"}}>
        <WindingRoad width={180} height={280} color="#C97B3C" opacity={0.08}/>
      </div>
      <div style={{padding:"22px 18px 14px",borderBottom:`1px solid ${C.border}`}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{filter:`drop-shadow(0 0 6px rgba(155,35,53,0.4))`}}>
            <RotasCafeLogo size={34}/>
          </div>
          <div>
            <div style={{fontSize:13,fontWeight:600,color:C.text,fontFamily:"'Lora','Georgia',serif"}}>FinanceControl</div>
            <div style={{fontSize:10,color:C.faint}}>v2.6 · IFRS</div>
          </div>
        </div>
      </div>

      <nav style={{flex:1,padding:"10px 8px",overflowY:"auto"}}>
        {nav.map(({id,icon:Icon,label})=>{
          const on=active===id;
          return (
            <button key={id} onClick={()=>set(id)} style={{width:"100%",display:"flex",alignItems:"center",
              gap:9,padding:"9px 12px",borderRadius:8,border:"none",cursor:"pointer",
              background:on?C.accentSft:"transparent",
              color:on?C.accent:C.muted,
              fontSize:13,fontWeight:on?600:400,marginBottom:2,textAlign:"left",
              position:"relative",transition:"all 0.15s ease",
              borderLeft:on?`2px solid ${C.accent}`:"2px solid transparent"}}>
              <Icon size={15}/>{label}
            </button>
          );
        })}
      </nav>

      <div style={{padding:"12px 8px",borderTop:`1px solid ${C.border}`}}>
        <div style={{display:"flex",alignItems:"center",gap:9,padding:"8px 12px",marginBottom:4,
          background:C.card,borderRadius:8,border:`1px solid ${C.border}`}}>
          <div style={{width:30,height:30,borderRadius:"50%",
            background:`linear-gradient(135deg, ${C.accent}, #1d4ed8)`,
            display:"flex",alignItems:"center",justifyContent:"center",
            fontSize:12,fontWeight:700,color:"#fff",flexShrink:0,
            boxShadow:"0 2px 8px rgba(37,99,235,0.35)"}}>
            {user?.name?.charAt(0)?.toUpperCase()}
          </div>
          <div style={{flex:1,overflow:"hidden"}}>
            <div style={{fontSize:12,fontWeight:600,color:C.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{user?.name}</div>
            <div style={{fontSize:10,color:C.faint}}>{roleLabel}</div>
          </div>
        </div>
        <button onClick={onLogout} style={{width:"100%",display:"flex",alignItems:"center",gap:8,
          padding:"8px 12px",borderRadius:8,border:"none",cursor:"pointer",
          background:"transparent",color:C.muted,fontSize:12,transition:"color 0.15s ease"}}>
          <LogOut size={12}/>Sair da conta
        </button>
      </div>
    </div>
  );
}
