import { NavLink } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "../lib/api.js";
import { useTheme } from "../context/ThemeContext.jsx";
import {
  Key, LayoutDashboard, FlaskConical, BarChart3,
  ShieldCheck, Sun, Moon, LogOut, Settings, X
} from "lucide-react";

const NAV = [
  { to: "/dashboard",  label: "Dashboard",  icon: LayoutDashboard },
  { to: "/playground", label: "Playground", icon: FlaskConical },
  { to: "/stats",      label: "Analytics",  icon: BarChart3 },
  { to: "/keys",       label: "API Keys",   icon: Key },
];

function NavItem({ to, label, icon: Icon, onClick }) {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={({ isActive }) =>
        `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group ${
          isActive
            ? "bg-slate-950 text-white shadow-sm dark:bg-white dark:text-slate-950"
            : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-950 dark:hover:text-white"
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
  );
}

export default function Sidebar({ isOpen, onClose }) {
  const { theme, toggleTheme } = useTheme();
  const { data: user } = useQuery({
    queryKey: ["me"],
    queryFn: () => apiGet("/api/me"),
    retry: false,
  });

  const avatarUrl = user
    ? user.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || user.email)}&background=FF5F1F&color=fff`
    : null;

  async function logout() {
    try {
      await fetch("/auth/logout", { method: "POST", credentials: "include" });
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      window.location.href = "/";
    }
  }

  return (
    <aside
      className={`
        fixed inset-y-0 left-0 w-64 flex flex-col z-30
        bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800
        transition-transform duration-300 ease-in-out
        ${isOpen ? "translate-x-0" : "-translate-x-full"}
        md:translate-x-0
      `}
    >
      {/* Logo row */}
      <div className="flex items-center justify-between px-5 py-5 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2.5">
          <img src="/logom.png" alt="ModMe" className="h-8 w-auto object-contain shrink-0" />
          <div>
            <div className="font-bold text-slate-900 dark:text-white text-sm leading-none">ModMe</div>
            <div className="text-xs text-slate-400 mt-0.5">Moderation API</div>
          </div>
        </div>
        {/* Close button — mobile only */}
        <button
          onClick={onClose}
          className="md:hidden p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          aria-label="Close menu"
        >
          <X size={18} />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {NAV.map((item) => <NavItem key={item.to} {...item} onClick={onClose} />)}
        {user?.is_admin && <NavItem to="/admin" label="Admin" icon={ShieldCheck} onClick={onClose} />}
      </nav>

      {/* Bottom */}
      <div className="border-t border-slate-100 dark:border-slate-800 p-3 space-y-0.5">
        <NavLink
          to="/settings"
          onClick={onClose}
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group ${
              isActive
                ? "bg-slate-950 text-white shadow-sm dark:bg-white dark:text-slate-950"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-950 dark:hover:text-white"
            }`
          }
        >
          {({ isActive }) => (
            <>
              <Settings size={17} className={isActive ? "text-white" : "text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300"} />
              Settings
            </>
          )}
        </NavLink>

        <button
          onClick={toggleTheme}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white transition-all"
        >
          {theme === "dark"
            ? <Sun size={17} className="text-amber-400" />
            : <Moon size={17} className="text-gray-400" />}
          {theme === "dark" ? "Light mode" : "Dark mode"}
        </button>

        {user && (
          <NavLink
            to="/settings"
            onClick={onClose}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-all group"
          >
            <div className="relative shrink-0">
              <img src={avatarUrl} alt="" className="w-7 h-7 rounded-full object-cover" />
              <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-400 rounded-full border-2 border-white dark:border-gray-900" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold text-gray-800 dark:text-gray-200 truncate">
                {user.name || user.email.split("@")[0]}
              </div>
              <div className="text-xs text-gray-400 truncate capitalize">{user.plan || "free"} plan</div>
            </div>
            <button
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); logout(); }}
              title="Logout"
              className="opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity text-gray-400 hover:text-red-500 p-0.5 rounded"
            >
              <LogOut size={14} />
            </button>
          </NavLink>
        )}
      </div>
    </aside>
  );
}
