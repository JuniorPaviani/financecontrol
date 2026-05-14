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
        const msg = err.detail || "Erro desconhecido";
        if (res.status === 401) throw new Error("E-mail ou senha incorretos.");
        if (res.status === 400) throw new Error(msg);
        throw new Error(msg);
      }
      return res.json();
    } catch(e) {
      lastError = e;
      if (e.message.includes("incorretos") || e.message.includes("cadastrado")) throw e;
      if (attempt < MAX_RETRIES - 1) await new Promise(r => setTimeout(r, 2000 * (attempt + 1)));
    }
  }
  throw new Error(lastError?.message || "Servidor indisponível. Aguarde alguns segundos e tente novamente.");
}
