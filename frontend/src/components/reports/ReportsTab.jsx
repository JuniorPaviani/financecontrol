import { useState, useEffect, useMemo } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { TrendingUp, TrendingDown, BarChart2, FileText, FileSpreadsheet } from "lucide-react";
import { C, fmt, fmtD, card, pill, selSt, btn } from "../../styles/theme";
import { API } from "../../api/client";
import Loading from "../shared/Loading";
import ErrMsg from "../shared/ErrMsg";

// ─── Conciliation view ────────────────────────────────────────────────────────

function ConciliacaoView({ api }) {
  const [cards,       setCards]       = useState([]);
  const [categories,  setCategories]  = useState([]);
  const [cardId,      setCardId]      = useState("");
  const [month,       setMonth]       = useState(() => new Date().toISOString().slice(0, 7));
  const [txs,         setTxs]         = useState([]);
  const [loading,     setLoading]     = useState(false);
  const [err,         setErr]         = useState("");
  // null = all selected; Set<id> = specific subset
  const [selectedCats, setSelectedCats] = useState(null);

  useEffect(() => {
    Promise.all([api("/cards"), api("/categories")])
      .then(([c, cats]) => { setCards(c); setCategories(cats); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    setErr("");
    const p = new URLSearchParams({ type: "D", periodo: month });
    if (cardId) p.set("card_id", cardId);
    api(`/transactions?${p}`)
      .then(data => setTxs(data || []))
      .catch(e => setErr(e.message))
      .finally(() => setLoading(false));
  }, [cardId, month]);

  const filtered = useMemo(() => {
    if (!selectedCats) return txs;
    return txs.filter(t => selectedCats.has(t.category?.id ?? "none"));
  }, [txs, selectedCats]);

  const groups = useMemo(() => {
    const map = new Map();
    filtered.forEach(t => {
      const key = t.category?.id ?? "none";
      if (!map.has(key)) map.set(key, {
        id: key,
        name:  t.category?.name      || "Sem categoria",
        icon:  t.category?.icon      || "💰",
        color: t.category?.color     || C.accent,
        ifrs:  t.category?.ifrs_group || "—",
        txs: [],
      });
      map.get(key).txs.push(t);
    });
    return [...map.values()].sort((a, b) => a.ifrs.localeCompare(b.ifrs));
  }, [filtered]);

  const total = filtered.reduce((s, t) => s + t.amount, 0);

  const isCatOn = id => !selectedCats || selectedCats.has(id);

  const toggleCat = id => {
    if (!selectedCats) {
      // all → deselect one
      const s = new Set(categories.map(c => c.id));
      s.delete(id);
      setSelectedCats(s.size ? s : null);
    } else {
      const s = new Set(selectedCats);
      if (s.has(id)) s.delete(id); else s.add(id);
      setSelectedCats(s.size === categories.length ? null : s);
    }
  };

  const handleExport = async () => {
    try {
      const token = localStorage.getItem("fc_token");
      const p = new URLSearchParams({ periodo: month });
      if (cardId) p.set("card_id", cardId);
      if (selectedCats) p.set("category_ids", [...selectedCats].join(","));
      const res = await fetch(`${API}/reports/export/reconciliation?${p}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) { setErr("Erro ao gerar Excel"); return; }
      const blob = await res.blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `conciliacao_${month}.xlsx`;
      a.click();
    } catch (e) { setErr(e.message); }
  };

  const chipSt = (on, color) => ({
    padding: "4px 11px", borderRadius: 20, border: "none", cursor: "pointer",
    fontSize: 11, fontWeight: 600, transition: "all 0.15s ease",
    background: on ? color + "22" : "transparent",
    color:      on ? color        : C.faint,
    outline:    on ? `1px solid ${color}44` : `1px solid ${C.border}`,
  });

  return (
    <div>
      {/* Filters */}
      <div style={{ display: "flex", gap: 10, marginBottom: 14, flexWrap: "wrap", alignItems: "center" }}>
        <input type="month" value={month} onChange={e => setMonth(e.target.value)}
          style={{ ...selSt, padding: "8px 12px" }} />
        <select value={cardId} onChange={e => setCardId(e.target.value)}
          style={{ ...selSt, padding: "8px 12px", flex: 1, minWidth: 160 }}>
          <option value="">Todos os cartões</option>
          {cards.map(c => <option key={c.id} value={c.id}>{c.name} ({c.bank})</option>)}
        </select>
        <button onClick={handleExport}
          style={{ ...btn(C.green, { padding: "8px 14px", fontSize: 12, gap: 6 }) }}>
          <FileSpreadsheet size={13} />Exportar Excel
        </button>
      </div>

      {/* Category chips */}
      {categories.length > 0 && (
        <div style={{ ...card({ marginBottom: 14, padding: "12px 16px" }) }}>
          <div style={{ fontSize: 10, fontWeight: 600, color: C.muted, textTransform: "uppercase",
            letterSpacing: "0.06em", marginBottom: 8 }}>Filtrar Categorias</div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            <button onClick={() => setSelectedCats(null)} style={chipSt(!selectedCats, C.accent)}>
              Todas
            </button>
            {categories.map(cat => (
              <button key={cat.id} onClick={() => toggleCat(cat.id)}
                style={chipSt(isCatOn(cat.id), cat.color)}>
                {cat.icon} {cat.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {err && <div style={{ marginBottom: 14 }}><ErrMsg msg={err} /></div>}
      {loading && <Loading />}

      {!loading && filtered.length === 0 && !err && (
        <div style={{ ...card({ background: C.surface }), textAlign: "center", padding: "48px 24px" }}>
          <p style={{ color: C.muted, margin: 0, fontSize: 14 }}>
            Nenhum lançamento encontrado. Ajuste os filtros ou o período.
          </p>
        </div>
      )}

      {!loading && filtered.length > 0 && (
        <>
          {/* Summary bar */}
          <div style={{ display: "flex", gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
            {[
              ["Lançamentos",     String(filtered.length), C.text],
              ["Categorias",      String(groups.length),   C.text],
              ["Total Selecionado", fmt(total),             C.red],
            ].map(([label, val, color]) => (
              <div key={label} style={{ ...card({ padding: "10px 18px", flex: 1, minWidth: 120,
                boxShadow: color === C.red ? `inset 0 2px 0 0 ${C.red}33` : "none" }) }}>
                <div style={{ fontSize: 10, color: C.muted, fontWeight: 600, textTransform: "uppercase",
                  letterSpacing: "0.06em", marginBottom: 4 }}>{label}</div>
                <div style={{ fontSize: 18, fontWeight: 700, color,
                  fontFamily: color === C.red ? "'Space Mono',monospace" : "inherit" }}>{val}</div>
              </div>
            ))}
          </div>

          {/* Groups */}
          {groups.map(g => {
            const subtotal = g.txs.reduce((s, t) => s + t.amount, 0);
            return (
              <div key={g.id} style={{ ...card({ padding: 0, marginBottom: 10 }), overflow: "hidden" }}>
                {/* Category header */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "10px 16px", background: g.color + "15",
                  borderBottom: `1px solid ${g.color}33` }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 16 }}>{g.icon}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: g.color }}>{g.name}</span>
                    <span style={{ ...pill(C.muted), fontSize: 9 }}>{g.ifrs}</span>
                    <span style={{ fontSize: 11, color: C.faint }}>
                      · {g.txs.length} lançamento{g.txs.length !== 1 ? "s" : ""}
                    </span>
                  </div>
                  <span style={{ fontFamily: "'Space Mono',monospace", fontWeight: 700,
                    color: g.color, fontSize: 14 }}>
                    {fmt(subtotal)}
                  </span>
                </div>

                {/* Transactions table */}
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                  <thead>
                    <tr style={{ background: C.surface }}>
                      {["Data", "Descrição", "Fornecedor", "Cartão", "Parcela", "Valor"].map(h => (
                        <th key={h} style={{
                          padding: "7px 14px",
                          textAlign: h === "Valor" ? "right" : "left",
                          color: C.faint, fontWeight: 600, fontSize: 9,
                          textTransform: "uppercase", letterSpacing: "0.06em",
                          borderBottom: `1px solid ${C.border}`,
                        }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {g.txs.map((t, i) => (
                      <tr key={t.id} style={{
                        borderBottom: `1px solid ${C.border}22`,
                        background: i % 2 === 0 ? "transparent" : C.surface + "55",
                      }}>
                        <td style={{ padding: "8px 14px", color: C.muted,
                          fontFamily: "'Space Mono',monospace", fontSize: 11, whiteSpace: "nowrap" }}>
                          {fmtD(t.date)}
                        </td>
                        <td style={{ padding: "8px 14px", color: C.text, fontWeight: 500,
                          maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {t.description}
                        </td>
                        <td style={{ padding: "8px 14px", color: C.muted, fontSize: 11 }}>
                          {t.supplier || "—"}
                        </td>
                        <td style={{ padding: "8px 14px", color: C.muted, fontSize: 11 }}>
                          {t.card?.name || "—"}
                        </td>
                        <td style={{ padding: "8px 14px" }}>
                          {t.installment_current
                            ? <span style={{ ...pill(C.purple), fontSize: 9 }}>
                                {t.installment_current}/{t.installment_total}
                              </span>
                            : <span style={{ color: C.faint, fontSize: 10 }}>À vista</span>}
                        </td>
                        <td style={{ padding: "8px 14px", fontFamily: "'Space Mono',monospace",
                          fontWeight: 700, color: C.red, textAlign: "right", whiteSpace: "nowrap" }}>
                          {fmt(t.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          })}

          {/* Grand total */}
          <div style={{ ...card({ padding: "14px 20px", background: C.surface }),
            display: "flex", justifyContent: "space-between", alignItems: "center",
            border: `1px solid ${C.red}33` }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: C.text }}>Total Geral</span>
            <span style={{ fontSize: 20, fontWeight: 700, color: C.red,
              fontFamily: "'Space Mono',monospace" }}>{fmt(total)}</span>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Comparative view ─────────────────────────────────────────────────────────

function ComparativoView({ api }) {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [err,     setErr]     = useState("");
  const [periodo, setPeriodo] = useState(() => new Date().toISOString().slice(0, 7));

  useEffect(() => {
    setLoading(true);
    api(`/reports/comparative?current_periodo=${periodo}`)
      .then(setData).catch(e => setErr(e.message)).finally(() => setLoading(false));
  }, [periodo]);

  const handleExport = async (format) => {
    const token = localStorage.getItem("fc_token");
    const res = await fetch(`${API}/reports/export/${format}?periodo=${periodo}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const blob = await res.blob();
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `relatorio_${periodo}.${format === "excel" ? "xlsx" : "pdf"}`;
    a.click();
  };

  if (loading) return <Loading />;
  if (err)     return <ErrMsg msg={err} />;
  if (!data)   return null;

  const compareData = (data.by_category || []).map(c => ({
    cat: c.name, atual: c.current, anterior: c.previous,
    diff: c.previous > 0 ? ((c.current - c.previous) / c.previous * 100) : 0,
  }));

  return (
    <div>
      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginBottom: 20 }}>
        <input type="month" value={periodo} onChange={e => setPeriodo(e.target.value)}
          style={{ ...selSt, padding: "8px 12px" }} />
        <button onClick={() => handleExport("pdf")}
          style={{ ...btn(C.accent, { padding: "8px 14px", fontSize: 12, gap: 6 }) }}>
          <FileText size={13} />Exportar PDF
        </button>
        <button onClick={() => handleExport("excel")}
          style={{ ...btn(C.green, { padding: "8px 14px", fontSize: 12, gap: 6 }) }}>
          <FileSpreadsheet size={13} />Exportar Excel
        </button>
      </div>

      <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
        {[
          ["Receitas (Atual)",      fmt(data.current.total_receitas), C.green],
          ["Despesas (Atual)",      fmt(data.current.total_despesas), C.red],
          ["Saldo (Atual)",         fmt(data.current.saldo), data.current.saldo >= 0 ? C.green : C.red],
          ["Variação nas Despesas", `${data.variation_pct > 0 ? "+" : ""}${data.variation_pct.toFixed(1)}%`,
            data.variation_pct <= 0 ? C.green : C.red],
        ].map(([l, v, c]) => (
          <div key={l} style={{ ...card(), flex: 1, minWidth: 140, boxShadow: `inset 0 2px 0 0 ${c}33` }}>
            <div style={{ fontSize: 10, color: C.muted, fontWeight: 600, textTransform: "uppercase",
              letterSpacing: "0.06em", marginBottom: 7 }}>{l}</div>
            <div style={{ fontSize: 17, fontWeight: 700, color: c,
              fontFamily: "'Space Mono',monospace" }}>{v}</div>
          </div>
        ))}
      </div>

      {compareData.length > 0 ? (
        <>
          <div style={{ ...card(), marginBottom: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 16 }}>
              Despesas: Mês Atual vs. Mês Anterior (R$)
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={compareData} margin={{ top: 0, right: 0, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={C.border} strokeOpacity={0.6} />
                <XAxis dataKey="cat" tick={{ fill: C.muted, fontSize: 10 }} />
                <YAxis tick={{ fill: C.muted, fontSize: 10 }} tickFormatter={v => fmt(v)} />
                <Tooltip contentStyle={{ background: C.cardB, border: `1px solid ${C.border}`,
                  borderRadius: 9, fontSize: 12, boxShadow: "0 8px 24px rgba(0,0,0,0.4)" }}
                  formatter={v => fmt(v)} />
                <Legend formatter={v => <span style={{ color: C.muted, fontSize: 11 }}>{v}</span>} />
                <Bar dataKey="anterior" name="Mês Anterior" fill={C.faint}  radius={[4, 4, 0, 0]} />
                <Bar dataKey="atual"    name="Mês Atual"    fill={C.accent} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div style={{ ...card({ padding: 0 }), overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr style={{ background: C.surface }}>
                  {["Categoria", "Mês Anterior", "Mês Atual", "Variação", "Tendência"].map(h => (
                    <th key={h} style={{ padding: "10px 14px", textAlign: "left", color: C.muted,
                      fontWeight: 600, fontSize: 10, textTransform: "uppercase",
                      letterSpacing: "0.06em", borderBottom: `1px solid ${C.border}` }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {compareData.map((r, i) => (
                  <tr key={r.cat} style={{ borderBottom: `1px solid ${C.border}22`,
                    background: i % 2 === 0 ? "transparent" : C.surface + "55" }}>
                    <td style={{ padding: "9px 14px", color: C.text, fontWeight: 500 }}>{r.cat}</td>
                    <td style={{ padding: "9px 14px", fontFamily: "'Space Mono',monospace",
                      color: C.muted }}>{fmt(r.anterior)}</td>
                    <td style={{ padding: "9px 14px", fontFamily: "'Space Mono',monospace",
                      fontWeight: 600, color: C.text }}>{fmt(r.atual)}</td>
                    <td style={{ padding: "9px 14px", fontFamily: "'Space Mono',monospace",
                      fontWeight: 700, color: r.diff > 0 ? C.red : r.diff < 0 ? C.green : C.muted }}>
                      {r.diff > 0 ? "+" : ""}{r.diff.toFixed(1)}%
                    </td>
                    <td style={{ padding: "9px 14px" }}>
                      {r.diff > 10  ? <span style={{ ...pill(C.red),   fontSize: 10 }}><TrendingUp   size={9} />Alta</span>  :
                       r.diff < -10 ? <span style={{ ...pill(C.green), fontSize: 10 }}><TrendingDown size={9} />Queda</span> :
                                      <span style={{ ...pill(C.gold),  fontSize: 10 }}>Estável</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <div style={{ ...card({ background: C.surface }), textAlign: "center", padding: "56px" }}>
          <div style={{ width: 54, height: 54, borderRadius: 16, background: C.border + "44",
            display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
            <BarChart2 size={22} color={C.faint} />
          </div>
          <p style={{ color: C.muted, margin: 0, fontSize: 14 }}>
            Sem dados suficientes para comparação. Cadastre lançamentos nos dois períodos.
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Main tab ─────────────────────────────────────────────────────────────────

export default function ReportsTab({ api }) {
  const [view, setView] = useState("comparativo");

  const tabBtn = (id, label) => (
    <button key={id} onClick={() => setView(id)} style={{
      padding: "8px 18px", borderRadius: 7, border: "none", cursor: "pointer",
      fontSize: 13, fontWeight: view === id ? 700 : 400, transition: "all 0.15s ease",
      background: view === id ? C.accent : "transparent",
      color: view === id ? "#fff" : C.muted,
    }}>{label}</button>
  );

  return (
    <div style={{ fontFamily: "'Outfit','Segoe UI',sans-serif" }}>
      <div style={{ marginBottom: 20, display: "flex", justifyContent: "space-between",
        alignItems: "center", flexWrap: "wrap", gap: 10 }}>
        <div>
          <h2 style={{ fontSize: 21, fontWeight: 700, color: C.text, margin: 0,
            letterSpacing: "-0.02em", fontFamily: "'Lora','Georgia',serif" }}>Relatórios</h2>
          <p style={{ color: C.muted, fontSize: 13, margin: "4px 0 0" }}>
            {view === "comparativo"
              ? "Período atual versus período anterior"
              : "Conciliação detalhada — escolha categorias e exporte para Excel"}
          </p>
        </div>
        <div style={{ display: "flex", gap: 4, background: C.card, borderRadius: 9,
          border: `1px solid ${C.border}`, padding: 4 }}>
          {tabBtn("comparativo", "Comparativo")}
          {tabBtn("conciliacao", "Conciliação")}
        </div>
      </div>

      {view === "comparativo" && <ComparativoView api={api} />}
      {view === "conciliacao" && <ConciliacaoView api={api} />}
    </div>
  );
}
