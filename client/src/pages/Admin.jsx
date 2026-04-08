import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPatch, apiDelete } from "../lib/api.js";

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

  const th = "px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider";
  const td = "px-4 py-3 text-sm text-gray-700 dark:text-gray-300";

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-black text-gray-900 dark:text-white">Admin</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Platform management</p>
      </div>

      {stats && (
        <div className="grid grid-cols-3 gap-4">
          {[["Total Users", stats.total_users], ["Active Keys", stats.total_active_keys], ["Total Requests", stats.total_requests]].map(([label, val]) => (
            <div key={label} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
              <p className="text-3xl font-black text-gray-900 dark:text-white mt-1">{val?.toLocaleString() ?? "—"}</p>
            </div>
          ))}
        </div>
      )}

      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800">
          <h2 className="font-bold text-gray-900 dark:text-white">Users</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800">
              <tr>{["Email", "Plan", "Keys", "Calls", "Joined", "Admin"].map(h => <th key={h} className={th}>{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {users.map(u => (
                <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <td className={td}>{u.email}</td>
                  <td className={td}>
                    <select
                      value={u.plan}
                      onChange={e => updateUser.mutate({ id: u.id, plan: e.target.value })}
                      className="bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1 text-xs text-gray-700 dark:text-gray-300"
                    >
                      <option value="free">free</option>
                      <option value="pro">pro</option>
                    </select>
                  </td>
                  <td className={td}>{u.key_count}</td>
                  <td className={td}>{u.total_calls}</td>
                  <td className={`${td} text-gray-400`}>{new Date(u.created_at).toLocaleDateString()}</td>
                  <td className={td}>
                    <input
                      type="checkbox"
                      checked={u.is_admin}
                      onChange={e => updateUser.mutate({ id: u.id, isAdmin: e.target.checked })}
                      className="accent-brand-600"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800">
          <h2 className="font-bold text-gray-900 dark:text-white">All API Keys</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800">
              <tr>{["Name", "Owner", "Calls", "Last Used", "Status", ""].map(h => <th key={h} className={th}>{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {keys.map(k => (
                <tr key={k.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <td className={`${td} font-medium text-gray-900 dark:text-white`}>{k.name}</td>
                  <td className={td}>{k.owner_email}</td>
                  <td className={td}>{k.call_count}</td>
                  <td className={`${td} text-gray-400`}>{k.last_used_at ? new Date(k.last_used_at).toLocaleDateString() : "Never"}</td>
                  <td className={td}>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${k.is_active ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400" : "bg-gray-100 dark:bg-gray-800 text-gray-500"}`}>
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
