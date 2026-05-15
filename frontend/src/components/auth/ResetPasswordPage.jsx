import { useState } from "react";
import { CheckCircle2, AlertCircle, Loader2, KeyRound } from "lucide-react";
import { C, card, inpSt, btn } from "../../styles/theme";
import { API } from "../../api/client";
import RotasCafeLogo from "../logos/RotasCafeLogo";
import WindingRoad from "../logos/WindingRoad";

export default function ResetPasswordPage({ token }) {
  const [pass,    setPass]    = useState("");
  const [confirm, setConfirm] = useState("");
  const [err,     setErr]     = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handle = async () => {
    if (pass.length < 6)    { setErr("A senha deve ter pelo menos 6 caracteres."); return; }
    if (pass !== confirm)   { setErr("As senhas não coincidem."); return; }
    setErr(""); setLoading(true);
    try {
      const res  = await fetch(`${API}/auth/reset-password`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ token, new_password: pass }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Erro ao redefinir senha.");
      setSuccess(true);
      setTimeout(() => {
        window.location.href = window.location.pathname;
      }, 2500);
    } catch (e) { setErr(e.message); }
    finally     { setLoading(false); }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: `radial-gradient(ellipse 90% 55% at 50% 0%, rgba(155,35,53,0.18) 0%, rgba(201,123,60,0.06) 40%, ${C.bg} 70%)`,
      fontFamily: "'Outfit','Segoe UI',sans-serif", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", bottom: -40, right: -60 }}>
        <WindingRoad width={300} height={440} color="#C97B3C" opacity={0.09} />
      </div>

      <div style={{ ...card({ background: C.surface,
        boxShadow: "0 0 0 1px rgba(155,35,53,0.12), 0 32px 80px rgba(0,0,0,0.7)" }),
        width: "100%", maxWidth: 400, padding: "36px 28px", margin: "16px" }}>

        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ marginBottom: 14, filter: `drop-shadow(0 0 16px rgba(155,35,53,0.5))` }}>
            <RotasCafeLogo size={54} />
          </div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: C.text, margin: "0 0 4px",
            letterSpacing: "-0.02em", fontFamily: "'Lora','Georgia',serif" }}>Nova Senha</h1>
          <p style={{ color: C.muted, fontSize: 12, margin: 0 }}>Digite e confirme sua nova senha</p>
        </div>

        {success ? (
          <div style={{ padding: "20px", borderRadius: 10, background: C.greenSft,
            border: `1px solid ${C.green}44`, textAlign: "center" }}>
            <CheckCircle2 size={32} color={C.green} style={{ marginBottom: 10 }} />
            <p style={{ color: C.green, fontWeight: 700, fontSize: 15, margin: "0 0 6px" }}>
              Senha redefinida!
            </p>
            <p style={{ color: C.muted, fontSize: 12, margin: 0 }}>
              Redirecionando para o login...
            </p>
          </div>
        ) : (
          <>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: C.muted,
                marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                Nova Senha
              </label>
              <input type="password" value={pass} onChange={e => setPass(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handle()}
                placeholder="Mínimo 6 caracteres" style={inpSt(false)} />
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: C.muted,
                marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                Confirmar Nova Senha
              </label>
              <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handle()}
                placeholder="Repita a senha" style={inpSt(false)} />
            </div>

            {err && (
              <div style={{ padding: "10px 13px", borderRadius: 8, background: C.redSft,
                border: `1px solid ${C.red}33`, color: C.red, fontSize: 12,
                marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
                <AlertCircle size={13} />{err}
              </div>
            )}

            <button onClick={handle} disabled={loading}
              style={{ ...btn(loading ? C.faint : C.accent, { width: "100%", padding: "12px", fontSize: 14,
                boxShadow: loading ? "none" : `0 4px 14px rgba(155,35,53,0.35)` }) }}>
              {loading
                ? <><Loader2 size={15} style={{ animation: "spin .8s linear infinite" }} />Salvando...</>
                : <><KeyRound size={15} />Salvar Nova Senha</>}
            </button>
          </>
        )}
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
