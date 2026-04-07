// client/src/pages/Landing.jsx
import { useState } from "react";

const CURL_EXAMPLE = `curl -X POST https://your-domain.com/moderate \\
  -H "Authorization: Bearer mod_sk_your_api_key" \\
  -F "file=@image.jpg"`;

const JS_EXAMPLE = `const form = new FormData();
form.append("file", fileInput.files[0]);

const res = await fetch("https://your-domain.com/moderate", {
  method: "POST",
  headers: { Authorization: "Bearer mod_sk_your_api_key" },
  body: form,
});

const result = await res.json();
console.log(result.finalDecision); // "allow" | "flag" | "block"`;

const PYTHON_EXAMPLE = `import requests

with open("image.jpg", "rb") as f:
    res = requests.post(
        "https://your-domain.com/moderate",
        headers={"Authorization": "Bearer mod_sk_your_api_key"},
        files={"file": f},
    )

data = res.json()
print(data["finalDecision"])  # "allow" | "flag" | "block"`;

const RESPONSE_EXAMPLE = `{
  "finalDecision": "allow",
  "layer": "google_vision",
  "sourceType": "image",
  "googleScores": {
    "adult": 0.05,
    "violence": 0.05,
    "racy": 0.25,
    "medical": 0.05,
    "spoof": 0.05
  },
  "googleReason": "Google Vision: all scores within safe range",
  "claude": null,
  "performance": {
    "googleMs": 312,
    "claudeMs": 0,
    "totalMs": 312
  },
  "timestamp": "2026-04-07T10:22:31.000Z"
}`;

function CodeBlock({ code, lang }) {
  const [copied, setCopied] = useState(false);
  function copy() {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }
  return (
    <div className="relative rounded-xl bg-gray-900 border border-gray-700 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700">
        <span className="text-xs text-gray-400 font-mono">{lang}</span>
        <button onClick={copy} className="text-xs text-gray-400 hover:text-white transition">
          {copied ? "✓ Copied" : "Copy"}
        </button>
      </div>
      <pre className="p-4 text-sm text-gray-100 overflow-x-auto font-mono leading-relaxed whitespace-pre">{code}</pre>
    </div>
  );
}

function Badge({ children, color = "indigo" }) {
  const colors = {
    indigo: "bg-indigo-900/50 text-indigo-300 border-indigo-700",
    green:  "bg-green-900/50  text-green-300  border-green-700",
    yellow: "bg-yellow-900/50 text-yellow-300 border-yellow-700",
    red:    "bg-red-900/50    text-red-300    border-red-700",
  };
  return (
    <span className={`inline-block text-xs px-2.5 py-0.5 rounded-full border font-medium ${colors[color]}`}>
      {children}
    </span>
  );
}

const TABS = ["cURL", "JavaScript", "Python"];
const CODE = [CURL_EXAMPLE, JS_EXAMPLE, PYTHON_EXAMPLE];
const LANGS = ["bash", "javascript", "python"];

export default function Landing() {
  const [tab, setTab] = useState(0);

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">

      {/* ── Nav ──────────────────────────────────────────────────────────── */}
      <nav className="border-b border-gray-800 px-6 py-4 flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-500 flex items-center justify-center text-white font-black text-sm">M</div>
          <span className="font-bold text-white text-lg">ModMe</span>
        </div>
        <div className="flex items-center gap-6 text-sm">
          <a href="#quickstart" className="text-gray-400 hover:text-white transition">Quickstart</a>
          <a href="#api"        className="text-gray-400 hover:text-white transition">API Reference</a>
          <a href="#plans"      className="text-gray-400 hover:text-white transition">Plans</a>
          <a
            href="/auth/google"
            className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-1.5 rounded-lg text-sm font-medium transition"
          >
            Get API Key →
          </a>
        </div>
      </nav>

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-6 pt-20 pb-16 text-center">
        <div className="inline-flex items-center gap-2 bg-indigo-950 border border-indigo-800 rounded-full px-4 py-1.5 text-xs text-indigo-300 mb-6">
          <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-pulse" />
          Powered by Google Vision + Claude on Vertex AI
        </div>
        <h1 className="text-5xl md:text-6xl font-black text-white leading-tight mb-6">
          Content Moderation<br />
          <span className="text-indigo-400">as an API.</span>
        </h1>
        <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
          One endpoint. Drop in any image, GIF, or video. Get back an <span className="text-white font-medium">allow / flag / block</span> decision
          in milliseconds — with scores and reasoning.
        </p>
        <div className="flex items-center justify-center gap-4 flex-wrap">
          <a
            href="/auth/google"
            className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-xl font-semibold text-base transition shadow-lg shadow-indigo-900/50"
          >
            Start for free →
          </a>
          <a
            href="#quickstart"
            className="border border-gray-700 hover:border-gray-500 text-gray-300 hover:text-white px-6 py-3 rounded-xl font-semibold text-base transition"
          >
            View docs
          </a>
        </div>

        {/* Stats row */}
        <div className="flex items-center justify-center gap-8 mt-14 text-sm text-gray-500 flex-wrap">
          {[["&lt; 400ms", "avg response"], ["99.9%", "uptime SLA"], ["2-layer AI", "Vision + Claude"], ["Instant", "key revocation"]].map(([v, l]) => (
            <div key={l} className="text-center">
              <div className="text-white font-bold text-lg" dangerouslySetInnerHTML={{ __html: v }} />
              <div>{l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-6 py-16 border-t border-gray-800">
        <h2 className="text-2xl font-bold text-white mb-2 text-center">How it works</h2>
        <p className="text-gray-500 text-center mb-12 text-sm">Two-layer AI — fast + accurate, cost-efficient by design</p>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { step: "01", icon: "📤", title: "Upload", desc: "POST any image, GIF, or video to /moderate with your Bearer token" },
            { step: "02", icon: "🔍", title: "Google Vision", desc: "SafeSearch scores adult, violence, racy content across all frames in parallel" },
            { step: "03", icon: "🤖", title: "Claude AI (gray zone)", desc: "Only ~15% of content reaches Claude — keeping your costs low" },
            { step: "04", icon: "✅", title: "Decision", desc: "Get allow / flag / block with scores, layer, and latency breakdown" },
          ].map(({ step, icon, title, desc }) => (
            <div key={step} className="bg-gray-900 border border-gray-800 rounded-2xl p-5 relative overflow-hidden">
              <div className="absolute top-4 right-4 text-gray-800 font-black text-3xl">{step}</div>
              <div className="text-2xl mb-3">{icon}</div>
              <div className="font-semibold text-white mb-1">{title}</div>
              <div className="text-sm text-gray-400 leading-relaxed">{desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Quickstart ───────────────────────────────────────────────────── */}
      <section id="quickstart" className="max-w-7xl mx-auto px-6 py-16 border-t border-gray-800">
        <h2 className="text-2xl font-bold text-white mb-2">Quickstart</h2>
        <p className="text-gray-500 mb-8 text-sm">Get running in 2 minutes</p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Steps */}
          <div className="space-y-4">
            {[
              { n: "1", title: "Sign in with Google", body: "Create a free account — no credit card required." },
              { n: "2", title: "Create an API key", body: "Go to Dashboard → New Key. Copy the key — it starts with mod_sk_." },
              { n: "3", title: "Send your first request", body: "POST any image to /moderate with your key as a Bearer token." },
              { n: "4", title: "Read the decision", body: 'Check finalDecision: "allow" | "flag" | "block" in the JSON response.' },
            ].map(({ n, title, body }) => (
              <div key={n} className="flex gap-4">
                <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-bold shrink-0 mt-0.5">{n}</div>
                <div>
                  <div className="font-semibold text-white text-sm">{title}</div>
                  <div className="text-gray-400 text-sm mt-0.5">{body}</div>
                </div>
              </div>
            ))}

            <a
              href="/auth/google"
              className="inline-flex items-center gap-2 mt-2 bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="white" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="white" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="white" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="white" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Sign up with Google
            </a>
          </div>

          {/* Code */}
          <div>
            <div className="flex gap-1 mb-3">
              {TABS.map((t, i) => (
                <button
                  key={t}
                  onClick={() => setTab(i)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${tab === i ? "bg-indigo-600 text-white" : "text-gray-400 hover:text-white hover:bg-gray-800"}`}
                >
                  {t}
                </button>
              ))}
            </div>
            <CodeBlock code={CODE[tab]} lang={LANGS[tab]} />
          </div>
        </div>
      </section>

      {/* ── API Reference ────────────────────────────────────────────────── */}
      <section id="api" className="max-w-7xl mx-auto px-6 py-16 border-t border-gray-800">
        <h2 className="text-2xl font-bold text-white mb-2">API Reference</h2>
        <p className="text-gray-500 mb-10 text-sm">One endpoint. That's it.</p>

        {/* Endpoint box */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mb-8">
          <div className="flex items-center gap-3 mb-4">
            <span className="bg-indigo-600 text-white text-xs font-bold px-2.5 py-1 rounded-lg">POST</span>
            <code className="text-white font-mono text-sm">/moderate</code>
            <Badge>API key required</Badge>
          </div>
          <p className="text-gray-400 text-sm mb-6">Run content moderation on an image, GIF, or video. Returns a moderation decision with confidence scores.</p>

          {/* Headers */}
          <div className="mb-6">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Headers</div>
            <div className="space-y-2">
              <div className="flex items-start gap-3 bg-gray-800 rounded-lg px-4 py-3">
                <code className="text-indigo-300 font-mono text-xs w-48 shrink-0">Authorization</code>
                <div>
                  <div className="text-gray-200 text-xs">Bearer <span className="text-yellow-300">mod_sk_your_key</span></div>
                  <div className="text-gray-500 text-xs mt-0.5">Required. Your API key from the dashboard.</div>
                </div>
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="mb-6">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Body — multipart/form-data</div>
            <div className="space-y-2">
              {[
                { name: "file", type: "File", required: true, desc: "The media file to moderate." },
              ].map(({ name, type, required, desc }) => (
                <div key={name} className="flex items-start gap-3 bg-gray-800 rounded-lg px-4 py-3">
                  <code className="text-indigo-300 font-mono text-xs w-48 shrink-0">{name}</code>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-200 text-xs">{type}</span>
                      {required && <Badge color="red">required</Badge>}
                    </div>
                    <div className="text-gray-500 text-xs mt-0.5">{desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Supported types */}
          <div className="mb-6">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Supported File Types</div>
            <div className="flex flex-wrap gap-2">
              {["image/jpeg", "image/png", "image/webp", "image/gif", "video/mp4", "video/webm", "video/quicktime"].map(t => (
                <code key={t} className="bg-gray-800 text-gray-300 text-xs px-2.5 py-1 rounded-lg font-mono">{t}</code>
              ))}
            </div>
            <p className="text-gray-500 text-xs mt-2">Max file size: 100 MB</p>
          </div>

          {/* Status codes */}
          <div>
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Status Codes</div>
            <div className="space-y-2">
              {[
                { code: "200", color: "green",  label: "allow",   desc: "Content passed moderation" },
                { code: "422", color: "yellow", label: "flag",    desc: "Content flagged for human review" },
                { code: "422", color: "red",    label: "block",   desc: "Content blocked — policy violation" },
                { code: "401", color: "red",    label: "error",   desc: "Invalid or missing API key" },
                { code: "429", color: "yellow", label: "error",   desc: "Rate limit exceeded" },
                { code: "415", color: "red",    label: "error",   desc: "Unsupported file type" },
              ].map(({ code, color, label, desc }) => (
                <div key={code + label + desc} className="flex items-center gap-3 bg-gray-800 rounded-lg px-4 py-2.5">
                  <code className="text-gray-300 font-mono text-xs w-10 shrink-0">{code}</code>
                  <Badge color={color}>{label}</Badge>
                  <span className="text-gray-400 text-xs">{desc}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Response shape */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Response Fields</div>
            <div className="space-y-3">
              {[
                { field: "finalDecision", type: "string",  desc: '"allow" | "flag" | "block"' },
                { field: "layer",         type: "string",  desc: '"google_vision" | "claude_vertex"' },
                { field: "sourceType",    type: "string",  desc: '"image" | "gif" | "video"' },
                { field: "googleScores",  type: "object",  desc: "adult, violence, racy, medical, spoof (0–1)" },
                { field: "claude",        type: "object|null", desc: "Claude result when escalated (action, confidence, reason)" },
                { field: "performance",   type: "object",  desc: "googleMs, claudeMs, totalMs" },
                { field: "timestamp",     type: "string",  desc: "ISO 8601 UTC timestamp" },
              ].map(({ field, type, desc }) => (
                <div key={field} className="flex items-start gap-3">
                  <code className="text-indigo-300 font-mono text-xs w-32 shrink-0 mt-0.5">{field}</code>
                  <div>
                    <span className="text-yellow-300 text-xs font-mono">{type}</span>
                    <span className="text-gray-500 text-xs ml-2">— {desc}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Rate limit headers */}
            <div className="mt-8">
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Rate Limit Headers</div>
              <div className="space-y-2">
                {[
                  { h: "X-RateLimit-Limit",     desc: "Requests allowed per hour" },
                  { h: "X-RateLimit-Remaining", desc: "Requests remaining this window" },
                  { h: "X-RateLimit-Reset",     desc: "Unix timestamp when window resets" },
                  { h: "Retry-After",            desc: "Seconds to wait (only on 429)" },
                ].map(({ h, desc }) => (
                  <div key={h} className="flex items-center gap-3">
                    <code className="text-indigo-300 font-mono text-xs w-48 shrink-0">{h}</code>
                    <span className="text-gray-500 text-xs">{desc}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div>
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Example Response</div>
            <CodeBlock code={RESPONSE_EXAMPLE} lang="json" />
          </div>
        </div>
      </section>

      {/* ── Plans ────────────────────────────────────────────────────────── */}
      <section id="plans" className="max-w-7xl mx-auto px-6 py-16 border-t border-gray-800">
        <h2 className="text-2xl font-bold text-white mb-2 text-center">Plans</h2>
        <p className="text-gray-500 mb-10 text-sm text-center">Simple, predictable limits</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
          {[
            {
              name: "Free",
              price: "$0",
              period: "forever",
              limit: "100 req / hour",
              features: ["All file types", "Google Vision + Claude AI", "Usage analytics", "Playground", "Instant key revocation"],
              cta: "Get started",
              highlight: false,
            },
            {
              name: "Pro",
              price: "$29",
              period: "/ month",
              limit: "1,000 req / hour",
              features: ["Everything in Free", "10× higher rate limit", "Priority support", "SLA guarantee"],
              cta: "Upgrade",
              highlight: true,
            },
          ].map(({ name, price, period, limit, features, cta, highlight }) => (
            <div
              key={name}
              className={`rounded-2xl p-6 border ${highlight ? "border-indigo-500 bg-indigo-950/30" : "border-gray-800 bg-gray-900"}`}
            >
              <div className="flex items-center justify-between mb-4">
                <span className="font-semibold text-white">{name}</span>
                {highlight && <Badge color="indigo">Popular</Badge>}
              </div>
              <div className="mb-1">
                <span className="text-3xl font-black text-white">{price}</span>
                <span className="text-gray-500 text-sm ml-1">{period}</span>
              </div>
              <div className="text-indigo-300 text-xs font-medium mb-5">{limit}</div>
              <ul className="space-y-2 mb-6">
                {features.map(f => (
                  <li key={f} className="flex items-center gap-2 text-sm text-gray-400">
                    <span className="text-green-400 text-xs">✓</span> {f}
                  </li>
                ))}
              </ul>
              <a
                href="/auth/google"
                className={`block text-center py-2.5 rounded-xl text-sm font-medium transition ${highlight ? "bg-indigo-600 hover:bg-indigo-500 text-white" : "border border-gray-700 hover:border-gray-500 text-gray-300 hover:text-white"}`}
              >
                {cta}
              </a>
            </div>
          ))}
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <footer className="border-t border-gray-800 px-6 py-8 text-center text-xs text-gray-600 max-w-7xl mx-auto">
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="w-5 h-5 rounded bg-indigo-500 flex items-center justify-center text-white font-black text-xs">M</div>
          <span className="text-gray-500 font-medium">ModMe</span>
        </div>
        <p>Content Moderation API · Powered by Google Cloud Vision &amp; Anthropic Claude</p>
      </footer>
    </div>
  );
}
