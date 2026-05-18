import { useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Menu } from "lucide-react";
import { apiGet } from "./lib/api.js";
import Sidebar from "./components/Sidebar.jsx";
import Landing from "./pages/Landing.jsx";
import Login from "./pages/Login.jsx";
import Docs from "./pages/Docs.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Playground from "./pages/Playground.jsx";
import Stats from "./pages/Stats.jsx";
import Admin from "./pages/Admin.jsx";
import Settings from "./pages/Settings.jsx";
import Checkout from "./pages/Checkout.jsx";

function AuthGuard({ children, adminOnly = false }) {
  const { data: user, isLoading, isError } = useQuery({
    queryKey: ["me"],
    queryFn: () => apiGet("/api/me"),
    retry: false,
  });

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
  if (isError || !user) return <Navigate to="/login" replace />;
  if (adminOnly && !user.is_admin) return <Navigate to="/dashboard" replace />;

  return children;
}

function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <AuthGuard>
      <div className="relative flex min-h-screen bg-background">
        <div className="pointer-events-none fixed inset-0 opacity-40 dark:opacity-25" aria-hidden="true">
          <div className="mod-grid" />
        </div>

        {/* Mobile backdrop overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-20 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        {/* Main content — offset by sidebar on md+ */}
        <div className="relative flex-1 flex flex-col min-h-screen md:ml-64 w-0">

          {/* Mobile top bar */}
          <header className="md:hidden sticky top-0 z-10 flex items-center gap-3 px-4 py-3 bg-card border-b border-border">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-xl text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
              aria-label="Open menu"
            >
              <Menu size={20} />
            </button>
            <span className="font-display text-xl leading-none">ModMe</span>
            <span className="font-mono text-xs text-muted-foreground">API</span>
          </header>

          <main className="flex-1 overflow-y-auto">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
              <Routes>
                <Route path="/dashboard"  element={<Dashboard />} />
                <Route path="/keys"       element={<Dashboard />} />
                <Route path="/playground" element={<Playground />} />
                <Route path="/stats"      element={<Stats />} />
                <Route path="/settings"   element={<Settings />} />
                <Route path="/admin"      element={
                  <AuthGuard adminOnly>
                    <Admin />
                  </AuthGuard>
                } />
              </Routes>
            </div>
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"       element={<Landing />} />
        <Route path="/login"  element={<Login />} />
        <Route path="/docs"   element={<Docs />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/*"      element={<AppLayout />} />
      </Routes>
    </BrowserRouter>
  );
}
