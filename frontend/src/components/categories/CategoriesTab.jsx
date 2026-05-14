import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { C, card, pill } from "../../styles/theme";
import Loading from "../shared/Loading";

export default function CategoriesTab({api}) {
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
