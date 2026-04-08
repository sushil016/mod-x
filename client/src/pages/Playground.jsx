import { useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "../lib/api.js";
import VerdictBadge from "../components/VerdictBadge.jsx";
import ScoreBar from "../components/ScoreBar.jsx";
import { Upload, ChevronDown } from "lucide-react";

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
    select: k => k.filter(k => k.is_active),
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
      setResult(await res.json());
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
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-black text-gray-900 dark:text-white">Playground</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Test the moderation API live in your browser</p>
      </div>

      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 space-y-5">
        {/* API Key selector */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">API Key</label>
          <div className="relative">
            <select
              className="w-full appearance-none bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-brand-500 pr-9"
              value={selectedKey}
              onChange={e => setSelectedKey(e.target.value)}
            >
              <option value="">Select an API key…</option>
              {keys.map(k => <option key={k.id} value={k.key}>{k.name}</option>)}
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
          {keys.length === 0 && (
            <p className="text-xs text-gray-400 mt-1.5">No active keys — <a href="/dashboard" className="text-brand-600 dark:text-brand-400 hover:underline">create one in Dashboard</a></p>
          )}
        </div>

        {/* Drop zone */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">File</label>
          <div
            onDrop={onDrop}
            onDragOver={e => e.preventDefault()}
            onClick={() => inputRef.current?.click()}
            className="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl p-10 text-center cursor-pointer hover:border-brand-400 dark:hover:border-brand-600 transition-colors group"
          >
            {file ? (
              <div>
                <div className="text-3xl mb-2">📎</div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{file.name}</p>
                <p className="text-xs text-gray-400 mt-1">{(file.size / 1024).toFixed(1)} KB · {file.type}</p>
                <button
                  onClick={e => { e.stopPropagation(); setFile(null); setResult(null); }}
                  className="text-xs text-gray-400 hover:text-red-500 mt-2 transition-colors"
                >
                  Remove
                </button>
              </div>
            ) : (
              <div>
                <Upload size={28} className="mx-auto mb-3 text-gray-300 dark:text-gray-600 group-hover:text-brand-400 transition-colors" />
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Drop a file here or click to browse</p>
                <p className="text-xs text-gray-400 mt-1">JPEG, PNG, WebP, GIF, MP4, WebM, MOV</p>
              </div>
            )}
            <input ref={inputRef} type="file" className="hidden" accept="image/*,video/*" onChange={e => setFile(e.target.files[0])} />
          </div>
        </div>

        <button
          onClick={runModeration}
          disabled={!file || !selectedKey || loading}
          className="w-full bg-brand-600 hover:bg-brand-700 disabled:opacity-40 text-white py-3 rounded-xl font-medium text-sm transition-colors"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Running moderation…
            </span>
          ) : "Run Moderation"}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-xl p-4 text-sm">{error}</div>
      )}

      {result && (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 space-y-5">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <VerdictBadge decision={result.finalDecision} />
            <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-3 py-1.5 rounded-full">
              via {result.layer === "google_vision" ? "Google Vision" : "Claude AI"}
            </span>
          </div>

          <div className="space-y-2.5">
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Content Scores</p>
            <ScoreBar label="Adult"    score={result.googleScores?.adult} />
            <ScoreBar label="Violence" score={result.googleScores?.violence} />
            <ScoreBar label="Racy"     score={result.googleScores?.racy} />
          </div>

          {result.claude && (
            <div className="bg-brand-50 dark:bg-brand-950/30 border border-brand-200 dark:border-brand-800 rounded-xl p-4">
              <p className="text-xs font-semibold text-brand-700 dark:text-brand-400 mb-1">Claude AI Decision</p>
              <p className="text-sm text-brand-800 dark:text-brand-300">{result.claude.reason}</p>
              <p className="text-xs text-brand-500 dark:text-brand-500 mt-1">Confidence: {Math.round((result.claude.confidence || 0) * 100)}%</p>
            </div>
          )}

          <div className="flex gap-4 text-xs text-gray-400 flex-wrap">
            <span>Google: {result.performance?.googleMs}ms</span>
            {result.performance?.claudeMs > 0 && <span>Claude: {result.performance.claudeMs}ms</span>}
            <span>Total: {result.performance?.totalMs}ms</span>
          </div>

          <div>
            <button onClick={() => setShowRaw(!showRaw)} className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
              {showRaw ? "Hide" : "Show"} raw JSON
            </button>
            {showRaw && (
              <pre className="mt-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 text-xs overflow-auto max-h-64 text-gray-600 dark:text-gray-300">
                {JSON.stringify(result, null, 2)}
              </pre>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
