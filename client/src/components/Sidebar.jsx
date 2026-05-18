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
            ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
            : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        }`
      }
    >
      {({ isActive }) => (
        <>
          <Icon size={17} className={isActive ? "text-sidebar-primary-foreground" : "text-muted-foreground group-hover:text-sidebar-accent-foreground"} />
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
        bg-sidebar text-sidebar-foreground border-r border-sidebar-border
        transition-transform duration-300 ease-in-out
        ${isOpen ? "translate-x-0" : "-translate-x-full"}
        md:translate-x-0
      `}
    >
      {/* Logo row */}
      <div className="flex items-center justify-between px-5 py-5 border-b border-sidebar-border">
        <div className="flex items-center gap-2.5">
          <div>
            <div className="font-display text-xl leading-none text-foreground">ModMe</div>
            <div className="text-xs text-muted-foreground mt-0.5">Moderation API</div>
          </div>
        </div>
        {/* Close button — mobile only */}
        <button
          onClick={onClose}
          className="md:hidden p-1.5 rounded-lg text-muted-foreground hover:bg-sidebar-accent transition-colors"
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
      <div className="border-t border-sidebar-border p-3 space-y-0.5">
        <NavLink
          to="/settings"
          onClick={onClose}
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group ${
              isActive
                ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            }`
          }
        >
          {({ isActive }) => (
            <>
              <Settings size={17} className={isActive ? "text-sidebar-primary-foreground" : "text-muted-foreground group-hover:text-sidebar-accent-foreground"} />
              Settings
            </>
          )}
        </NavLink>

        <button
          onClick={toggleTheme}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-all"
        >
          {theme === "dark"
            ? <Sun size={17} className="text-amber-400" />
            : <Moon size={17} className="text-muted-foreground" />}
          {theme === "dark" ? "Light mode" : "Dark mode"}
        </button>

        {user && (
          <NavLink
            to="/settings"
            onClick={onClose}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-sidebar-accent transition-all group"
          >
            <div className="relative shrink-0">
              <img src={avatarUrl} alt="" className="w-7 h-7 rounded-full object-cover" />
              <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-400 rounded-full border-2 border-sidebar" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold text-sidebar-foreground truncate">
                {user.name || user.email.split("@")[0]}
              </div>
              <div className="text-xs text-muted-foreground truncate capitalize">{user.plan || "free"} plan</div>
            </div>
            <button
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); logout(); }}
              title="Logout"
              className="opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity text-muted-foreground hover:text-destructive p-0.5 rounded"
            >
              <LogOut size={14} />
            </button>
          </NavLink>
        )}
      </div>
    </aside>
  );
}
