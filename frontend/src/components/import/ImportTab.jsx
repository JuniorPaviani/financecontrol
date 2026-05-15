import { useState, useEffect } from "react";
import { Upload, CheckCircle2, Loader2, Building2 } from "lucide-react";
import { C, fmt, fmtD, card, pill, selSt, btn } from "../../styles/theme";
import ErrMsg from "../shared/ErrMsg";

export default function ImportTab({api}) {
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

  const BANKS = ["Itaú","Santander","Bradesco","Caixa","Sam's Club","Sicredi","Riachuelo","Stone"];

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
        <p style={{color:C.muted,fontSize:13,margin:"5px 0 0"}}>Suporte a: Itaú, Santander, Bradesco, Caixa, Sam's Club, Sicredi, Riachuelo, Stone</p>
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
