import { useState, useEffect, useCallback } from "react";
import { Plus, Search, X, Filter, Trash2, CheckCircle2, Loader2, Pencil } from "lucide-react";
import { C, fmt, fmtD, card, pill, inpSt, selSt, btn } from "../../styles/theme";
import Loading from "../shared/Loading";
import ErrMsg from "../shared/ErrMsg";

const PAYMENT_METHODS = [
  {value:"cartao",  label:"💳 Cartão",   color:"#6366F1"},
  {value:"pix",     label:"⚡ PIX",       color:"#10B981"},
  {value:"dinheiro",label:"💵 Dinheiro",  color:"#F59E0B"},
  {value:"boleto",  label:"📄 Boleto",    color:"#8B5CF6"},
];

const EMPTY = {date:"",desc:"",supplier:"",amount:"",type:"D",cat_id:"",card_id:"",inst:"",instTotal:"",payment_method:"pix"};

function TxModal({onClose, onSaved, api, categories, cards, canReceita, initial, defaultDate}) {
  const isEdit = !!initial;
  const [f,    setF]    = useState(() => {
    if (initial) return {
      date: initial.date,
      desc: initial.description,
      supplier: initial.supplier || "",
      amount: String(initial.amount),
      type: initial.type,
      cat_id: initial.category?.id ? String(initial.category.id) : "",
      card_id: initial.card?.id ? String(initial.card.id) : "",
      inst: initial.installment_current ? `${initial.installment_current}/${initial.installment_total}` : "",
      payment_method: initial.payment_method || "cartao",
    };
    return {...EMPTY, date: defaultDate || new Date().toISOString().slice(0,10)};
  });
  const [err,  setErr]  = useState({});
  const [saved,setSaved]= useState(false);
  const [loading,setLoading]=useState(false);

  const validate = () => {
    const e = {};
    if(!f.date)          e.date     = "Obrigatório";
    if(!f.desc.trim())   e.desc     = "Obrigatório";
    if(!f.amount||isNaN(Number(f.amount))||Number(f.amount)<=0) e.amount="Valor inválido";
    if(f.inst && !/^\d{2}\/\d{2}$/.test(f.inst)) e.inst="Formato esperado: 02/10";
    if(f.type==="D" && f.payment_method==="cartao" && !f.card_id) e.card_id="Selecione um cartão";
    return e;
  };

  const handle = async () => {
    const e = validate();
    if(Object.keys(e).length){ setErr(e); return; }
    setLoading(true);
    try {
      let inst_cur=null, inst_tot=null;
      if(f.inst){ [inst_cur,inst_tot]=f.inst.split("/").map(Number); }
      if (isEdit) {
        await api(`/transactions/${initial.id}`, {method:"PUT", body:JSON.stringify({
          type:f.type, date:f.date, description:f.desc.toUpperCase(),
          supplier:f.supplier, amount:Number(f.amount),
          category_id:f.cat_id?Number(f.cat_id):null,
          card_id:f.payment_method==="cartao"&&f.card_id?Number(f.card_id):null,
          payment_method:f.payment_method,
        })});
      } else {
        await api("/transactions",{method:"POST",body:JSON.stringify({
          type:f.type, date:f.date, description:f.desc.toUpperCase(),
          supplier:f.supplier, amount:Number(f.amount),
          category_id:f.cat_id?Number(f.cat_id):null,
          card_id:f.payment_method==="cartao"&&f.card_id?Number(f.card_id):null,
          installment_current:inst_cur, installment_total:inst_tot,
          payment_method:f.payment_method,
        })});
      }
      onSaved();
      setSaved(true);
      setTimeout(()=>{ setSaved(false); onClose(); }, 1400);
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
          <h3 style={{margin:0,fontSize:16,fontWeight:700,color:C.text,letterSpacing:"-0.01em"}}>{isEdit ? "Editar Lançamento" : "Novo Lançamento"}</h3>
          <button onClick={onClose} style={{background:C.card,border:`1px solid ${C.border}`,cursor:"pointer",color:C.muted,width:30,height:30,borderRadius:7,display:"flex",alignItems:"center",justifyContent:"center",transition:"color 0.15s ease"}}>
            <X size={15}/>
          </button>
        </div>

        {/* Tipo */}
        <div style={{display:"flex",gap:8,marginBottom:14}}>
          {[["D","▼  Despesa",C.red],["R","▲  Receita",C.green]].filter(([v])=>v==="D"||canReceita).map(([v,l,c])=>(
            <button key={v} onClick={()=>setF({...f,type:v,payment_method:v==="R"?"pix":f.payment_method})} style={{flex:1,padding:"11px",borderRadius:9,
              border:`2px solid ${f.type===v?c:C.border}`,background:f.type===v?c+"18":"transparent",
              color:f.type===v?c:C.muted,fontSize:13,fontWeight:700,cursor:"pointer",
              transition:"all 0.15s ease"}}>
              {l}
            </button>
          ))}
        </div>

        {/* Forma de Pagamento (só despesas) */}
        {f.type==="D" && (
          <div style={{marginBottom:18}}>
            <label style={{display:"block",fontSize:11,fontWeight:600,color:C.muted,marginBottom:8,textTransform:"uppercase",letterSpacing:"0.06em"}}>Forma de Pagamento *</label>
            <div style={{display:"flex",gap:6}}>
              {PAYMENT_METHODS.map(pm=>(
                <button key={pm.value} onClick={()=>setF({...f,payment_method:pm.value,card_id:pm.value!=="cartao"?"":f.card_id})}
                  style={{flex:1,padding:"8px 4px",borderRadius:8,border:`2px solid ${f.payment_method===pm.value?pm.color:C.border}`,
                    background:f.payment_method===pm.value?pm.color+"22":"transparent",
                    color:f.payment_method===pm.value?pm.color:C.muted,
                    fontSize:11,fontWeight:600,cursor:"pointer",transition:"all 0.15s ease",textAlign:"center"}}>
                  {pm.label}
                </button>
              ))}
            </div>
            {(f.payment_method==="pix"||f.payment_method==="dinheiro") && (
              <p style={{margin:"6px 0 0",fontSize:11,color:"#10B981"}}>✓ Será baixado automaticamente como pago</p>
            )}
          </div>
        )}

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
          <label style={{display:"block",fontSize:11,fontWeight:600,color:C.muted,marginBottom:6,textTransform:"uppercase",letterSpacing:"0.06em"}}>Fornecedor</label>
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
          {f.type==="D" && f.payment_method==="cartao" && (
            <div style={{flex:1}}>
              <label style={{display:"block",fontSize:11,fontWeight:600,color:err.card_id?C.red:C.muted,marginBottom:6,textTransform:"uppercase",letterSpacing:"0.06em"}}>Cartão *</label>
              <select value={f.card_id} onChange={e=>setF({...f,card_id:e.target.value})} style={{...selSt,width:"100%",padding:"9px 12px",borderColor:err.card_id?C.red:undefined}}>
                <option value="">— Selecione o cartão</option>
                {cards.map(c=><option key={c.id} value={c.id}>{c.name} ({c.bank})</option>)}
              </select>
              {err.card_id&&<span style={{color:C.red,fontSize:10,marginTop:3,display:"block"}}>{err.card_id}</span>}
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
              {isEdit ? "Salvar Alterações" : f.type==="D"?"Registrar Despesa":"Registrar Receita"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function TransactionsTab({api, user}) {
  const canReceita = user?.role === "admin" || user?.can_view_receitas;
  const [txList,    setTxList]    = useState([]);
  const [categories,setCategories]= useState([]);
  const [cards,     setCards]     = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [err,       setErr]       = useState("");
  const [modal,     setModal]     = useState(false);
  const [editTx,    setEditTx]    = useState(null);
  const [search,    setSearch]    = useState("");
  const [fType,     setFType]     = useState("all");
  const [delId,     setDelId]     = useState(null);
  const [deleting,  setDeleting]  = useState(false);
  const [periodo,   setPeriodo]   = useState(new Date().toISOString().slice(0,7));
  const [serverToday, setServerToday] = useState(null);

  useEffect(() => {
    api("/health").then(data => {
      if (data?.periodo) setPeriodo(data.periodo);
      if (data?.date) setServerToday(data.date);
    }).catch(() => {});
  }, []);

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
    setDeleting(true);
    try { await api(`/transactions/${id}`,{method:"DELETE"}); setDelId(null); load(); }
    catch(e){ setErr(e.message); }
    finally{ setDeleting(false); }
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
        {[
          ...(canReceita ? [["Receitas", rec, C.green]] : []),
          ["Despesas", des, C.red],
          ...(canReceita ? [["Saldo", rec-des, rec-des>=0?C.green:C.red]] : []),
        ].map(([l,v,c])=>(
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
          <option value="all">Todos</option>
          <option value="D">Despesas</option>
          {canReceita && <option value="R">Receitas</option>}
        </select>
        <span style={{...pill(C.accent),fontSize:10}}><Filter size={9}/>{txList.length}</span>
      </div>

      {err && <div style={{marginBottom:10}}><ErrMsg msg={err}/></div>}
      {loading ? <Loading/> : (
        <div style={{...card({padding:0}),overflow:"hidden"}}>
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
            <thead>
              <tr style={{background:C.surface}}>
                {["Data","Descrição","Parcela","Cartão","Categoria","Valor","Tipo","Pagto",""].map(h=>(
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
                  <td style={{padding:"9px 12px"}}>
                    {t.type==="D" && (() => {
                      const pm = t.payment_method||"cartao";
                      const cfg = {cartao:["💳",C.purple],pix:["⚡","#10B981"],dinheiro:["💵",C.gold],boleto:["📄","#8B5CF6"]};
                      const [icon,color] = cfg[pm]||["💳",C.purple];
                      return <span style={{...pill(color),fontSize:10}}>{icon} {pm}</span>;
                    })()}
                  </td>
                  <td style={{padding:"9px 8px"}}>
                    <div style={{display:"flex",gap:4,alignItems:"center"}}>
                      {delId===t.id?(
                        <>
                          <button onClick={()=>handleDelete(t.id)} disabled={deleting}
                            style={{padding:"3px 8px",borderRadius:5,border:"none",background:deleting?C.faint:C.red,color:"#fff",fontSize:10,cursor:deleting?"not-allowed":"pointer",fontWeight:600}}>
                            {deleting?"...":"Sim"}
                          </button>
                          <button onClick={()=>setDelId(null)} disabled={deleting}
                            style={{padding:"3px 8px",borderRadius:5,border:`1px solid ${C.border}`,background:"transparent",color:C.muted,fontSize:10,cursor:deleting?"not-allowed":"pointer"}}>Não</button>
                        </>
                      ):(
                        <>
                          <button onClick={()=>setEditTx(t)} title="Editar"
                            style={{background:"none",border:"none",cursor:"pointer",color:C.faint,padding:4,display:"flex",borderRadius:5,transition:"color 0.15s ease"}}
                            onMouseEnter={e=>e.currentTarget.style.color=C.accent}
                            onMouseLeave={e=>e.currentTarget.style.color=C.faint}>
                            <Pencil size={13}/>
                          </button>
                          <button onClick={()=>setDelId(t.id)} title="Excluir"
                            style={{background:"none",border:"none",cursor:"pointer",color:C.faint,padding:4,display:"flex",borderRadius:5,transition:"color 0.15s ease"}}
                            onMouseEnter={e=>e.currentTarget.style.color=C.red}
                            onMouseLeave={e=>e.currentTarget.style.color=C.faint}>
                            <Trash2 size={13}/>
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modal && <TxModal onClose={()=>setModal(false)} onSaved={load} api={api} categories={categories} cards={cards} canReceita={canReceita} defaultDate={serverToday}/>}
      {editTx && <TxModal onClose={()=>setEditTx(null)} onSaved={load} api={api} categories={categories} cards={cards} canReceita={canReceita} initial={editTx} defaultDate={serverToday}/>}
    </div>
  );
}
