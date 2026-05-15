import { useState } from "react";
import { Loader2, KeyRound } from "lucide-react";
import { C, card, inpSt, btn } from "../../styles/theme";
import { apiFetch } from "../../api/client";
import RotasCafeLogo from "../logos/RotasCafeLogo";

export default function ChangePasswordPage({ token, onChanged }) {
  const [pass,    setPass]    = useState("");
  const [confirm, setConfirm] = useState("");
  const [err,     setErr]     = useState("");
  const [loading, setLoading] = useState(false);

  const handle = async () => {
    setErr("");
    if (pass.length < 6)         return setErr("A senha deve ter pelo menos 6 caracteres.");
    if (pass !== confirm)        return setErr("As senhas não coincidem.");
    setLoading(true);
    try {
      const data = await apiFetch("/auth/change-password", {
        method: "POST",
        body: JSON.stringify({ new_password: pass }),
      }, token);
      onChanged(data);
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: `radial-gradient(ellipse 90% 55% at 50% 0%, rgba(155,35,53,0.18) 0%, rgba(201,123,60,0.06) 40%, ${C.bg} 70%)`,
      fontFamily: "'Outfit','Segoe UI',sans-serif",
    }}>
      <div style={{
        ...card({ background: C.surface,
          boxShadow: "0 0 0 1px rgba(155,35,53,0.12), 0 32px 80px rgba(0,0,0,0.7)" }),
        width: "100%", maxWidth: 400, padding: "36px 28px", margin: "16px",
      }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ marginBottom: 16 }}><RotasCafeLogo size={56} /></div>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            padding: "6px 14px", borderRadius: 20,
            background: "rgba(155,35,53,0.15)", border: "1px solid rgba(155,35,53,0.3)",
            marginBottom: 12,
          }}>
            <KeyRound size={13} color={C.accent} />
            <span style={{ fontSize: 11, color: C.accent, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase" }}>
              Primeiro acesso
            </span>
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: C.text, margin: "0 0 6px", fontFamily: "'Lora',serif" }}>
            Defina sua nova senha
          </h2>
          <p style={{ color: C.muted, fontSize: 12, margin: 0, lineHeight: 1.5 }}>
            Por segurança, crie uma senha pessoal antes de continuar.
          </p>
        </div>

        {[["Nova senha", pass, setPass], ["Confirmar senha", confirm, setConfirm]].map(([label, val, setter]) => (
          <div key={label} style={{ marginBottom: 16 }}>
            <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: C.muted, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>
              {label}
            </label>
            <input
              type="password" value={val}
              onChange={e => setter(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handle()}
              placeholder="••••••••" style={inpSt(false)}
            />
          </div>
        ))}

        {err && (
          <div style={{ padding: "10px 13px", borderRadius: 8, background: C.redSft, border: `1px solid ${C.red}33`, color: C.red, fontSize: 12, marginBottom: 16 }}>
            {err}
          </div>
        )}

        <button onClick={handle} disabled={loading} style={{ ...btn(loading ? C.faint : C.accent, { width: "100%", padding: "12px", fontSize: 14 }) }}>
          {loading
            ? <><Loader2 size={15} style={{ animation: "spin .8s linear infinite" }} /> Salvando...</>
            : "Definir senha e entrar"}
        </button>
      </div>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Lora:wght@500;700&family=Outfit:wght@400;600;700&display=swap');@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
