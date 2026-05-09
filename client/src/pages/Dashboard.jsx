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
    <div className="group rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-slate-950/5 dark:border-slate-800 dark:bg-slate-900 sm:p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400 sm:text-sm">{label}</span>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-transform group-hover:scale-110 ${colors[color]}`}>
          <Icon size={16} />
        </div>
      </div>
      <div className="text-xl sm:text-2xl font-black text-slate-950 dark:text-white">{value ?? "—"}</div>
      {sub && <div className="text-xs text-gray-400 mt-1">{sub}</div>}
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
    <div className="px-4 sm:px-5 py-4 border-b border-slate-100 dark:border-slate-800 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
      {/* Top row: dot + name + badge + actions */}
      <div className="flex items-center gap-3">
        <div className={`w-2 h-2 rounded-full shrink-0 ${isActive ? "bg-green-500" : "bg-gray-300 dark:bg-gray-600"}`} />

        {/* Name */}
        <div className="flex-1 min-w-0">
          {editing ? (
            <input
              className="bg-transparent border border-brand-400 dark:border-brand-600 rounded px-2 py-0.5 text-sm text-gray-900 dark:text-white focus:outline-none w-full max-w-[200px]"
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") save(); if (e.key === "Escape") { setName(k.name); setEditing(false); } }}
              autoFocus
            />
          ) : (
            <div className="font-bold text-slate-900 dark:text-white text-sm truncate">{k.name}</div>
          )}
        </div>

        {/* Status badge */}
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${
          isExpired  ? "bg-gray-100 dark:bg-gray-800 text-gray-500"
          : isActive ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                     : "bg-gray-100 dark:bg-gray-800 text-gray-500"
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
            <button onClick={() => setEditing(true)} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors" title="Rename">
              <Edit3 size={14} />
            </button>
          )}
          {isActive && (
            <button
              onClick={() => { if (window.confirm(`Revoke "${k.name}"? This cannot be undone.`)) onRevoke(k.id); }}
              className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              title="Revoke key"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Bottom row: key preview + meta */}
      <div className="mt-2 ml-5 flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg px-2.5 py-1">
          <code className="text-xs text-slate-500 dark:text-slate-400 font-mono">{k.key.slice(0, 18)}…</code>
          <button onClick={copy} className="text-gray-400 hover:text-brand-500 transition-colors" title="Copy full key">
            {copied ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
          </button>
        </div>
        <span className="text-xs text-gray-400">
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
      <div className="relative overflow-hidden rounded-lg border border-slate-200 bg-slate-950 p-6 text-white shadow-2xl shadow-slate-950/10 dark:border-slate-800">
        <div className="absolute inset-0 opacity-30">
          <div className="scan-beam" />
        </div>
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-md border border-white/10 bg-white/[0.06] px-3 py-1.5 text-xs font-black uppercase tracking-[0.18em] text-brand-300">
              <ShieldCheck size={14} />
              Upload protection
            </div>
            <h1 className="text-2xl font-black sm:text-4xl">Moderation control center</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">Create API keys, watch decisions, and keep your app protected across images, GIFs, and videos.</p>
          </div>
          <div className="flex gap-3">
            <a href="/playground" className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/[0.06] px-4 py-2.5 text-sm font-black text-white transition-colors hover:bg-white/[0.1]">
              Test API <ArrowUpRight size={16} />
            </a>
            <button
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white px-4 py-2.5 rounded-lg text-sm font-black transition-colors shadow-lg shadow-brand-600/25 shrink-0"
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
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden shadow-sm">
        <div className="flex items-center justify-between px-4 sm:px-5 py-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="font-black text-slate-900 dark:text-white">API Keys</h2>
            <p className="text-xs text-gray-400 mt-0.5">{activeKeys.length} active {activeKeys.length === 1 ? "key" : "keys"}</p>
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
            <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <Key size={22} className="text-gray-400" />
            </div>
            <p className="font-medium text-gray-700 dark:text-gray-300">No API keys yet</p>
            <p className="text-sm text-gray-400 mt-1 mb-4">Create your first key to start moderating content</p>
            <button
              onClick={() => setShowCreate(true)}
              className="bg-brand-500 hover:bg-brand-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors shadow-sm"
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
          <div className="bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-lg p-6 w-full sm:max-w-md shadow-2xl border border-slate-200 dark:border-slate-800">
            {/* Mobile drag handle */}
            <div className="w-10 h-1 bg-gray-300 dark:bg-gray-700 rounded-full mx-auto mb-5 sm:hidden" />

            <h2 id="create-key-title" className="text-lg font-bold text-gray-900 dark:text-white mb-1">Create API Key</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">Give your key a name to identify where it's used.</p>

            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Key Name <span className="text-red-500">*</span>
            </label>
            <input
              className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-brand-500 mb-4"
              placeholder="e.g. Production, iOS App, Development"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => e.key === "Enter" && newName.trim() && createKey.mutate()}
              autoFocus
            />

            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Expiry Date <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <input
              type="date"
              className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-brand-500 mb-6"
              value={newExpiry}
              onChange={e => setNewExpiry(e.target.value)}
            />

            <div className="flex gap-3">
              <button
                onClick={() => createKey.mutate()}
                disabled={!newName.trim() || createKey.isPending}
                className="flex-1 bg-brand-500 hover:bg-brand-600 disabled:opacity-40 text-white py-2.5 rounded-xl text-sm font-semibold transition-colors"
              >
                {createKey.isPending ? "Creating…" : "Create Key"}
              </button>
              <button
                onClick={() => { setShowCreate(false); setNewName(""); setNewExpiry(""); }}
                className="flex-1 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 py-2.5 rounded-xl text-sm font-semibold transition-colors"
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
