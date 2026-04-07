// client/src/pages/Dashboard.jsx
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost } from "../lib/api.js";
import KeyCard from "../components/KeyCard.jsx";

export default function Dashboard() {
  const qc = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [newName, setNewName] = useState("");
  const [newExpiry, setNewExpiry] = useState("");

  const { data: keys = [], isLoading } = useQuery({
    queryKey: ["keys"],
    queryFn: () => apiGet("/api/keys"),
  });

  const createKey = useMutation({
    mutationFn: () => apiPost("/api/keys", { name: newName, expiresAt: newExpiry || undefined }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["keys"] });
      setShowModal(false);
      setNewName("");
      setNewExpiry("");
    },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">API Keys</h1>
          <p className="text-sm text-gray-500 mt-1">Manage keys for your applications</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-700"
        >
          + New Key
        </button>
      </div>

      {isLoading ? (
        <p className="text-gray-400 text-sm">Loading...</p>
      ) : keys.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <div className="text-4xl mb-3">🔑</div>
          <p className="font-medium">No API keys yet</p>
          <p className="text-sm mt-1">Create your first key to get started</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {keys.map(k => <KeyCard key={k.id} k={k} />)}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <h2 className="text-lg font-bold mb-4">Create New API Key</h2>
            <label className="block text-sm text-gray-600 mb-1">Key Name *</label>
            <input
              className="w-full border rounded-lg px-3 py-2 text-sm mb-4"
              placeholder="e.g. Production, Development"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              autoFocus
            />
            <label className="block text-sm text-gray-600 mb-1">Expiry Date (optional)</label>
            <input
              type="date"
              className="w-full border rounded-lg px-3 py-2 text-sm mb-6"
              value={newExpiry}
              onChange={e => setNewExpiry(e.target.value)}
            />
            <div className="flex gap-3">
              <button
                onClick={() => createKey.mutate()}
                disabled={!newName.trim() || createKey.isPending}
                className="flex-1 bg-brand-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-brand-700 disabled:opacity-50"
              >
                {createKey.isPending ? "Creating..." : "Create Key"}
              </button>
              <button onClick={() => setShowModal(false)} className="flex-1 border py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
