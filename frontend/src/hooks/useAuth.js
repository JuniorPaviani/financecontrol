import { useState, useCallback } from "react";
import { apiFetch } from "../api/client";

export function useAuth() {
  const [token, setToken] = useState(() => {
    if (new URLSearchParams(window.location.search).has("logout")) {
      localStorage.removeItem("fc_token");
      localStorage.removeItem("fc_user");
      window.history.replaceState({}, "", window.location.pathname);
      return null;
    }
    return localStorage.getItem("fc_token");
  });
  const [user,  setUser]  = useState(() => {
    if (!localStorage.getItem("fc_token")) return null;
    try { return JSON.parse(localStorage.getItem("fc_user")); } catch { return null; }
  });

  const login = async (email, password) => {
    const data = await apiFetch("/auth/login", {method:"POST", body:JSON.stringify({email, password})});
    setToken(data.access_token);
    setUser(data.user);
    localStorage.setItem("fc_token", data.access_token);
    localStorage.setItem("fc_user", JSON.stringify(data.user));
    return data;
  };

  const register = async (name, email, password) => {
    const data = await apiFetch("/auth/register", {method:"POST", body:JSON.stringify({name, email, password})});
    setToken(data.access_token);
    setUser(data.user);
    localStorage.setItem("fc_token", data.access_token);
    localStorage.setItem("fc_user", JSON.stringify(data.user));
    return data;
  };

  const logout = () => {
    setToken(null); setUser(null);
    localStorage.removeItem("fc_token"); localStorage.removeItem("fc_user");
  };

  const updateUser = (data) => {
    setToken(data.access_token);
    setUser(data.user);
    localStorage.setItem("fc_token", data.access_token);
    localStorage.setItem("fc_user", JSON.stringify(data.user));
  };

  const api = useCallback((path, opts={}) => apiFetch(path, opts, token), [token]);

  return { token, user, login, register, logout, updateUser, api };
}
