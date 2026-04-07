// client/src/pages/Admin.jsx
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPatch, apiDelete } from "../lib/api.js";

export default function Admin() {
  const qc = useQueryClient();

  const { data: stats }  = useQuery({ queryKey: ["admin-stats"], queryFn: () => apiGet("/api/admin/stats") });
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

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Admin Panel</h1>
        <p className="text-sm text-gray-500 mt-1">Platform management</p>
      </div>

      {/* Platform Stats */}
      {stats && (
        <div className="grid grid-cols-3 gap-4">
          {[["Total Users", stats.total_users], ["Active Keys", stats.total_active_keys], ["Total Requests", stats.total_requests]].map(([label, val]) => (
            <div key={label} className="bg-white border rounded-xl p-4 text-center">
              <p className="text-sm text-gray-500">{label}</p>
              <p className="text-2xl font-bold text-gray-900">{val?.toLocaleString()}</p>
            </div>
          ))}
        </div>
      )}

      {/* Users Table */}
      <div className="bg-white border rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b">
          <h2 className="font-semibold text-gray-800">Users</h2>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              {["Email", "Plan", "Keys", "Calls", "Joined", "Admin", "Actions"].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {users.map(u => (
              <tr key={u.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-gray-800">{u.email}</td>
                <td className="px-4 py-3">
                  <select
                    value={u.plan}
                    onChange={e => updateUser.mutate({ id: u.id, plan: e.target.value })}
                    className="border rounded px-2 py-1 text-xs"
                  >
                    <option value="free">Free</option>
                    <option value="pro">Pro</option>
                  </select>
                </td>
                <td className="px-4 py-3 text-gray-500">{u.key_count}</td>
                <td className="px-4 py-3 text-gray-500">{u.total_calls}</td>
                <td className="px-4 py-3 text-gray-400">{new Date(u.created_at).toLocaleDateString()}</td>
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={u.is_admin}
                    onChange={e => updateUser.mutate({ id: u.id, isAdmin: e.target.checked })}
                  />
                </td>
                <td className="px-4 py-3 text-gray-400 text-xs">{u.id.slice(0, 8)}...</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Keys Table */}
      <div className="bg-white border rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b">
          <h2 className="font-semibold text-gray-800">All API Keys</h2>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              {["Name", "Owner", "Calls", "Last Used", "Status", ""].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {keys.map(k => (
              <tr key={k.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-800">{k.name}</td>
                <td className="px-4 py-3 text-gray-500">{k.owner_email}</td>
                <td className="px-4 py-3 text-gray-500">{k.call_count}</td>
                <td className="px-4 py-3 text-gray-400">{k.last_used_at ? new Date(k.last_used_at).toLocaleDateString() : "Never"}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${k.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                    {k.is_active ? "Active" : "Revoked"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {k.is_active && (
                    <button onClick={() => revokeKey.mutate(k.id)} className="text-xs text-red-500 hover:text-red-700">Revoke</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
