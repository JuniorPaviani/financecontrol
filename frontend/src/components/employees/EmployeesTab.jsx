import { useState, useEffect } from "react";
import { Plus, Trash2, ChevronDown, CheckCircle2, Clock, X, Users, DollarSign } from "lucide-react";
import { C, fmt, fmtD, card, pill, inpSt, selSt, btn } from "../../styles/theme";
import Loading from "../shared/Loading";
import ErrMsg from "../shared/ErrMsg";

const STATUS_COLORS = { active: C.green, inactive: C.red, suspended: C.gold };
const STATUS_LABELS = { active: "Ativo", inactive: "Inativo", suspended: "Suspenso" };
const PAY_STATUS_COLORS = { paid: C.green, pending: C.gold, cancelled: C.red };
const PAY_STATUS_LABELS = { paid: "Pago", pending: "Pendente", cancelled: "Cancelado" };

const EMP_EMPTY = { name:"", cpf:"", position:"", department:"", base_salary:"", hire_date:"", status:"active", notes:"" };
const SAL_EMPTY = { periodo_referencia:"", base_salary:"", bonus:"0", deductions:"0", inss:"0", fgts:"0", net_salary:"", payment_date:"", status:"pending", notes:"" };

function EmployeeModal({ onClose, onSaved, api, initial }) {
  const [f, setF] = useState(initial ? { ...initial, hire_date: initial.hire_date||"", base_salary: String(initial.base_salary||0) } : { ...EMP_EMPTY });
  const [err, setErr] = useState({});
  const [loading, setLoading] = useState(false);
  const isEdit = !!initial;

  const set = k => e => setF(p => ({ ...p, [k]: e.target.value }));

  const handle = async () => {
    const e = {};
    if (!f.name.trim()) e.name = "Obrigatório";
    if (f.base_salary && isNaN(Number(f.base_salary))) e.base_salary = "Valor inválido";
    if (Object.keys(e).length) { setErr(e); return; }
    setLoading(true);
    try {
      const payload = {
        name: f.name.trim(),
        cpf: f.cpf||null,
        position: f.position||null,
        department: f.department||null,
        base_salary: f.base_salary ? Number(f.base_salary) : 0,
        hire_date: f.hire_date||null,
        status: f.status,
        notes: f.notes||null,
      };
      if (isEdit) {
        await api(`/employees/${initial.id}`, { method:"PUT", body:JSON.stringify(payload) });
      } else {
        await api("/employees/", { method:"POST", body:JSON.stringify(payload) });
      }
      onSaved();
    } catch(ex) {
      setErr({ _: ex.message });
    } finally { setLoading(false); }
  };

  return (
    <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.7)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000,padding:16 }}>
      <div style={{ ...card({ background:C.surface, maxWidth:480, width:"100%", maxHeight:"90vh", overflowY:"auto" }), boxShadow:"0 24px 64px rgba(0,0,0,0.7)" }}>
        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20 }}>
          <h3 style={{ margin:0,fontSize:16,fontWeight:700,color:C.text }}>{isEdit ? "Editar Funcionário" : "Novo Funcionário"}</h3>
          <button onClick={onClose} style={{ background:"transparent",border:"none",color:C.muted,cursor:"pointer",padding:4 }}><X size={18}/></button>
        </div>

        {err._ && <div style={{ padding:"9px 12px",borderRadius:7,background:C.redSft,border:`1px solid ${C.red}33`,color:C.red,fontSize:12,marginBottom:14 }}>{err._}</div>}

        {[
          ["Nome *", "name", "text", f.name],
          ["CPF", "cpf", "text", f.cpf],
          ["Cargo", "position", "text", f.position],
          ["Departamento", "department", "text", f.department],
          ["Salário Base (R$)", "base_salary", "number", f.base_salary],
          ["Data de Admissão", "hire_date", "date", f.hire_date],
        ].map(([label, key, type, val]) => (
          <div key={key} style={{ marginBottom:14 }}>
            <label style={{ display:"block",fontSize:11,fontWeight:600,color:C.muted,marginBottom:5,textTransform:"uppercase",letterSpacing:"0.06em" }}>{label}</label>
            <input type={type} value={val||""} onChange={set(key)} style={inpSt(!!err[key])} min={type==="number"?"0":undefined} step={type==="number"?"0.01":undefined}/>
            {err[key] && <span style={{ fontSize:10,color:C.red,marginTop:2,display:"block" }}>{err[key]}</span>}
          </div>
        ))}

        <div style={{ marginBottom:14 }}>
          <label style={{ display:"block",fontSize:11,fontWeight:600,color:C.muted,marginBottom:5,textTransform:"uppercase",letterSpacing:"0.06em" }}>Status</label>
          <select value={f.status} onChange={set("status")} style={{ ...selSt, width:"100%" }}>
            <option value="active">Ativo</option>
            <option value="inactive">Inativo</option>
            <option value="suspended">Suspenso</option>
          </select>
        </div>

        <div style={{ marginBottom:18 }}>
          <label style={{ display:"block",fontSize:11,fontWeight:600,color:C.muted,marginBottom:5,textTransform:"uppercase",letterSpacing:"0.06em" }}>Observações</label>
          <textarea value={f.notes||""} onChange={set("notes")} rows={2}
            style={{ ...inpSt(false), resize:"vertical", fontFamily:"inherit" }} placeholder="Notas internas..."/>
        </div>

        <div style={{ display:"flex",gap:10 }}>
          <button onClick={onClose} style={{ ...btn(C.border, { flex:1, background:"transparent", border:`1px solid ${C.border}`, color:C.muted }) }}>Cancelar</button>
          <button onClick={handle} disabled={loading} style={{ ...btn(C.accent, { flex:1 }) }}>
            {loading ? "Salvando..." : isEdit ? "Salvar alterações" : "Cadastrar"}
          </button>
        </div>
      </div>
    </div>
  );
}

function SalaryModal({ employee, onClose, onSaved, api }) {
  const [f, setF] = useState({ ...SAL_EMPTY, periodo_referencia: new Date().toISOString().slice(0,7), base_salary: String(employee.base_salary||0) });
  const [err, setErr] = useState({});
  const [loading, setLoading] = useState(false);

  const set = k => e => setF(p => ({ ...p, [k]: e.target.value }));

  const handle = async () => {
    const e = {};
    if (!f.periodo_referencia) e.periodo_referencia = "Obrigatório";
    if (!f.base_salary || isNaN(Number(f.base_salary))) e.base_salary = "Valor inválido";
    if (!f.net_salary || isNaN(Number(f.net_salary))) e.net_salary = "Valor inválido";
    if (Object.keys(e).length) { setErr(e); return; }
    setLoading(true);
    try {
      const payload = {
        periodo_referencia: f.periodo_referencia,
        base_salary: Number(f.base_salary),
        bonus: Number(f.bonus||0),
        deductions: Number(f.deductions||0),
        inss: Number(f.inss||0),
        fgts: Number(f.fgts||0),
        net_salary: Number(f.net_salary),
        payment_date: f.payment_date||null,
        status: f.status,
        notes: f.notes||null,
      };
      await api(`/employees/${employee.id}/salaries`, { method:"POST", body:JSON.stringify(payload) });
      onSaved();
    } catch(ex) {
      setErr({ _: ex.message });
    } finally { setLoading(false); }
  };

  const calcNet = () => {
    const base = Number(f.base_salary||0);
    const bonus = Number(f.bonus||0);
    const ded = Number(f.deductions||0);
    const inss = Number(f.inss||0);
    const net = base + bonus - ded - inss;
    setF(p => ({ ...p, net_salary: net > 0 ? net.toFixed(2) : "0.00" }));
  };

  return (
    <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.7)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000,padding:16 }}>
      <div style={{ ...card({ background:C.surface, maxWidth:480, width:"100%", maxHeight:"90vh", overflowY:"auto" }), boxShadow:"0 24px 64px rgba(0,0,0,0.7)" }}>
        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20 }}>
          <div>
            <h3 style={{ margin:0,fontSize:16,fontWeight:700,color:C.text }}>Registrar Pagamento</h3>
            <p style={{ margin:"3px 0 0",fontSize:12,color:C.muted }}>{employee.name}</p>
          </div>
          <button onClick={onClose} style={{ background:"transparent",border:"none",color:C.muted,cursor:"pointer",padding:4 }}><X size={18}/></button>
        </div>

        {err._ && <div style={{ padding:"9px 12px",borderRadius:7,background:C.redSft,border:`1px solid ${C.red}33`,color:C.red,fontSize:12,marginBottom:14 }}>{err._}</div>}

        <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:12 }}>
          {[
            ["Período (YYYY-MM) *", "periodo_referencia", "month", f.periodo_referencia],
            ["Salário Base (R$) *", "base_salary", "number", f.base_salary],
            ["Bônus (R$)", "bonus", "number", f.bonus],
            ["Deduções (R$)", "deductions", "number", f.deductions],
            ["INSS (R$)", "inss", "number", f.inss],
            ["FGTS (R$)", "fgts", "number", f.fgts],
          ].map(([label, key, type, val]) => (
            <div key={key}>
              <label style={{ display:"block",fontSize:10,fontWeight:600,color:C.muted,marginBottom:4,textTransform:"uppercase",letterSpacing:"0.06em" }}>{label}</label>
              <input type={type} value={val||""} onChange={set(key)} style={inpSt(!!err[key])} min="0" step="0.01"/>
              {err[key] && <span style={{ fontSize:10,color:C.red }}>{err[key]}</span>}
            </div>
          ))}
        </div>

        <div style={{ marginTop:12,marginBottom:12 }}>
          <button onClick={calcNet} style={{ ...btn(C.goldSft, { color:C.gold, border:`1px solid ${C.gold}33`, fontSize:11, padding:"6px 12px" }) }}>
            Calcular Salário Líquido
          </button>
        </div>

        <div style={{ marginBottom:12 }}>
          <label style={{ display:"block",fontSize:11,fontWeight:600,color:C.muted,marginBottom:5,textTransform:"uppercase",letterSpacing:"0.06em" }}>Salário Líquido (R$) *</label>
          <input type="number" value={f.net_salary||""} onChange={set("net_salary")} style={inpSt(!!err.net_salary)} min="0" step="0.01"/>
          {err.net_salary && <span style={{ fontSize:10,color:C.red }}>{err.net_salary}</span>}
        </div>

        <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:12 }}>
          <div>
            <label style={{ display:"block",fontSize:10,fontWeight:600,color:C.muted,marginBottom:4,textTransform:"uppercase",letterSpacing:"0.06em" }}>Data de Pagamento</label>
            <input type="date" value={f.payment_date||""} onChange={set("payment_date")} style={inpSt(false)}/>
          </div>
          <div>
            <label style={{ display:"block",fontSize:10,fontWeight:600,color:C.muted,marginBottom:4,textTransform:"uppercase",letterSpacing:"0.06em" }}>Status</label>
            <select value={f.status} onChange={set("status")} style={{ ...selSt, width:"100%" }}>
              <option value="pending">Pendente</option>
              <option value="paid">Pago</option>
              <option value="cancelled">Cancelado</option>
            </select>
          </div>
        </div>

        <div style={{ marginBottom:18 }}>
          <label style={{ display:"block",fontSize:11,fontWeight:600,color:C.muted,marginBottom:5,textTransform:"uppercase",letterSpacing:"0.06em" }}>Observações</label>
          <textarea value={f.notes||""} onChange={set("notes")} rows={2}
            style={{ ...inpSt(false), resize:"vertical", fontFamily:"inherit" }} placeholder="Notas..."/>
        </div>

        <div style={{ display:"flex",gap:10 }}>
          <button onClick={onClose} style={{ ...btn(C.border, { flex:1, background:"transparent", border:`1px solid ${C.border}`, color:C.muted }) }}>Cancelar</button>
          <button onClick={handle} disabled={loading} style={{ ...btn(C.green, { flex:1 }) }}>
            {loading ? "Salvando..." : "Registrar Pagamento"}
          </button>
        </div>
      </div>
    </div>
  );
}

function SalariesPanel({ employee, api, onClose }) {
  const [salaries, setSalaries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [showModal, setShowModal] = useState(false);

  const load = () => {
    setLoading(true);
    api(`/employees/${employee.id}/salaries`)
      .then(setSalaries).catch(e => setErr(e.message)).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [employee.id]);

  const deleteSalary = async (salId) => {
    if (!confirm("Excluir este pagamento?")) return;
    try {
      await api(`/employees/${employee.id}/salaries/${salId}`, { method:"DELETE" });
      load();
    } catch(e) { alert(e.message); }
  };

  return (
    <div style={{ ...card({ background:C.cardB }), marginTop:8 }}>
      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14 }}>
        <div style={{ display:"flex",alignItems:"center",gap:8 }}>
          <DollarSign size={15} color={C.gold}/>
          <span style={{ fontSize:13,fontWeight:600,color:C.text }}>Histórico de Pagamentos</span>
        </div>
        <div style={{ display:"flex",gap:8 }}>
          <button onClick={() => setShowModal(true)} style={{ ...btn(C.green, { padding:"6px 12px", fontSize:11 }) }}>
            <Plus size={12}/>Registrar
          </button>
          <button onClick={onClose} style={{ background:"transparent",border:"none",color:C.muted,cursor:"pointer",padding:4 }}>
            <X size={14}/>
          </button>
        </div>
      </div>

      {loading ? <Loading/> : err ? <ErrMsg msg={err}/> : salaries.length === 0 ? (
        <p style={{ color:C.muted,fontSize:13,textAlign:"center",padding:"20px 0" }}>Nenhum pagamento registrado.</p>
      ) : (
        <div style={{ overflowX:"auto" }}>
          <table style={{ width:"100%",borderCollapse:"collapse",fontSize:12 }}>
            <thead>
              <tr>
                {["Período","Salário Base","Bônus","Deduções","INSS","Líquido","Pgto","Status",""].map(h => (
                  <th key={h} style={{ textAlign:"left",padding:"6px 8px",color:C.muted,fontWeight:600,fontSize:10,textTransform:"uppercase",borderBottom:`1px solid ${C.border}` }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {salaries.map(s => (
                <tr key={s.id} style={{ borderBottom:`1px solid ${C.border}22` }}>
                  <td style={{ padding:"8px",color:C.text,fontWeight:600 }}>{s.periodo_referencia}</td>
                  <td style={{ padding:"8px",color:C.muted }}>{fmt(s.base_salary)}</td>
                  <td style={{ padding:"8px",color:s.bonus>0?C.green:C.muted }}>{fmt(s.bonus)}</td>
                  <td style={{ padding:"8px",color:s.deductions>0?C.red:C.muted }}>{fmt(s.deductions)}</td>
                  <td style={{ padding:"8px",color:C.muted }}>{fmt(s.inss)}</td>
                  <td style={{ padding:"8px",color:C.text,fontWeight:700 }}>{fmt(s.net_salary)}</td>
                  <td style={{ padding:"8px",color:C.muted }}>{s.payment_date ? fmtD(s.payment_date) : "—"}</td>
                  <td style={{ padding:"8px" }}>
                    <span style={pill(PAY_STATUS_COLORS[s.status]||C.muted)}>{PAY_STATUS_LABELS[s.status]||s.status}</span>
                  </td>
                  <td style={{ padding:"8px" }}>
                    <button onClick={() => deleteSalary(s.id)} style={{ background:"transparent",border:"none",color:C.red,cursor:"pointer",padding:3 }}>
                      <Trash2 size={12}/>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && <SalaryModal employee={employee} api={api} onClose={() => setShowModal(false)} onSaved={() => { setShowModal(false); load(); }}/>}
    </div>
  );
}

export default function EmployeesTab({ api }) {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [modal, setModal] = useState(null); // null | "new" | employee object for edit
  const [expanded, setExpanded] = useState(null); // employee id with open salaries
  const [search, setSearch] = useState("");

  const load = () => {
    setLoading(true);
    api("/employees/")
      .then(setEmployees).catch(e => setErr(e.message)).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const deleteEmployee = async (emp) => {
    if (!confirm(`Excluir funcionário "${emp.name}"? Esta ação não pode ser desfeita.`)) return;
    try {
      await api(`/employees/${emp.id}`, { method:"DELETE" });
      if (expanded === emp.id) setExpanded(null);
      load();
    } catch(e) { alert(e.message); }
  };

  const filtered = employees.filter(e =>
    !search || e.name.toLowerCase().includes(search.toLowerCase()) ||
    (e.position||"").toLowerCase().includes(search.toLowerCase()) ||
    (e.department||"").toLowerCase().includes(search.toLowerCase())
  );

  const totalSalaries = employees.filter(e => e.status === "active").reduce((a, e) => a + (e.base_salary||0), 0);

  if (loading) return <Loading/>;
  if (err) return <ErrMsg msg={err}/>;

  return (
    <div style={{ fontFamily:"'Outfit','Segoe UI',sans-serif" }}>
      {/* Header */}
      <div style={{ marginBottom:22,display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:12 }}>
        <div>
          <h2 style={{ fontSize:21,fontWeight:700,color:C.text,margin:0,letterSpacing:"-0.02em",fontFamily:"'Lora','Georgia',serif" }}>Funcionários</h2>
          <p style={{ color:C.muted,fontSize:13,margin:"4px 0 0" }}>Gestão de equipe e folha de pagamento</p>
        </div>
        <button onClick={() => setModal("new")} style={{ ...btn(C.accent) }}>
          <Plus size={14}/>Novo Funcionário
        </button>
      </div>

      {/* KPIs */}
      <div style={{ display:"flex",gap:10,marginBottom:18,flexWrap:"wrap" }}>
        {[
          ["Total de Funcionários", employees.length, Users, C.accent],
          ["Ativos", employees.filter(e=>e.status==="active").length, CheckCircle2, C.green],
          ["Pendentes/Suspensos", employees.filter(e=>e.status!=="active").length, Clock, C.gold],
          ["Folha Mensal Estimada", fmt(totalSalaries), DollarSign, C.purple],
        ].map(([label, value, Icon, color]) => (
          <div key={label} style={{ ...card(), flex:1,minWidth:140,boxShadow:`inset 0 2px 0 0 ${color}33` }}>
            <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8 }}>
              <span style={{ fontSize:10,fontWeight:600,color:C.muted,textTransform:"uppercase",letterSpacing:"0.06em" }}>{label}</span>
              <div style={{ width:28,height:28,borderRadius:7,background:color+"18",display:"flex",alignItems:"center",justifyContent:"center",border:`1px solid ${color}22` }}>
                <Icon size={13} color={color}/>
              </div>
            </div>
            <div style={{ fontSize:17,fontWeight:700,color:C.text }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div style={{ marginBottom:14,display:"flex",gap:10,alignItems:"center" }}>
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar por nome, cargo ou departamento..."
          style={{ ...inpSt(false), maxWidth:360 }}
        />
        {search && (
          <button onClick={() => setSearch("")} style={{ background:"transparent",border:"none",color:C.muted,cursor:"pointer" }}>
            <X size={14}/>
          </button>
        )}
      </div>

      {/* Employee List */}
      {filtered.length === 0 ? (
        <div style={{ ...card(), textAlign:"center", padding:"40px 24px" }}>
          <Users size={32} color={C.faint} style={{ marginBottom:12 }}/>
          <p style={{ color:C.muted,margin:0 }}>
            {search ? "Nenhum funcionário encontrado para esta busca." : "Nenhum funcionário cadastrado ainda."}
          </p>
        </div>
      ) : (
        <div style={{ display:"flex",flexDirection:"column",gap:8 }}>
          {filtered.map(emp => (
            <div key={emp.id}>
              <div style={{ ...card(), display:"flex",alignItems:"center",gap:12,flexWrap:"wrap" }}>
                {/* Avatar */}
                <div style={{ width:40,height:40,borderRadius:"50%",
                  background:`linear-gradient(135deg, ${C.accent}, ${C.gold})`,
                  display:"flex",alignItems:"center",justifyContent:"center",
                  fontSize:15,fontWeight:700,color:"#fff",flexShrink:0 }}>
                  {emp.name.charAt(0).toUpperCase()}
                </div>

                {/* Info */}
                <div style={{ flex:1,minWidth:0 }}>
                  <div style={{ display:"flex",alignItems:"center",gap:8,flexWrap:"wrap" }}>
                    <span style={{ fontSize:14,fontWeight:700,color:C.text }}>{emp.name}</span>
                    <span style={pill(STATUS_COLORS[emp.status]||C.muted)}>{STATUS_LABELS[emp.status]||emp.status}</span>
                  </div>
                  <div style={{ fontSize:11,color:C.muted,marginTop:2 }}>
                    {[emp.position, emp.department].filter(Boolean).join(" · ")||"—"}
                    {emp.cpf && <span style={{ marginLeft:8 }}>CPF: {emp.cpf}</span>}
                  </div>
                </div>

                {/* Salary */}
                <div style={{ textAlign:"right",flexShrink:0 }}>
                  <div style={{ fontSize:14,fontWeight:700,color:C.gold }}>{fmt(emp.base_salary)}</div>
                  <div style={{ fontSize:10,color:C.muted }}>salário base</div>
                </div>

                {/* Hire date */}
                {emp.hire_date && (
                  <div style={{ textAlign:"right",flexShrink:0 }}>
                    <div style={{ fontSize:11,color:C.muted }}>Admissão</div>
                    <div style={{ fontSize:12,color:C.text }}>{fmtD(emp.hire_date)}</div>
                  </div>
                )}

                {/* Actions */}
                <div style={{ display:"flex",gap:6,flexShrink:0 }}>
                  <button
                    onClick={() => setExpanded(expanded === emp.id ? null : emp.id)}
                    title="Ver pagamentos"
                    style={{ ...btn(C.goldSft, { color:C.gold, border:`1px solid ${C.gold}33`, padding:"6px 10px", fontSize:11 }) }}>
                    <DollarSign size={12}/>Salários
                    <ChevronDown size={12} style={{ transform: expanded===emp.id ? "rotate(180deg)":"rotate(0)", transition:"transform 0.2s" }}/>
                  </button>
                  <button
                    onClick={() => setModal(emp)}
                    style={{ ...btn(C.accentSft, { color:C.accent, border:`1px solid ${C.accent}33`, padding:"6px 10px", fontSize:11 }) }}>
                    Editar
                  </button>
                  <button
                    onClick={() => deleteEmployee(emp)}
                    style={{ background:"transparent",border:`1px solid ${C.border}`,color:C.red,cursor:"pointer",borderRadius:7,padding:"6px 8px" }}>
                    <Trash2 size={13}/>
                  </button>
                </div>
              </div>

              {expanded === emp.id && (
                <SalariesPanel employee={emp} api={api} onClose={() => setExpanded(null)}/>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      {modal === "new" && (
        <EmployeeModal api={api} onClose={() => setModal(null)} onSaved={() => { setModal(null); load(); }}/>
      )}
      {modal && modal !== "new" && (
        <EmployeeModal api={api} initial={modal} onClose={() => setModal(null)} onSaved={() => { setModal(null); load(); }}/>
      )}
    </div>
  );
}
