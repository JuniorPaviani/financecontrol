import { useState, useEffect, useCallback } from "react";
import { Plus, X, Trash2, CreditCard, CheckCircle2, Clock } from "lucide-react";
import { C, fmt, card, inpSt, selSt, btn } from "../../styles/theme";
import Loading from "../shared/Loading";
import ErrMsg from "../shared/ErrMsg";

export default function CardsTab({api}) {
  const [cards,    setCards]    = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [modal,    setModal]    = useState(false);
  const [loading,  setLoading]  = useState(true);
  const [err,      setErr]      = useState("");
  const [periodo,  setPeriodo]  = useState(new Date().toISOString().slice(0,7));
  const [f,        setF]        = useState({name:"",bank:"Itaú",last_four:"",credit_limit:"",closing_day:"",due_day:"",color:"#2563EB"});

  const BANKS_LIST=["Itaú","Santander","Bradesco","Caixa","Sicredi","Sam's Club","Riachuelo","Nubank","Inter","C6 Bank","PagBank","Banco do Brasil","Outro"];

  const load = useCallback(()=>{
    setLoading(true);
    Promise.all([
      api("/cards"),
      api(`/cards/invoice-status?period=${periodo}`),
    ]).then(([c,s])=>{ setCards(c); setStatuses(s); setErr(""); })
      .catch(e=>setErr(e.message)).finally(()=>setLoading(false));
  },[periodo]);

  useEffect(()=>{ load(); },[load]);

  const togglePaid = async (cardId) => {
    try {
      await api(`/cards/invoice-status/${cardId}?period=${periodo}`,{method:"POST"});
      load();
    } catch(e){ setErr(e.message); }
  };

  const save = async () => {
    try {
      await api("/cards",{method:"POST",body:JSON.stringify({...f,credit_limit:Number(f.credit_limit)||0,closing_day:Number(f.closing_day)||null,due_day:Number(f.due_day)||null})});
      setModal(false); setF({name:"",bank:"Itaú",last_four:"",credit_limit:"",closing_day:"",due_day:"",color:"#2563EB"});
      load();
    } catch(e){ setErr(e.message); }
  };

  const remove = async (id) => {
    try { await api(`/cards/${id}`,{method:"DELETE"}); load(); } catch(e){ setErr(e.message); }
  };

  return (
    <div style={{fontFamily:"'Outfit','Segoe UI',sans-serif"}}>
      <div style={{marginBottom:20,display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:12}}>
        <div>
          <h2 style={{fontSize:21,fontWeight:700,color:C.text,margin:0,letterSpacing:"-0.02em",fontFamily:"'Lora','Georgia',serif"}}>Cartões</h2>
          <p style={{color:C.muted,fontSize:13,margin:"4px 0 0"}}>Gerencie seus cartões e faturas mensais</p>
        </div>
        <div style={{display:"flex",gap:8,alignItems:"center"}}>
          <input type="month" value={periodo} onChange={e=>setPeriodo(e.target.value)}
            style={{...selSt,padding:"7px 10px"}}/>
          <button onClick={()=>setModal(true)} style={{...btn(C.accent,{boxShadow:"0 4px 14px rgba(37,99,235,0.35)"})}}>
            <Plus size={15}/>Novo Cartão
          </button>
        </div>
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
          {cards.map(c=>{
            const st = statuses.find(s=>s.card_id===c.id);
            const paid = st?.paid||false;
            const totalSpent = st?.total_spent||0;
            const creditLimit = st?.credit_limit||c.credit_limit||0;
            const available = st?.available ?? (creditLimit - totalSpent);
            const usedPct = creditLimit>0 ? Math.min(100, (totalSpent/creditLimit)*100) : 0;
            const barColor = usedPct>90?C.red:usedPct>70?"#F59E0B":C.green;
            return (
            <div key={c.id} style={{...card({borderLeft:`4px solid ${c.color}`}),flex:"0 0 300px",transition:"transform 0.15s ease, box-shadow 0.15s ease"}}
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
              <div style={{display:"flex",gap:16,marginBottom:10}}>
                {creditLimit>0&&<div><div style={{fontSize:10,color:C.muted,marginBottom:3,fontWeight:600,textTransform:"uppercase",letterSpacing:"0.04em"}}>Limite</div><div style={{fontSize:13,fontWeight:700,color:C.text,fontFamily:"'Space Mono',monospace"}}>{fmt(creditLimit)}</div></div>}
                {c.closing_day&&<div><div style={{fontSize:10,color:C.muted,marginBottom:3,fontWeight:600,textTransform:"uppercase",letterSpacing:"0.04em"}}>Fechamento</div><div style={{fontSize:13,fontWeight:700,color:C.text}}>Dia {c.closing_day}</div></div>}
                {c.due_day&&<div><div style={{fontSize:10,color:C.muted,marginBottom:3,fontWeight:600,textTransform:"uppercase",letterSpacing:"0.04em"}}>Vencimento</div><div style={{fontSize:13,fontWeight:700,color:C.text}}>Dia {c.due_day}</div></div>}
              </div>
              <div style={{marginBottom:12,padding:"10px 12px",background:C.surface,borderRadius:8,border:`1px solid ${C.border}`}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:creditLimit>0?8:0}}>
                  <div>
                    <div style={{fontSize:10,color:C.muted,fontWeight:600,textTransform:"uppercase",letterSpacing:"0.04em",marginBottom:2}}>Gasto no período</div>
                    <div style={{fontSize:14,fontWeight:700,color:totalSpent>0?C.red:C.faint,fontFamily:"'Space Mono',monospace"}}>{fmt(totalSpent)}</div>
                  </div>
                  {creditLimit>0&&(
                    <div style={{textAlign:"right"}}>
                      <div style={{fontSize:10,color:C.muted,fontWeight:600,textTransform:"uppercase",letterSpacing:"0.04em",marginBottom:2}}>Disponível</div>
                      <div style={{fontSize:14,fontWeight:700,color:available>=0?C.green:C.red,fontFamily:"'Space Mono',monospace"}}>{fmt(available)}</div>
                    </div>
                  )}
                </div>
                {creditLimit>0&&(
                  <>
                    <div style={{background:C.border,borderRadius:4,height:5,overflow:"hidden"}}>
                      <div style={{background:barColor,height:"100%",width:`${usedPct}%`,borderRadius:4,transition:"width 0.4s ease"}}/>
                    </div>
                    <div style={{fontSize:10,color:C.muted,marginTop:3,textAlign:"right"}}>{usedPct.toFixed(0)}% do limite utilizado</div>
                  </>
                )}
              </div>
              {/* Baixa de fatura */}
              <div style={{borderTop:`1px solid ${C.border}`,paddingTop:12}}>
                <div style={{fontSize:10,color:C.muted,fontWeight:600,textTransform:"uppercase",letterSpacing:"0.04em",marginBottom:8}}>
                  Fatura {periodo.split("-")[1]}/{periodo.split("-")[0]}
                </div>
                <button onClick={()=>togglePaid(c.id)}
                  style={{width:"100%",padding:"9px 12px",borderRadius:8,border:`1px solid ${paid?C.green+"55":C.border}`,
                    background:paid?C.greenSft:"transparent",cursor:"pointer",
                    display:"flex",alignItems:"center",justifyContent:"center",gap:7,
                    color:paid?C.green:C.muted,fontSize:12,fontWeight:600,transition:"all 0.2s ease"}}>
                  {paid
                    ? <><CheckCircle2 size={14}/> Fatura Paga</>
                    : <><Clock size={14}/> Marcar como Paga</>}
                </button>
              </div>
            </div>
            );
          })}
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
