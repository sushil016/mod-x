import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "./lib/api.js";
import Sidebar from "./components/Sidebar.jsx";
import Landing from "./pages/Landing.jsx";
import Login from "./pages/Login.jsx";
import Docs from "./pages/Docs.jsx";
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

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
      <div className="w-6 h-6 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );
  if (isError || !user) return <Navigate to="/login" replace />;
  if (adminOnly && !user.is_admin) return <Navigate to="/dashboard" replace />;

  return children;
}

function AppLayout() {
  return (
    <AuthGuard>
      <div className="flex min-h-screen bg-gray-50 dark:bg-gray-950">
        <Sidebar />
        <main className="ml-60 flex-1 min-h-screen overflow-y-auto">
          <div className="max-w-6xl mx-auto px-8 py-8">
            <Routes>
              <Route path="/dashboard"  element={<Dashboard />} />
              <Route path="/keys"       element={<Dashboard />} />
              <Route path="/playground" element={<Playground />} />
              <Route path="/stats"      element={<Stats />} />
              <Route path="/admin"      element={
                <AuthGuard adminOnly>
                  <Admin />
                </AuthGuard>
              } />
            </Routes>
          </div>
        </main>
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
        <Route path="/*"      element={<AppLayout />} />
      </Routes>
    </BrowserRouter>
  );
}
