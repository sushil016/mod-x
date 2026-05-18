import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost, apiPatch, apiDelete } from "../lib/api.js";
import { Key, Plus, ShieldX, CheckCircle, Activity, Copy, Trash2, Edit3, Check, ShieldCheck, ArrowUpRight } from "lucide-react";

function StatCard({ label, value, icon: Icon, color = "brand", sub }) {
  const colors = {
    brand:  "bg-brand-50 dark:bg-brand-950/30 text-brand-500 dark:text-brand-400",
    green:  "bg-green-50 dark:bg-green-950/30 text-green-600 dark:text-green-400",
    red:    "bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400",
    yellow: "bg-yellow-50 dark:bg-yellow-950/30 text-yellow-600 dark:text-yellow-400",
  };
  return (
    <div className="group app-panel p-4 transition-transform hover:-translate-y-0.5 sm:p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-bold uppercase tracking-wide text-muted-foreground sm:text-sm">{label}</span>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-transform group-hover:scale-110 ${colors[color]}`}>
          <Icon size={16} />
        </div>
      </div>
      <div className="font-display text-xl text-foreground sm:text-2xl">{value ?? "—"}</div>
      {sub && <div className="mt-1 text-xs text-muted-foreground">{sub}</div>}
    </div>
  );
}

function KeyRow({ k, onRevoke, onRename }) {
  const [copied, setCopied] = useState(false);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(k.name);
  const isExpired = k.expires_at && new Date(k.expires_at) < new Date();
  const isActive = k.is_active && !isExpired;

  function copy() {
    navigator.clipboard.writeText(k.key).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function save() {
    if (name.trim() && name !== k.name) onRename(k.id, name.trim());
    setName(k.name);
    setEditing(false);
  }

  return (
    <div className="border-b border-border px-4 py-4 transition-colors last:border-0 hover:bg-secondary sm:px-5">
      {/* Top row: dot + name + badge + actions */}
      <div className="flex items-center gap-3">
        <div className={`w-2 h-2 rounded-full shrink-0 ${isActive ? "bg-green-500" : "bg-gray-300 dark:bg-gray-600"}`} />

        {/* Name */}
        <div className="flex-1 min-w-0">
          {editing ? (
            <input
              className="bg-transparent border border-brand-400 dark:border-brand-600 rounded px-2 py-0.5 text-sm text-foreground focus:outline-none w-full max-w-[200px]"
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") save(); if (e.key === "Escape") { setName(k.name); setEditing(false); } }}
              autoFocus
            />
          ) : (
            <div className="truncate text-sm font-medium text-foreground">{k.name}</div>
          )}
        </div>

        {/* Status badge */}
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${
          isExpired  ? "bg-muted text-gray-500"
          : isActive ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                     : "bg-muted text-gray-500"
        }`}>
          {isExpired ? "Expired" : isActive ? "Active" : "Revoked"}
        </span>

        {/* Actions */}
        <div className="flex items-center gap-1 shrink-0">
          {editing ? (
            <button onClick={save} className="p-1.5 rounded-lg text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors">
              <Check size={14} />
            </button>
          ) : (
            <button onClick={() => setEditing(true)} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors" title="Rename">
              <Edit3 size={14} />
            </button>
          )}
          {isActive && (
            <button
              onClick={() => { if (window.confirm(`Revoke "${k.name}"? This cannot be undone.`)) onRevoke(k.id); }}
              className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20"
              title="Revoke key"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Bottom row: key preview + meta */}
      <div className="mt-2 ml-5 flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-1.5 bg-muted rounded-lg px-2.5 py-1">
          <code className="text-xs text-muted-foreground font-mono">{k.key.slice(0, 18)}…</code>
          <button onClick={copy} className="text-muted-foreground transition-colors hover:text-foreground" title="Copy full key">
            {copied ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
          </button>
        </div>
        <span className="text-xs text-muted-foreground">
          Created {new Date(k.created_at).toLocaleDateString()}
          {k.last_used_at && <span className="ml-1.5">· Used {new Date(k.last_used_at).toLocaleDateString()}</span>}
        </span>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const qc = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newExpiry, setNewExpiry] = useState("");

  const { data: keys = [], isLoading: keysLoading } = useQuery({
    queryKey: ["keys"],
    queryFn: () => apiGet("/api/keys"),
  });

  const { data: stats } = useQuery({
    queryKey: ["stats"],
    queryFn: () => apiGet("/api/stats"),
  });

  const createKey = useMutation({
    mutationFn: () => apiPost("/api/keys", { name: newName.trim(), expiresAt: newExpiry || undefined }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["keys"] });
      setShowCreate(false);
      setNewName("");
      setNewExpiry("");
    },
  });

  const revokeKey = useMutation({
    mutationFn: (id) => apiDelete(`/api/keys/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["keys"] }),
  });

  const renameKey = useMutation({
    mutationFn: ({ id, name }) => apiPatch(`/api/keys/${id}`, { name }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["keys"] }),
  });

  const summary = stats?.summary;
  const activeKeys = keys.filter(k => k.is_active && !(k.expires_at && new Date(k.expires_at) < new Date()));
  const allowedPct = summary?.total_requests
    ? Math.round(((summary.total_requests - (summary.total_blocked || 0) - (summary.total_flagged || 0)) / summary.total_requests) * 100)
    : null;

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="editorial-banner">
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="app-kicker inline-flex items-center gap-2">
              <ShieldCheck size={14} />
              Upload protection
            </div>
            <h1 className="app-title">Moderation control center</h1>
            <p className="app-copy max-w-2xl">Create API keys, watch decisions, and keep your app protected across images, GIFs, and videos.</p>
          </div>
          <div className="flex gap-3">
            <a href="/playground" className="soft-button gap-2">
              Test API <ArrowUpRight size={16} />
            </a>
            <button
              onClick={() => setShowCreate(true)}
              className="solid-button shrink-0 gap-2"
            >
              <Plus size={16} />
              New Key
            </button>
          </div>
        </div>
      </div>

      {/* Stats cards — 2 cols on mobile, 4 on lg */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard label="Total Requests" value={summary?.total_requests?.toLocaleString()} icon={Activity}    color="brand" sub="last 30 days" />
        <StatCard label="Active Keys"    value={activeKeys.length}                         icon={Key}         color="green" />
        <StatCard label="Blocked"        value={summary?.total_blocked?.toLocaleString()}  icon={ShieldX}     color="red"   sub="last 30 days" />
        <StatCard label="Pass Rate"      value={allowedPct != null ? `${allowedPct}%` : null} icon={CheckCircle} color="green" sub="allowed content" />
      </div>

      {/* API Keys */}
      <div className="app-panel overflow-hidden">
        <div className="app-panel-header flex items-center justify-between">
          <div>
            <h2 className="font-display text-xl text-foreground">API Keys</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">{activeKeys.length} active {activeKeys.length === 1 ? "key" : "keys"}</p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-1.5 text-sm text-brand-500 dark:text-brand-400 hover:text-brand-600 dark:hover:text-brand-300 font-semibold transition-colors"
          >
            <Plus size={15} /> New key
          </button>
        </div>

        {keysLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-5 h-5 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : keys.length === 0 ? (
          <div className="text-center py-12 sm:py-16 px-4">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-muted">
              <Key size={22} className="text-muted-foreground" />
            </div>
            <p className="font-medium text-card-foreground">No API keys yet</p>
            <p className="mb-4 mt-1 text-sm text-muted-foreground">Create your first key to start moderating content</p>
            <button
              onClick={() => setShowCreate(true)}
              className="solid-button px-5"
            >
              Create first key
            </button>
          </div>
        ) : (
          keys.map(k => (
            <KeyRow
              key={k.id}
              k={k}
              onRevoke={(id) => revokeKey.mutate(id)}
              onRename={(id, name) => renameKey.mutate({ id, name })}
            />
          ))
        )}
      </div>

      {/* Create key modal */}
      {showCreate && (
        <div
          className="fixed inset-0 bg-black/60 dark:bg-black/70 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4"
          role="dialog" aria-modal="true" aria-labelledby="create-key-title"
          onClick={(e) => { if (e.target === e.currentTarget) { setShowCreate(false); setNewName(""); setNewExpiry(""); } }}
        >
          <div className="w-full rounded-t-3xl border border-border bg-card p-6 shadow-2xl sm:max-w-md sm:rounded-lg">
            {/* Mobile drag handle */}
            <div className="mx-auto mb-5 h-1 w-10 rounded-full bg-border sm:hidden" />

            <h2 id="create-key-title" className="mb-1 font-display text-2xl text-foreground">Create API Key</h2>
            <p className="text-sm text-muted-foreground mb-5">Give your key a name to identify where it's used.</p>

            <label className="block text-sm font-medium text-card-foreground mb-1.5">
              Key Name <span className="text-red-500">*</span>
            </label>
            <input
              className="field-control mb-4"
              placeholder="e.g. Production, iOS App, Development"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => e.key === "Enter" && newName.trim() && createKey.mutate()}
              autoFocus
            />

            <label className="block text-sm font-medium text-card-foreground mb-1.5">
              Expiry Date <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <input
              type="date"
              className="field-control mb-6"
              value={newExpiry}
              onChange={e => setNewExpiry(e.target.value)}
            />

            <div className="flex gap-3">
              <button
                onClick={() => createKey.mutate()}
                disabled={!newName.trim() || createKey.isPending}
                className="solid-button flex-1 disabled:opacity-40"
              >
                {createKey.isPending ? "Creating…" : "Create Key"}
              </button>
              <button
                onClick={() => { setShowCreate(false); setNewName(""); setNewExpiry(""); }}
                className="soft-button flex-1"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
