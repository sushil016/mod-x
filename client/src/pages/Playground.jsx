import { useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "../lib/api.js";
import VerdictBadge from "../components/VerdictBadge.jsx";
import ScoreBar from "../components/ScoreBar.jsx";
import { Upload, ChevronDown, Play, ShieldCheck, FileVideo } from "lucide-react";

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
    <div className="space-y-6">
      <div className="editorial-banner">
        <div className="absolute right-6 top-6 hidden h-24 w-24 rounded-full border border-brand-500/20 md:block">
          <div className="core-ring" />
        </div>
        <div className="relative max-w-2xl">
          <div className="app-kicker inline-flex items-center gap-2">
            <Play size={13} />
            Live test
          </div>
          <h1 className="app-title">Moderation playground</h1>
          <p className="app-copy">Upload a real media file, choose an active key, and verify the exact allow, flag, or block payload your app receives.</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <div className="app-panel space-y-5 p-6">
        {/* API Key selector */}
        <div>
          <label className="block text-sm font-medium text-card-foreground mb-1.5">API Key</label>
          <div className="relative">
            <select
              className="field-control appearance-none pr-9"
              value={selectedKey}
              onChange={e => setSelectedKey(e.target.value)}
            >
              <option value="">Select an API key…</option>
              {keys.map(k => <option key={k.id} value={k.key}>{k.name}</option>)}
            </select>
            <ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          </div>
          {keys.length === 0 && (
            <p className="mt-1.5 text-xs text-muted-foreground">No active keys — <a href="/dashboard" className="text-foreground hover:underline">create one in Dashboard</a></p>
          )}
        </div>

        {/* Drop zone */}
        <div>
          <label className="block text-sm font-medium text-card-foreground mb-1.5">File</label>
          <div
            onDrop={onDrop}
            onDragOver={e => e.preventDefault()}
            onClick={() => inputRef.current?.click()}
            className="group cursor-pointer rounded-lg border border-dashed border-border p-10 text-center transition-colors hover:border-foreground/30 hover:bg-secondary"
          >
            {file ? (
              <div>
                <div className="text-3xl mb-2">📎</div>
                <p className="text-sm font-medium text-card-foreground">{file.name}</p>
                <p className="mt-1 text-xs text-muted-foreground">{(file.size / 1024).toFixed(1)} KB · {file.type}</p>
                <button
                  onClick={e => { e.stopPropagation(); setFile(null); setResult(null); }}
                  className="mt-2 text-xs text-muted-foreground transition-colors hover:text-red-500"
                >
                  Remove
                </button>
              </div>
            ) : (
              <div>
                <Upload size={32} className="mx-auto mb-3 text-muted-foreground transition-colors group-hover:text-foreground" />
                <p className="text-sm font-medium text-card-foreground">Drop a file here or click to browse</p>
                <p className="mt-1 text-xs text-muted-foreground">JPEG, PNG, WebP, GIF, MP4, WebM, MOV</p>
              </div>
            )}
            <input ref={inputRef} type="file" className="hidden" accept="image/*,video/*" onChange={e => setFile(e.target.files[0])} />
          </div>
        </div>

        <button
          onClick={runModeration}
          disabled={!file || !selectedKey || loading}
          className="solid-button w-full py-3 disabled:opacity-40"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Running moderation…
            </span>
          ) : "Run Moderation"}
        </button>
      </div>

      <aside className="app-panel p-6">
        <ShieldCheck size={26} className="mb-5 text-foreground" />
        <h2 className="font-display text-2xl">What gets checked</h2>
        <div className="mt-5 space-y-4">
          {[
            ["Images", "Direct SafeSearch scoring"],
            ["GIFs", "Sampled frames in parallel"],
            ["Videos", "Frame extraction up to your cap"],
          ].map(([title, body]) => (
            <div key={title} className="flex gap-3 rounded-lg border border-border bg-secondary p-3">
              <FileVideo size={16} className="mt-0.5 text-foreground" />
              <div>
                <div className="text-sm font-medium">{title}</div>
                <div className="text-xs text-muted-foreground">{body}</div>
              </div>
            </div>
          ))}
        </div>
      </aside>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-xl p-4 text-sm">{error}</div>
      )}

      {result && (
        <div className="app-panel space-y-5 p-6">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <VerdictBadge decision={result.finalDecision} />
            <span className="text-xs text-muted-foreground bg-muted px-3 py-1.5 rounded-full">
              via {result.layer === "google_vision" ? "Google Vision" : "NVIDIA LLM"}
            </span>
          </div>

          <div className="space-y-2.5">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Content Scores</p>
            <ScoreBar label="Adult"    score={result.googleScores?.adult} />
            <ScoreBar label="Violence" score={result.googleScores?.violence} />
            <ScoreBar label="Racy"     score={result.googleScores?.racy} />
          </div>

          {(result.llm || result.claude) && (
            <div className="bg-brand-50 dark:bg-brand-950/30 border border-brand-200 dark:border-brand-800 rounded-xl p-4">
              <p className="text-xs font-semibold text-brand-700 dark:text-brand-400 mb-1">NVIDIA LLM Decision</p>
              <p className="text-sm text-brand-800 dark:text-brand-300">{(result.llm || result.claude).reason}</p>
              <p className="text-xs text-brand-500 dark:text-brand-500 mt-1">Confidence: {Math.round(((result.llm || result.claude).confidence || 0) * 100)}%</p>
            </div>
          )}

          <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
            <span>Google: {result.performance?.googleMs}ms</span>
            {(result.performance?.llmMs || result.performance?.claudeMs) > 0 && <span>LLM: {result.performance.llmMs || result.performance.claudeMs}ms</span>}
            <span>Total: {result.performance?.totalMs}ms</span>
          </div>

          <div>
            <button onClick={() => setShowRaw(!showRaw)} className="text-xs text-muted-foreground transition-colors hover:text-foreground">
              {showRaw ? "Hide" : "Show"} raw JSON
            </button>
            {showRaw && (
              <pre className="mt-3 max-h-64 overflow-auto rounded-lg border border-border bg-secondary p-4 text-xs text-muted-foreground">
                {JSON.stringify(result, null, 2)}
              </pre>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
