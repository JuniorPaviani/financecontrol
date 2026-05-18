import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, X, CheckCircle2, Loader2 } from "lucide-react";
import { C, card, pill, inpSt, selSt, btn, CAT_TITLE, GROUP_LABEL } from "../../styles/theme";
import Loading from "../shared/Loading";
import ErrMsg from "../shared/ErrMsg";

const IFRS_GROUPS = [
  "Custos Operacionais",
  "Despesas Administrativas",
  "Despesas Financeiras",
  "Despesas Fixas",
  "Investimentos (Ativos)",
];

const EMPTY = { name: "", ifrs_group: IFRS_GROUPS[0], icon: "💰", color: "#2563EB" };

function CatModal({ onClose, onSaved, api, initial }) {
  const editing = !!initial;
  const [f, setF] = useState(initial ? { ...initial } : { ...EMPTY });
  const [err, setErr] = useState({});
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  const handle = async () => {
    const e = {};
    if (!f.name.trim()) e.name = "Obrigatório";
    if (!f.ifrs_group) e.ifrs_group = "Obrigatório";
    if (Object.keys(e).length) { setErr(e); return; }
    setLoading(true);
    try {
      const method = editing ? "PUT" : "POST";
      const path   = editing ? `/categories/${initial.id}` : "/categories";
      await api(path, { method, body: JSON.stringify({
        name: f.name.trim(),
        ifrs_group: f.ifrs_group,
        icon: f.icon || "💰",
        color: f.color || "#2563EB",
      })});
      setSaved(true);
      setTimeout(() => { setSaved(false); onSaved(); onClose(); }, 1200);
    } catch (e) { setErr({ api: e.message }); }
    finally { setLoading(false); }
  };

  return (
    <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.78)",
      display:"flex",alignItems:"center",justifyContent:"center",zIndex:200,padding:16,
      backdropFilter:"blur(4px)"}}>
      <div onClick={e=>e.stopPropagation()} style={{...card({background:C.surface,
        boxShadow:"0 0 0 1px rgba(255,255,255,0.04),0 32px 80px rgba(0,0,0,0.7)"}),
        width:"100%",maxWidth:420}}>

        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
          <h3 style={{margin:0,fontSize:16,fontWeight:700,color:C.text,letterSpacing:"-0.01em"}}>
            {editing ? "Editar Categoria" : "Nova Categoria"}
          </h3>
          <button onClick={onClose} style={{background:C.card,border:`1px solid ${C.border}`,cursor:"pointer",
            color:C.muted,width:30,height:30,borderRadius:7,display:"flex",alignItems:"center",justifyContent:"center"}}>
            <X size={15}/>
          </button>
        </div>

        {/* Nome */}
        <div style={{marginBottom:14}}>
          <label style={{display:"block",fontSize:11,fontWeight:600,color:err.name?C.red:C.muted,
            marginBottom:6,textTransform:"uppercase",letterSpacing:"0.06em"}}>Nome *</label>
          <input type="text" placeholder="Ex: Aluguel" value={f.name}
            onChange={e=>setF({...f,name:e.target.value})} style={inpSt(err.name)}/>
          {err.name && <span style={{color:C.red,fontSize:10,marginTop:3,display:"block"}}>{err.name}</span>}
        </div>

        {/* Grupo IFRS */}
        <div style={{marginBottom:14}}>
          <label style={{display:"block",fontSize:11,fontWeight:600,color:err.ifrs_group?C.red:C.muted,
            marginBottom:6,textTransform:"uppercase",letterSpacing:"0.06em"}}>{GROUP_LABEL} *</label>
          <select value={f.ifrs_group} onChange={e=>setF({...f,ifrs_group:e.target.value})}
            style={{...selSt,width:"100%",padding:"9px 12px"}}>
            {IFRS_GROUPS.map(g=><option key={g} value={g}>{g}</option>)}
          </select>
        </div>

        {/* Ícone + Cor */}
        <div style={{display:"flex",gap:12,marginBottom:20}}>
          <div style={{flex:1}}>
            <label style={{display:"block",fontSize:11,fontWeight:600,color:C.muted,
              marginBottom:6,textTransform:"uppercase",letterSpacing:"0.06em"}}>Ícone (emoji)</label>
            <input type="text" placeholder="💰" value={f.icon} maxLength={4}
              onChange={e=>setF({...f,icon:e.target.value})} style={{...inpSt(false),textAlign:"center",fontSize:20}}/>
          </div>
          <div style={{flex:1}}>
            <label style={{display:"block",fontSize:11,fontWeight:600,color:C.muted,
              marginBottom:6,textTransform:"uppercase",letterSpacing:"0.06em"}}>Cor</label>
            <div style={{display:"flex",gap:8,alignItems:"center"}}>
              <input type="color" value={f.color} onChange={e=>setF({...f,color:e.target.value})}
                style={{width:42,height:38,padding:2,borderRadius:7,border:`1px solid ${C.border}`,
                  background:C.card,cursor:"pointer"}}/>
              <div style={{flex:1,height:38,borderRadius:7,background:f.color+"22",border:`2px solid ${f.color}`,
                display:"flex",alignItems:"center",justifyContent:"center",
                fontSize:14,fontWeight:700,color:f.color}}>
                {f.icon || "💰"} {f.name||"Prévia"}
              </div>
            </div>
          </div>
        </div>

        {err.api && <div style={{marginBottom:14}}><ErrMsg msg={err.api}/></div>}

        {saved ? (
          <div style={{padding:"14px",borderRadius:9,background:C.greenSft||"rgba(42,157,110,0.12)",
            border:`1px solid ${C.green}44`,display:"flex",alignItems:"center",gap:10,justifyContent:"center"}}>
            <CheckCircle2 size={18} color={C.green}/>
            <span style={{color:C.green,fontWeight:600,fontSize:14}}>
              {editing ? "Categoria atualizada!" : "Categoria criada!"}
            </span>
          </div>
        ) : (
          <div style={{display:"flex",gap:8}}>
            <button onClick={onClose} style={{flex:1,padding:"11px",borderRadius:8,
              border:`1px solid ${C.border}`,background:"transparent",color:C.muted,fontSize:13,cursor:"pointer"}}>
              Cancelar
            </button>
            <button onClick={handle} disabled={loading} style={{...btn(C.accent,{flex:2,padding:"11px",
              boxShadow:`0 4px 14px ${C.accent}33`})}}>
              {loading ? <Loader2 size={14} style={{animation:"spin .8s linear infinite"}}/> : <CheckCircle2 size={14}/>}
              {editing ? "Salvar Alterações" : "Criar Categoria"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function CategoriesTab({ api }) {
  const [cats,    setCats]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal,   setModal]   = useState(null); // null | "new" | {category object}
  const [delId,   setDelId]   = useState(null);
  const [err,     setErr]     = useState("");

  const load = () => {
    setLoading(true);
    api("/categories").then(setCats).catch(e=>setErr(e.message)).finally(()=>setLoading(false));
  };

  useEffect(()=>{ load(); }, []);

  const remove = async (id) => {
    try {
      await api(`/categories/${id}`, { method: "DELETE" });
      setDelId(null);
      setCats(p => p.filter(c => c.id !== id));
    } catch(e) { setErr(e.message); }
  };

  const groupColor = g => ({
    "Custos Operacionais":      C.accent,
    "Despesas Administrativas": C.purple,
    "Despesas Financeiras":     C.red,
    "Despesas Fixas":           C.gold,
    "Investimentos (Ativos)":   C.green,
  }[g] || C.accent);

  if (loading) return <Loading/>;

  return (
    <div style={{fontFamily:"'Outfit','Segoe UI',sans-serif"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:22}}>
        <div>
          <h2 style={{fontSize:21,fontWeight:700,color:C.text,margin:"0 0 4px",
            letterSpacing:"-0.02em",fontFamily:"'Lora','Georgia',serif"}}>{CAT_TITLE}</h2>
          <p style={{color:C.muted,fontSize:13,margin:0}}>
            {cats.length} categori{cats.length===1?"a":"as"} · classificação baseada nas Normas Internacionais de Contabilidade
          </p>
        </div>
        <button onClick={()=>setModal("new")} style={{...btn(C.accent,{boxShadow:"0 4px 14px rgba(155,35,53,0.35)"})}}>
          <Plus size={15}/>Nova Categoria
        </button>
      </div>

      {err && <div style={{marginBottom:12}}><ErrMsg msg={err}/></div>}

      {IFRS_GROUPS.map(g => {
        const gc = cats.filter(c => c.ifrs_group === g);
        const gColor = groupColor(g);
        return (
          <div key={g} style={{...card(),marginBottom:12}}>
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14,
              paddingBottom:12,borderBottom:`1px solid ${C.border}`}}>
              <div style={{width:10,height:10,borderRadius:3,background:gColor,boxShadow:`0 0 8px ${gColor}44`}}/>
              <span style={{fontSize:13,fontWeight:700,color:C.text}}>{g}</span>
              <span style={{...pill(gColor),fontSize:10}}>{gc.length} categori{gc.length===1?"a":"as"}</span>
            </div>

            <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
              {gc.map(c => (
                <div key={c.id} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 12px",
                  background:C.surface,borderRadius:8,border:`1px solid ${C.border}`,
                  borderLeft:`3px solid ${c.color}`,transition:"border-color 0.15s ease"}}>
                  <span style={{fontSize:16}}>{c.icon}</span>
                  <span style={{fontSize:13,color:C.text,fontWeight:500}}>{c.name}</span>

                  {/* Botão editar */}
                  <button onClick={()=>setModal(c)}
                    style={{background:"none",border:"none",cursor:"pointer",color:C.faint,
                      padding:3,display:"flex",borderRadius:4,transition:"color 0.15s ease"}}
                    onMouseEnter={e=>e.currentTarget.style.color=C.gold}
                    onMouseLeave={e=>e.currentTarget.style.color=C.faint}
                    title="Editar">
                    <Pencil size={11}/>
                  </button>

                  {/* Botão excluir com confirmação inline */}
                  {delId === c.id ? (
                    <div style={{display:"flex",gap:3}}>
                      <button onClick={()=>remove(c.id)}
                        style={{padding:"2px 7px",borderRadius:4,border:"none",
                          background:C.red,color:"#fff",fontSize:10,cursor:"pointer",fontWeight:600}}>
                        Sim
                      </button>
                      <button onClick={()=>setDelId(null)}
                        style={{padding:"2px 7px",borderRadius:4,border:`1px solid ${C.border}`,
                          background:"transparent",color:C.muted,fontSize:10,cursor:"pointer"}}>
                        Não
                      </button>
                    </div>
                  ) : (
                    <button onClick={()=>setDelId(c.id)}
                      style={{background:"none",border:"none",cursor:"pointer",color:C.faint,
                        padding:3,display:"flex",borderRadius:4,transition:"color 0.15s ease"}}
                      onMouseEnter={e=>e.currentTarget.style.color=C.red}
                      onMouseLeave={e=>e.currentTarget.style.color=C.faint}
                      title="Excluir">
                      <Trash2 size={11}/>
                    </button>
                  )}
                </div>
              ))}
              {gc.length === 0 && (
                <span style={{color:C.faint,fontSize:12}}>Nenhuma categoria neste grupo.</span>
              )}
            </div>
          </div>
        );
      })}

      {modal && (
        <CatModal
          onClose={()=>setModal(null)}
          onSaved={load}
          api={api}
          initial={modal === "new" ? null : modal}
        />
      )}
    </div>
  );
}
