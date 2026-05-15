import { useState, useEffect } from "react";
import { CreditCard } from "lucide-react";
import { C, fmt, fmtD, card, selSt, pill } from "../../styles/theme";
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

  useEffect(() => {
    api("/cards").then(setCards).catch(() => {});
  }, []);

  useEffect(() => {
    if (!cardId) return;
    setLoading(true);
    setErr("");
    api(`/transactions?card_id=${cardId}&periodo=${month}&type=D`)
      .then(data => setTxs(data || []))
      .catch(e => setErr(e.message))
      .finally(() => setLoading(false));
  }, [cardId, month]);

  const total = txs.reduce((s, t) => s + t.amount, 0);
  const selected = cards.find(c => c.id === Number(cardId));

  return (
    <div style={{ fontFamily: "'Outfit','Segoe UI',sans-serif" }}>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 21, fontWeight: 700, color: C.text, margin: "0 0 4px",
          letterSpacing: "-0.02em", fontFamily: "'Lora','Georgia',serif" }}>
          Fatura do Cartão
        </h2>
        <p style={{ color: C.muted, fontSize: 13, margin: 0 }}>
          Todas as compras do mês — parceladas ou à vista
        </p>
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
          <p style={{ color: C.muted, margin: 0, fontSize: 14 }}>
            Nenhuma compra encontrada neste período.
          </p>
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
                  {["Data", "Descrição", "Parcela", "Valor"].map(h => (
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
                      <div>{t.description}</div>
                      {t.supplier && t.supplier !== t.description && (
                        <div style={{ fontSize: 11, color: C.faint, marginTop: 2 }}>{t.supplier}</div>
                      )}
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
                  <td colSpan={3} style={{ padding: "14px 16px", fontWeight: 700,
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
    </div>
  );
}
