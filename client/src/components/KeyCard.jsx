// client/src/components/KeyCard.jsx
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiPatch, apiDelete } from "../lib/api.js";

export default function KeyCard({ k }) {
  const qc = useQueryClient();
  const [copied, setCopied] = useState(false);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(k.name);

  const revoke = useMutation({
    mutationFn: () => apiDelete(`/api/keys/${k.id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["keys"] }),
  });

  const rename = useMutation({
    mutationFn: () => apiPatch(`/api/keys/${k.id}`, { name }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["keys"] }); setEditing(false); },
  });

  function copy() {
    navigator.clipboard.writeText(k.key);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const isExpired = k.expires_at && new Date(k.expires_at) < new Date();

  return (
    <div className={`border rounded-xl p-5 flex flex-col gap-3 ${isExpired ? "opacity-50" : "bg-white"}`}>
      <div className="flex items-center justify-between">
        {editing ? (
          <input
            className="border rounded px-2 py-1 text-sm flex-1 mr-2"
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === "Enter" && rename.mutate()}
            autoFocus
          />
        ) : (
          <span className="font-semibold text-gray-800">{k.name}</span>
        )}
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${k.is_active && !isExpired ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
          {isExpired ? "Expired" : k.is_active ? "Active" : "Revoked"}
        </span>
      </div>

      <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2">
        <code className="text-xs text-gray-600 flex-1 truncate">{k.key}</code>
        <button onClick={copy} className="text-xs text-brand-600 hover:text-brand-700 font-medium shrink-0">
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>

      <div className="flex items-center justify-between text-xs text-gray-400">
        <span>Created {new Date(k.created_at).toLocaleDateString()}</span>
        {k.last_used_at && <span>Last used {new Date(k.last_used_at).toLocaleDateString()}</span>}
        {k.expires_at && <span>Expires {new Date(k.expires_at).toLocaleDateString()}</span>}
      </div>

      <div className="flex gap-2 pt-1">
        {editing ? (
          <>
            <button onClick={() => rename.mutate()} className="text-xs bg-brand-600 text-white px-3 py-1.5 rounded-lg hover:bg-brand-700">Save</button>
            <button onClick={() => setEditing(false)} className="text-xs text-gray-500 px-3 py-1.5 rounded-lg hover:bg-gray-100">Cancel</button>
          </>
        ) : (
          <>
            <button onClick={() => setEditing(true)} className="text-xs text-gray-500 px-3 py-1.5 rounded-lg hover:bg-gray-100">Rename</button>
            <button onClick={() => revoke.mutate()} className="text-xs text-red-500 px-3 py-1.5 rounded-lg hover:bg-red-50">Revoke</button>
          </>
        )}
      </div>
    </div>
  );
}
