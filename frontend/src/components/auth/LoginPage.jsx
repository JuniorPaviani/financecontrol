import { useState, useEffect } from "react";
import { AlertCircle, Loader2 } from "lucide-react";
import { C, card, inpSt, btn } from "../../styles/theme";
import { API } from "../../api/client";
import RotasCafeLogo from "../logos/RotasCafeLogo";
import WindingRoad from "../logos/WindingRoad";

export default function LoginPage({onLogin}) {
  const [mode,  setMode]  = useState("login");
  const [name,  setName]  = useState("");
  const [email, setEmail] = useState("");
  const [pass,  setPass]  = useState("");
  const [err,   setErr]   = useState("");
  const [loading,setLoading]=useState(false);
  const [serverReady,setServerReady]=useState(false);

  useEffect(()=>{
    let cancelled=false;
    const wake=async()=>{
      for(let i=0;i<5;i++){
        try{ await fetch(`${API}/health`); if(!cancelled)setServerReady(true); return; }
        catch(e){ await new Promise(r=>setTimeout(r,3000)); }
      }
    };
    wake();
    return ()=>{cancelled=true;};
  },[]);

  const handle = async () => {
    setErr(""); setLoading(true);
    try {
      await onLogin(mode, name, email, pass);
    } catch(e) {
      setErr(e.message);
    } finally { setLoading(false); }
  };

  return (
    <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",
      background:`radial-gradient(ellipse 90% 55% at 50% 0%, rgba(155,35,53,0.18) 0%, rgba(201,123,60,0.06) 40%, ${C.bg} 70%)`,
      fontFamily:"'Outfit','Segoe UI',sans-serif",position:"relative",overflow:"hidden"}}>
      {/* Estrada serpenteante — decoração de fundo */}
      <div style={{position:"absolute",bottom:-40,right:-60,opacity:1}}>
        <WindingRoad width={300} height={440} color="#C97B3C" opacity={0.09}/>
      </div>
      <div style={{position:"absolute",top:-60,left:-40,opacity:1,transform:"scaleX(-1) rotate(10deg)"}}>
        <WindingRoad width={220} height={340} color="#9B2335" opacity={0.06}/>
      </div>
      <div style={{...card({background:C.surface,
        boxShadow:"0 0 0 1px rgba(155,35,53,0.12), 0 32px 80px rgba(0,0,0,0.7), 0 8px 24px rgba(0,0,0,0.4)"}),
        width:"100%",maxWidth:400,padding:"36px 28px",margin:"16px"}}>

        <div style={{textAlign:"center",marginBottom:30}}>
          <div style={{marginBottom:16,filter:`drop-shadow(0 0 16px rgba(155,35,53,0.5)) drop-shadow(0 4px 10px rgba(0,0,0,0.5))`}}>
            <RotasCafeLogo size={64}/>
          </div>
          <h1 style={{fontSize:22,fontWeight:700,color:C.text,margin:0,letterSpacing:"-0.02em",fontFamily:"'Lora','Georgia',serif"}}>FinanceControl</h1>
          <p style={{color:C.muted,fontSize:12,marginTop:6,letterSpacing:"0.08em",textTransform:"uppercase"}}>Gestão Financeira · IFRS</p>
          {!serverReady && (
            <div style={{display:"flex",alignItems:"center",gap:6,justifyContent:"center",marginTop:12,
              padding:"7px 14px",borderRadius:8,background:C.goldSft,border:`1px solid ${C.gold}33`}}>
              <Loader2 size={12} color={C.gold} style={{animation:"spin .8s linear infinite"}}/>
              <span style={{fontSize:11,color:C.gold,fontWeight:500}}>Conectando ao servidor...</span>
            </div>
          )}
        </div>

        <div style={{display:"flex",background:C.card,borderRadius:9,padding:3,marginBottom:24,border:`1px solid ${C.border}`}}>
          {[["login","Entrar"],["register","Criar conta"]].map(([v,l])=>(
            <button key={v} onClick={()=>setMode(v)} style={{flex:1,padding:"8px",borderRadius:7,border:"none",
              cursor:"pointer",background:mode===v?C.accent:"transparent",
              color:mode===v?"#fff":C.muted,fontSize:13,fontWeight:600,
              transition:"all 0.2s ease"}}>
              {l}
            </button>
          ))}
        </div>

        {mode==="register" && (
          <div style={{marginBottom:16}}>
            <label style={{display:"block",fontSize:11,fontWeight:600,color:C.muted,marginBottom:6,textTransform:"uppercase",letterSpacing:"0.06em"}}>Nome</label>
            <input type="text" value={name} onChange={e=>setName(e.target.value)} placeholder="Seu nome completo"
              style={inpSt(false)}/>
          </div>
        )}

        {[["E-mail","email",email,setEmail,"email"],["Senha","password",pass,setPass,"password"]].map(([l,id,v,s,t])=>(
          <div key={id} style={{marginBottom:16}}>
            <label style={{display:"block",fontSize:11,fontWeight:600,color:C.muted,marginBottom:6,textTransform:"uppercase",letterSpacing:"0.06em"}}>{l}</label>
            <input type={t} value={v} onChange={e=>s(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handle()}
              placeholder={t==="password"?"••••••••":"seu@email.com"} style={inpSt(false)}/>
          </div>
        ))}

        {err && (
          <div style={{padding:"10px 13px",borderRadius:8,background:C.redSft,border:`1px solid ${C.red}33`,
            color:C.red,fontSize:12,marginBottom:16,display:"flex",alignItems:"center",gap:8}}>
            <AlertCircle size={13}/>{err}
          </div>
        )}

        <button onClick={handle} disabled={loading} style={{...btn(loading?C.faint:C.accent,{width:"100%",padding:"12px",fontSize:14,
          boxShadow:loading?"none":`0 4px 14px rgba(37,99,235,0.35)`})}}>
          {loading?<><Loader2 size={15} style={{animation:"spin .8s linear infinite"}}/>Aguardando...</>:
          mode==="login"?"Entrar no Sistema":"Criar Conta"}
        </button>
      </div>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Lora:wght@500;600;700&family=Outfit:wght@400;500;600;700&family=Space+Mono:wght@400;700&display=swap');@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
