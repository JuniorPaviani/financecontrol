import { useState, useEffect } from "react";
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";
import { TrendingUp, TrendingDown, Wallet, CreditCard, Clock } from "lucide-react";
import { C, fmt, card, pill } from "../../styles/theme";
import Loading from "../shared/Loading";
import ErrMsg from "../shared/ErrMsg";

export default function DashboardTab({api}) {
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
