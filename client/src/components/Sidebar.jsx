import { NavLink, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "../lib/api.js";
import { useTheme } from "../context/ThemeContext.jsx";
import {
  Key, LayoutDashboard, FlaskConical, BarChart3,
  ShieldCheck, Sun, Moon, LogOut
} from "lucide-react";

const NAV = [
  { to: "/dashboard",  label: "Dashboard",  icon: LayoutDashboard },
  { to: "/playground", label: "Playground", icon: FlaskConical },
  { to: "/stats",      label: "Analytics",  icon: BarChart3 },
  { to: "/keys",       label: "API Keys",   icon: Key },
];

export default function Sidebar() {
  const { theme, toggleTheme } = useTheme();
  const { data: user } = useQuery({
    queryKey: ["me"],
    queryFn: () => apiGet("/api/me"),
    retry: false,
  });

  function logout() {
    fetch("/auth/logout", { method: "POST", credentials: "include" })
      .then(() => { window.location = "/"; });
  }

  return (
    <aside className="fixed inset-y-0 left-0 w-60 flex flex-col bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 z-30">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-5 border-b border-gray-100 dark:border-gray-800">
        <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center text-white font-black text-sm shrink-0">M</div>
        <div>
          <div className="font-bold text-gray-900 dark:text-white text-sm leading-none">ModMe</div>
          <div className="text-xs text-gray-400 mt-0.5">Content Moderation</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {NAV.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors group ${
                isActive
                  ? "bg-brand-600 text-white shadow-sm shadow-brand-600/30"
                  : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={17} className={isActive ? "text-white" : "text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300"} />
                {label}
              </>
            )}
          </NavLink>
        ))}

        {user?.is_admin && (
          <NavLink
            to="/admin"
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors group ${
                isActive
                  ? "bg-brand-600 text-white"
                  : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <ShieldCheck size={17} className={isActive ? "text-white" : "text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300"} />
                Admin
              </>
            )}
          </NavLink>
        )}
      </nav>

      {/* Bottom: theme toggle + profile */}
      <div className="border-t border-gray-100 dark:border-gray-800 p-3 space-y-1">
        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          {theme === "dark"
            ? <Sun size={17} className="text-amber-400" />
            : <Moon size={17} className="text-gray-400" />}
          {theme === "dark" ? "Light mode" : "Dark mode"}
        </button>

        {/* Profile */}
        {user && (
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors group">
            <img
              src={user.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.email)}&background=4f46e5&color=fff`}
              alt=""
              className="w-7 h-7 rounded-full shrink-0"
            />
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium text-gray-800 dark:text-gray-200 truncate">{user.name || user.email.split("@")[0]}</div>
              <div className="text-xs text-gray-400 truncate">{user.plan || "free"}</div>
            </div>
            <button
              onClick={logout}
              title="Logout"
              className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-red-500"
            >
              <LogOut size={14} />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
