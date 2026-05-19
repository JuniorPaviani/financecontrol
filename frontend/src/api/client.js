export const API = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

export async function apiFetch(path, options={}, token=null) {
  const headers = { "Content-Type":"application/json", ...(token?{Authorization:`Bearer ${token}`}:{}) };
  const reqHeaders = options.body instanceof FormData ? (token?{Authorization:`Bearer ${token}`}:{}) : headers;
  const MAX_RETRIES = 3;
  let lastError;
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const res = await fetch(`${API}${path}`, {...options, headers: reqHeaders});
      if (!res.ok) {
        const err = await res.json().catch(()=>({detail:res.statusText}));
        const raw = err.detail;
        const msg = Array.isArray(raw)
          ? raw.map(d => d.msg || String(d)).join("; ")
          : (raw || "Erro desconhecido");
        if (res.status === 401) throw Object.assign(new Error("E-mail ou senha incorretos."), {_noRetry:true});
        // 4xx errors are client errors (not found, validation, etc.) — don't retry
        if (res.status >= 400 && res.status < 500) throw Object.assign(new Error(msg), {_noRetry:true});
        throw new Error(msg);
      }
      if (res.status === 204 || res.headers.get("content-length") === "0") return null;
      return res.json();
    } catch(e) {
      lastError = e;
      if (e._noRetry) throw e;
      if (attempt < MAX_RETRIES - 1) await new Promise(r => setTimeout(r, 2000 * (attempt + 1)));
    }
  }
  throw new Error(lastError?.message || "Servidor indisponível. Aguarde alguns segundos e tente novamente.");
}
