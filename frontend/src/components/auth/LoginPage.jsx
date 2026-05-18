import { useState, useEffect } from "react";
import { AlertCircle, Loader2, CheckCircle2 } from "lucide-react";
import { C, card, inpSt, btn, IS_ROTAS_CAFE, APP_NAME, APP_SUB } from "../../styles/theme";
import { API } from "../../api/client";
import FinanceControlLogo from "../logos/FinanceControlLogo";
import RotasCafeLogo from "../logos/RotasCafeLogo";
const Logo = IS_ROTAS_CAFE ? RotasCafeLogo : FinanceControlLogo;

export default function LoginPage({onLogin}) {
  const [mode,  setMode]  = useState("login"); // "login" | "register" | "forgot"
  const [name,  setName]  = useState("");
  const [email, setEmail] = useState("");
  const [pass,  setPass]  = useState("");
  const [err,   setErr]   = useState("");
  const [loading,setLoading]=useState(false);
  const [serverReady,setServerReady]=useState(false);
  const [forgotSent, setForgotSent] = useState(false);

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
      if (mode === "forgot") {
        const res  = await fetch(`${API}/auth/forgot-password`, {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({ email }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.detail || "Erro ao enviar e-mail.");
        setForgotSent(true);
      } else {
        await onLogin(mode, name, email, pass);
      }
    } catch(e) {
      setErr(e.message);
    } finally { setLoading(false); }
  };

  return (
    <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",
      background:`radial-gradient(ellipse 90% 55% at 50% 0%, ${C.accent}30 0%, ${C.accent}0a 40%, ${C.bg} 70%)`,
      fontFamily:"'Outfit','Segoe UI',sans-serif",position:"relative",overflow:"hidden"}}>
      <div style={{...card({background:C.surface,
        boxShadow:`0 0 0 1px ${C.accent}1f, 0 32px 80px rgba(0,0,0,0.7), 0 8px 24px rgba(0,0,0,0.4)`}),
        width:"100%",maxWidth:400,padding:"36px 28px",margin:"16px"}}>

        <div style={{textAlign:"center",marginBottom:30}}>
          <div style={{marginBottom:16,filter:`drop-shadow(0 0 16px ${C.accent}80) drop-shadow(0 4px 10px rgba(0,0,0,0.5))`}}>
            <Logo size={64}/>
          </div>
          <h1 style={{fontSize:22,fontWeight:700,color:C.text,margin:0,letterSpacing:"-0.02em",fontFamily:"'Lora','Georgia',serif"}}>{APP_NAME}</h1>
          <p style={{color:C.muted,fontSize:12,marginTop:6,letterSpacing:"0.08em",textTransform:"uppercase"}}>{APP_SUB}</p>
          {!serverReady && (
            <div style={{display:"flex",alignItems:"center",gap:6,justifyContent:"center",marginTop:12,
              padding:"7px 14px",borderRadius:8,background:C.goldSft,border:`1px solid ${C.gold}33`}}>
              <Loader2 size={12} color={C.gold} style={{animation:"spin .8s linear infinite"}}/>
              <span style={{fontSize:11,color:C.gold,fontWeight:500}}>Conectando ao servidor...</span>
            </div>
          )}
        </div>

        {mode !== "forgot" && (
          <div style={{display:"flex",background:C.card,borderRadius:9,padding:3,marginBottom:24,border:`1px solid ${C.border}`}}>
            {[["login","Entrar"],["register","Criar conta"]].map(([v,l])=>(
              <button key={v} onClick={()=>{setMode(v);setErr("");}} style={{flex:1,padding:"8px",borderRadius:7,border:"none",
                cursor:"pointer",background:mode===v?C.accent:"transparent",
                color:mode===v?"#fff":C.muted,fontSize:13,fontWeight:600,
                transition:"all 0.2s ease"}}>
                {l}
              </button>
            ))}
          </div>
        )}

        {/* ── Modo: Esqueci a senha ── */}
        {mode === "forgot" && (
          forgotSent ? (
            <div style={{padding:"20px",borderRadius:10,background:C.greenSft,
              border:`1px solid ${C.green}44`,textAlign:"center",marginBottom:16}}>
              <CheckCircle2 size={28} color={C.green} style={{marginBottom:10}}/>
              <p style={{color:C.green,fontWeight:700,fontSize:14,margin:"0 0 6px"}}>E-mail enviado!</p>
              <p style={{color:C.muted,fontSize:12,margin:"0 0 16px"}}>
                Se o endereço estiver cadastrado, você receberá as instruções em breve.<br/>
                Verifique também a caixa de spam.
              </p>
              <button onClick={()=>{setMode("login");setForgotSent(false);setEmail("");}}
                style={{fontSize:12,color:C.accent,background:"none",border:"none",cursor:"pointer",textDecoration:"underline"}}>
                Voltar ao login
              </button>
            </div>
          ) : (
            <>
              <div style={{marginBottom:8}}>
                <button onClick={()=>{setMode("login");setErr("");}}
                  style={{fontSize:11,color:C.muted,background:"none",border:"none",cursor:"pointer",
                    display:"flex",alignItems:"center",gap:4,marginBottom:16,padding:0}}>
                  ← Voltar ao login
                </button>
                <p style={{color:C.muted,fontSize:13,margin:"0 0 20px",lineHeight:1.5}}>
                  Informe seu e-mail e enviaremos um link para redefinir sua senha.
                </p>
              </div>
              <div style={{marginBottom:16}}>
                <label style={{display:"block",fontSize:11,fontWeight:600,color:C.muted,marginBottom:6,textTransform:"uppercase",letterSpacing:"0.06em"}}>E-mail</label>
                <input type="email" value={email} onChange={e=>setEmail(e.target.value)}
                  onKeyDown={e=>e.key==="Enter"&&handle()}
                  placeholder="seu@email.com" style={inpSt(false)}/>
              </div>
            </>
          )
        )}

        {/* ── Modo: Login / Cadastro ── */}
        {mode !== "forgot" && (
          <>
            {mode==="register" && (
              <div style={{marginBottom:16}}>
                <label style={{display:"block",fontSize:11,fontWeight:600,color:C.muted,marginBottom:6,textTransform:"uppercase",letterSpacing:"0.06em"}}>Nome</label>
                <input type="text" value={name} onChange={e=>setName(e.target.value)} placeholder="Seu nome completo"
                  style={inpSt(false)}/>
              </div>
            )}
            {[
              [mode==="register"?"E-mail":"E-mail ou Login","email",email,setEmail, mode==="register"?"email":"text"],
              ["Senha","password",pass,setPass,"password"]
            ].map(([l,id,v,s,t])=>(
              <div key={id} style={{marginBottom:16}}>
                <label style={{display:"block",fontSize:11,fontWeight:600,color:C.muted,marginBottom:6,textTransform:"uppercase",letterSpacing:"0.06em"}}>{l}</label>
                <input type={t} value={v} onChange={e=>s(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handle()}
                  placeholder={t==="password"?"••••••••":mode==="register"?"seu@email.com":"seu@email.com ou ADM.LOGIN"} style={inpSt(false)}/>
              </div>
            ))}
            {mode === "login" && (
              <div style={{textAlign:"right",marginTop:-8,marginBottom:14}}>
                <button onClick={()=>{setMode("forgot");setErr("");setPass("");}}
                  style={{fontSize:11,color:C.muted,background:"none",border:"none",cursor:"pointer",
                    textDecoration:"underline",padding:0}}>
                  Esqueci a senha
                </button>
              </div>
            )}
          </>
        )}

        {err && (
          <div style={{padding:"10px 13px",borderRadius:8,background:C.redSft,border:`1px solid ${C.red}33`,
            color:C.red,fontSize:12,marginBottom:16,display:"flex",alignItems:"center",gap:8}}>
            <AlertCircle size={13}/>{err}
          </div>
        )}

        {!forgotSent && (
          <button onClick={handle} disabled={loading} style={{...btn(loading?C.faint:C.accent,{width:"100%",padding:"12px",fontSize:14,
            boxShadow:loading?"none":`0 4px 14px rgba(155,35,53,0.35)`})}}>
            {loading?<><Loader2 size={15} style={{animation:"spin .8s linear infinite"}}/>Aguardando...</>:
             mode==="login"?"Entrar no Sistema":
             mode==="register"?"Criar Conta":
             "Enviar Link de Redefinição"}
          </button>
        )}
      </div>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Lora:wght@500;600;700&family=Outfit:wght@400;500;600;700&family=Space+Mono:wght@400;700&display=swap');@keyframes spin{to{transform:rotate(360deg)}}body{background:${C.bg}}`}</style>
    </div>
  );
}
