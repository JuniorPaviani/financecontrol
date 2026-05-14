import { useState, useEffect } from "react";
import { C } from "./styles/theme";
import { useAuth } from "./hooks/useAuth";
import LoginPage from "./components/auth/LoginPage";
import Sidebar from "./components/layout/Sidebar";
import DashboardTab from "./components/dashboard/DashboardTab";
import TransactionsTab from "./components/transactions/TransactionsTab";
import ImportTab from "./components/import/ImportTab";
import CardsTab from "./components/cards/CardsTab";
import CategoriesTab from "./components/categories/CategoriesTab";
import ReportsTab from "./components/reports/ReportsTab";
import EmployeesTab from "./components/employees/EmployeesTab";
import ManageUsersTab from "./components/users/ManageUsersTab";

export default function App() {
  const { user, login, register, logout, api } = useAuth();
  const [tab, setTab] = useState("dashboard");

  useEffect(() => {
    const l = document.createElement("link");
    l.href = "https://fonts.googleapis.com/css2?family=Lora:wght@500;600;700&family=Outfit:wght@400;500;600;700&family=Space+Mono:wght@400;700&display=swap";
    l.rel = "stylesheet";
    document.head.appendChild(l);
  }, []);

  const handleAuth = async (mode, name, email, password) => {
    if (mode === "login") await login(email, password);
    else await register(name, email, password);
  };

  const [isMobile, setIsMobile] = useState(() => typeof window !== "undefined" && window.innerWidth < 768);
  useEffect(() => {
    const h = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);

  if (!user) return <LoginPage onLogin={handleAuth} />;

  return (
    <div style={{
      display: "flex",
      flexDirection: isMobile ? "column" : "row",
      height: "100vh",
      background: `radial-gradient(ellipse 120% 80% at 80% 120%, rgba(155,35,53,0.06) 0%, ${C.bg} 50%)`,
      color: C.text,
      overflow: "hidden",
      fontFamily: "'Outfit','Segoe UI',sans-serif",
    }}>
      {!isMobile && <Sidebar active={tab} set={setTab} user={user} onLogout={logout} />}

      <main style={{ flex: 1, overflowY: "auto", padding: isMobile ? "16px 12px 84px" : "24px 24px" }}>
        {tab === "dashboard"    && <DashboardTab    api={api} />}
        {tab === "transactions" && <TransactionsTab api={api} user={user} />}
        {tab === "import"       && <ImportTab       api={api} />}
        {tab === "cards"        && <CardsTab        api={api} />}
        {tab === "categories"   && <CategoriesTab   api={api} />}
        {tab === "reports"      && <ReportsTab      api={api} />}
        {tab === "employees"    && <EmployeesTab    api={api} />}
        {tab === "manage-users" && <ManageUsersTab  api={api} />}
      </main>

      {isMobile && <Sidebar active={tab} set={setTab} user={user} onLogout={logout} />}

      <style>{`
        * { box-sizing: border-box; }
        button:focus-visible { outline: 2px solid ${C.accent}; outline-offset: 2px; }
        input:focus { border-color: ${C.accent} !important; box-shadow: 0 0 0 3px rgba(155,35,53,0.14); }
        select:focus { outline: 2px solid ${C.accent}; outline-offset: 1px; }
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-track { background: ${C.surface}; }
        ::-webkit-scrollbar-thumb { background: ${C.borderL}; border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: ${C.faint}; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
