import { useState, useEffect, useRef } from "react";
import { CreditCard, Upload, CheckCircle2, Loader2, X, FileText } from "lucide-react";
import { C, fmt, fmtD, card, selSt, pill, btn } from "../../styles/theme";
import Loading from "../shared/Loading";
import ErrMsg from "../shared/ErrMsg";

function makeMonths() {
  const list = [];
  const now = new Date();
  for (let i = -2; i <= 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const val = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const raw = d.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
    list.push({ val, label: raw.charAt(0).toUpperCase() + raw.slice(1) });
  }
  return list;
}

const MONTHS = makeMonths();

export default function FaturaTab({ api }) {
  const [cards,   setCards]   = useState([]);
  const [cardId,  setCardId]  = useState("");
  const [month,   setMonth]   = useState(() => {
    const n = new Date();
    return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, "0")}`;
  });
  const [txs,     setTxs]     = useState([]);
  const [loading, setLoading] = useState(false);
  const [err,     setErr]     = useState("");

  // import state
  const [importStep,     setImportStep]     = useState(null); // null|"parsing"|"preview"|"saving"
  const [importPreview,  setImportPreview]  = useState(null);
  const [importFile,     setImportFile]     = useState(null);
  const [importProgress, setImportProgress] = useState(0);
  const [importErr,      setImportErr]      = useState("");
  const fileInputRef = useRef(null);

  useEffect(() => {
    api("/cards").then(setCards).catch(() => {});
  }, []);

  const loadTxs = () => {
    if (!cardId) return;
    setLoading(true);
    setErr("");
    api(`/transactions?card_id=${cardId}&periodo=${month}&type=D`)
      .then(data => setTxs(data || []))
      .catch(e => setErr(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadTxs(); }, [cardId, month]);

  const total = txs.reduce((s, t) => s + t.amount, 0);
  const selected = cards.find(c => c.id === Number(cardId));

  // ── PDF import handlers ──────────────────────────────────────────
  const handlePdfFile = async (f) => {
    if (!f || !f.name.endsWith(".pdf")) {
      setImportErr("Apenas arquivos PDF são aceitos."); return;
    }
    setImportFile(f);
    setImportErr("");
    setImportStep("parsing");
    setImportProgress(0);

    const timer = setInterval(() => {
      setImportProgress(p => { if (p >= 85) { clearInterval(timer); } return Math.min(p + 12, 85); });
    }, 180);

    try {
      const fd = new FormData();
      fd.append("file", f);
      const data = await api("/invoices/preview", { method: "POST", body: fd });
      clearInterval(timer);
      setImportProgress(100);
      setTimeout(() => { setImportPreview(data); setImportStep("preview"); }, 300);
    } catch (e) {
      clearInterval(timer);
      setImportErr(e.message);
      setImportStep(null);
    }
  };

  const handleImportConfirm = async () => {
    setImportStep("saving");
    setImportErr("");
    try {
      const fd = new FormData();
      fd.append("file", importFile);
      fd.append("card_id", cardId);
      await api("/invoices/confirm", { method: "POST", body: fd });
      setImportStep(null);
      setImportPreview(null);
      setImportFile(null);
      loadTxs();
    } catch (e) {
      setImportErr(e.message);
      setImportStep("preview");
    }
  };

  const closeImport = () => {
    setImportStep(null);
    setImportPreview(null);
    setImportFile(null);
    setImportErr("");
  };

  return (
    <div style={{ fontFamily: "'Outfit','Segoe UI',sans-serif" }}>
      {/* Header */}
      <div style={{ marginBottom: 20, display: "flex", justifyContent: "space-between",
        alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h2 style={{ fontSize: 21, fontWeight: 700, color: C.text, margin: "0 0 4px",
            letterSpacing: "-0.02em", fontFamily: "'Lora','Georgia',serif" }}>
            Fatura do Cartão
          </h2>
          <p style={{ color: C.muted, fontSize: 13, margin: 0 }}>
            Todas as compras do mês — parceladas ou à vista
          </p>
        </div>
        {cardId && (
          <button onClick={() => fileInputRef.current?.click()}
            style={{ ...btn(C.accent, { gap: 7, boxShadow: `0 4px 14px ${C.accent}44` }) }}>
            <Upload size={14} />Importar PDF da Fatura
          </button>
        )}
        <input ref={fileInputRef} type="file" accept=".pdf" style={{ display: "none" }}
          onChange={e => handlePdfFile(e.target.files[0])} />
      </div>

      {/* Filtros */}
      <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
        <select value={cardId} onChange={e => setCardId(e.target.value)}
          style={{ ...selSt, padding: "9px 14px", flex: 1, minWidth: 200 }}>
          <option value="">Selecione o cartão...</option>
          {cards.map(c => <option key={c.id} value={c.id}>{c.name} ({c.bank})</option>)}
        </select>
        <select value={month} onChange={e => setMonth(e.target.value)}
          style={{ ...selSt, padding: "9px 14px", flex: 1, minWidth: 180 }}>
          {MONTHS.map(m => <option key={m.val} value={m.val}>{m.label}</option>)}
        </select>
      </div>

      {err && <div style={{ marginBottom: 14 }}><ErrMsg msg={err} /></div>}

      {!cardId && (
        <div style={{ ...card({ background: C.surface }), textAlign: "center", padding: "60px 24px" }}>
          <div style={{ width: 54, height: 54, borderRadius: 16, background: C.border + "44",
            display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
            <CreditCard size={22} color={C.faint} />
          </div>
          <p style={{ color: C.muted, margin: 0, fontSize: 14 }}>
            Selecione um cartão para visualizar a fatura.
          </p>
        </div>
      )}

      {cardId && loading && <Loading />}

      {cardId && !loading && txs.length === 0 && !err && (
        <div style={{ ...card({ background: C.surface }), textAlign: "center", padding: "48px 24px" }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: C.border + "44",
            display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
            <FileText size={20} color={C.faint} />
          </div>
          <p style={{ color: C.muted, margin: "0 0 12px", fontSize: 14 }}>
            Nenhuma compra encontrada neste período.
          </p>
          <button onClick={() => fileInputRef.current?.click()}
            style={{ ...btn(C.accent, { display: "inline-flex", padding: "9px 18px",
              boxShadow: `0 4px 14px ${C.accent}33` }) }}>
            <Upload size={13} />Importar PDF da Fatura
          </button>
        </div>
      )}

      {cardId && !loading && txs.length > 0 && (
        <>
          {/* Resumo do cartão */}
          <div style={{ ...card({ background: C.surface, marginBottom: 12 }),
            display: "flex", gap: 20, flexWrap: "wrap", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 38, height: 38, borderRadius: 10,
                background: (selected?.color || C.accent) + "22",
                border: `2px solid ${(selected?.color || C.accent)}44`,
                display: "flex", alignItems: "center", justifyContent: "center" }}>
                <CreditCard size={16} color={selected?.color || C.accent} />
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{selected?.name}</div>
                <div style={{ fontSize: 11, color: C.muted }}>
                  {selected?.bank}{selected?.last_four ? ` ···· ${selected.last_four}` : ""}
                </div>
              </div>
            </div>
            <div style={{ flex: 1 }} />
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 11, color: C.muted, fontWeight: 600, textTransform: "uppercase",
                letterSpacing: "0.06em", marginBottom: 3 }}>
                {txs.length} compra{txs.length !== 1 ? "s" : ""}
              </div>
              <div style={{ fontSize: 22, fontWeight: 700, color: C.red,
                fontFamily: "'Space Mono',monospace" }}>
                {fmt(total)}
              </div>
            </div>
          </div>

          {/* Tabela */}
          <div style={{ ...card({ padding: 0 }), overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ background: C.surface }}>
                  {["Data", "Descrição", "Fornecedor", "Parcela", "Valor"].map(h => (
                    <th key={h} style={{
                      padding: "10px 16px",
                      textAlign: h === "Valor" ? "right" : "left",
                      color: C.muted, fontWeight: 600, fontSize: 10,
                      textTransform: "uppercase", letterSpacing: "0.06em",
                      borderBottom: `1px solid ${C.border}`,
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {txs.map((t, i) => (
                  <tr key={t.id} style={{
                    borderBottom: `1px solid ${C.border}22`,
                    background: i % 2 === 0 ? "transparent" : C.surface + "55",
                  }}>
                    <td style={{ padding: "10px 16px", color: C.muted,
                      fontFamily: "'Space Mono',monospace", fontSize: 11, whiteSpace: "nowrap" }}>
                      {fmtD(t.date)}
                    </td>
                    <td style={{ padding: "10px 16px", color: C.text, fontWeight: 500 }}>
                      {t.description}
                    </td>
                    <td style={{ padding: "10px 16px", color: C.muted, fontSize: 11 }}>
                      {t.supplier && t.supplier !== t.description ? t.supplier : "—"}
                    </td>
                    <td style={{ padding: "10px 16px" }}>
                      {t.installment_current
                        ? <span style={{ ...pill(C.purple), fontSize: 10 }}>
                            {t.installment_current}/{t.installment_total}
                          </span>
                        : <span style={{ color: C.faint, fontSize: 11 }}>À vista</span>}
                    </td>
                    <td style={{ padding: "10px 16px", fontFamily: "'Space Mono',monospace",
                      fontWeight: 700, color: C.red, textAlign: "right", whiteSpace: "nowrap" }}>
                      {fmt(t.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ background: C.surface, borderTop: `2px solid ${C.border}` }}>
                  <td colSpan={4} style={{ padding: "14px 16px", fontWeight: 700,
                    color: C.text, fontSize: 14 }}>
                    Total da Fatura
                  </td>
                  <td style={{ padding: "14px 16px", fontFamily: "'Space Mono',monospace",
                    fontWeight: 700, color: C.red, fontSize: 17, textAlign: "right" }}>
                    {fmt(total)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </>
      )}

      {/* ── Import modal ─────────────────────────────────────────── */}
      {importStep === "parsing" && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 300,
          backdropFilter: "blur(4px)" }}>
          <div style={{ ...card({ background: C.surface, width: 420, textAlign: "center",
            boxShadow: "0 0 0 1px rgba(255,255,255,0.04), 0 32px 72px rgba(0,0,0,0.6)" }) }}>
            <div style={{ width: 56, height: 56, borderRadius: 16, background: C.accentSft,
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 18px" }}>
              <Loader2 size={24} color={C.accent} style={{ animation: "spin .9s linear infinite" }} />
            </div>
            <h3 style={{ color: C.text, fontSize: 16, fontWeight: 700, margin: "0 0 8px" }}>
              Processando PDF
            </h3>
            <p style={{ color: C.muted, fontSize: 13, margin: "0 0 24px" }}>
              Identificando banco e extraindo itens da fatura...
            </p>
            <div style={{ background: C.border, borderRadius: 8, height: 8, overflow: "hidden" }}>
              <div style={{ background: `linear-gradient(90deg,${C.accent},${C.teal})`,
                height: "100%", width: `${importProgress}%`, borderRadius: 8,
                transition: "width .2s ease" }} />
            </div>
            <p style={{ color: C.accent, fontFamily: "'Space Mono',monospace",
              marginTop: 10, fontSize: 14, fontWeight: 700 }}>
              {Math.round(importProgress)}%
            </p>
          </div>
        </div>
      )}

      {(importStep === "preview" || importStep === "saving") && importPreview && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.78)",
          display: "flex", alignItems: "flex-start", justifyContent: "center", zIndex: 300,
          backdropFilter: "blur(4px)", padding: "24px 16px", overflowY: "auto" }}>
          <div style={{ ...card({ background: C.surface, width: "100%", maxWidth: 720,
            boxShadow: "0 0 0 1px rgba(255,255,255,0.04), 0 32px 80px rgba(0,0,0,0.7)" }) }}>

            {/* Modal header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center",
              marginBottom: 16 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: C.text }}>
                  Pré-visualização da Fatura
                </h3>
                <p style={{ margin: "4px 0 0", fontSize: 13, color: C.muted }}>
                  <strong style={{ color: C.accent }}>{importPreview.bank}</strong>
                  {" · "}{importPreview.total_transactions} ite{importPreview.total_transactions !== 1 ? "ns" : "m"}
                  {" · Total: "}<strong style={{ color: C.red }}>{fmt(importPreview.total_amount)}</strong>
                </p>
              </div>
              <button onClick={closeImport}
                style={{ background: C.card, border: `1px solid ${C.border}`, cursor: "pointer",
                  color: C.muted, width: 32, height: 32, borderRadius: 8,
                  display: "flex", alignItems: "center", justifyContent: "center" }}>
                <X size={15} />
              </button>
            </div>

            {importErr && <div style={{ marginBottom: 12 }}><ErrMsg msg={importErr} /></div>}

            {/* Items table */}
            <div style={{ ...card({ padding: 0, marginBottom: 16 }), overflow: "hidden",
              maxHeight: 380, overflowY: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                <thead style={{ position: "sticky", top: 0, zIndex: 1 }}>
                  <tr style={{ background: C.surface }}>
                    {["Data", "Descrição", "Fornecedor", "Parcela", "Valor"].map(h => (
                      <th key={h} style={{ padding: "10px 12px",
                        textAlign: h === "Valor" ? "right" : "left",
                        color: C.muted, fontWeight: 600, fontSize: 10,
                        textTransform: "uppercase", letterSpacing: "0.06em",
                        borderBottom: `1px solid ${C.border}` }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {importPreview.transactions.map((t, i) => (
                    <tr key={i} style={{ borderBottom: `1px solid ${C.border}22`,
                      background: i % 2 === 0 ? "transparent" : C.surface + "55" }}>
                      <td style={{ padding: "9px 12px", color: C.muted,
                        fontFamily: "'Space Mono',monospace", fontSize: 11, whiteSpace: "nowrap" }}>
                        {fmtD(t.date)}
                      </td>
                      <td style={{ padding: "9px 12px", color: C.text }}>{t.description}</td>
                      <td style={{ padding: "9px 12px", color: C.muted, fontSize: 11 }}>
                        {t.supplier || "—"}
                      </td>
                      <td style={{ padding: "9px 12px" }}>
                        {t.installment_current
                          ? <span style={{ ...pill(C.purple), fontSize: 10 }}>
                              {t.installment_current}/{t.installment_total}
                            </span>
                          : <span style={{ color: C.faint }}>À vista</span>}
                      </td>
                      <td style={{ padding: "9px 12px", fontFamily: "'Space Mono',monospace",
                        fontWeight: 700, color: C.red, textAlign: "right" }}>
                        {fmt(t.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Modal actions */}
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button onClick={closeImport} disabled={importStep === "saving"}
                style={{ padding: "10px 18px", borderRadius: 8, border: `1px solid ${C.border}`,
                  background: "transparent", color: C.muted, fontSize: 13, cursor: "pointer" }}>
                Cancelar
              </button>
              <button onClick={handleImportConfirm} disabled={importStep === "saving"}
                style={{ ...btn(C.green, { boxShadow: `0 4px 14px ${C.green}33` }) }}>
                {importStep === "saving"
                  ? <><Loader2 size={13} style={{ animation: "spin .8s linear infinite" }} />Salvando...</>
                  : <><CheckCircle2 size={13} />Confirmar e Salvar Itens</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
