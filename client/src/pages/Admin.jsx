import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPatch, apiDelete } from "../lib/api.js";
import { ShieldCheck } from "lucide-react";

export default function Admin() {
  const qc = useQueryClient();
  const { data: stats }      = useQuery({ queryKey: ["admin-stats"], queryFn: () => apiGet("/api/admin/stats") });
  const { data: users = [] } = useQuery({ queryKey: ["admin-users"], queryFn: () => apiGet("/api/admin/users") });
  const { data: keys  = [] } = useQuery({ queryKey: ["admin-keys"],  queryFn: () => apiGet("/api/admin/keys") });

  const updateUser = useMutation({
    mutationFn: ({ id, ...body }) => apiPatch(`/api/admin/users/${id}`, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-users"] }),
  });

  const revokeKey = useMutation({
    mutationFn: (id) => apiDelete(`/api/admin/keys/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-keys"] }),
  });

  const th = "px-4 py-3 text-left text-xs font-black text-muted-foreground uppercase tracking-wider";
  const td = "px-4 py-3 text-sm text-card-foreground";

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="editorial-banner">
        <div className="app-kicker inline-flex items-center gap-2">
          <ShieldCheck size={14} />
          Admin layer
        </div>
        <h1 className="app-title">Platform management</h1>
        <p className="app-copy">Manage users, plans, API keys, and moderation capacity.</p>
      </div>

      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          {[["Total Users", stats.total_users], ["Active Keys", stats.total_active_keys], ["Total Requests", stats.total_requests]].map(([label, val]) => (
            <div key={label} className="app-panel p-5 text-center">
              <p className="text-sm text-muted-foreground">{label}</p>
              <p className="mt-1 font-display text-3xl text-foreground">{val?.toLocaleString() ?? "—"}</p>
            </div>
          ))}
        </div>
      )}

      <div className="app-panel overflow-hidden">
        <div className="app-panel-header">
          <h2 className="font-display text-xl text-foreground">Users</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-secondary">
              <tr>{["Email", "Plan", "Keys", "Calls", "Joined", "Admin"].map(h => <th key={h} className={th}>{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-border">
              {users.map(u => (
                <tr key={u.id} className="hover:bg-accent transition-colors">
                  <td className={td}>{u.email}</td>
                  <td className={td}>
                    <select
                      value={u.plan}
                      onChange={e => updateUser.mutate({ id: u.id, plan: e.target.value })}
                      className="bg-muted border border-border dark:border-gray-700 rounded-lg px-2 py-1 text-xs text-card-foreground"
                    >
                      <option value="free">free</option>
                      <option value="pro">pro</option>
                    </select>
                  </td>
                  <td className={td}>{u.key_count}</td>
                  <td className={td}>{u.total_calls}</td>
                  <td className={`${td} text-muted-foreground`}>{new Date(u.created_at).toLocaleDateString()}</td>
                  <td className={td}>
                    <input
                      type="checkbox"
                      checked={u.is_admin}
                      onChange={e => updateUser.mutate({ id: u.id, isAdmin: e.target.checked })}
                      className="accent-brand-500"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="app-panel overflow-hidden">
        <div className="app-panel-header">
          <h2 className="font-display text-xl text-foreground">All API Keys</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-secondary">
              <tr>{["Name", "Owner", "Calls", "Last Used", "Status", ""].map(h => <th key={h} className={th}>{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-border">
              {keys.map(k => (
                <tr key={k.id} className="hover:bg-accent transition-colors">
                  <td className={`${td} font-medium text-foreground`}>{k.name}</td>
                  <td className={td}>{k.owner_email}</td>
                  <td className={td}>{k.call_count}</td>
                  <td className={`${td} text-muted-foreground`}>{k.last_used_at ? new Date(k.last_used_at).toLocaleDateString() : "Never"}</td>
                  <td className={td}>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${k.is_active ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400" : "bg-muted text-gray-500"}`}>
                      {k.is_active ? "Active" : "Revoked"}
                    </span>
                  </td>
                  <td className={td}>
                    {k.is_active && (
                      <button onClick={() => revokeKey.mutate(k.id)} className="text-xs text-red-500 hover:text-red-700 dark:hover:text-red-400 transition-colors">
                        Revoke
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
