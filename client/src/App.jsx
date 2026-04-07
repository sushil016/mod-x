// client/src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "./lib/api.js";
import Login from "./pages/Login.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Playground from "./pages/Playground.jsx";
import Stats from "./pages/Stats.jsx";
import Admin from "./pages/Admin.jsx";

function AuthGuard({ children, adminOnly = false }) {
  const { data: user, isLoading, isError } = useQuery({
    queryKey: ["me"],
    queryFn: () => apiGet("/api/me"),
    retry: false,
  });

  if (isLoading) return <div className="min-h-screen flex items-center justify-center text-gray-400">Loading...</div>;
  if (isError || !user) return <Navigate to="/login" replace />;
  if (adminOnly && !user.is_admin) return <Navigate to="/dashboard" replace />;

  return children;
}

function Nav({ user }) {
  return (
    <nav className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
      <span className="font-bold text-brand-600 text-lg">ModMe</span>
      <div className="flex items-center gap-6 text-sm">
        <a href="/dashboard"  className="text-gray-600 hover:text-brand-600">Keys</a>
        <a href="/playground" className="text-gray-600 hover:text-brand-600">Playground</a>
        <a href="/stats"      className="text-gray-600 hover:text-brand-600">Stats</a>
        {user?.is_admin && <a href="/admin" className="text-gray-600 hover:text-brand-600">Admin</a>}
        <button
          onClick={() => fetch("/auth/logout", { method: "POST", credentials: "include" }).then(() => window.location = "/login")}
          className="text-gray-400 hover:text-red-500"
        >
          Logout
        </button>
        <img src={user?.avatar_url} className="w-8 h-8 rounded-full" alt="" />
      </div>
    </nav>
  );
}

function ProtectedLayout({ adminOnly = false }) {
  const { data: user } = useQuery({ queryKey: ["me"], queryFn: () => apiGet("/api/me"), retry: false });
  return (
    <AuthGuard adminOnly={adminOnly}>
      <Nav user={user} />
      <main className="max-w-6xl mx-auto px-6 py-8">
        <Routes>
          <Route path="/dashboard"  element={<Dashboard />} />
          <Route path="/playground" element={<Playground />} />
          <Route path="/stats"      element={<Stats />} />
          <Route path="/admin"      element={<Admin />} />
        </Routes>
      </main>
    </AuthGuard>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/*" element={<ProtectedLayout />} />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
