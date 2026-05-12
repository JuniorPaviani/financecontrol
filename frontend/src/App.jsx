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

const C = {
  bg:"#060A12",surface:"#0C1120",card:"#101728",cardB:"#141E30",
  border:"#1C2A42",borderL:"#243550",accent:"#2563EB",accentSft:"rgba(37,99,235,0.14)",
  gold:"#F59E0B",goldSft:"rgba(245,158,11,0.13)",green:"#10B981",greenSft:"rgba(16,185,129,0.11)",
  red:"#EF4444",redSft:"rgba(239,68,68,0.11)",purple:"#8B5CF6",teal:"#06B6D4",
  text:"#E8F0FE",muted:"#8895B0",faint:"#3D4F6E",
};

const fmt = n => `R$ ${Number(n||0).toLocaleString("pt-BR",{minimumFractionDigits:2,maximumFractionDigits:2})}`;
const fmtD = d => d ? new Date(d+"T12:00").toLocaleDateString("pt-BR") : "—";
const card = (x={}) => ({background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:"20px 24px",...x});
const pill = c => ({display:"inline-flex",alignItems:"center",gap:4,padding:"2px 10px",borderRadius:20,fontSize:11,fontWeight:600,background:c+"22",color:c,letterSpacing:"0.02em"});
const inpSt = (err) => ({width:"100%",padding:"9px 12px",borderRadius:7,background:C.card,border:`1px solid ${err?C.red:C.border}`,color:C.text,fontSize:13,outline:"none",boxSizing:"border-box"});
const selSt = {background:C.card,border:`1px solid ${C.border}`,borderRadius:6,color:C.text,fontSize:12,padding:"6px 10px",cursor:"pointer",outline:"none"};

/* ═══════════════════════════════════════════════
   API HELPER
═══════════════════════════════════════════════ */
async function apiFetch(path, options={}, token=null) {
  const headers = { "Content-Type":"application/json", ...(token?{Authorization:`Bearer ${token}`}:{}) };
  const res = await fetch(`${API}${path}`, {...options, headers: options.body instanceof FormData ? (token?{Authorization:`Bearer ${token}`}:{}) : headers });
  if (!res.ok) {
    const err = await res.json().catch(()=>({detail:res.statusText}));
    throw new Error(err.detail || "Erro desconhecido");
  }
  return res.json();
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
      background:C.bg,fontFamily:"'Outfit','Segoe UI',sans-serif"}}>
      <div style={{...card({background:C.surface,boxShadow:"0 30px 70px rgba(0,0,0,.55)"}),width:400,padding:40}}>
        <div style={{textAlign:"center",marginBottom:28}}>
          <div style={{display:"inline-flex",alignItems:"center",justifyContent:"center",width:54,height:54,
            borderRadius:14,background:C.accentSft,border:`1px solid ${C.accent}44`,marginBottom:14}}>
            <Wallet size={24} color={C.accent}/>
          </div>
          <h1 style={{fontSize:21,fontWeight:700,color:C.text,margin:0}}>FinanceControl</h1>
          <p style={{color:C.muted,fontSize:13,marginTop:4}}>Gestão Financeira · Classificação IFRS</p>
        </div>

        <div style={{display:"flex",background:C.card,borderRadius:8,padding:3,marginBottom:22}}>
          {[["login","Entrar"],["register","Criar conta"]].map(([v,l])=>(
            <button key={v} onClick={()=>setMode(v)} style={{flex:1,padding:"7px",borderRadius:6,border:"none",
              cursor:"pointer",background:mode===v?C.accent:"transparent",color:mode===v?"#fff":C.muted,fontSize:13,fontWeight:600}}>
              {l}
            </button>
          ))}
        </div>

        {mode==="register" && (
          <div style={{marginBottom:14}}>
            <label style={{display:"block",fontSize:11,fontWeight:600,color:C.muted,marginBottom:5,textTransform:"uppercase",letterSpacing:"0.04em"}}>Nome</label>
            <input type="text" value={name} onChange={e=>setName(e.target.value)} placeholder="Seu nome completo"
              style={inpSt(false)}/>
          </div>
        )}

        {[["E-mail","email",email,setEmail,"text"],["Senha","password",pass,setPass,"password"]].map(([l,id,v,s,t])=>(
          <div key={id} style={{marginBottom:14}}>
            <label style={{display:"block",fontSize:11,fontWeight:600,color:C.muted,marginBottom:5,textTransform:"uppercase",letterSpacing:"0.04em"}}>{l}</label>
            <input type={t} value={v} onChange={e=>s(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handle()}
              placeholder={t==="password"?"••••••••":"seu@email.com"} style={inpSt(false)}/>
          </div>
        ))}

        {err && (
          <div style={{padding:"10px 12px",borderRadius:7,background:C.redSft,border:`1px solid ${C.red}33`,
            color:C.red,fontSize:12,marginBottom:14,display:"flex",alignItems:"center",gap:7}}>
            <AlertCircle size={13}/>{err}
          </div>
        )}

        <button onClick={handle} disabled={loading} style={{width:"100%",padding:"12px",borderRadius:8,border:"none",
          cursor:"pointer",background:loading?C.faint:C.accent,color:"#fff",fontSize:14,fontWeight:600,
          display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
          {loading?<><Loader2 size={15} style={{animation:"spin .8s linear infinite"}}/>Aguarde...</>:
          mode==="login"?"Entrar no Sistema":"Criar Conta"}
        </button>
      </div>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&family=Space+Mono:wght@400;700&display=swap');@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   SIDEBAR
═══════════════════════════════════════════════ */
function Sidebar({active,set,user,onLogout}) {
  const nav=[
    {id:"dashboard",   icon:LayoutDashboard,label:"Dashboard"},
    {id:"transactions",icon:CreditCard,      label:"Lançamentos"},
    {id:"import",      icon:Upload,          label:"Importar PDF"},
    {id:"cards",       icon:CreditCard,      label:"Cartões"},
    {id:"categories",  icon:Tag,             label:"Categorias"},
    {id:"reports",     icon:BarChart2,       label:"Relatórios"},
  ];
  return (
    <div style={{width:216,height:"100vh",background:C.surface,borderRight:`1px solid ${C.border}`,
      display:"flex",flexDirection:"column",flexShrink:0,fontFamily:"'Outfit','Segoe UI',sans-serif"}}>
      <div style={{padding:"20px 16px 12px",borderBottom:`1px solid ${C.border}`}}>
        <div style={{display:"flex",alignItems:"center",gap:9}}>
          <div style={{width:32,height:32,borderRadius:8,background:C.accentSft,display:"flex",alignItems:"center",justifyContent:"center"}}>
            <Wallet size={16} color={C.accent}/>
          </div>
          <div>
            <div style={{fontSize:13,fontWeight:700,color:C.text}}>FinanceControl</div>
            <div style={{fontSize:10,color:C.muted}}>v2.5 · IFRS</div>
          </div>
        </div>
      </div>
      <nav style={{flex:1,padding:"8px 6px",overflowY:"auto"}}>
        {nav.map(({id,icon:Icon,label})=>{
          const on=active===id;
          return (
            <button key={id} onClick={()=>set(id)} style={{width:"100%",display:"flex",alignItems:"center",
              gap:9,padding:"8px 11px",borderRadius:7,border:"none",cursor:"pointer",
              background:on?C.accentSft:"transparent",color:on?C.accent:C.muted,
              fontSize:12,fontWeight:on?600:400,marginBottom:1,textAlign:"left"}}>
              <Icon size={14}/>{label}
            </button>
          );
        })}
      </nav>
      <div style={{padding:"12px 6px",borderTop:`1px solid ${C.border}`}}>
        <div style={{display:"flex",alignItems:"center",gap:8,padding:"7px 11px",marginBottom:3}}>
          <div style={{width:30,height:30,borderRadius:"50%",background:C.accent,display:"flex",
            alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:700,color:"#fff",flexShrink:0}}>
            {user?.name?.charAt(0)?.toUpperCase()}
          </div>
          <div style={{flex:1,overflow:"hidden"}}>
            <div style={{fontSize:12,fontWeight:600,color:C.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{user?.name}</div>
            <div style={{fontSize:10,color:C.muted}}>Administrador</div>
          </div>
        </div>
        <button onClick={onLogout} style={{width:"100%",display:"flex",alignItems:"center",gap:8,
          padding:"7px 11px",borderRadius:7,border:"none",cursor:"pointer",background:"transparent",color:C.muted,fontSize:12}}>
          <LogOut size={12}/>Sair
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
    <div style={{display:"flex",alignItems:"center",justifyContent:"center",minHeight:300}}>
      <Loader2 size={28} color={C.accent} style={{animation:"spin .9s linear infinite"}}/>
    </div>
  );
}
function ErrMsg({msg}) {
  return (
    <div style={{padding:"14px 18px",borderRadius:8,background:C.redSft,border:`1px solid ${C.red}33`,
      color:C.red,fontSize:13,display:"flex",alignItems:"center",gap:8}}>
      <AlertCircle size={14}/>{msg}
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

  return (
    <div style={{fontFamily:"'Outfit','Segoe UI',sans-serif"}}>
      <div style={{marginBottom:20,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div>
          <h2 style={{fontSize:20,fontWeight:700,color:C.text,margin:0}}>Dashboard</h2>
          <p style={{color:C.muted,fontSize:13,margin:"3px 0 0"}}>Período: {currentPeriod.replace("-","/")} </p>
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
          <div key={t} style={{...card(),flex:1,minWidth:150}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
              <span style={{fontSize:10,fontWeight:600,color:C.muted,textTransform:"uppercase",letterSpacing:"0.05em"}}>{t}</span>
              <div style={{width:28,height:28,borderRadius:7,background:color+"22",display:"flex",alignItems:"center",justifyContent:"center"}}>
                <Icon size={13} color={color}/>
              </div>
            </div>
            <div style={{fontSize:18,fontWeight:700,color:C.text,fontFamily:"'Space Mono',monospace"}}>{fmt(v)}</div>
            {chg!=null && (
              <div style={{display:"flex",alignItems:"center",gap:3,fontSize:10,marginTop:4}}>
                {chg>=0?<TrendingUp size={10} color={C.green}/>:<TrendingDown size={10} color={C.red}/>}
                <span style={{color:chg>=0?C.green:C.red,fontWeight:600}}>{chg>0?"+":""}{chg.toFixed(1)}%</span>
                <span style={{color:C.faint}}>vs mês ant.</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Charts row */}
      {summary.length > 0 && (
        <div style={{display:"flex",gap:10,marginBottom:10,flexWrap:"wrap"}}>
          <div style={{...card(),flex:2,minWidth:300}}>
            <div style={{fontSize:13,fontWeight:600,color:C.text,marginBottom:12}}>Evolução Mensal</div>
            <ResponsiveContainer width="100%" height={190}>
              <AreaChart data={summary} margin={{top:0,right:0,left:-20,bottom:0}}>
                <defs>
                  <linearGradient id="gR" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={C.green} stopOpacity={.2}/><stop offset="95%" stopColor={C.green} stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="gD" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={C.red} stopOpacity={.2}/><stop offset="95%" stopColor={C.red} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={C.border}/>
                <XAxis dataKey="periodo_referencia" tick={{fill:C.muted,fontSize:10}}/>
                <YAxis tick={{fill:C.muted,fontSize:10}} tickFormatter={v=>`${(v/1000).toFixed(0)}k`}/>
                <Tooltip contentStyle={{background:C.cardB,border:`1px solid ${C.border}`,borderRadius:8,fontSize:12}}
                  formatter={v=>fmt(v)}/>
                <Area type="monotone" dataKey="total_receitas" name="Receitas" stroke={C.green} fill="url(#gR)" strokeWidth={2}/>
                <Area type="monotone" dataKey="total_despesas" name="Despesas" stroke={C.red}   fill="url(#gD)" strokeWidth={2}/>
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {catData.length>0 && (
            <div style={{...card(),flex:1,minWidth:220}}>
              <div style={{fontSize:13,fontWeight:600,color:C.text,marginBottom:12}}>Por Categoria</div>
              <ResponsiveContainer width="100%" height={190}>
                <BarChart data={catData} layout="vertical" margin={{top:0,right:0,left:40,bottom:0}}>
                  <XAxis type="number" tick={{fill:C.muted,fontSize:10}} tickFormatter={v=>fmt(v)}/>
                  <YAxis type="category" dataKey="name" tick={{fill:C.muted,fontSize:10}} width={80}/>
                  <Tooltip formatter={v=>fmt(v)} contentStyle={{background:C.cardB,border:`1px solid ${C.border}`,borderRadius:8,fontSize:12}}/>
                  <Bar dataKey="value" fill={C.accent} radius={[0,4,4,0]}/>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}

      {/* Projection */}
      {proj.length>0 && (
        <div style={{...card()}}>
          <div style={{fontSize:13,fontWeight:600,color:C.text,marginBottom:12,display:"flex",alignItems:"center",gap:8}}>
            <Clock size={13} color={C.gold}/> Parcelas Futuras
            <span style={{...pill(C.gold)}}>{proj.length} compromissos</span>
          </div>
          <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            {proj.map((p,i)=>(
              <div key={i} style={{flex:1,minWidth:160,background:C.surface,borderRadius:8,padding:"11px 14px",
                border:`1px solid ${C.border}`,borderLeft:`3px solid ${C.gold}`}}>
                <div style={{fontSize:11,fontWeight:600,color:C.text,marginBottom:4,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.description}</div>
                <div style={{fontSize:15,fontWeight:700,color:C.gold,fontFamily:"monospace"}}>{fmt(p.monthly_amount)}/mês</div>
                <div style={{fontSize:11,color:C.muted,marginTop:2}}>{p.remaining}× restantes</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {summary.length===0 && (
        <div style={{...card({background:C.surface}),textAlign:"center",padding:"48px 24px"}}>
          <Wallet size={36} color={C.faint} style={{marginBottom:12}}/>
          <p style={{color:C.muted,margin:0}}>Nenhum dado ainda. Cadastre lançamentos ou importe uma fatura PDF.</p>
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
    if(f.inst && !/^\d{2}\/\d{2}$/.test(f.inst)) e.inst="Formato: 02/10";
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
    <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.76)",
      display:"flex",alignItems:"center",justifyContent:"center",zIndex:200,padding:16}}>
      <div onClick={e=>e.stopPropagation()} style={{...card({background:C.surface,boxShadow:"0 32px 72px rgba(0,0,0,.65)"}),
        width:"100%",maxWidth:500,maxHeight:"92vh",overflowY:"auto"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18}}>
          <h3 style={{margin:0,fontSize:15,fontWeight:700,color:C.text}}>Novo Lançamento</h3>
          <button onClick={onClose} style={{background:"none",border:"none",cursor:"pointer",color:C.muted}}><X size={17}/></button>
        </div>

        {/* Tipo */}
        <div style={{display:"flex",gap:8,marginBottom:16}}>
          {[["D","▼ Despesa",C.red],["R","▲ Receita",C.green]].map(([v,l,c])=>(
            <button key={v} onClick={()=>setF({...f,type:v})} style={{flex:1,padding:"10px",borderRadius:8,
              border:`2px solid ${f.type===v?c:C.border}`,background:f.type===v?c+"22":"transparent",
              color:f.type===v?c:C.muted,fontSize:13,fontWeight:700,cursor:"pointer"}}>
              {l}
            </button>
          ))}
        </div>

        {/* Data + Valor */}
        <div style={{display:"flex",gap:12,marginBottom:14}}>
          <div style={{flex:1}}>
            <label style={{display:"block",fontSize:11,fontWeight:600,color:err.date?C.red:C.muted,marginBottom:5,textTransform:"uppercase",letterSpacing:"0.04em"}}>Data *</label>
            <input type="date" value={f.date} onChange={e=>setF({...f,date:e.target.value})} style={inpSt(err.date)}/>
            {err.date&&<span style={{color:C.red,fontSize:10}}>{err.date}</span>}
          </div>
          <div style={{flex:1}}>
            <label style={{display:"block",fontSize:11,fontWeight:600,color:err.amount?C.red:C.muted,marginBottom:5,textTransform:"uppercase",letterSpacing:"0.04em"}}>Valor (R$) *</label>
            <input type="number" min="0.01" step="0.01" placeholder="0,00" value={f.amount}
              onChange={e=>setF({...f,amount:e.target.value})} style={inpSt(err.amount)}/>
            {err.amount&&<span style={{color:C.red,fontSize:10}}>{err.amount}</span>}
          </div>
        </div>

        {/* Descrição */}
        <div style={{marginBottom:14}}>
          <label style={{display:"block",fontSize:11,fontWeight:600,color:err.desc?C.red:C.muted,marginBottom:5,textTransform:"uppercase",letterSpacing:"0.04em"}}>Descrição *</label>
          <input type="text" placeholder="Ex: SUPERMERCADO EXTRA" value={f.desc}
            onChange={e=>setF({...f,desc:e.target.value})} style={inpSt(err.desc)}/>
          {err.desc&&<span style={{color:C.red,fontSize:10}}>{err.desc}</span>}
        </div>

        {/* Fornecedor */}
        <div style={{marginBottom:14}}>
          <label style={{display:"block",fontSize:11,fontWeight:600,color:err.supplier?C.red:C.muted,marginBottom:5,textTransform:"uppercase",letterSpacing:"0.04em"}}>Fornecedor *</label>
          <input type="text" placeholder="Ex: Extra, iFood, Uber..." value={f.supplier}
            onChange={e=>setF({...f,supplier:e.target.value})} style={inpSt(err.supplier)}/>
          {err.supplier&&<span style={{color:C.red,fontSize:10}}>{err.supplier}</span>}
        </div>

        {/* Categoria + Cartão */}
        <div style={{display:"flex",gap:12,marginBottom:14}}>
          <div style={{flex:1}}>
            <label style={{display:"block",fontSize:11,fontWeight:600,color:C.muted,marginBottom:5,textTransform:"uppercase",letterSpacing:"0.04em"}}>Categoria IFRS</label>
            <select value={f.cat_id} onChange={e=>setF({...f,cat_id:e.target.value})} style={{...selSt,width:"100%",padding:"9px 12px"}}>
              <option value="">— Sem categoria</option>
              {categories.map(c=><option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
            </select>
          </div>
          {f.type==="D" && (
            <div style={{flex:1}}>
              <label style={{display:"block",fontSize:11,fontWeight:600,color:C.muted,marginBottom:5,textTransform:"uppercase",letterSpacing:"0.04em"}}>Cartão</label>
              <select value={f.card_id} onChange={e=>setF({...f,card_id:e.target.value})} style={{...selSt,width:"100%",padding:"9px 12px"}}>
                <option value="">— Sem cartão</option>
                {cards.map(c=><option key={c.id} value={c.id}>{c.name} ({c.bank})</option>)}
              </select>
            </div>
          )}
        </div>

        {/* Parcela (só despesa) */}
        {f.type==="D" && (
          <div style={{marginBottom:18,padding:"12px 14px",background:C.card,borderRadius:8,border:`1px solid ${C.border}`}}>
            <p style={{fontSize:11,fontWeight:600,color:C.muted,margin:"0 0 10px",textTransform:"uppercase",letterSpacing:"0.04em"}}>
              Compra Parcelada (opcional)
            </p>
            <div style={{display:"flex",gap:12,alignItems:"flex-start"}}>
              <div style={{flex:1}}>
                <label style={{fontSize:11,color:err.inst?C.red:C.muted,display:"block",marginBottom:4}}>Parcela (ex: 01/12)</label>
                <input type="text" placeholder="01/12" maxLength={5} value={f.inst}
                  onChange={e=>setF({...f,inst:e.target.value})} style={inpSt(err.inst)}/>
                {err.inst&&<span style={{color:C.red,fontSize:10}}>{err.inst}</span>}
              </div>
              <div style={{flex:1,paddingTop:20,fontSize:12,color:C.muted}}>
                {f.inst&&f.amount?
                  <span style={{color:C.gold}}>Projetará {f.inst.split("/")[1]||"?"} meses a {fmt(f.amount)}</span>:
                  <span style={{color:C.faint}}>Preencha para ver projeção</span>}
              </div>
            </div>
          </div>
        )}

        {err.api && <ErrMsg msg={err.api}/>}

        {saved ? (
          <div style={{padding:"13px",borderRadius:8,background:C.greenSft,border:`1px solid ${C.green}44`,
            display:"flex",alignItems:"center",gap:10,justifyContent:"center"}}>
            <CheckCircle2 size={17} color={C.green}/>
            <span style={{color:C.green,fontWeight:600,fontSize:14}}>Lançamento salvo!</span>
          </div>
        ) : (
          <div style={{display:"flex",gap:8,marginTop:4}}>
            <button onClick={onClose} style={{flex:1,padding:"10px",borderRadius:8,border:`1px solid ${C.border}`,
              background:"transparent",color:C.muted,fontSize:13,cursor:"pointer"}}>Cancelar</button>
            <button onClick={handle} disabled={loading} style={{flex:2,padding:"10px",borderRadius:8,border:"none",
              cursor:"pointer",background:f.type==="D"?C.red:C.green,color:"#fff",fontSize:13,fontWeight:700,
              display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
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
      <div style={{marginBottom:14,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div>
          <h2 style={{fontSize:20,fontWeight:700,color:C.text,margin:0}}>Lançamentos</h2>
          <p style={{color:C.muted,fontSize:13,margin:"3px 0 0"}}>{txList.length} transações · saldo&nbsp;
            <strong style={{color:rec-des>=0?C.green:C.red}}>{fmt(rec-des)}</strong>
          </p>
        </div>
        <button onClick={()=>setModal(true)} style={{display:"flex",alignItems:"center",gap:6,padding:"9px 16px",
          borderRadius:8,border:"none",cursor:"pointer",background:C.accent,color:"#fff",fontSize:13,fontWeight:600}}>
          <Plus size={14}/>Novo Lançamento
        </button>
      </div>

      {/* Totais */}
      <div style={{display:"flex",gap:8,marginBottom:12}}>
        {[["Receitas",rec,C.green],["Despesas",des,C.red],["Saldo",rec-des,rec-des>=0?C.green:C.red]].map(([l,v,c])=>(
          <div key={l} style={{flex:1,background:C.card,border:`1px solid ${C.border}`,borderRadius:9,padding:"9px 14px"}}>
            <div style={{fontSize:10,color:C.muted,fontWeight:600,textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:3}}>{l}</div>
            <div style={{fontSize:15,fontWeight:700,color:c,fontFamily:"monospace"}}>{fmt(v)}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{...card({padding:"10px 14px"}),marginBottom:10,display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
        <input type="month" value={periodo} onChange={e=>setPeriodo(e.target.value)}
          style={{...selSt,padding:"7px 10px"}}/>
        <div style={{display:"flex",alignItems:"center",gap:7,flex:1,minWidth:160,background:C.surface,
          borderRadius:7,border:`1px solid ${C.border}`,padding:"7px 10px"}}>
          <Search size={12} color={C.muted}/>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar..."
            style={{background:"transparent",border:"none",outline:"none",color:C.text,fontSize:12,flex:1}}/>
          {search&&<button onClick={()=>setSearch("")} style={{background:"none",border:"none",cursor:"pointer",color:C.muted,padding:0}}><X size={11}/></button>}
        </div>
        <select value={fType} onChange={e=>setFType(e.target.value)} style={selSt}>
          <option value="all">Todos</option><option value="D">Despesas</option><option value="R">Receitas</option>
        </select>
        <span style={{...pill(C.accent),fontSize:10}}><Filter size={9}/>{txList.length}</span>
      </div>

      {err && <ErrMsg msg={err}/>}
      {loading ? <Loading/> : (
        <div style={{...card({padding:0}),overflow:"hidden"}}>
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
            <thead>
              <tr style={{background:C.surface}}>
                {["Data","Descrição","Parcela","Cartão","Categoria","Valor","Tipo",""].map(h=>(
                  <th key={h} style={{padding:"9px 12px",textAlign:"left",color:C.muted,fontWeight:600,
                    fontSize:10,textTransform:"uppercase",letterSpacing:"0.04em",borderBottom:`1px solid ${C.border}`}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {txList.length===0 && (
                <tr><td colSpan={8} style={{padding:"32px",textAlign:"center",color:C.muted,fontSize:13}}>
                  Nenhuma transação neste período.
                </td></tr>
              )}
              {txList.map((t,i)=>(
                <tr key={t.id} style={{borderBottom:`1px solid ${C.border}22`,background:i%2===0?"transparent":C.surface+"55"}}>
                  <td style={{padding:"8px 12px",color:C.muted,fontFamily:"monospace",fontSize:11}}>{fmtD(t.date)}</td>
                  <td style={{padding:"8px 12px"}}>
                    <div style={{color:C.text,fontWeight:500}}>{t.description}</div>
                    <div style={{color:C.muted,fontSize:11}}>{t.supplier}</div>
                  </td>
                  <td style={{padding:"8px 12px"}}>
                    {t.installment_current?<span style={{...pill(C.purple),fontSize:10}}>{t.installment_current}/{t.installment_total}</span>:<span style={{color:C.faint}}>—</span>}
                  </td>
                  <td style={{padding:"8px 12px",color:C.muted,fontSize:11}}>{t.card?.name||"—"}</td>
                  <td style={{padding:"8px 12px"}}>
                    {t.category?<span style={{...pill(t.category.color||C.accent),fontSize:10}}>{t.category.icon} {t.category.name}</span>:<span style={{color:C.faint}}>—</span>}
                  </td>
                  <td style={{padding:"8px 12px",fontFamily:"monospace",fontWeight:700,color:t.type==="R"?C.green:C.red}}>
                    {t.type==="R"?"+":"-"}{fmt(t.amount)}
                  </td>
                  <td style={{padding:"8px 12px"}}>
                    <span style={{...pill(t.type==="R"?C.green:C.red),fontSize:10}}>{t.type==="R"?"Receita":"Despesa"}</span>
                  </td>
                  <td style={{padding:"8px 8px"}}>
                    {delId===t.id?(
                      <div style={{display:"flex",gap:3}}>
                        <button onClick={()=>handleDelete(t.id)} style={{padding:"3px 7px",borderRadius:5,border:"none",background:C.red,color:"#fff",fontSize:10,cursor:"pointer",fontWeight:600}}>Sim</button>
                        <button onClick={()=>setDelId(null)} style={{padding:"3px 7px",borderRadius:5,border:`1px solid ${C.border}`,background:"transparent",color:C.muted,fontSize:10,cursor:"pointer"}}>Não</button>
                      </div>
                    ):(
                      <button onClick={()=>setDelId(t.id)} style={{background:"none",border:"none",cursor:"pointer",color:C.faint,padding:3}}
                        onMouseEnter={e=>e.currentTarget.style.color=C.red}
                        onMouseLeave={e=>e.currentTarget.style.color=C.faint}>
                        <Trash2 size={12}/>
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
    if(!f||!f.name.endsWith(".pdf")){ setErr("Apenas arquivos PDF."); return; }
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
      <div style={{...card({background:C.surface,width:420,textAlign:"center"})}}>
        <Loader2 size={28} color={C.accent} style={{animation:"spin .9s linear infinite",marginBottom:16}}/>
        <h3 style={{color:C.text,fontSize:15,fontWeight:700,margin:"0 0 8px"}}>Processando PDF</h3>
        <p style={{color:C.muted,fontSize:13,margin:"0 0 20px"}}>Identificando banco e extraindo transações...</p>
        <div style={{background:C.border,borderRadius:6,height:7,overflow:"hidden"}}>
          <div style={{background:`linear-gradient(90deg,${C.accent},${C.teal})`,height:"100%",width:`${prog}%`,borderRadius:6,transition:"width .2s"}}/>
        </div>
        <p style={{color:C.accent,fontFamily:"monospace",marginTop:8}}>{Math.round(prog)}%</p>
      </div>
    </div>
  );

  if(step==="preview"&&preview) return (
    <div style={{fontFamily:"'Outfit','Segoe UI',sans-serif"}}>
      <div style={{marginBottom:16,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div>
          <h2 style={{fontSize:18,fontWeight:700,color:C.text,margin:0}}>Pré-visualização da Fatura</h2>
          <p style={{color:C.muted,fontSize:13,margin:"3px 0 0"}}>
            <strong style={{color:C.accent}}>{preview.bank}</strong> · {preview.total_transactions} transações · Total: <strong style={{color:C.red}}>{fmt(preview.total_amount)}</strong>
          </p>
        </div>
        <div style={{display:"flex",gap:8,alignItems:"center"}}>
          <select value={cardId} onChange={e=>setCardId(e.target.value)} style={{...selSt,padding:"9px 14px"}}>
            <option value="">Selecione o cartão...</option>
            {cards.map(c=><option key={c.id} value={c.id}>{c.name} ({c.bank})</option>)}
          </select>
          <button onClick={()=>setStep("upload")} style={{padding:"9px 14px",borderRadius:8,border:`1px solid ${C.border}`,background:"transparent",color:C.muted,fontSize:13,cursor:"pointer"}}>Cancelar</button>
          <button onClick={handleConfirm} disabled={importing} style={{padding:"9px 16px",borderRadius:8,border:"none",background:C.green,color:"#fff",fontSize:13,fontWeight:600,cursor:"pointer",display:"flex",alignItems:"center",gap:7}}>
            {importing?<Loader2 size={13} style={{animation:"spin .8s linear infinite"}}/>:<CheckCircle2 size={13}/>}Confirmar
          </button>
        </div>
      </div>
      {err&&<div style={{marginBottom:12}}><ErrMsg msg={err}/></div>}
      <div style={{...card({padding:0}),overflow:"hidden"}}>
        <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
          <thead>
            <tr style={{background:C.surface}}>
              {["Data","Descrição","Fornecedor","Parcela","Categoria","Valor"].map(h=>(
                <th key={h} style={{padding:"9px 12px",textAlign:"left",color:C.muted,fontWeight:600,fontSize:10,textTransform:"uppercase",letterSpacing:"0.04em",borderBottom:`1px solid ${C.border}`}}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {preview.transactions.map((t,i)=>(
              <tr key={i} style={{borderBottom:`1px solid ${C.border}22`,background:i%2===0?"transparent":C.surface+"55"}}>
                <td style={{padding:"8px 12px",color:C.muted,fontFamily:"monospace",fontSize:11}}>{fmtD(t.date)}</td>
                <td style={{padding:"8px 12px",color:C.text}}>{t.description}</td>
                <td style={{padding:"8px 12px",color:C.muted,fontSize:11}}>{t.supplier||"—"}</td>
                <td style={{padding:"8px 12px"}}>
                  {t.installment_current?<span style={{...pill(C.purple),fontSize:10}}>{t.installment_current}/{t.installment_total}</span>:<span style={{color:C.faint}}>À vista</span>}
                </td>
                <td style={{padding:"8px 12px"}}><span style={{...pill(C.accent),fontSize:10}}>{t.category_guess||"—"}</span></td>
                <td style={{padding:"8px 12px",fontFamily:"monospace",fontWeight:700,color:C.red}}>{fmt(t.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  if(step==="done"&&result) return (
    <div style={{display:"flex",alignItems:"center",justifyContent:"center",minHeight:360}}>
      <div style={{...card({background:C.surface,width:380,textAlign:"center"})}}>
        <div style={{width:54,height:54,borderRadius:"50%",background:C.greenSft,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 16px",border:`2px solid ${C.green}`}}>
          <CheckCircle2 size={26} color={C.green}/>
        </div>
        <h3 style={{color:C.text,fontSize:16,fontWeight:700,margin:"0 0 8px"}}>Importação Concluída!</h3>
        <p style={{color:C.muted,fontSize:13,margin:"0 0 6px"}}><strong style={{color:C.green}}>{result.imported} transações</strong> importadas — banco <strong style={{color:C.accent}}>{result.bank}</strong></p>
        <button onClick={()=>{setStep("upload");setPreview(null);setFile(null);setResult(null);}} style={{marginTop:20,padding:"10px 22px",borderRadius:8,border:"none",background:C.accent,color:"#fff",fontSize:13,fontWeight:600,cursor:"pointer"}}>
          Importar Outra Fatura
        </button>
      </div>
    </div>
  );

  return (
    <div style={{fontFamily:"'Outfit','Segoe UI',sans-serif"}}>
      <div style={{marginBottom:22}}>
        <h2 style={{fontSize:20,fontWeight:700,color:C.text,margin:0}}>Importar Fatura PDF</h2>
        <p style={{color:C.muted,fontSize:13,margin:"4px 0 0"}}>Suporte a: Itaú, Santander, Bradesco, Caixa, Sam's Club, Sicredi, Riachuelo</p>
      </div>

      <div onDragOver={e=>{e.preventDefault();}} onDrop={e=>{e.preventDefault();handleFile(e.dataTransfer.files[0]);}}
        onClick={()=>document.getElementById("pdfInput").click()}
        style={{border:`2px dashed ${C.border}`,borderRadius:12,padding:"48px 24px",textAlign:"center",marginBottom:20,cursor:"pointer"}}
        onMouseEnter={e=>e.currentTarget.style.borderColor=C.accent}
        onMouseLeave={e=>e.currentTarget.style.borderColor=C.border}>
        <Upload size={28} color={C.accent} style={{marginBottom:14}}/>
        <p style={{color:C.text,fontSize:14,fontWeight:600,margin:"0 0 6px"}}>Arraste o PDF da fatura aqui</p>
        <p style={{color:C.muted,fontSize:13,margin:0}}>ou clique para selecionar · máximo 25 MB</p>
        <input id="pdfInput" type="file" accept=".pdf" style={{display:"none"}} onChange={e=>handleFile(e.target.files[0])}/>
      </div>

      {err&&<ErrMsg msg={err}/>}

      <div style={{...card()}}>
        <p style={{fontSize:13,fontWeight:600,color:C.text,margin:"0 0 12px"}}>Bancos suportados:</p>
        <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
          {BANKS.map(b=>(
            <span key={b} style={{...pill(C.accent),fontSize:11,padding:"4px 12px"}}>
              <Building2 size={10}/>{b}
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
      <div style={{marginBottom:18,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div>
          <h2 style={{fontSize:20,fontWeight:700,color:C.text,margin:0}}>Cartões</h2>
          <p style={{color:C.muted,fontSize:13,margin:"3px 0 0"}}>Gerencie seus cartões de crédito e débito</p>
        </div>
        <button onClick={()=>setModal(true)} style={{display:"flex",alignItems:"center",gap:6,padding:"9px 16px",borderRadius:8,border:"none",cursor:"pointer",background:C.accent,color:"#fff",fontSize:13,fontWeight:600}}>
          <Plus size={14}/>Novo Cartão
        </button>
      </div>

      {err&&<ErrMsg msg={err}/>}
      {loading?<Loading/>:(
        <div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
          {cards.length===0&&(
            <div style={{...card({background:C.surface}),flex:1,textAlign:"center",padding:"48px"}}>
              <CreditCard size={32} color={C.faint} style={{marginBottom:12}}/>
              <p style={{color:C.muted,margin:0}}>Nenhum cartão cadastrado. Adicione um para vincular às despesas.</p>
            </div>
          )}
          {cards.map(c=>(
            <div key={c.id} style={{...card({borderLeft:`4px solid ${c.color}`}),flex:"0 0 280px"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12}}>
                <div>
                  <div style={{fontSize:15,fontWeight:700,color:C.text}}>{c.name}</div>
                  <div style={{fontSize:12,color:C.muted,marginTop:2}}>{c.bank}{c.last_four?` ···· ${c.last_four}`:""}</div>
                </div>
                <button onClick={()=>remove(c.id)} style={{background:"none",border:"none",cursor:"pointer",color:C.faint,padding:4}}
                  onMouseEnter={e=>e.currentTarget.style.color=C.red}
                  onMouseLeave={e=>e.currentTarget.style.color=C.faint}>
                  <Trash2 size={14}/>
                </button>
              </div>
              <div style={{display:"flex",gap:16}}>
                {c.credit_limit>0&&<div><div style={{fontSize:10,color:C.muted,marginBottom:2}}>LIMITE</div><div style={{fontSize:13,fontWeight:600,color:C.text,fontFamily:"monospace"}}>{fmt(c.credit_limit)}</div></div>}
                {c.closing_day&&<div><div style={{fontSize:10,color:C.muted,marginBottom:2}}>FECHAMENTO</div><div style={{fontSize:13,fontWeight:600,color:C.text}}>Dia {c.closing_day}</div></div>}
                {c.due_day&&<div><div style={{fontSize:10,color:C.muted,marginBottom:2}}>VENCIMENTO</div><div style={{fontSize:13,fontWeight:600,color:C.text}}>Dia {c.due_day}</div></div>}
              </div>
            </div>
          ))}
        </div>
      )}

      {modal&&(
        <div onClick={()=>setModal(false)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.76)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:200,padding:16}}>
          <div onClick={e=>e.stopPropagation()} style={{...card({background:C.surface,boxShadow:"0 32px 72px rgba(0,0,0,.65)"}),width:"100%",maxWidth:440}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18}}>
              <h3 style={{margin:0,fontSize:15,fontWeight:700,color:C.text}}>Novo Cartão</h3>
              <button onClick={()=>setModal(false)} style={{background:"none",border:"none",cursor:"pointer",color:C.muted}}><X size={17}/></button>
            </div>
            {[["Nome do cartão","name","text","Ex: Itaú Mastercard Gold"],["Últimos 4 dígitos","last_four","text","1234"],["Limite (R$)","credit_limit","number","5000"],["Dia fechamento","closing_day","number","25"],["Dia vencimento","due_day","number","5"]].map(([l,k,t,ph])=>(
              <div key={k} style={{marginBottom:13}}>
                <label style={{display:"block",fontSize:11,fontWeight:600,color:C.muted,marginBottom:5,textTransform:"uppercase",letterSpacing:"0.04em"}}>{l}</label>
                <input type={t} placeholder={ph} value={f[k]} onChange={e=>setF({...f,[k]:e.target.value})} style={inpSt(false)}/>
              </div>
            ))}
            <div style={{display:"flex",gap:12,marginBottom:16}}>
              <div style={{flex:1}}>
                <label style={{display:"block",fontSize:11,fontWeight:600,color:C.muted,marginBottom:5,textTransform:"uppercase",letterSpacing:"0.04em"}}>Banco</label>
                <select value={f.bank} onChange={e=>setF({...f,bank:e.target.value})} style={{...selSt,width:"100%",padding:"9px 12px"}}>
                  {BANKS_LIST.map(b=><option key={b} value={b}>{b}</option>)}
                </select>
              </div>
              <div style={{flex:1}}>
                <label style={{display:"block",fontSize:11,fontWeight:600,color:C.muted,marginBottom:5,textTransform:"uppercase",letterSpacing:"0.04em"}}>Cor</label>
                <input type="color" value={f.color} onChange={e=>setF({...f,color:e.target.value})} style={{...inpSt(false),padding:"5px",height:40,cursor:"pointer"}}/>
              </div>
            </div>
            <div style={{display:"flex",gap:8}}>
              <button onClick={()=>setModal(false)} style={{flex:1,padding:"10px",borderRadius:8,border:`1px solid ${C.border}`,background:"transparent",color:C.muted,fontSize:13,cursor:"pointer"}}>Cancelar</button>
              <button onClick={save} style={{flex:2,padding:"10px",borderRadius:8,border:"none",background:C.accent,color:"#fff",fontSize:13,fontWeight:600,cursor:"pointer"}}>Salvar Cartão</button>
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
      <h2 style={{fontSize:20,fontWeight:700,color:C.text,margin:"0 0 6px"}}>Categorias IFRS</h2>
      <p style={{color:C.muted,fontSize:13,margin:"0 0 20px"}}>Classificação baseada nas Normas Internacionais de Contabilidade</p>
      {IFRS_GROUPS.map(g=>{
        const gc=cats.filter(c=>c.ifrs_group===g);
        const gColor={Custos:C.accent,Despesas:C.purple,Financeiras:C.red,Invest:C.green}[g.split(" ")[0]]||C.accent;
        return (
          <div key={g} style={{...card(),marginBottom:12}}>
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:12,paddingBottom:10,borderBottom:`1px solid ${C.border}`}}>
              <div style={{width:10,height:10,borderRadius:2,background:gColor}}/>
              <span style={{fontSize:13,fontWeight:700,color:C.text}}>{g}</span>
              <span style={{...pill(gColor),fontSize:10}}>{gc.length} categorias</span>
            </div>
            <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
              {gc.map(c=>(
                <div key={c.id} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 12px",
                  background:C.surface,borderRadius:7,border:`1px solid ${C.border}`,borderLeft:`3px solid ${c.color}`}}>
                  <span style={{fontSize:16}}>{c.icon}</span>
                  <span style={{fontSize:13,color:C.text,fontWeight:500}}>{c.name}</span>
                  <button onClick={()=>remove(c.id)} style={{background:"none",border:"none",cursor:"pointer",color:C.faint,padding:2}}
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
      <div style={{marginBottom:18,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div>
          <h2 style={{fontSize:20,fontWeight:700,color:C.text,margin:0}}>Relatórios Comparativos</h2>
          <p style={{color:C.muted,fontSize:13,margin:"3px 0 0"}}>Período atual vs anterior</p>
        </div>
        <input type="month" value={periodo} onChange={e=>setPeriodo(e.target.value)} style={{...selSt,padding:"8px 12px"}}/>
      </div>

      <div style={{display:"flex",gap:10,marginBottom:18,flexWrap:"wrap"}}>
        {[
          ["Receitas (Atual)",   fmt(data.current.total_receitas), C.green],
          ["Despesas (Atual)",   fmt(data.current.total_despesas), C.red],
          ["Saldo (Atual)",      fmt(data.current.saldo),          data.current.saldo>=0?C.green:C.red],
          ["Variação Despesas",  `${data.variation_pct>0?"+":""}${data.variation_pct.toFixed(1)}%`, data.variation_pct<=0?C.green:C.red],
        ].map(([l,v,c])=>(
          <div key={l} style={{...card(),flex:1,minWidth:140}}>
            <div style={{fontSize:10,color:C.muted,fontWeight:600,textTransform:"uppercase",letterSpacing:"0.04em",marginBottom:6}}>{l}</div>
            <div style={{fontSize:17,fontWeight:700,color:c,fontFamily:"monospace"}}>{v}</div>
          </div>
        ))}
      </div>

      {compareData.length>0 ? (
        <>
          <div style={{...card(),marginBottom:12}}>
            <div style={{fontSize:13,fontWeight:600,color:C.text,marginBottom:14}}>Despesas: Mês Atual vs Anterior (R$)</div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={compareData} margin={{top:0,right:0,left:-10,bottom:0}}>
                <CartesianGrid strokeDasharray="3 3" stroke={C.border}/>
                <XAxis dataKey="cat" tick={{fill:C.muted,fontSize:10}}/>
                <YAxis tick={{fill:C.muted,fontSize:10}} tickFormatter={v=>fmt(v)}/>
                <Tooltip contentStyle={{background:C.cardB,border:`1px solid ${C.border}`,borderRadius:8,fontSize:12}} formatter={v=>fmt(v)}/>
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
                    <th key={h} style={{padding:"9px 14px",textAlign:"left",color:C.muted,fontWeight:600,fontSize:10,textTransform:"uppercase",letterSpacing:"0.04em",borderBottom:`1px solid ${C.border}`}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {compareData.map((r,i)=>(
                  <tr key={r.cat} style={{borderBottom:`1px solid ${C.border}22`,background:i%2===0?"transparent":C.surface+"55"}}>
                    <td style={{padding:"8px 14px",color:C.text,fontWeight:500}}>{r.cat}</td>
                    <td style={{padding:"8px 14px",fontFamily:"monospace",color:C.muted}}>{fmt(r.anterior)}</td>
                    <td style={{padding:"8px 14px",fontFamily:"monospace",fontWeight:600,color:C.text}}>{fmt(r.atual)}</td>
                    <td style={{padding:"8px 14px",fontFamily:"monospace",fontWeight:700,color:r.diff>0?C.red:r.diff<0?C.green:C.muted}}>
                      {r.diff>0?"+":""}{r.diff.toFixed(1)}%
                    </td>
                    <td style={{padding:"8px 14px"}}>
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
        <div style={{...card({background:C.surface}),textAlign:"center",padding:"48px"}}>
          <BarChart2 size={32} color={C.faint} style={{marginBottom:12}}/>
          <p style={{color:C.muted,margin:0}}>Sem dados suficientes para comparativo. Cadastre lançamentos nos dois períodos.</p>
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
    l.href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&family=Space+Mono:wght@400;700&display=swap";
    l.rel="stylesheet"; document.head.appendChild(l);
  },[]);

  const handleAuth = async (mode, name, email, password) => {
    if(mode==="login") await login(email, password);
    else await register(name, email, password);
  };

  if(!user) return <LoginPage onLogin={handleAuth}/>;

  return (
    <div style={{display:"flex",height:"100vh",background:C.bg,color:C.text,overflow:"hidden",fontFamily:"'Outfit','Segoe UI',sans-serif"}}>
      <Sidebar active={tab} set={setTab} user={user} onLogout={logout}/>
      <main style={{flex:1,overflowY:"auto",padding:"24px 22px"}}>
        {tab==="dashboard"    && <DashboardTab    api={api}/>}
        {tab==="transactions" && <TransactionsTab api={api}/>}
        {tab==="import"       && <ImportTab       api={api}/>}
        {tab==="cards"        && <CardsTab        api={api}/>}
        {tab==="categories"   && <CategoriesTab   api={api}/>}
        {tab==="reports"      && <ReportsTab      api={api}/>}
      </main>
      <style>{`*{box-sizing:border-box}::-webkit-scrollbar{width:5px}::-webkit-scrollbar-track{background:${C.surface}}::-webkit-scrollbar-thumb{background:${C.border};border-radius:3px}@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
