import { useState, useEffect } from "react";
import { UserCog, Shield, BarChart2, TrendingUp, Eye, EyeOff, RefreshCw, CheckCircle2, Trash2 } from "lucide-react";
import { C, card } from "../../styles/theme";

export default function ManageUsersTab({ api }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(null);
  const [confirmDel, setConfirmDel] = useState(null);
  const [flash, setFlash] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const data = await api("/users/");
      setUsers(data);
    } catch (e) {
      setFlash({ type: "error", msg: e.message });
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const patch = async (userId, payload) => {
    setSaving(userId);
    try {
      const updated = await api(`/users/${userId}`, { method: "PATCH", body: JSON.stringify(payload) });
      setUsers(prev => prev.map(u => u.id === userId ? updated : u));
      setFlash({ type: "ok", msg: "Permissões atualizadas" });
      setTimeout(() => setFlash(null), 2500);
    } catch (e) {
      setFlash({ type: "error", msg: e.message });
    } finally { setSaving(null); }
  };

  const deleteUser = async (userId) => {
    setSaving(userId);
    try {
      await api(`/users/${userId}`, { method: "DELETE" });
      setUsers(prev => prev.filter(u => u.id !== userId));
      setConfirmDel(null);
      setFlash({ type: "ok", msg: "Usuário excluído" });
      setTimeout(() => setFlash(null), 2500);
    } catch (e) {
      setFlash({ type: "error", msg: e.message });
    } finally { setSaving(null); }
  };

  const roleColor = (role) => role === "admin" ? C.accent : C.gold;
  const roleLabel = (role) => role === "admin" ? "Admin" : "Usuário";

  return (
    <div style={{ maxWidth: 720, margin: "0 auto", fontFamily: "'Outfit','Segoe UI',sans-serif" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24 }}>
        <UserCog size={20} color={C.accent} />
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: C.text }}>Gerenciar Usuários</h2>
        <button onClick={load} style={{ marginLeft: "auto", background: "transparent", border: `1px solid ${C.border}`,
          borderRadius: 7, padding: "5px 12px", cursor: "pointer", color: C.muted, display: "flex", alignItems: "center", gap: 5, fontSize: 12 }}>
          <RefreshCw size={12} />Atualizar
        </button>
      </div>

      {flash && (
        <div style={{ padding: "10px 14px", borderRadius: 8, marginBottom: 16,
          background: flash.type === "ok" ? C.greenSft ?? "rgba(16,185,129,0.1)" : C.redSft,
          border: `1px solid ${flash.type === "ok" ? "#10B98133" : C.red + "33"}`,
          color: flash.type === "ok" ? "#10B981" : C.red, fontSize: 13, display: "flex", alignItems: "center", gap: 8 }}>
          {flash.type === "ok" && <CheckCircle2 size={14} />}{flash.msg}
        </div>
      )}

      {/* Info banner */}
      <div style={{ ...card({ background: C.card }), padding: "12px 16px", marginBottom: 20, display: "flex", gap: 12,
        borderLeft: `3px solid ${C.accent}` }}>
        <Shield size={16} color={C.accent} style={{ flexShrink: 0, marginTop: 2 }} />
        <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.6 }}>
          <strong style={{ color: C.text }}>Controle de acesso</strong><br />
          Defina o papel de cada usuário e habilite o acesso aos Relatórios individualmente.
          Administradores têm acesso total. O toggle de Relatórios só aparece para usuários comuns.
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: 40, color: C.muted }}>Carregando...</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {users.map(u => {
            const isBusy = saving === u.id;
            return (
              <div key={u.id} style={{ ...card({ background: C.surface }), padding: "16px 18px",
                display: "flex", alignItems: "center", gap: 14, opacity: u.is_active ? 1 : 0.5 }}>

                {/* Avatar */}
                <div style={{ width: 38, height: 38, borderRadius: "50%", flexShrink: 0,
                  background: `linear-gradient(135deg, ${roleColor(u.role)}, ${C.gold})`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 14, fontWeight: 700, color: "#fff" }}>
                  {u.name?.charAt(0)?.toUpperCase()}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {u.name}
                  </div>
                  <div style={{ fontSize: 11, color: C.muted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {u.email}
                  </div>
                </div>

                {/* Role badge + toggle */}
                <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
                  {/* Role selector */}
                  <select
                    value={u.role}
                    disabled={isBusy}
                    onChange={e => patch(u.id, { role: e.target.value })}
                    style={{ fontSize: 11, fontWeight: 600, padding: "4px 8px", borderRadius: 6,
                      border: `1px solid ${roleColor(u.role)}33`,
                      background: `${roleColor(u.role)}18`,
                      color: roleColor(u.role), cursor: "pointer" }}>
                    <option value="admin">Admin</option>
                    <option value="user">Usuário</option>
                  </select>

                  {/* Toggles — only for regular users */}
                  {u.role !== "admin" && (
                    <>
                      <button
                        disabled={isBusy}
                        onClick={() => patch(u.id, { can_view_receitas: !u.can_view_receitas })}
                        title={u.can_view_receitas ? "Revogar acesso às Receitas" : "Permitir ver Receitas"}
                        style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 10px", borderRadius: 7,
                          border: `1px solid ${u.can_view_receitas ? C.accent + "66" : C.border}`,
                          background: u.can_view_receitas ? C.accentSft : C.card,
                          color: u.can_view_receitas ? C.accent : C.muted,
                          cursor: "pointer", fontSize: 11, fontWeight: 600, transition: "all 0.2s" }}>
                        <TrendingUp size={12} />
                        {u.can_view_receitas ? <Eye size={11} /> : <EyeOff size={11} />}Receitas
                      </button>
                      <button
                        disabled={isBusy}
                        onClick={() => patch(u.id, { can_view_reports: !u.can_view_reports })}
                        title={u.can_view_reports ? "Revogar acesso aos Relatórios" : "Permitir acesso aos Relatórios"}
                        style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 10px", borderRadius: 7,
                          border: `1px solid ${u.can_view_reports ? "#10B98144" : C.border}`,
                          background: u.can_view_reports ? "rgba(16,185,129,0.12)" : C.card,
                          color: u.can_view_reports ? "#10B981" : C.muted,
                          cursor: "pointer", fontSize: 11, fontWeight: 600, transition: "all 0.2s" }}>
                        <BarChart2 size={12} />
                        {u.can_view_reports ? <Eye size={11} /> : <EyeOff size={11} />}Relatórios
                      </button>
                    </>
                  )}

                  {u.role === "admin" && (
                    <span style={{ fontSize: 10, color: C.muted, padding: "5px 10px" }}>Acesso total</span>
                  )}

                  {/* Active toggle */}
                  <button
                    disabled={isBusy}
                    onClick={() => patch(u.id, { is_active: !u.is_active })}
                    title={u.is_active ? "Desativar usuário" : "Ativar usuário"}
                    style={{ fontSize: 10, padding: "4px 8px", borderRadius: 6, cursor: "pointer",
                      border: `1px solid ${C.border}`, background: C.card,
                      color: u.is_active ? C.muted : C.red }}>
                    {u.is_active ? "Ativo" : "Inativo"}
                  </button>

                  {/* Delete */}
                  {confirmDel === u.id ? (
                    <div style={{ display: "flex", gap: 4 }}>
                      <button onClick={() => deleteUser(u.id)} disabled={isBusy}
                        style={{ fontSize: 10, padding: "4px 8px", borderRadius: 6, cursor: "pointer",
                          border: "none", background: C.red, color: "#fff", fontWeight: 700 }}>
                        Excluir
                      </button>
                      <button onClick={() => setConfirmDel(null)}
                        style={{ fontSize: 10, padding: "4px 8px", borderRadius: 6, cursor: "pointer",
                          border: `1px solid ${C.border}`, background: "transparent", color: C.muted }}>
                        Não
                      </button>
                    </div>
                  ) : (
                    <button onClick={() => setConfirmDel(u.id)} disabled={isBusy}
                      title="Excluir usuário"
                      style={{ background: "none", border: "none", cursor: "pointer", color: C.faint,
                        padding: 4, borderRadius: 5, display: "flex", transition: "color 0.15s" }}
                      onMouseEnter={e => e.currentTarget.style.color = C.red}
                      onMouseLeave={e => e.currentTarget.style.color = C.faint}>
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          {users.length === 0 && (
            <div style={{ textAlign: "center", padding: 40, color: C.muted }}>Nenhum usuário encontrado.</div>
          )}
        </div>
      )}
    </div>
  );
}
