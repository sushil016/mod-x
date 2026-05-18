import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPatch, apiDelete } from "../lib/api.js";
import { useTheme } from "../context/ThemeContext.jsx";
import {
  User, Mail, Shield, Palette, Trash2, Sun, Moon,
  CheckCircle, AlertTriangle, Crown, Key, BarChart3, ExternalLink
} from "lucide-react";

/* ── Section wrapper ───────────────────────────────────────────────────────── */
function Section({ title, description, children, danger = false }) {
  return (
    <div className={`overflow-hidden rounded-lg border bg-card ${danger
      ? "border-red-200 dark:border-red-900/50"
      : "border-border"}`}
    >
      <div className={`px-6 py-5 border-b ${danger
        ? "border-red-100 dark:border-red-900/50 bg-red-50/50 dark:bg-red-950/20"
        : "border-border"}`}
      >
        <h2 className={`font-bold text-base ${danger ? "text-red-700 dark:text-red-400" : "text-foreground"}`}>
          {title}
        </h2>
        {description && (
          <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
        )}
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

/* ── Input field ───────────────────────────────────────────────────────────── */
function Field({ label, hint, children }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-card-foreground">{label}</label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

/* ── Toast notification ────────────────────────────────────────────────────── */
function Toast({ message, type = "success" }) {
  if (!message) return null;
  return (
    <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl animate-slide-down border text-sm font-medium ${
      type === "success"
        ? "bg-green-50 dark:bg-green-950/80 border-green-200 dark:border-green-800 text-green-700 dark:text-green-300"
        : "bg-red-50 dark:bg-red-950/80 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300"
    }`}>
      {type === "success"
        ? <CheckCircle size={16} className="text-green-500 shrink-0" />
        : <AlertTriangle size={16} className="text-red-500 shrink-0" />}
      {message}
    </div>
  );
}

const TABS = [
  { id: "profile",    label: "Profile",    icon: User },
  { id: "plan",       label: "Plan",       icon: Crown },
  { id: "appearance", label: "Appearance", icon: Palette },
  { id: "security",   label: "Security",   icon: Shield },
  { id: "danger",     label: "Danger zone",icon: Trash2 },
];

export default function Settings() {
  const qc = useQueryClient();
  const { theme, toggleTheme } = useTheme();
  const [activeTab, setActiveTab] = useState("profile");
  const [toast, setToast] = useState(null);

  const { data: user, isLoading } = useQuery({
    queryKey: ["me"],
    queryFn: () => apiGet("/api/me"),
    retry: false,
  });

  const { data: stats } = useQuery({
    queryKey: ["stats"],
    queryFn: () => apiGet("/api/stats"),
  });

  // Profile form state
  const [displayName, setDisplayName] = useState("");
  const nameInitialized = useState(false);

  if (user && !nameInitialized[0]) {
    setDisplayName(user.name || "");
    nameInitialized[1](true);
  }

  function showToast(message, type = "success") {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  }

  const updateProfile = useMutation({
    mutationFn: (body) => apiPatch("/api/me", body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["me"] });
      showToast("Profile updated successfully");
    },
    onError: (err) => showToast(err.message || "Failed to update profile", "error"),
  });

  const [deleteConfirm, setDeleteConfirm] = useState("");
  const deleteAccount = useMutation({
    mutationFn: () => apiDelete("/api/me"),
    onSuccess: () => { window.location.href = "/"; },
    onError: (err) => showToast(err.message || "Failed to delete account", "error"),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-6 h-6 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const avatarUrl = user?.avatar_url
    || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || user?.email || "U")}&background=FF5F1F&color=fff&size=128`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="editorial-banner">
        <div className="app-kicker">Account controls</div>
        <h1 className="app-title">Settings</h1>
        <p className="app-copy">Manage profile, plan, appearance, and security for your moderation workspace.</p>
      </div>

      {/* Tab bar */}
      <div className="flex items-center gap-1 bg-muted/60 rounded-lg p-1 overflow-x-auto">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
              activeTab === id
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-slate-900 dark:hover:text-white"
            } ${id === "danger" && activeTab !== "danger" ? "text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300" : ""}`}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      {/* ── Profile tab ─────────────────────────────────────────────── */}
      {activeTab === "profile" && (
        <div className="space-y-5 animate-fade-in">
          <Section title="Profile" description="Your public-facing identity on ModMe">
            {/* Avatar */}
            <div className="mb-7 flex items-center gap-5 border-b border-border pb-7">
              <div className="relative">
                <img
                  src={avatarUrl}
                  alt="Avatar"
                  className="w-20 h-20 rounded-2xl object-cover ring-2 ring-brand-100 dark:ring-brand-900/40"
                />
                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-400 rounded-full border-2 border-white dark:border-gray-900" title="Connected" />
              </div>
              <div>
                <p className="font-semibold text-foreground">{user?.name || user?.email?.split("@")[0]}</p>
                <p className="text-sm text-muted-foreground mt-0.5">{user?.email}</p>
                <span className={`inline-flex items-center gap-1.5 mt-2 text-xs font-semibold px-2.5 py-1 rounded-full ${
                  user?.plan === "pro"
                    ? "bg-brand-100 dark:bg-brand-950/40 text-brand-700 dark:text-brand-300"
                    : "bg-muted text-muted-foreground"
                }`}>
                  {user?.plan === "pro" && <Crown size={11} />}
                  {user?.plan || "free"} plan
                </span>
              </div>
            </div>

            {/* Form */}
            <div className="space-y-5">
              <Field label="Display Name" hint="How you appear in the dashboard">
                <div className="flex gap-3">
                  <div className="relative flex-1">
                    <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={displayName}
                      onChange={e => setDisplayName(e.target.value)}
                      placeholder="Your name"
                      className="w-full pl-10 pr-4 py-2.5 bg-secondary border border-border dark:border-gray-700 rounded-xl text-sm text-foreground focus:outline-none focus:border-brand-500 dark:focus:border-brand-500 transition-colors"
                    />
                  </div>
                  <button
                    onClick={() => updateProfile.mutate({ name: displayName.trim() })}
                    disabled={!displayName.trim() || displayName === user?.name || updateProfile.isPending}
                    className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 disabled:opacity-40 text-white rounded-xl text-sm font-medium transition-colors"
                  >
                    {updateProfile.isPending ? "Saving…" : "Save"}
                  </button>
                </div>
              </Field>

              <Field label="Email Address" hint="Managed by your Google account — cannot be changed here">
                <div className="relative">
                  <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="email"
                    value={user?.email || ""}
                    readOnly
                    className="w-full pl-10 pr-4 py-2.5 bg-muted/50 border border-border dark:border-gray-700 rounded-xl text-sm text-gray-500 dark:text-gray-500 cursor-not-allowed"
                  />
                </div>
              </Field>

              <Field label="Joined">
                <div className="text-sm text-muted-foreground py-2.5">
                  {user?.created_at ? new Date(user.created_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : "—"}
                </div>
              </Field>
            </div>
          </Section>

          {/* Quick stats */}
          <Section title="Your activity" description="Overview of your moderation usage">
            <div className="grid grid-cols-3 gap-4">
              {[
                { icon: BarChart3, label: "Total Requests", value: stats?.summary?.total_requests?.toLocaleString() ?? "0", color: "text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-950/40" },
                { icon: Key,       label: "API Keys",       value: stats?.activeKeys ?? "0",                                 color: "text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/40" },
                { icon: Shield,    label: "Blocked",        value: stats?.summary?.total_blocked?.toLocaleString() ?? "0",   color: "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40" },
              ].map(({ icon: Icon, label, value, color }) => (
                <div key={label} className="text-center p-4 bg-secondary rounded-xl">
                  <div className={`w-9 h-9 rounded-xl ${color} flex items-center justify-center mx-auto mb-2`}>
                    <Icon size={16} />
                  </div>
                  <div className="text-xl font-black text-foreground">{value}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{label}</div>
                </div>
              ))}
            </div>
          </Section>
        </div>
      )}

      {/* ── Plan tab ─────────────────────────────────────────────────── */}
      {activeTab === "plan" && (
        <div className="space-y-5 animate-fade-in">
          <Section title="Current Plan" description="Manage your subscription and usage limits">
            <div className={`rounded-2xl p-6 border-2 mb-6 ${
              user?.plan === "pro"
                ? "border-brand-400 dark:border-brand-500/60 bg-brand-50 dark:bg-brand-950/20"
                : "border-border dark:border-gray-700 bg-secondary/40"
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    {user?.plan === "pro" && <Crown size={16} className="text-brand-600 dark:text-brand-400" />}
                    <span className="font-black text-lg text-foreground capitalize">{user?.plan || "free"}</span>
                    <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-0.5 rounded-full font-medium">Active</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {user?.plan === "pro" ? "1,000 requests / hour · Priority support · 99.9% SLA" : "100 requests / hour · Community support"}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-black text-foreground">{user?.plan === "pro" ? "$29" : "$0"}</div>
                  <div className="text-xs text-gray-400">{user?.plan === "pro" ? "/ month" : "forever"}</div>
                </div>
              </div>
            </div>

            {user?.plan !== "pro" ? (
              <div className="space-y-4">
                <p className="text-sm font-medium text-card-foreground">Upgrade to Pro and get:</p>
                <ul className="space-y-2.5">
                  {["10× higher rate limit (1,000 req/hour)", "Priority email support", "99.9% SLA", "Custom webhook callbacks", "Early access to new features"].map(f => (
                    <li key={f} className="flex items-center gap-2.5 text-sm text-muted-foreground">
                      <CheckCircle size={15} className="text-green-500 shrink-0" /> {f}
                    </li>
                  ))}
                </ul>
                <a
                  href="/checkout?plan=scale"
                  className="inline-flex items-center gap-2 mt-2 bg-brand-600 hover:bg-brand-700 text-white px-6 py-3 rounded-lg text-sm font-black transition-colors shadow-lg shadow-brand-600/25"
                >
                  <Crown size={15} /> Upgrade to Pro — $29/month
                </a>
              </div>
            ) : (
              <div className="flex items-center gap-3 p-4 bg-secondary rounded-xl">
                <CheckCircle size={16} className="text-green-500 shrink-0" />
                <p className="text-sm text-card-foreground">You're on the Pro plan. Thank you for your support!</p>
              </div>
            )}
          </Section>

          <Section title="Usage this month">
            <div className="space-y-4">
              {[
                { label: "API Requests", used: stats?.summary?.total_requests || 0, limit: user?.plan === "pro" ? 720000 : 72000 },
              ].map(({ label, used, limit }) => {
                const pct = Math.min(Math.round((used / limit) * 100), 100);
                return (
                  <div key={label}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-card-foreground">{label}</span>
                      <span className="text-sm text-muted-foreground">{used.toLocaleString()} / {limit.toLocaleString()}</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-2 rounded-full transition-all duration-700 ${pct >= 90 ? "bg-red-500" : pct >= 70 ? "bg-yellow-500" : "bg-brand-500"}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-400 mt-1.5">{pct}% of monthly limit used · resets on the 1st</p>
                  </div>
                );
              })}
            </div>
          </Section>
        </div>
      )}

      {/* ── Appearance tab ───────────────────────────────────────────── */}
      {activeTab === "appearance" && (
        <div className="space-y-5 animate-fade-in">
          <Section title="Theme" description="Choose how ModMe looks for you">
            <div className="grid grid-cols-2 gap-4">
              {[
                { value: "light", label: "Light", icon: Sun, preview: "bg-card border-border", text: "text-foreground", sub: "text-muted-foreground" },
                { value: "dark",  label: "Dark",  icon: Moon, preview: "bg-gray-900 border-gray-700", text: "text-white", sub: "text-gray-500" },
              ].map(({ value, label, icon: Icon, preview, text, sub }) => (
                <button
                  key={value}
                  onClick={() => { if (theme !== value) toggleTheme(); }}
                  className={`relative text-left rounded-2xl border-2 p-4 transition-all ${theme === value
                    ? "border-brand-500 dark:border-brand-400 ring-2 ring-brand-500/20"
                    : "border-border dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"}`}
                >
                  {/* Mini preview */}
                  <div className={`${preview} border rounded-xl p-3 mb-3 h-20 relative overflow-hidden`}>
                    <div className={`${text} text-xs font-bold mb-1.5`}>Dashboard</div>
                    <div className="space-y-1">
                      <div className={`${sub} text-[10px] bg-muted rounded px-1.5 py-0.5 w-16`}>&nbsp;</div>
                      <div className={`${sub} text-[10px] bg-muted rounded px-1.5 py-0.5 w-12`}>&nbsp;</div>
                    </div>
                    <div className="absolute bottom-2 right-2 w-8 h-4 bg-brand-500 rounded-md opacity-70" />
                  </div>
                  <div className="flex items-center gap-2">
                    <Icon size={14} className={theme === value ? "text-brand-600 dark:text-brand-400" : "text-gray-400"} />
                    <span className={`text-sm font-semibold ${theme === value ? "text-brand-600 dark:text-brand-400" : "text-card-foreground"}`}>
                      {label}
                    </span>
                  </div>
                  {theme === value && (
                    <div className="absolute top-3 right-3 w-5 h-5 bg-brand-500 rounded-full flex items-center justify-center">
                      <CheckCircle size={12} className="text-white" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </Section>
        </div>
      )}

      {/* ── Security tab ─────────────────────────────────────────────── */}
      {activeTab === "security" && (
        <div className="space-y-5 animate-fade-in">
          <Section title="Authentication" description="How you sign in to ModMe">
            <div className="flex items-center gap-4 p-4 bg-secondary rounded-xl">
              <div className="w-10 h-10 rounded-xl bg-card dark:bg-gray-700 border border-border dark:border-gray-600 flex items-center justify-center shadow-sm">
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-foreground">Google OAuth</p>
                <p className="text-xs text-muted-foreground mt-0.5">{user?.email}</p>
              </div>
              <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2.5 py-1 rounded-full font-medium">Connected</span>
            </div>
          </Section>

          <Section title="API Keys" description="Revoke keys you no longer need">
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Your API keys are managed on the{" "}
                <a href="/dashboard" className="text-brand-600 dark:text-brand-400 hover:underline font-medium inline-flex items-center gap-1">
                  Dashboard <ExternalLink size={11} />
                </a>. You can create, rename, and revoke keys there.
              </p>
              <div className="flex items-center gap-3 p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 rounded-xl">
                <AlertTriangle size={15} className="text-amber-500 shrink-0" />
                <p className="text-xs text-amber-700 dark:text-amber-400">
                  If a key is compromised, revoke it immediately from the Dashboard. Revocation is instant.
                </p>
              </div>
              <a
                href="/dashboard"
                className="inline-flex items-center gap-2 text-sm text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 font-medium transition-colors"
              >
                <Key size={14} /> Manage API Keys
              </a>
            </div>
          </Section>

          <Section title="Session">
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                You are signed in via Google OAuth. Your session is secured with HTTP-only cookies.
              </p>
              <button
                onClick={async () => {
                  try { await fetch("/auth/logout", { method: "POST", credentials: "include" }); } catch (_) {}
                  window.location.href = "/";
                }}
                className="flex items-center gap-2 text-sm text-red-500 hover:text-red-600 dark:hover:text-red-400 font-medium transition-colors"
              >
                Sign out of all sessions
              </button>
            </div>
          </Section>
        </div>
      )}

      {/* ── Danger zone tab ───────────────────────────────────────────── */}
      {activeTab === "danger" && (
        <div className="space-y-5 animate-fade-in">
          <Section title="Danger Zone" description="Irreversible and destructive actions" danger>
            <div className="space-y-6">
              {/* Warning banner */}
              <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 rounded-xl">
                <AlertTriangle size={16} className="text-red-500 shrink-0 mt-0.5" />
                <div className="text-sm text-red-700 dark:text-red-400">
                  <p className="font-semibold mb-1">These actions are permanent.</p>
                  <p>Deleting your account will immediately revoke all API keys, erase all usage history, and remove your data from our systems. This cannot be undone.</p>
                </div>
              </div>

              {/* Delete account form */}
              <div className="space-y-3">
                <p className="text-sm font-medium text-card-foreground">
                  Type <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono text-red-600 dark:text-red-400">delete my account</code> to confirm:
                </p>
                <input
                  type="text"
                  value={deleteConfirm}
                  onChange={e => setDeleteConfirm(e.target.value)}
                  placeholder="delete my account"
                  className="w-full bg-secondary border border-red-200 dark:border-red-900/50 rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-red-500 dark:focus:border-red-500 transition-colors"
                />
                <button
                  onClick={() => { if (deleteConfirm === "delete my account") deleteAccount.mutate(); }}
                  disabled={deleteConfirm !== "delete my account" || deleteAccount.isPending}
                  className="flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl text-sm font-bold transition-colors"
                >
                  <Trash2 size={14} />
                  {deleteAccount.isPending ? "Deleting…" : "Delete my account permanently"}
                </button>
              </div>
            </div>
          </Section>
        </div>
      )}

      {/* Toast */}
      <Toast message={toast?.message} type={toast?.type} />
    </div>
  );
}
