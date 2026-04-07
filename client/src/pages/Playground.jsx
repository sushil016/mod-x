// client/src/pages/Playground.jsx
import { useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "../lib/api.js";
import VerdictBadge from "../components/VerdictBadge.jsx";
import ScoreBar from "../components/ScoreBar.jsx";

export default function Playground() {
  const [file, setFile] = useState(null);
  const [selectedKey, setSelectedKey] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showRaw, setShowRaw] = useState(false);
  const inputRef = useRef();

  const { data: keys = [] } = useQuery({
    queryKey: ["keys"],
    queryFn: () => apiGet("/api/keys"),
    select: (keys) => keys.filter(k => k.is_active),
  });

  async function runModeration() {
    if (!file || !selectedKey) return;
    setLoading(true);
    setError(null);
    setResult(null);

    const form = new FormData();
    form.append("file", file);

    try {
      const res = await fetch("/moderate", {
        method: "POST",
        headers: { Authorization: `Bearer ${selectedKey}` },
        body: form,
      });
      const data = await res.json();
      setResult(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  function onDrop(e) {
    e.preventDefault();
    const f = e.dataTransfer?.files?.[0];
    if (f) setFile(f);
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Playground</h1>
        <p className="text-sm text-gray-500 mt-1">Test the moderation API directly in your browser</p>
      </div>

      <div className="space-y-4 mb-6">
        {/* API Key selector */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">API Key</label>
          <select
            className="w-full border rounded-lg px-3 py-2 text-sm"
            value={selectedKey}
            onChange={e => setSelectedKey(e.target.value)}
          >
            <option value="">Select a key...</option>
            {keys.map(k => (
              <option key={k.id} value={k.key}>{k.name}</option>
            ))}
          </select>
        </div>

        {/* Drop zone */}
        <div
          onDrop={onDrop}
          onDragOver={e => e.preventDefault()}
          onClick={() => inputRef.current?.click()}
          className="border-2 border-dashed border-gray-300 rounded-xl p-10 text-center cursor-pointer hover:border-brand-500 transition"
        >
          {file ? (
            <div>
              <div className="text-2xl mb-1">📎</div>
              <p className="text-sm font-medium text-gray-700">{file.name}</p>
              <p className="text-xs text-gray-400">{(file.size / 1024).toFixed(1)} KB · {file.type}</p>
            </div>
          ) : (
            <div>
              <div className="text-3xl mb-2">☁️</div>
              <p className="text-sm font-medium text-gray-600">Drop a file here or click to browse</p>
              <p className="text-xs text-gray-400 mt-1">JPEG, PNG, WebP, GIF, MP4, WebM, MOV</p>
            </div>
          )}
          <input ref={inputRef} type="file" className="hidden" accept="image/*,video/*" onChange={e => setFile(e.target.files[0])} />
        </div>

        <button
          onClick={runModeration}
          disabled={!file || !selectedKey || loading}
          className="w-full bg-brand-600 text-white py-3 rounded-xl font-medium hover:bg-brand-700 disabled:opacity-40 transition"
        >
          {loading ? "Running moderation..." : "Run Moderation"}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 text-sm">{error}</div>
      )}

      {result && (
        <div className="bg-white border rounded-2xl p-6 space-y-5">
          <div className="flex items-center justify-between">
            <VerdictBadge decision={result.finalDecision} />
            <span className="text-xs text-gray-400 bg-gray-100 px-3 py-1 rounded-full">
              via {result.layer === "google_vision" ? "Google Vision" : "Claude AI"}
            </span>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Content Scores</p>
            <ScoreBar label="Adult"    score={result.googleScores?.adult} />
            <ScoreBar label="Violence" score={result.googleScores?.violence} />
            <ScoreBar label="Racy"     score={result.googleScores?.racy} />
          </div>

          {result.claude && (
            <div className="bg-indigo-50 rounded-xl p-4">
              <p className="text-xs font-semibold text-indigo-700 mb-1">Claude AI Decision</p>
              <p className="text-sm text-indigo-800">{result.claude.reason}</p>
              <p className="text-xs text-indigo-500 mt-1">Confidence: {Math.round((result.claude.confidence || 0) * 100)}%</p>
            </div>
          )}

          <div className="flex gap-4 text-xs text-gray-400">
            <span>Google: {result.performance?.googleMs}ms</span>
            {result.performance?.claudeMs > 0 && <span>Claude: {result.performance.claudeMs}ms</span>}
            <span>Total: {result.performance?.totalMs}ms</span>
          </div>

          <div>
            <button onClick={() => setShowRaw(!showRaw)} className="text-xs text-gray-400 hover:text-gray-600">
              {showRaw ? "Hide" : "Show"} raw JSON
            </button>
            {showRaw && (
              <pre className="mt-2 bg-gray-50 rounded-lg p-4 text-xs overflow-auto max-h-64 text-gray-600">
                {JSON.stringify(result, null, 2)}
              </pre>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
