import { useState, useEffect, useCallback } from "react";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  ComposedChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer
} from "recharts";
import {
  LayoutDashboard, CreditCard, Upload, Tag, BarChart2,
  LogOut, TrendingUp, TrendingDown, Wallet, Filter, Plus,
  CheckCircle2, Clock, Building2, Search, X, AlertCircle,
  Shield, Loader2, Trash2, ChevronDown
} from "lucide-react";

/* ═══════════════════════════════════════════════
   CONFIG
═══════════════════════════════════════════════ */
const API = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

/* Paleta derivada da identidade visual do Rotas Café (@rotascafejb) */
const C = {
  bg:"#0D0805",surface:"#140D07",card:"#1C110A",cardB:"#231509",
  border:"#3D2415",borderL:"#5A3520",accent:"#9B2335",accentSft:"rgba(155,35,53,0.15)",
  gold:"#C97B3C",goldSft:"rgba(201,123,60,0.14)",green:"#2A9D6E",greenSft:"rgba(42,157,110,0.12)",
  red:"#DC3545",redSft:"rgba(220,53,69,0.12)",purple:"#8B6DB5",teal:"#C97B3C",
  text:"#F5E6D3",muted:"#9E826A",faint:"#5A3D28",
};

const fmt = n => `R$ ${Number(n||0).toLocaleString("pt-BR",{minimumFractionDigits:2,maximumFractionDigits:2})}`;
const fmtD = d => d ? new Date(d+"T12:00").toLocaleDateString("pt-BR") : "—";
const card = (x={}) => ({background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:"20px 24px",...x});
const pill = c => ({display:"inline-flex",alignItems:"center",gap:4,padding:"2px 10px",borderRadius:20,fontSize:11,fontWeight:600,background:c+"22",color:c,letterSpacing:"0.02em"});
const inpSt = (err) => ({width:"100%",padding:"9px 12px",borderRadius:7,background:C.card,border:`1px solid ${err?C.red:C.border}`,color:C.text,fontSize:13,outline:"none",boxSizing:"border-box",transition:"border-color 0.15s ease"});
const selSt = {background:C.card,border:`1px solid ${C.border}`,borderRadius:6,color:C.text,fontSize:12,padding:"6px 10px",cursor:"pointer",outline:"none"};
const btn = (bg, extra={}) => ({display:"flex",alignItems:"center",justifyContent:"center",gap:8,padding:"10px 18px",borderRadius:8,border:"none",cursor:"pointer",background:bg,color:"#fff",fontSize:13,fontWeight:600,transition:"opacity 0.15s ease, transform 0.1s ease",...extra});

/* ═══════════════════════════════════════════════
   API HELPER
═══════════════════════════════════════════════ */
async function apiFetch(path, options={}, token=null) {
  const headers = { "Content-Type":"application/json", ...(token?{Authorization:`Bearer ${token}`}:{}) };
  const reqHeaders = options.body instanceof FormData ? (token?{Authorization:`Bearer ${token}`}:{}) : headers;
  const MAX_RETRIES = 3;
  let lastError;
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const res = await fetch(`${API}${path}`, {...options, headers: reqHeaders});
      if (!res.ok) {
        const err = await res.json().catch(()=>({detail:res.statusText}));
        const msg = err.detail || "Erro desconhecido";
        if (res.status === 401) throw new Error("E-mail ou senha incorretos.");
        if (res.status === 400) throw new Error(msg);
        throw new Error(msg);
      }
      return res.json();
    } catch(e) {
      lastError = e;
      if (e.message.includes("incorretos") || e.message.includes("cadastrado")) throw e;
      if (attempt < MAX_RETRIES - 1) await new Promise(r => setTimeout(r, 2000 * (attempt + 1)));
    }
  }
  throw new Error(lastError?.message || "Servidor indisponível. Aguarde alguns segundos e tente novamente.");
}

/* ═══════════════════════════════════════════════
   AUTH CONTEXT (simple)
═══════════════════════════════════════════════ */
function useAuth() {
  const [token, setToken]     = useState(() => localStorage.getItem("fc_token"));
  const [user,  setUser]      = useState(() => { try { return JSON.parse(localStorage.getItem("fc_user")); } catch { return null; }});

  const login = async (email, password) => {
    const data = await apiFetch("/auth/login", {method:"POST", body:JSON.stringify({email, password})});
    setToken(data.access_token);
    setUser(data.user);
    localStorage.setItem("fc_token", data.access_token);
    localStorage.setItem("fc_user", JSON.stringify(data.user));
    return data;
  };

  const register = async (name, email, password) => {
    const data = await apiFetch("/auth/register", {method:"POST", body:JSON.stringify({name, email, password})});
    setToken(data.access_token);
    setUser(data.user);
    localStorage.setItem("fc_token", data.access_token);
    localStorage.setItem("fc_user", JSON.stringify(data.user));
    return data;
  };

  const logout = () => {
    setToken(null); setUser(null);
    localStorage.removeItem("fc_token"); localStorage.removeItem("fc_user");
  };

  const api = useCallback((path, opts={}) => apiFetch(path, opts, token), [token]);

  return { token, user, login, register, logout, api };
}

/* ═══════════════════════════════════════════════
   LOGIN PAGE
═══════════════════════════════════════════════ */
function LoginPage({onLogin}) {
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
      fontFamily:"'Outfit','Segoe UI',sans-serif"}}>
      <div style={{...card({background:C.surface,
        boxShadow:"0 0 0 1px rgba(155,35,53,0.12), 0 32px 80px rgba(0,0,0,0.7), 0 8px 24px rgba(0,0,0,0.4)"}),
        width:"100%",maxWidth:400,padding:"36px 28px",margin:"16px"}}>

        <div style={{textAlign:"center",marginBottom:30}}>
          <div style={{display:"inline-flex",alignItems:"center",justifyContent:"center",width:56,height:56,
            borderRadius:"50%",background:`linear-gradient(135deg, #9B2335, #6B1522)`,
            border:`1px solid rgba(155,35,53,0.4)`,marginBottom:16,
            boxShadow:`0 0 24px rgba(155,35,53,0.3), 0 4px 12px rgba(0,0,0,0.4)`}}>
            <Wallet size={22} color="#F5E6D3"/>
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
          boxShadow:loading?"none":`0 4px 14px rgba(37,99,235,0.35)`})}} >
          {loading?<><Loader2 size={15} style={{animation:"spin .8s linear infinite"}}/>Aguardando...</>:
          mode==="login"?"Entrar no Sistema":"Criar Conta"}
        </button>
      </div>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Lora:wght@500;600;700&family=Outfit:wght@400;500;600;700&family=Space+Mono:wght@400;700&display=swap');@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   SIDEBAR (responsivo — nav inferior no mobile)
═══════════════════════════════════════════════ */
function Sidebar({active,set,user,onLogout}) {
  const nav=[
    {id:"dashboard",   icon:LayoutDashboard,label:"Dashboard"},
    {id:"transactions",icon:CreditCard,      label:"Lançamentos"},
    {id:"import",      icon:Upload,          label:"Importar"},
    {id:"cards",       icon:CreditCard,      label:"Cartões"},
    {id:"categories",  icon:Tag,             label:"Categorias"},
    {id:"reports",     icon:BarChart2,       label:"Relatórios"},
  ];
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(()=>{
    const h=()=>setIsMobile(window.innerWidth<768);
    window.addEventListener("resize",h); return ()=>window.removeEventListener("resize",h);
  },[]);

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
      display:"flex",flexDirection:"column",flexShrink:0,fontFamily:"'Outfit','Segoe UI',sans-serif"}}>
      <div style={{padding:"22px 18px 14px",borderBottom:`1px solid ${C.border}`}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{width:34,height:34,borderRadius:"50%",
            background:`linear-gradient(135deg, #9B2335, #6B1522)`,
            border:`1px solid rgba(155,35,53,0.4)`,
            display:"flex",alignItems:"center",justifyContent:"center",
            boxShadow:`0 0 12px rgba(155,35,53,0.25), 0 2px 8px rgba(0,0,0,0.4)`}}>
            <Wallet size={15} color="#F5E6D3"/>
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
            <div style={{fontSize:10,color:C.faint}}>Administrador</div>
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

/* ═══════════════════════════════════════════════
   SHARED: LOADING / ERROR STATES
═══════════════════════════════════════════════ */
function Loading() {
  return (
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minHeight:300,gap:14}}>
      <Loader2 size={28} color={C.accent} style={{animation:"spin .9s linear infinite"}}/>
      <span style={{fontSize:12,color:C.muted}}>Carregando...</span>
    </div>
  );
}
function ErrMsg({msg}) {
  return (
    <div style={{padding:"13px 16px",borderRadius:9,background:C.redSft,border:`1px solid ${C.red}33`,
      color:C.red,fontSize:13,display:"flex",alignItems:"center",gap:9}}>
      <AlertCircle size={15}/>{msg}
    </div>
  );
}

/* ═══════════════════════════════════════════════
   DASHBOARD TAB
═══════════════════════════════════════════════ */
function DashboardTab({api}) {
  const [summary, setSummary] = useState([]);
  const [catData, setCatData] = useState([]);
  const [proj,    setProj]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [err,     setErr]     = useState("");

  const currentPeriod = new Date().toISOString().slice(0,7);

  useEffect(()=>{
    setLoading(true);
    Promise.all([
      api("/reports/summary?months=6"),
      api(`/reports/comparative?current_periodo=${currentPeriod}`),
      api("/reports/installments-projection"),
    ]).then(([s, cmp, pr])=>{
      setSummary(s.reverse());
      const catRows = (cmp.by_category||[]).map(c=>({name:c.name,value:c.current,color:"#2563EB"}));
      setCatData(catRows);
      setProj(pr);
    }).catch(e=>setErr(e.message)).finally(()=>setLoading(false));
  },[]);

  if(loading) return <Loading/>;
  if(err)     return <ErrMsg msg={err}/>;

  const latest   = summary[summary.length-1] || {};
  const previous = summary[summary.length-2] || {};
  const rec = latest.total_receitas||0;
  const des = latest.total_despesas||0;
  const sal = latest.saldo||0;
  const projTotal = proj.reduce((a,p)=>a+p.monthly_amount,0);

  const varDes = previous.total_despesas ? ((des-previous.total_despesas)/previous.total_despesas*100) : 0;
  const varRec = previous.total_receitas ? ((rec-previous.total_receitas)/previous.total_receitas*100) : 0;
  const varSal = previous.saldo          ? ((sal-previous.saldo)/Math.abs(previous.saldo)*100)          : 0;

  const [mes, ano] = currentPeriod.split("-");
  const periodoFmt = `${mes}/${ano}`;

  return (
    <div style={{fontFamily:"'Outfit','Segoe UI',sans-serif"}}>
      <div style={{marginBottom:22,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div>
          <h2 style={{fontSize:21,fontWeight:700,color:C.text,margin:0,letterSpacing:"-0.02em",fontFamily:"'Lora','Georgia',serif"}}>Dashboard</h2>
          <p style={{color:C.muted,fontSize:13,margin:"4px 0 0"}}>Período: {periodoFmt}</p>
        </div>
      </div>

      {/* KPIs */}
      <div style={{display:"flex",gap:10,marginBottom:16,flexWrap:"wrap"}}>
        {[
          ["Receitas do Mês",rec,varRec,TrendingUp,C.green],
          ["Despesas do Mês",des,varDes,TrendingDown,C.red],
          ["Saldo",sal,varSal,Wallet,C.gold],
          ["Parcelas Futuras",projTotal,null,CreditCard,C.purple],
        ].map(([t,v,chg,Icon,color])=>(
          <div key={t} style={{...card(),flex:1,minWidth:150,
            boxShadow:`inset 0 2px 0 0 ${color}33`,
            transition:"transform 0.15s ease, box-shadow 0.15s ease"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
              <span style={{fontSize:10,fontWeight:600,color:C.muted,textTransform:"uppercase",letterSpacing:"0.06em"}}>{t}</span>
              <div style={{width:30,height:30,borderRadius:8,background:color+"18",
                display:"flex",alignItems:"center",justifyContent:"center",border:`1px solid ${color}22`}}>
                <Icon size={13} color={color}/>
              </div>
            </div>
            <div style={{fontSize:18,fontWeight:700,color:C.text,fontFamily:"'Space Mono',monospace"}}>{fmt(v)}</div>
            {chg!=null && (
              <div style={{display:"flex",alignItems:"center",gap:4,fontSize:10,marginTop:6}}>
                {chg>=0?<TrendingUp size={10} color={C.green}/>:<TrendingDown size={10} color={C.red}/>}
                <span style={{color:chg>=0?C.green:C.red,fontWeight:600}}>{chg>0?"+":""}{chg.toFixed(1)}%</span>
                <span style={{color:C.faint}}>vs mês anterior</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Charts row */}
      {summary.length > 0 && (
        <div style={{display:"flex",gap:10,marginBottom:10,flexWrap:"wrap"}}>
          <div style={{...card(),flex:2,minWidth:300}}>
            <div style={{fontSize:13,fontWeight:600,color:C.text,marginBottom:14}}>Evolução Mensal</div>
            <ResponsiveContainer width="100%" height={190}>
              <AreaChart data={summary} margin={{top:0,right:0,left:-20,bottom:0}}>
                <defs>
                  <linearGradient id="gR" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={C.green} stopOpacity={.25}/><stop offset="95%" stopColor={C.green} stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="gD" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={C.red} stopOpacity={.25}/><stop offset="95%" stopColor={C.red} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={C.border} strokeOpacity={0.6}/>
                <XAxis dataKey="periodo_referencia" tick={{fill:C.muted,fontSize:10}}/>
                <YAxis tick={{fill:C.muted,fontSize:10}} tickFormatter={v=>`${(v/1000).toFixed(0)}k`}/>
                <Tooltip contentStyle={{background:C.cardB,border:`1px solid ${C.border}`,borderRadius:9,fontSize:12,boxShadow:"0 8px 24px rgba(0,0,0,0.4)"}}
                  formatter={v=>fmt(v)}/>
                <Area type="monotone" dataKey="total_receitas" name="Receitas" stroke={C.green} fill="url(#gR)" strokeWidth={2}/>
                <Area type="monotone" dataKey="total_despesas" name="Despesas" stroke={C.red}   fill="url(#gD)" strokeWidth={2}/>
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {catData.length>0 && (
            <div style={{...card(),flex:1,minWidth:220}}>
              <div style={{fontSize:13,fontWeight:600,color:C.text,marginBottom:14}}>Por Categoria</div>
              <ResponsiveContainer width="100%" height={190}>
                <BarChart data={catData} layout="vertical" margin={{top:0,right:0,left:40,bottom:0}}>
                  <XAxis type="number" tick={{fill:C.muted,fontSize:10}} tickFormatter={v=>fmt(v)}/>
                  <YAxis type="category" dataKey="name" tick={{fill:C.muted,fontSize:10}} width={80}/>
                  <Tooltip formatter={v=>fmt(v)} contentStyle={{background:C.cardB,border:`1px solid ${C.border}`,borderRadius:9,fontSize:12,boxShadow:"0 8px 24px rgba(0,0,0,0.4)"}}/>
                  <Bar dataKey="value" fill={C.accent} radius={[0,5,5,0]}/>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}

      {/* Projeção de parcelas */}
      {proj.length>0 && (
        <div style={{...card()}}>
          <div style={{fontSize:13,fontWeight:600,color:C.text,marginBottom:14,display:"flex",alignItems:"center",gap:9}}>
            <Clock size={14} color={C.gold}/> Parcelas Futuras
            <span style={{...pill(C.gold)}}>{proj.length} compromisso{proj.length>1?"s":""}</span>
          </div>
          <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            {proj.map((p,i)=>(
              <div key={i} style={{flex:1,minWidth:160,background:C.surface,borderRadius:9,padding:"12px 14px",
                border:`1px solid ${C.border}`,borderLeft:`3px solid ${C.gold}`,
                transition:"transform 0.15s ease"}}>
                <div style={{fontSize:11,fontWeight:600,color:C.text,marginBottom:5,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.description}</div>
                <div style={{fontSize:15,fontWeight:700,color:C.gold,fontFamily:"'Space Mono',monospace"}}>{fmt(p.monthly_amount)}<span style={{fontSize:11,fontWeight:400,color:C.muted}}>/mês</span></div>
                <div style={{fontSize:11,color:C.muted,marginTop:3}}>{p.remaining} parcela{p.remaining>1?"s":""} restante{p.remaining>1?"s":""}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {summary.length===0 && (
        <div style={{...card({background:C.surface}),textAlign:"center",padding:"56px 24px"}}>
          <div style={{width:56,height:56,borderRadius:16,background:C.border+"44",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 16px"}}>
            <Wallet size={24} color={C.faint}/>
          </div>
          <p style={{color:C.muted,margin:0,fontSize:14}}>Nenhum dado disponível. Cadastre lançamentos ou importe uma fatura PDF.</p>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════
   TRANSACTION FORM MODAL
═══════════════════════════════════════════════ */
const EMPTY = {date:"",desc:"",supplier:"",amount:"",type:"D",cat_id:"",card_id:"",inst:"",instTotal:""};

function TxModal({onClose, onSaved, api, categories, cards}) {
  const [f,    setF]    = useState({...EMPTY, date: new Date().toISOString().slice(0,10)});
  const [err,  setErr]  = useState({});
  const [saved,setSaved]= useState(false);
  const [loading,setLoading]=useState(false);

  const validate = () => {
    const e = {};
    if(!f.date)          e.date     = "Obrigatório";
    if(!f.desc.trim())   e.desc     = "Obrigatório";
    if(!f.supplier.trim())e.supplier= "Obrigatório";
    if(!f.amount||isNaN(Number(f.amount))||Number(f.amount)<=0) e.amount="Valor inválido";
    if(f.inst && !/^\d{2}\/\d{2}$/.test(f.inst)) e.inst="Formato esperado: 02/10";
    return e;
  };

  const handle = async () => {
    const e = validate();
    if(Object.keys(e).length){ setErr(e); return; }
    setLoading(true);
    try {
      let inst_cur=null, inst_tot=null;
      if(f.inst){ [inst_cur,inst_tot]=f.inst.split("/").map(Number); }
      await api("/transactions",{method:"POST",body:JSON.stringify({
        type:f.type, date:f.date, description:f.desc.toUpperCase(),
        supplier:f.supplier, amount:Number(f.amount),
        category_id:f.cat_id?Number(f.cat_id):null,
        card_id:f.card_id?Number(f.card_id):null,
        installment_current:inst_cur, installment_total:inst_tot,
      })});
      setSaved(true);
      setTimeout(()=>{ setSaved(false); onSaved(); onClose(); }, 1400);
    } catch(e){ setErr({api:e.message}); }
    finally{ setLoading(false); }
  };

  return (
    <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.78)",
      display:"flex",alignItems:"center",justifyContent:"center",zIndex:200,padding:16,
      backdropFilter:"blur(4px)"}}>
      <div onClick={e=>e.stopPropagation()} style={{...card({background:C.surface,
        boxShadow:"0 0 0 1px rgba(255,255,255,0.04), 0 32px 80px rgba(0,0,0,0.7)"}),
        width:"100%",maxWidth:500,maxHeight:"92vh",overflowY:"auto"}}>

        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
          <h3 style={{margin:0,fontSize:16,fontWeight:700,color:C.text,letterSpacing:"-0.01em"}}>Novo Lançamento</h3>
          <button onClick={onClose} style={{background:C.card,border:`1px solid ${C.border}`,cursor:"pointer",color:C.muted,width:30,height:30,borderRadius:7,display:"flex",alignItems:"center",justifyContent:"center",transition:"color 0.15s ease"}}>
            <X size={15}/>
          </button>
        </div>

        {/* Tipo */}
        <div style={{display:"flex",gap:8,marginBottom:18}}>
          {[["D","▼  Despesa",C.red],["R","▲  Receita",C.green]].map(([v,l,c])=>(
            <button key={v} onClick={()=>setF({...f,type:v})} style={{flex:1,padding:"11px",borderRadius:9,
              border:`2px solid ${f.type===v?c:C.border}`,background:f.type===v?c+"18":"transparent",
              color:f.type===v?c:C.muted,fontSize:13,fontWeight:700,cursor:"pointer",
              transition:"all 0.15s ease"}}>
              {l}
            </button>
          ))}
        </div>

        {/* Data + Valor */}
        <div style={{display:"flex",gap:12,marginBottom:14}}>
          <div style={{flex:1}}>
            <label style={{display:"block",fontSize:11,fontWeight:600,color:err.date?C.red:C.muted,marginBottom:6,textTransform:"uppercase",letterSpacing:"0.06em"}}>Data *</label>
            <input type="date" value={f.date} onChange={e=>setF({...f,date:e.target.value})} style={inpSt(err.date)}/>
            {err.date&&<span style={{color:C.red,fontSize:10,marginTop:3,display:"block"}}>{err.date}</span>}
          </div>
          <div style={{flex:1}}>
            <label style={{display:"block",fontSize:11,fontWeight:600,color:err.amount?C.red:C.muted,marginBottom:6,textTransform:"uppercase",letterSpacing:"0.06em"}}>Valor (R$) *</label>
            <input type="number" min="0.01" step="0.01" placeholder="0,00" value={f.amount}
              onChange={e=>setF({...f,amount:e.target.value})} style={inpSt(err.amount)}/>
            {err.amount&&<span style={{color:C.red,fontSize:10,marginTop:3,display:"block"}}>{err.amount}</span>}
          </div>
        </div>

        {/* Descrição */}
        <div style={{marginBottom:14}}>
          <label style={{display:"block",fontSize:11,fontWeight:600,color:err.desc?C.red:C.muted,marginBottom:6,textTransform:"uppercase",letterSpacing:"0.06em"}}>Descrição *</label>
          <input type="text" placeholder="Ex: SUPERMERCADO EXTRA" value={f.desc}
            onChange={e=>setF({...f,desc:e.target.value})} style={inpSt(err.desc)}/>
          {err.desc&&<span style={{color:C.red,fontSize:10,marginTop:3,display:"block"}}>{err.desc}</span>}
        </div>

        {/* Fornecedor */}
        <div style={{marginBottom:14}}>
          <label style={{display:"block",fontSize:11,fontWeight:600,color:err.supplier?C.red:C.muted,marginBottom:6,textTransform:"uppercase",letterSpacing:"0.06em"}}>Fornecedor *</label>
          <input type="text" placeholder="Ex: Extra, iFood, Uber..." value={f.supplier}
            onChange={e=>setF({...f,supplier:e.target.value})} style={inpSt(err.supplier)}/>
          {err.supplier&&<span style={{color:C.red,fontSize:10,marginTop:3,display:"block"}}>{err.supplier}</span>}
        </div>

        {/* Categoria + Cartão */}
        <div style={{display:"flex",gap:12,marginBottom:14}}>
          <div style={{flex:1}}>
            <label style={{display:"block",fontSize:11,fontWeight:600,color:C.muted,marginBottom:6,textTransform:"uppercase",letterSpacing:"0.06em"}}>Categoria IFRS</label>
            <select value={f.cat_id} onChange={e=>setF({...f,cat_id:e.target.value})} style={{...selSt,width:"100%",padding:"9px 12px"}}>
              <option value="">— Sem categoria</option>
              {categories.map(c=><option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
            </select>
          </div>
          {f.type==="D" && (
            <div style={{flex:1}}>
              <label style={{display:"block",fontSize:11,fontWeight:600,color:C.muted,marginBottom:6,textTransform:"uppercase",letterSpacing:"0.06em"}}>Cartão</label>
              <select value={f.card_id} onChange={e=>setF({...f,card_id:e.target.value})} style={{...selSt,width:"100%",padding:"9px 12px"}}>
                <option value="">— Sem cartão</option>
                {cards.map(c=><option key={c.id} value={c.id}>{c.name} ({c.bank})</option>)}
              </select>
            </div>
          )}
        </div>

        {/* Parcela (só despesa) */}
        {f.type==="D" && (
          <div style={{marginBottom:18,padding:"14px 16px",background:C.card,borderRadius:9,border:`1px solid ${C.border}`}}>
            <p style={{fontSize:11,fontWeight:600,color:C.muted,margin:"0 0 12px",textTransform:"uppercase",letterSpacing:"0.06em"}}>
              Compra Parcelada <span style={{color:C.faint,fontWeight:400,textTransform:"none",letterSpacing:0}}>(opcional)</span>
            </p>
            <div style={{display:"flex",gap:12,alignItems:"flex-start"}}>
              <div style={{flex:1}}>
                <label style={{fontSize:11,color:err.inst?C.red:C.muted,display:"block",marginBottom:5,fontWeight:600}}>Parcela (ex: 01/12)</label>
                <input type="text" placeholder="01/12" maxLength={5} value={f.inst}
                  onChange={e=>setF({...f,inst:e.target.value})} style={inpSt(err.inst)}/>
                {err.inst&&<span style={{color:C.red,fontSize:10,marginTop:3,display:"block"}}>{err.inst}</span>}
              </div>
              <div style={{flex:1,paddingTop:22,fontSize:12,color:C.muted}}>
                {f.inst&&f.amount?
                  <span style={{color:C.gold}}>Serão {f.inst.split("/")[1]||"?"} parcelas de {fmt(f.amount)}</span>:
                  <span style={{color:C.faint}}>Preencha para ver a projeção</span>}
              </div>
            </div>
          </div>
        )}

        {err.api && <div style={{marginBottom:14}}><ErrMsg msg={err.api}/></div>}

        {saved ? (
          <div style={{padding:"14px",borderRadius:9,background:C.greenSft,border:`1px solid ${C.green}44`,
            display:"flex",alignItems:"center",gap:10,justifyContent:"center"}}>
            <CheckCircle2 size={18} color={C.green}/>
            <span style={{color:C.green,fontWeight:600,fontSize:14}}>Lançamento salvo com sucesso!</span>
          </div>
        ) : (
          <div style={{display:"flex",gap:8,marginTop:4}}>
            <button onClick={onClose} style={{flex:1,padding:"11px",borderRadius:8,border:`1px solid ${C.border}`,
              background:"transparent",color:C.muted,fontSize:13,cursor:"pointer",transition:"border-color 0.15s ease, color 0.15s ease"}}>Cancelar</button>
            <button onClick={handle} disabled={loading} style={{...btn(f.type==="D"?C.red:C.green,{flex:2,padding:"11px",
              boxShadow:`0 4px 14px ${(f.type==="D"?C.red:C.green)}33`})}}>
              {loading?<Loader2 size={14} style={{animation:"spin .8s linear infinite"}}/>:<CheckCircle2 size={14}/>}
              {f.type==="D"?"Registrar Despesa":"Registrar Receita"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   TRANSACTIONS TAB
═══════════════════════════════════════════════ */
function TransactionsTab({api}) {
  const [txList,    setTxList]    = useState([]);
  const [categories,setCategories]= useState([]);
  const [cards,     setCards]     = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [err,       setErr]       = useState("");
  const [modal,     setModal]     = useState(false);
  const [search,    setSearch]    = useState("");
  const [fType,     setFType]     = useState("all");
  const [delId,     setDelId]     = useState(null);
  const [periodo,   setPeriodo]   = useState(new Date().toISOString().slice(0,7));

  const load = useCallback(()=>{
    setLoading(true);
    Promise.all([
      api(`/transactions?periodo=${periodo}${fType!=="all"?"&type="+fType:""}${search?"&search="+encodeURIComponent(search):""}`),
      api("/categories"),
      api("/cards"),
    ]).then(([t,c,k])=>{ setTxList(t); setCategories(c); setCards(k); setErr(""); })
      .catch(e=>setErr(e.message)).finally(()=>setLoading(false));
  },[periodo, fType, search]);

  useEffect(()=>{ load(); },[load]);

  const handleDelete = async (id) => {
    try { await api(`/transactions/${id}`,{method:"DELETE"}); setDelId(null); load(); }
    catch(e){ setErr(e.message); }
  };

  const rec = txList.filter(t=>t.type==="R").reduce((a,t)=>a+t.amount,0);
  const des = txList.filter(t=>t.type==="D").reduce((a,t)=>a+t.amount,0);

  return (
    <div style={{fontFamily:"'Outfit','Segoe UI',sans-serif"}}>
      <div style={{marginBottom:16,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div>
          <h2 style={{fontSize:21,fontWeight:700,color:C.text,margin:0,letterSpacing:"-0.02em",fontFamily:"'Lora','Georgia',serif"}}>Lançamentos</h2>
          <p style={{color:C.muted,fontSize:13,margin:"4px 0 0"}}>{txList.length} transaç{txList.length===1?"ão":"ões"} · saldo&nbsp;
            <strong style={{color:rec-des>=0?C.green:C.red}}>{fmt(rec-des)}</strong>
          </p>
        </div>
        <button onClick={()=>setModal(true)} style={{...btn(C.accent,{boxShadow:"0 4px 14px rgba(37,99,235,0.35)"})}}>
          <Plus size={15}/>Novo Lançamento
        </button>
      </div>

      {/* Totais */}
      <div style={{display:"flex",gap:8,marginBottom:12}}>
        {[["Receitas",rec,C.green],["Despesas",des,C.red],["Saldo",rec-des,rec-des>=0?C.green:C.red]].map(([l,v,c])=>(
          <div key={l} style={{flex:1,background:C.card,border:`1px solid ${C.border}`,borderRadius:10,padding:"10px 14px",
            boxShadow:`inset 0 2px 0 0 ${c}22`}}>
            <div style={{fontSize:10,color:C.muted,fontWeight:600,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:4}}>{l}</div>
            <div style={{fontSize:15,fontWeight:700,color:c,fontFamily:"'Space Mono',monospace"}}>{fmt(v)}</div>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div style={{...card({padding:"10px 14px"}),marginBottom:10,display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
        <input type="month" value={periodo} onChange={e=>setPeriodo(e.target.value)}
          style={{...selSt,padding:"7px 10px"}}/>
        <div style={{display:"flex",alignItems:"center",gap:7,flex:1,minWidth:160,background:C.surface,
          borderRadius:7,border:`1px solid ${C.border}`,padding:"7px 10px",transition:"border-color 0.15s ease"}}>
          <Search size={12} color={C.muted}/>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar..."
            style={{background:"transparent",border:"none",outline:"none",color:C.text,fontSize:12,flex:1}}/>
          {search&&<button onClick={()=>setSearch("")} style={{background:"none",border:"none",cursor:"pointer",color:C.muted,padding:0,display:"flex"}}><X size={11}/></button>}
        </div>
        <select value={fType} onChange={e=>setFType(e.target.value)} style={selSt}>
          <option value="all">Todos</option><option value="D">Despesas</option><option value="R">Receitas</option>
        </select>
        <span style={{...pill(C.accent),fontSize:10}}><Filter size={9}/>{txList.length}</span>
      </div>

      {err && <div style={{marginBottom:10}}><ErrMsg msg={err}/></div>}
      {loading ? <Loading/> : (
        <div style={{...card({padding:0}),overflow:"hidden"}}>
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
            <thead>
              <tr style={{background:C.surface}}>
                {["Data","Descrição","Parcela","Cartão","Categoria","Valor","Tipo",""].map(h=>(
                  <th key={h} style={{padding:"10px 12px",textAlign:"left",color:C.muted,fontWeight:600,
                    fontSize:10,textTransform:"uppercase",letterSpacing:"0.06em",borderBottom:`1px solid ${C.border}`}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {txList.length===0 && (
                <tr><td colSpan={8} style={{padding:"40px",textAlign:"center",color:C.muted,fontSize:13}}>
                  Nenhuma transação neste período.
                </td></tr>
              )}
              {txList.map((t,i)=>(
                <tr key={t.id} style={{borderBottom:`1px solid ${C.border}22`,background:i%2===0?"transparent":C.surface+"55",transition:"background 0.1s ease"}}>
                  <td style={{padding:"9px 12px",color:C.muted,fontFamily:"'Space Mono',monospace",fontSize:11}}>{fmtD(t.date)}</td>
                  <td style={{padding:"9px 12px"}}>
                    <div style={{color:C.text,fontWeight:500}}>{t.description}</div>
                    <div style={{color:C.muted,fontSize:11,marginTop:1}}>{t.supplier}</div>
                  </td>
                  <td style={{padding:"9px 12px"}}>
                    {t.installment_current?<span style={{...pill(C.purple),fontSize:10}}>{t.installment_current}/{t.installment_total}</span>:<span style={{color:C.faint}}>—</span>}
                  </td>
                  <td style={{padding:"9px 12px",color:C.muted,fontSize:11}}>{t.card?.name||"—"}</td>
                  <td style={{padding:"9px 12px"}}>
                    {t.category?<span style={{...pill(t.category.color||C.accent),fontSize:10}}>{t.category.icon} {t.category.name}</span>:<span style={{color:C.faint}}>—</span>}
                  </td>
                  <td style={{padding:"9px 12px",fontFamily:"'Space Mono',monospace",fontWeight:700,color:t.type==="R"?C.green:C.red}}>
                    {t.type==="R"?"+":"-"}{fmt(t.amount)}
                  </td>
                  <td style={{padding:"9px 12px"}}>
                    <span style={{...pill(t.type==="R"?C.green:C.red),fontSize:10}}>{t.type==="R"?"Receita":"Despesa"}</span>
                  </td>
                  <td style={{padding:"9px 8px"}}>
                    {delId===t.id?(
                      <div style={{display:"flex",gap:4}}>
                        <button onClick={()=>handleDelete(t.id)} style={{padding:"3px 8px",borderRadius:5,border:"none",background:C.red,color:"#fff",fontSize:10,cursor:"pointer",fontWeight:600}}>Sim</button>
                        <button onClick={()=>setDelId(null)} style={{padding:"3px 8px",borderRadius:5,border:`1px solid ${C.border}`,background:"transparent",color:C.muted,fontSize:10,cursor:"pointer"}}>Não</button>
                      </div>
                    ):(
                      <button onClick={()=>setDelId(t.id)} style={{background:"none",border:"none",cursor:"pointer",color:C.faint,padding:4,display:"flex",borderRadius:5,transition:"color 0.15s ease"}}
                        onMouseEnter={e=>e.currentTarget.style.color=C.red}
                        onMouseLeave={e=>e.currentTarget.style.color=C.faint}>
                        <Trash2 size={13}/>
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modal && <TxModal onClose={()=>setModal(false)} onSaved={load} api={api} categories={categories} cards={cards}/>}
    </div>
  );
}

/* ═══════════════════════════════════════════════
   IMPORT TAB
═══════════════════════════════════════════════ */
function ImportTab({api}) {
  const [step,    setStep]    = useState("upload");
  const [prog,    setProg]    = useState(0);
  const [preview, setPreview] = useState(null);
  const [cardId,  setCardId]  = useState("");
  const [cards,   setCards]   = useState([]);
  const [file,    setFile]    = useState(null);
  const [err,     setErr]     = useState("");
  const [importing,setImporting]=useState(false);
  const [result,  setResult]  = useState(null);

  useEffect(()=>{ api("/cards").then(setCards).catch(()=>{}); },[]);

  const handleFile = async (f) => {
    if(!f||!f.name.endsWith(".pdf")){ setErr("Apenas arquivos PDF são aceitos."); return; }
    setFile(f); setErr(""); setStep("parsing"); setProg(0);
    const fakeProgress = setInterval(()=>setProg(p=>{ if(p>=85){clearInterval(fakeProgress);} return Math.min(p+10,85); }), 200);
    try {
      const fd = new FormData(); fd.append("file", f);
      const data = await api("/invoices/preview", {method:"POST", body:fd});
      clearInterval(fakeProgress); setProg(100);
      setTimeout(()=>{ setPreview(data); setStep("preview"); }, 300);
    } catch(e){ clearInterval(fakeProgress); setErr(e.message); setStep("upload"); }
  };

  const handleConfirm = async () => {
    if(!cardId){ setErr("Selecione o cartão antes de confirmar."); return; }
    setImporting(true); setErr("");
    try {
      const fd = new FormData(); fd.append("file", file); fd.append("card_id", cardId);
      const r = await api("/invoices/confirm", {method:"POST", body:fd});
      setResult(r); setStep("done");
    } catch(e){ setErr(e.message); }
    finally{ setImporting(false); }
  };

  const BANKS = ["Itaú","Santander","Bradesco","Caixa","Sam's Club","Sicredi","Riachuelo"];

  if(step==="parsing") return (
    <div style={{display:"flex",alignItems:"center",justifyContent:"center",minHeight:360}}>
      <div style={{...card({background:C.surface,width:440,textAlign:"center",
        boxShadow:"0 0 0 1px rgba(37,99,235,0.08), 0 32px 72px rgba(0,0,0,0.5)"})}}>
        <div style={{width:56,height:56,borderRadius:16,background:C.accentSft,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 18px",border:`1px solid rgba(37,99,235,0.2)`}}>
          <Loader2 size={24} color={C.accent} style={{animation:"spin .9s linear infinite"}}/>
        </div>
        <h3 style={{color:C.text,fontSize:16,fontWeight:700,margin:"0 0 8px",letterSpacing:"-0.01em"}}>Processando PDF</h3>
        <p style={{color:C.muted,fontSize:13,margin:"0 0 24px"}}>Identificando banco e extraindo transações...</p>
        <div style={{background:C.border,borderRadius:8,height:8,overflow:"hidden"}}>
          <div style={{background:`linear-gradient(90deg,${C.accent},${C.teal})`,height:"100%",width:`${prog}%`,borderRadius:8,transition:"width .2s ease"}}/>
        </div>
        <p style={{color:C.accent,fontFamily:"'Space Mono',monospace",marginTop:10,fontSize:14,fontWeight:700}}>{Math.round(prog)}%</p>
      </div>
    </div>
  );

  if(step==="preview"&&preview) return (
    <div style={{fontFamily:"'Outfit','Segoe UI',sans-serif"}}>
      <div style={{marginBottom:18,display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:12}}>
        <div>
          <h2 style={{fontSize:20,fontWeight:700,color:C.text,margin:0,letterSpacing:"-0.02em"}}>Pré-visualização da Fatura</h2>
          <p style={{color:C.muted,fontSize:13,margin:"4px 0 0"}}>
            <strong style={{color:C.accent}}>{preview.bank}</strong> · {preview.total_transactions} transações · Total: <strong style={{color:C.red}}>{fmt(preview.total_amount)}</strong>
          </p>
        </div>
        <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
          <select value={cardId} onChange={e=>setCardId(e.target.value)} style={{...selSt,padding:"9px 14px"}}>
            <option value="">Selecione o cartão...</option>
            {cards.map(c=><option key={c.id} value={c.id}>{c.name} ({c.bank})</option>)}
          </select>
          <button onClick={()=>setStep("upload")} style={{padding:"9px 14px",borderRadius:8,border:`1px solid ${C.border}`,background:"transparent",color:C.muted,fontSize:13,cursor:"pointer",transition:"border-color 0.15s ease"}}>Cancelar</button>
          <button onClick={handleConfirm} disabled={importing} style={{...btn(C.green,{boxShadow:"0 4px 14px rgba(16,185,129,0.3)"})}}>
            {importing?<Loader2 size={13} style={{animation:"spin .8s linear infinite"}}/>:<CheckCircle2 size={13}/>}Confirmar Importação
          </button>
        </div>
      </div>
      {err&&<div style={{marginBottom:14}}><ErrMsg msg={err}/></div>}
      <div style={{...card({padding:0}),overflow:"hidden"}}>
        <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
          <thead>
            <tr style={{background:C.surface}}>
              {["Data","Descrição","Fornecedor","Parcela","Categoria","Valor"].map(h=>(
                <th key={h} style={{padding:"10px 12px",textAlign:"left",color:C.muted,fontWeight:600,fontSize:10,textTransform:"uppercase",letterSpacing:"0.06em",borderBottom:`1px solid ${C.border}`}}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {preview.transactions.map((t,i)=>(
              <tr key={i} style={{borderBottom:`1px solid ${C.border}22`,background:i%2===0?"transparent":C.surface+"55"}}>
                <td style={{padding:"9px 12px",color:C.muted,fontFamily:"'Space Mono',monospace",fontSize:11}}>{fmtD(t.date)}</td>
                <td style={{padding:"9px 12px",color:C.text}}>{t.description}</td>
                <td style={{padding:"9px 12px",color:C.muted,fontSize:11}}>{t.supplier||"—"}</td>
                <td style={{padding:"9px 12px"}}>
                  {t.installment_current?<span style={{...pill(C.purple),fontSize:10}}>{t.installment_current}/{t.installment_total}</span>:<span style={{color:C.faint}}>À vista</span>}
                </td>
                <td style={{padding:"9px 12px"}}><span style={{...pill(C.accent),fontSize:10}}>{t.category_guess||"—"}</span></td>
                <td style={{padding:"9px 12px",fontFamily:"'Space Mono',monospace",fontWeight:700,color:C.red}}>{fmt(t.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  if(step==="done"&&result) return (
    <div style={{display:"flex",alignItems:"center",justifyContent:"center",minHeight:360}}>
      <div style={{...card({background:C.surface,width:400,textAlign:"center",
        boxShadow:"0 0 0 1px rgba(16,185,129,0.1), 0 32px 72px rgba(0,0,0,0.5)"})}}>
        <div style={{width:60,height:60,borderRadius:"50%",background:C.greenSft,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 18px",border:`2px solid ${C.green}44`,boxShadow:`0 0 20px ${C.green}22`}}>
          <CheckCircle2 size={28} color={C.green}/>
        </div>
        <h3 style={{color:C.text,fontSize:17,fontWeight:700,margin:"0 0 10px",letterSpacing:"-0.01em"}}>Importação Concluída!</h3>
        <p style={{color:C.muted,fontSize:13,margin:"0 0 6px"}}>
          <strong style={{color:C.green}}>{result.imported} transaç{result.imported===1?"ão":"ões"}</strong> importadas do banco <strong style={{color:C.accent}}>{result.bank}</strong>
        </p>
        <button onClick={()=>{setStep("upload");setPreview(null);setFile(null);setResult(null);}} style={{...btn(C.accent,{marginTop:22,padding:"10px 24px",boxShadow:"0 4px 14px rgba(37,99,235,0.35)"})}}>
          Importar Outra Fatura
        </button>
      </div>
    </div>
  );

  return (
    <div style={{fontFamily:"'Outfit','Segoe UI',sans-serif"}}>
      <div style={{marginBottom:24}}>
        <h2 style={{fontSize:21,fontWeight:700,color:C.text,margin:0,letterSpacing:"-0.02em",fontFamily:"'Lora','Georgia',serif"}}>Importar Fatura PDF</h2>
        <p style={{color:C.muted,fontSize:13,margin:"5px 0 0"}}>Suporte a: Itaú, Santander, Bradesco, Caixa, Sam's Club, Sicredi, Riachuelo</p>
      </div>

      <div onDragOver={e=>{e.preventDefault();}} onDrop={e=>{e.preventDefault();handleFile(e.dataTransfer.files[0]);}}
        onClick={()=>document.getElementById("pdfInput").click()}
        style={{border:`2px dashed ${C.border}`,borderRadius:14,padding:"52px 24px",textAlign:"center",marginBottom:20,cursor:"pointer",
          transition:"border-color 0.2s ease, background 0.2s ease"}}
        onMouseEnter={e=>{e.currentTarget.style.borderColor=C.accent;e.currentTarget.style.background=C.accentSft+"55";}}
        onMouseLeave={e=>{e.currentTarget.style.borderColor=C.border;e.currentTarget.style.background="transparent";}}>
        <div style={{width:54,height:54,borderRadius:16,background:C.accentSft,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 16px",border:`1px solid rgba(37,99,235,0.2)`}}>
          <Upload size={22} color={C.accent}/>
        </div>
        <p style={{color:C.text,fontSize:15,fontWeight:600,margin:"0 0 7px"}}>Arraste o PDF da fatura aqui</p>
        <p style={{color:C.muted,fontSize:13,margin:0}}>ou clique para selecionar · máximo 25 MB</p>
        <input id="pdfInput" type="file" accept=".pdf" style={{display:"none"}} onChange={e=>handleFile(e.target.files[0])}/>
      </div>

      {err&&<div style={{marginBottom:14}}><ErrMsg msg={err}/></div>}

      <div style={{...card()}}>
        <p style={{fontSize:13,fontWeight:600,color:C.text,margin:"0 0 14px"}}>Bancos suportados:</p>
        <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
          {BANKS.map(b=>(
            <span key={b} style={{...pill(C.accent),fontSize:11,padding:"5px 13px"}}>
              <Building2 size={11}/>{b}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   CARDS TAB
═══════════════════════════════════════════════ */
function CardsTab({api}) {
  const [cards,  setCards]  = useState([]);
  const [modal,  setModal]  = useState(false);
  const [loading,setLoading]= useState(true);
  const [err,    setErr]    = useState("");
  const [f,      setF]      = useState({name:"",bank:"Itaú",last_four:"",credit_limit:"",closing_day:"",due_day:"",color:"#2563EB"});

  const BANKS_LIST=["Itaú","Santander","Bradesco","Caixa","Sicredi","Sam's Club","Riachuelo","Nubank","Inter","C6 Bank","PagBank","Banco do Brasil","Outro"];

  const load = ()=>{ api("/cards").then(setCards).catch(e=>setErr(e.message)).finally(()=>setLoading(false)); };
  useEffect(load,[]);

  const save = async () => {
    try {
      await api("/cards",{method:"POST",body:JSON.stringify({...f,credit_limit:Number(f.credit_limit)||0,closing_day:Number(f.closing_day)||null,due_day:Number(f.due_day)||null})});
      setModal(false); setF({name:"",bank:"Itaú",last_four:"",credit_limit:"",closing_day:"",due_day:"",color:"#2563EB"});
      load();
    } catch(e){ setErr(e.message); }
  };

  const remove = async (id)=>{ try{ await api(`/cards/${id}`,{method:"DELETE"}); load(); }catch(e){setErr(e.message);} };

  return (
    <div style={{fontFamily:"'Outfit','Segoe UI',sans-serif"}}>
      <div style={{marginBottom:20,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div>
          <h2 style={{fontSize:21,fontWeight:700,color:C.text,margin:0,letterSpacing:"-0.02em",fontFamily:"'Lora','Georgia',serif"}}>Cartões</h2>
          <p style={{color:C.muted,fontSize:13,margin:"4px 0 0"}}>Gerencie seus cartões de crédito e débito</p>
        </div>
        <button onClick={()=>setModal(true)} style={{...btn(C.accent,{boxShadow:"0 4px 14px rgba(37,99,235,0.35)"})}}>
          <Plus size={15}/>Novo Cartão
        </button>
      </div>

      {err&&<div style={{marginBottom:12}}><ErrMsg msg={err}/></div>}
      {loading?<Loading/>:(
        <div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
          {cards.length===0&&(
            <div style={{...card({background:C.surface}),flex:1,textAlign:"center",padding:"56px"}}>
              <div style={{width:54,height:54,borderRadius:16,background:C.border+"44",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 16px"}}>
                <CreditCard size={22} color={C.faint}/>
              </div>
              <p style={{color:C.muted,margin:0,fontSize:14}}>Nenhum cartão cadastrado. Adicione um para associar às despesas.</p>
            </div>
          )}
          {cards.map(c=>(
            <div key={c.id} style={{...card({borderLeft:`4px solid ${c.color}`}),flex:"0 0 290px",transition:"transform 0.15s ease, box-shadow 0.15s ease"}}
              onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-1px)";e.currentTarget.style.boxShadow=`0 8px 24px rgba(0,0,0,0.3)`;}}
              onMouseLeave={e=>{e.currentTarget.style.transform="translateY(0)";e.currentTarget.style.boxShadow="";}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:14}}>
                <div>
                  <div style={{fontSize:15,fontWeight:700,color:C.text,letterSpacing:"-0.01em"}}>{c.name}</div>
                  <div style={{fontSize:12,color:C.muted,marginTop:3}}>{c.bank}{c.last_four?` ···· ${c.last_four}`:""}</div>
                </div>
                <button onClick={()=>remove(c.id)} style={{background:"none",border:"none",cursor:"pointer",color:C.faint,padding:6,
                  borderRadius:7,transition:"color 0.15s ease, background 0.15s ease"}}
                  onMouseEnter={e=>{e.currentTarget.style.color=C.red;e.currentTarget.style.background=C.redSft;}}
                  onMouseLeave={e=>{e.currentTarget.style.color=C.faint;e.currentTarget.style.background="none";}}>
                  <Trash2 size={14}/>
                </button>
              </div>
              <div style={{display:"flex",gap:16}}>
                {c.credit_limit>0&&<div><div style={{fontSize:10,color:C.muted,marginBottom:3,fontWeight:600,textTransform:"uppercase",letterSpacing:"0.04em"}}>Limite</div><div style={{fontSize:13,fontWeight:700,color:C.text,fontFamily:"'Space Mono',monospace"}}>{fmt(c.credit_limit)}</div></div>}
                {c.closing_day&&<div><div style={{fontSize:10,color:C.muted,marginBottom:3,fontWeight:600,textTransform:"uppercase",letterSpacing:"0.04em"}}>Fechamento</div><div style={{fontSize:13,fontWeight:700,color:C.text}}>Dia {c.closing_day}</div></div>}
                {c.due_day&&<div><div style={{fontSize:10,color:C.muted,marginBottom:3,fontWeight:600,textTransform:"uppercase",letterSpacing:"0.04em"}}>Vencimento</div><div style={{fontSize:13,fontWeight:700,color:C.text}}>Dia {c.due_day}</div></div>}
              </div>
            </div>
          ))}
        </div>
      )}

      {modal&&(
        <div onClick={()=>setModal(false)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.78)",
          display:"flex",alignItems:"center",justifyContent:"center",zIndex:200,padding:16,backdropFilter:"blur(4px)"}}>
          <div onClick={e=>e.stopPropagation()} style={{...card({background:C.surface,
            boxShadow:"0 0 0 1px rgba(255,255,255,0.04), 0 32px 80px rgba(0,0,0,0.7)"}),width:"100%",maxWidth:440}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
              <h3 style={{margin:0,fontSize:16,fontWeight:700,color:C.text,letterSpacing:"-0.01em"}}>Novo Cartão</h3>
              <button onClick={()=>setModal(false)} style={{background:C.card,border:`1px solid ${C.border}`,cursor:"pointer",color:C.muted,width:30,height:30,borderRadius:7,display:"flex",alignItems:"center",justifyContent:"center"}}><X size={15}/></button>
            </div>
            {[["Nome do cartão","name","text","Ex: Itaú Mastercard Gold"],["Últimos 4 dígitos","last_four","text","1234"],["Limite (R$)","credit_limit","number","5000"],["Dia de fechamento","closing_day","number","25"],["Dia de vencimento","due_day","number","5"]].map(([l,k,t,ph])=>(
              <div key={k} style={{marginBottom:14}}>
                <label style={{display:"block",fontSize:11,fontWeight:600,color:C.muted,marginBottom:6,textTransform:"uppercase",letterSpacing:"0.06em"}}>{l}</label>
                <input type={t} placeholder={ph} value={f[k]} onChange={e=>setF({...f,[k]:e.target.value})} style={inpSt(false)}/>
              </div>
            ))}
            <div style={{display:"flex",gap:12,marginBottom:18}}>
              <div style={{flex:1}}>
                <label style={{display:"block",fontSize:11,fontWeight:600,color:C.muted,marginBottom:6,textTransform:"uppercase",letterSpacing:"0.06em"}}>Banco</label>
                <select value={f.bank} onChange={e=>setF({...f,bank:e.target.value})} style={{...selSt,width:"100%",padding:"9px 12px"}}>
                  {BANKS_LIST.map(b=><option key={b} value={b}>{b}</option>)}
                </select>
              </div>
              <div style={{flex:1}}>
                <label style={{display:"block",fontSize:11,fontWeight:600,color:C.muted,marginBottom:6,textTransform:"uppercase",letterSpacing:"0.06em"}}>Cor do cartão</label>
                <input type="color" value={f.color} onChange={e=>setF({...f,color:e.target.value})} style={{...inpSt(false),padding:"5px",height:40,cursor:"pointer"}}/>
              </div>
            </div>
            <div style={{display:"flex",gap:8}}>
              <button onClick={()=>setModal(false)} style={{flex:1,padding:"11px",borderRadius:8,border:`1px solid ${C.border}`,background:"transparent",color:C.muted,fontSize:13,cursor:"pointer"}}>Cancelar</button>
              <button onClick={save} style={{...btn(C.accent,{flex:2,padding:"11px",boxShadow:"0 4px 14px rgba(37,99,235,0.35)"})}}>Salvar Cartão</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════
   CATEGORIES TAB
═══════════════════════════════════════════════ */
function CategoriesTab({api}) {
  const [cats,   setCats]   = useState([]);
  const [loading,setLoading]= useState(true);
  const IFRS_GROUPS=["Custos Operacionais","Despesas Administrativas","Despesas Financeiras","Investimentos (Ativos)"];

  useEffect(()=>{ api("/categories").then(setCats).catch(()=>{}).finally(()=>setLoading(false)); },[]);
  const remove = async id =>{ await api(`/categories/${id}`,{method:"DELETE"}); setCats(p=>p.filter(c=>c.id!==id)); };

  if(loading) return <Loading/>;
  return (
    <div style={{fontFamily:"'Outfit','Segoe UI',sans-serif"}}>
      <h2 style={{fontSize:21,fontWeight:700,color:C.text,margin:"0 0 6px",letterSpacing:"-0.02em",fontFamily:"'Lora','Georgia',serif"}}>Categorias IFRS</h2>
      <p style={{color:C.muted,fontSize:13,margin:"0 0 22px"}}>Classificação baseada nas Normas Internacionais de Contabilidade</p>
      {IFRS_GROUPS.map(g=>{
        const gc=cats.filter(c=>c.ifrs_group===g);
        const gColor={Custos:C.accent,Despesas:C.purple,Financeiras:C.red,Invest:C.green}[g.split(" ")[0]]||C.accent;
        return (
          <div key={g} style={{...card(),marginBottom:12}}>
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14,paddingBottom:12,borderBottom:`1px solid ${C.border}`}}>
              <div style={{width:10,height:10,borderRadius:3,background:gColor,boxShadow:`0 0 8px ${gColor}44`}}/>
              <span style={{fontSize:13,fontWeight:700,color:C.text}}>{g}</span>
              <span style={{...pill(gColor),fontSize:10}}>{gc.length} categori{gc.length===1?"a":"as"}</span>
            </div>
            <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
              {gc.map(c=>(
                <div key={c.id} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 12px",
                  background:C.surface,borderRadius:8,border:`1px solid ${C.border}`,borderLeft:`3px solid ${c.color}`,
                  transition:"border-color 0.15s ease"}}>
                  <span style={{fontSize:16}}>{c.icon}</span>
                  <span style={{fontSize:13,color:C.text,fontWeight:500}}>{c.name}</span>
                  <button onClick={()=>remove(c.id)} style={{background:"none",border:"none",cursor:"pointer",color:C.faint,padding:2,display:"flex",borderRadius:4,transition:"color 0.15s ease"}}
                    onMouseEnter={e=>e.currentTarget.style.color=C.red}
                    onMouseLeave={e=>e.currentTarget.style.color=C.faint}>
                    <X size={11}/>
                  </button>
                </div>
              ))}
              {gc.length===0&&<span style={{color:C.faint,fontSize:12}}>Nenhuma categoria neste grupo.</span>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ═══════════════════════════════════════════════
   REPORTS TAB
═══════════════════════════════════════════════ */
function ReportsTab({api}) {
  const [data,   setData]   = useState(null);
  const [loading,setLoading]= useState(true);
  const [err,    setErr]    = useState("");
  const [periodo,setPeriodo]= useState(new Date().toISOString().slice(0,7));

  useEffect(()=>{
    setLoading(true);
    api(`/reports/comparative?current_periodo=${periodo}`)
      .then(setData).catch(e=>setErr(e.message)).finally(()=>setLoading(false));
  },[periodo]);

  if(loading) return <Loading/>;
  if(err)     return <ErrMsg msg={err}/>;
  if(!data)   return null;

  const compareData = (data.by_category||[]).map(c=>({
    cat:c.name, atual:c.current, anterior:c.previous,
    diff:c.previous>0?((c.current-c.previous)/c.previous*100):0,
  }));

  return (
    <div style={{fontFamily:"'Outfit','Segoe UI',sans-serif"}}>
      <div style={{marginBottom:20,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div>
          <h2 style={{fontSize:21,fontWeight:700,color:C.text,margin:0,letterSpacing:"-0.02em",fontFamily:"'Lora','Georgia',serif"}}>Relatórios Comparativos</h2>
          <p style={{color:C.muted,fontSize:13,margin:"4px 0 0"}}>Período atual versus período anterior</p>
        </div>
        <input type="month" value={periodo} onChange={e=>setPeriodo(e.target.value)} style={{...selSt,padding:"8px 12px"}}/>
      </div>

      <div style={{display:"flex",gap:10,marginBottom:20,flexWrap:"wrap"}}>
        {[
          ["Receitas (Atual)",   fmt(data.current.total_receitas), C.green],
          ["Despesas (Atual)",   fmt(data.current.total_despesas), C.red],
          ["Saldo (Atual)",      fmt(data.current.saldo),          data.current.saldo>=0?C.green:C.red],
          ["Variação nas Despesas",  `${data.variation_pct>0?"+":""}${data.variation_pct.toFixed(1)}%`, data.variation_pct<=0?C.green:C.red],
        ].map(([l,v,c])=>(
          <div key={l} style={{...card(),flex:1,minWidth:140,boxShadow:`inset 0 2px 0 0 ${c}33`}}>
            <div style={{fontSize:10,color:C.muted,fontWeight:600,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:7}}>{l}</div>
            <div style={{fontSize:17,fontWeight:700,color:c,fontFamily:"'Space Mono',monospace"}}>{v}</div>
          </div>
        ))}
      </div>

      {compareData.length>0 ? (
        <>
          <div style={{...card(),marginBottom:12}}>
            <div style={{fontSize:13,fontWeight:600,color:C.text,marginBottom:16}}>Despesas: Mês Atual vs. Mês Anterior (R$)</div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={compareData} margin={{top:0,right:0,left:-10,bottom:0}}>
                <CartesianGrid strokeDasharray="3 3" stroke={C.border} strokeOpacity={0.6}/>
                <XAxis dataKey="cat" tick={{fill:C.muted,fontSize:10}}/>
                <YAxis tick={{fill:C.muted,fontSize:10}} tickFormatter={v=>fmt(v)}/>
                <Tooltip contentStyle={{background:C.cardB,border:`1px solid ${C.border}`,borderRadius:9,fontSize:12,boxShadow:"0 8px 24px rgba(0,0,0,0.4)"}} formatter={v=>fmt(v)}/>
                <Legend formatter={v=><span style={{color:C.muted,fontSize:11}}>{v}</span>}/>
                <Bar dataKey="anterior" name="Mês Anterior" fill={C.faint} radius={[4,4,0,0]}/>
                <Bar dataKey="atual"    name="Mês Atual"    fill={C.accent} radius={[4,4,0,0]}/>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div style={{...card({padding:0}),overflow:"hidden"}}>
            <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
              <thead>
                <tr style={{background:C.surface}}>
                  {["Categoria","Mês Anterior","Mês Atual","Variação","Tendência"].map(h=>(
                    <th key={h} style={{padding:"10px 14px",textAlign:"left",color:C.muted,fontWeight:600,fontSize:10,textTransform:"uppercase",letterSpacing:"0.06em",borderBottom:`1px solid ${C.border}`}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {compareData.map((r,i)=>(
                  <tr key={r.cat} style={{borderBottom:`1px solid ${C.border}22`,background:i%2===0?"transparent":C.surface+"55"}}>
                    <td style={{padding:"9px 14px",color:C.text,fontWeight:500}}>{r.cat}</td>
                    <td style={{padding:"9px 14px",fontFamily:"'Space Mono',monospace",color:C.muted}}>{fmt(r.anterior)}</td>
                    <td style={{padding:"9px 14px",fontFamily:"'Space Mono',monospace",fontWeight:600,color:C.text}}>{fmt(r.atual)}</td>
                    <td style={{padding:"9px 14px",fontFamily:"'Space Mono',monospace",fontWeight:700,color:r.diff>0?C.red:r.diff<0?C.green:C.muted}}>
                      {r.diff>0?"+":""}{r.diff.toFixed(1)}%
                    </td>
                    <td style={{padding:"9px 14px"}}>
                      {r.diff>10?<span style={{...pill(C.red),fontSize:10}}><TrendingUp size={9}/>Alta</span>:
                       r.diff<-10?<span style={{...pill(C.green),fontSize:10}}><TrendingDown size={9}/>Queda</span>:
                       <span style={{...pill(C.gold),fontSize:10}}>Estável</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <div style={{...card({background:C.surface}),textAlign:"center",padding:"56px"}}>
          <div style={{width:54,height:54,borderRadius:16,background:C.border+"44",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 16px"}}>
            <BarChart2 size={22} color={C.faint}/>
          </div>
          <p style={{color:C.muted,margin:0,fontSize:14}}>Sem dados suficientes para comparação. Cadastre lançamentos nos dois períodos.</p>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════
   MAIN APP
═══════════════════════════════════════════════ */
export default function App() {
  const { user, login, register, logout, api } = useAuth();
  const [tab, setTab] = useState("dashboard");

  useEffect(()=>{
    const l=document.createElement("link");
    l.href="https://fonts.googleapis.com/css2?family=Lora:wght@500;600;700&family=Outfit:wght@400;500;600;700&family=Space+Mono:wght@400;700&display=swap";
    l.rel="stylesheet"; document.head.appendChild(l);
  },[]);

  const handleAuth = async (mode, name, email, password) => {
    if(mode==="login") await login(email, password);
    else await register(name, email, password);
  };

  const [isMobile, setIsMobile] = useState(()=>typeof window!=='undefined'&&window.innerWidth<768);
  useEffect(()=>{
    const h=()=>setIsMobile(window.innerWidth<768);
    window.addEventListener("resize",h); return ()=>window.removeEventListener("resize",h);
  },[]);

  if(!user) return <LoginPage onLogin={handleAuth}/>;

  return (
    <div style={{display:"flex",flexDirection:isMobile?"column":"row",height:"100vh",background:`radial-gradient(ellipse 120% 80% at 80% 120%, rgba(155,35,53,0.06) 0%, ${C.bg} 50%)`,color:C.text,overflow:"hidden",fontFamily:"'Outfit','Segoe UI',sans-serif"}}>
      {!isMobile && <Sidebar active={tab} set={setTab} user={user} onLogout={logout}/>}
      <main style={{flex:1,overflowY:"auto",padding:isMobile?"16px 12px 84px":"24px 24px"}}>
        {tab==="dashboard"    && <DashboardTab    api={api}/>}
        {tab==="transactions" && <TransactionsTab api={api}/>}
        {tab==="import"       && <ImportTab       api={api}/>}
        {tab==="cards"        && <CardsTab        api={api}/>}
        {tab==="categories"   && <CategoriesTab   api={api}/>}
        {tab==="reports"      && <ReportsTab      api={api}/>}
      </main>
      {isMobile && <Sidebar active={tab} set={setTab} user={user} onLogout={logout}/>}
      <style>{`
        *{box-sizing:border-box}
        button:focus-visible{outline:2px solid ${C.accent};outline-offset:2px}
        input:focus{border-color:${C.accent}!important;box-shadow:0 0 0 3px rgba(155,35,53,0.14)}
        select:focus{outline:2px solid ${C.accent};outline-offset:1px}
        ::-webkit-scrollbar{width:5px}
        ::-webkit-scrollbar-track{background:${C.surface}}
        ::-webkit-scrollbar-thumb{background:${C.borderL};border-radius:3px}
        ::-webkit-scrollbar-thumb:hover{background:${C.faint}}
        @keyframes spin{to{transform:rotate(360deg)}}
        @import url('https://fonts.googleapis.com/css2?family=Lora:wght@500;600;700&family=Outfit:wght@400;500;600;700&family=Space+Mono:wght@400;700&display=swap');
      `}</style>
    </div>
  );
}
