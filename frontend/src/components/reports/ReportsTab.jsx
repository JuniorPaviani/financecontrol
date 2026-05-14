import { useState, useEffect } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts";
import { TrendingUp, TrendingDown, BarChart2, FileText, FileSpreadsheet } from "lucide-react";
import { C, fmt, card, pill, selSt, btn } from "../../styles/theme";
import { API } from "../../api/client";
import Loading from "../shared/Loading";
import ErrMsg from "../shared/ErrMsg";

export default function ReportsTab({api}) {
  const [data,   setData]   = useState(null);
  const [loading,setLoading]= useState(true);
  const [err,    setErr]    = useState("");
  const [periodo,setPeriodo]= useState(new Date().toISOString().slice(0,7));

  useEffect(()=>{
    setLoading(true);
    api(`/reports/comparative?current_periodo=${periodo}`)
      .then(setData).catch(e=>setErr(e.message)).finally(()=>setLoading(false));
  },[periodo]);

  const handleExport = async (format) => {
    const token = localStorage.getItem("fc_token");
    const url = `${API}/reports/export/${format}?periodo=${periodo}`;
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    const blob = await res.blob();
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `relatorio_${periodo}.${format === "excel" ? "xlsx" : "pdf"}`;
    link.click();
  };

  if(loading) return <Loading/>;
  if(err)     return <ErrMsg msg={err}/>;
  if(!data)   return null;

  const compareData = (data.by_category||[]).map(c=>({
    cat:c.name, atual:c.current, anterior:c.previous,
    diff:c.previous>0?((c.current-c.previous)/c.previous*100):0,
  }));

  return (
    <div style={{fontFamily:"'Outfit','Segoe UI',sans-serif"}}>
      <div style={{marginBottom:20,display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:10}}>
        <div>
          <h2 style={{fontSize:21,fontWeight:700,color:C.text,margin:0,letterSpacing:"-0.02em",fontFamily:"'Lora','Georgia',serif"}}>Relatórios Comparativos</h2>
          <p style={{color:C.muted,fontSize:13,margin:"4px 0 0"}}>Período atual versus período anterior</p>
        </div>
        <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
          <input type="month" value={periodo} onChange={e=>setPeriodo(e.target.value)} style={{...selSt,padding:"8px 12px"}}/>
          <button onClick={()=>handleExport("pdf")} style={{...btn(C.accent,{padding:"8px 14px",fontSize:12,gap:6})}}>
            <FileText size={13}/>Exportar PDF
          </button>
          <button onClick={()=>handleExport("excel")} style={{...btn(C.green,{padding:"8px 14px",fontSize:12,gap:6})}}>
            <FileSpreadsheet size={13}/>Exportar Excel
          </button>
        </div>
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
