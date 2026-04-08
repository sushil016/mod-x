import { useState } from "react";
import { useTheme } from "../context/ThemeContext.jsx";
import { Sun, Moon, ArrowRight, Zap, Shield, Globe, Clock } from "lucide-react";

const CURL_EXAMPLE = `curl -X POST https://mod-x-409486837822.asia-south1.run.app/moderate \\
  -H "Authorization: Bearer mod_sk_your_key" \\
  -F "file=@photo.jpg"`;

const JS_EXAMPLE = `const form = new FormData();
form.append("file", fileInput.files[0]);

const res = await fetch("https://mod-x-409486837822.asia-south1.run.app/moderate", {
  method: "POST",
  headers: { Authorization: "Bearer mod_sk_your_key" },
  body: form,
});

const { finalDecision } = await res.json();
// "allow" | "flag" | "block"`;

const PYTHON_EXAMPLE = `import requests

with open("photo.jpg", "rb") as f:
    res = requests.post(
        "https://mod-x-409486837822.asia-south1.run.app/moderate",
        headers={"Authorization": "Bearer mod_sk_your_key"},
        files={"file": f},
    )

print(res.json()["finalDecision"])  # "allow" | "flag" | "block"`;

const TABS = ["cURL", "JavaScript", "Python"];
const CODE  = [CURL_EXAMPLE, JS_EXAMPLE, PYTHON_EXAMPLE];
const LANGS = ["bash", "javascript", "python"];

function CodeBlock({ code, lang }) {
  const [copied, setCopied] = useState(false);
  function copy() {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }
  return (
    <div className="rounded-xl bg-gray-950 border border-gray-800 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 bg-gray-900 border-b border-gray-800">
        <span className="text-xs text-gray-500 font-mono">{lang}</span>
        <button onClick={copy} className="text-xs text-gray-400 hover:text-white transition-colors">
          {copied ? "✓ Copied" : "Copy"}
        </button>
      </div>
      <pre className="p-4 text-sm text-gray-300 overflow-x-auto font-mono leading-relaxed whitespace-pre">{code}</pre>
    </div>
  );
}

const DEMO_RESULT = {
  decision: "allow",
  scores: { adult: 5, violence: 5, racy: 12 },
  layer: "Google Vision",
  ms: 312,
};

export default function Landing() {
  const { theme, toggleTheme } = useTheme();
  const [tab, setTab] = useState(0);
  const [demoFile, setDemoFile] = useState(null);
  const [demoRunning, setDemoRunning] = useState(false);
  const [demoResult, setDemoResult] = useState(null);

  function runDemo(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    setDemoFile(f);
    setDemoRunning(true);
    setDemoResult(null);
    setTimeout(() => {
      setDemoRunning(false);
      setDemoResult(DEMO_RESULT);
    }, 1400);
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 transition-colors">

      {/* ── Nav ─────────────────────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-40 border-b border-gray-200 dark:border-gray-800 bg-white/90 dark:bg-gray-950/90 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-brand-600 flex items-center justify-center text-white font-black text-sm">M</div>
            <span className="font-bold text-gray-900 dark:text-white">ModMe</span>
          </div>
          <div className="flex items-center gap-5 text-sm">
            <a href="#how-it-works" className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors hidden md:block">How it works</a>
            <a href="/docs"         className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors hidden md:block">Docs</a>
            <a href="#pricing"      className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors hidden md:block">Pricing</a>
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            >
              {theme === "dark" ? <Sun size={16} className="text-amber-400" /> : <Moon size={16} />}
            </button>
            <a
              href="/auth/google"
              className="bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
            >
              Get started free
            </a>
          </div>
        </div>
      </nav>

      {/* ── Hero ────────────────────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-6 pt-20 pb-16 text-center">
        <div className="inline-flex items-center gap-2 bg-brand-50 dark:bg-brand-950/50 border border-brand-200 dark:border-brand-800 rounded-full px-4 py-1.5 text-xs text-brand-700 dark:text-brand-300 mb-8 font-medium">
          <span className="w-1.5 h-1.5 bg-brand-500 rounded-full animate-pulse" />
          Powered by Google Vision + Claude on Vertex AI
        </div>
        <h1 className="text-5xl md:text-7xl font-black leading-[1.05] mb-6 tracking-tight">
          Content Moderation<br />
          <span className="text-brand-600 dark:text-brand-400">that just works.</span>
        </h1>
        <p className="text-xl text-gray-500 dark:text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
          One API endpoint. Drop in any image, GIF, or video — get back
          <span className="text-gray-900 dark:text-white font-medium"> allow / flag / block</span> in under 400ms.
          Two-layer AI. Dead simple integration.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <a
            href="/auth/google"
            className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white px-7 py-3.5 rounded-xl font-semibold text-base transition-colors shadow-lg shadow-brand-600/25"
          >
            Start for free <ArrowRight size={16} />
          </a>
          <a
            href="/docs"
            className="flex items-center gap-2 border border-gray-300 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-600 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white px-7 py-3.5 rounded-xl font-semibold text-base transition-colors"
          >
            View API docs
          </a>
        </div>

        {/* Stats */}
        <div className="flex flex-wrap items-center justify-center gap-10 mt-16">
          {[
            { icon: Clock,  value: "< 400ms",   label: "avg response" },
            { icon: Zap,    value: "99.9%",      label: "uptime" },
            { icon: Shield, value: "2-layer AI", label: "Vision + Claude" },
            { icon: Globe,  value: "3 types",    label: "image · GIF · video" },
          ].map(({ icon: Icon, value, label }) => (
            <div key={label} className="text-center">
              <div className="flex items-center justify-center gap-1.5 text-2xl font-black text-gray-900 dark:text-white mb-0.5">
                <Icon size={18} className="text-brand-500" />
                {value}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── How it works ────────────────────────────────────────────────────── */}
      <section id="how-it-works" className="bg-gray-50 dark:bg-gray-900/50 border-y border-gray-200 dark:border-gray-800 py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-3">How it works</h2>
            <p className="text-gray-500 dark:text-gray-400">Two-layer AI — fast, accurate, and cost-efficient by design</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              { step: "01", icon: "📤", title: "Upload",         desc: "POST any image, GIF, or video to /moderate with your Bearer token. Up to 100 MB." },
              { step: "02", icon: "🔍", title: "Google Vision",  desc: "SafeSearch scores adult, violence, and racy content across all frames in parallel." },
              { step: "03", icon: "🤖", title: "Claude AI",      desc: "Only ~15% of content reaches Claude — keeping your costs low while staying accurate." },
              { step: "04", icon: "✅", title: "Decision",       desc: "Get allow / flag / block with scores, the deciding layer, and full latency breakdown." },
            ].map(({ step, icon, title, desc }) => (
              <div key={step} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 relative overflow-hidden">
                <div className="absolute top-4 right-4 text-gray-100 dark:text-gray-800 font-black text-4xl select-none">{step}</div>
                <div className="text-3xl mb-4">{icon}</div>
                <div className="font-bold text-gray-900 dark:text-white mb-2">{title}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Live Playground Preview ──────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-3">Try it instantly</h2>
          <p className="text-gray-500 dark:text-gray-400">See the moderation pipeline in action — no signup required for this demo</p>
        </div>

        <div className="max-w-3xl mx-auto">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden shadow-xl dark:shadow-none">
            {/* Browser toolbar */}
            <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <div className="w-3 h-3 rounded-full bg-yellow-400" />
                <div className="w-3 h-3 rounded-full bg-green-400" />
              </div>
              <div className="flex-1 mx-4 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md px-3 py-1 text-xs text-gray-400 font-mono">
                POST /moderate
              </div>
            </div>

            <div className="p-6 space-y-5">
              {/* Drop zone */}
              <label className="block border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl p-10 text-center cursor-pointer hover:border-brand-400 dark:hover:border-brand-600 transition-colors group">
                {demoFile ? (
                  <div>
                    <div className="text-3xl mb-2">📎</div>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{demoFile.name}</p>
                    <p className="text-xs text-gray-400 mt-1">{(demoFile.size / 1024).toFixed(1)} KB · {demoFile.type}</p>
                  </div>
                ) : (
                  <div>
                    <div className="text-4xl mb-3 group-hover:scale-110 transition-transform">☁️</div>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Drop an image here or click to browse</p>
                    <p className="text-xs text-gray-400 mt-1">JPEG, PNG, WebP, GIF · Max 10 MB for demo</p>
                  </div>
                )}
                <input type="file" className="hidden" accept="image/*" onChange={runDemo} />
              </label>

              {/* Simulated running state */}
              {demoRunning && (
                <div className="flex items-center gap-3 bg-brand-50 dark:bg-brand-950/30 border border-brand-200 dark:border-brand-800 rounded-xl p-4">
                  <div className="w-4 h-4 border-2 border-brand-600 border-t-transparent rounded-full animate-spin shrink-0" />
                  <p className="text-sm text-brand-700 dark:text-brand-300">Running moderation pipeline...</p>
                </div>
              )}

              {/* Simulated result */}
              {demoResult && !demoRunning && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800 px-4 py-2 rounded-full font-bold text-sm">
                      ✅ ALLOWED
                    </span>
                    <span className="text-xs text-gray-400 bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full">via Google Vision · {demoResult.ms}ms</span>
                  </div>
                  <div className="space-y-2">
                    {[["Adult", demoResult.scores.adult], ["Violence", demoResult.scores.violence], ["Racy", demoResult.scores.racy]].map(([label, pct]) => (
                      <div key={label} className="flex items-center gap-3">
                        <span className="text-sm text-gray-500 dark:text-gray-400 w-20 shrink-0">{label}</span>
                        <div className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-full h-2">
                          <div className="h-2 rounded-full bg-green-500" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-sm font-mono text-gray-700 dark:text-gray-300 w-10 text-right">{pct}%</span>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-gray-400 text-center">
                    This is a simulated demo.{" "}
                    <a href="/auth/google" className="text-brand-600 dark:text-brand-400 hover:underline">Sign in</a>
                    {" "}to use the live playground with your own API keys.
                  </p>
                </div>
              )}

              {!demoFile && !demoRunning && !demoResult && (
                <div className="text-center">
                  <a
                    href="/auth/google"
                    className="inline-flex items-center gap-2 text-sm text-brand-600 dark:text-brand-400 hover:underline font-medium"
                  >
                    Or sign in to use the live playground with real moderation <ArrowRight size={14} />
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── Code Examples ───────────────────────────────────────────────────── */}
      <section className="bg-gray-50 dark:bg-gray-900/50 border-y border-gray-200 dark:border-gray-800 py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            <div>
              <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-4">Integrate in minutes</h2>
              <p className="text-gray-500 dark:text-gray-400 mb-8">One endpoint, any language. Works with anything that can send an HTTP request.</p>
              <div className="space-y-4">
                {[
                  { n: "1", title: "Sign in with Google",    body: "Free account — no credit card needed." },
                  { n: "2", title: "Create an API key",      body: "Dashboard → New Key. Starts with mod_sk_." },
                  { n: "3", title: "POST to /moderate",      body: "Send any image, GIF, or video as multipart form data." },
                  { n: "4", title: "Read the decision",      body: 'finalDecision is "allow", "flag", or "block".' },
                ].map(({ n, title, body }) => (
                  <div key={n} className="flex gap-4">
                    <div className="w-7 h-7 rounded-full bg-brand-600 flex items-center justify-center text-white text-xs font-bold shrink-0 mt-0.5">{n}</div>
                    <div>
                      <div className="font-semibold text-gray-900 dark:text-white text-sm">{title}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{body}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-8 flex gap-3">
                <a href="/auth/google" className="bg-brand-600 hover:bg-brand-700 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-colors">
                  Get your API key
                </a>
                <a href="/docs" className="border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-colors">
                  Full API docs
                </a>
              </div>
            </div>
            <div>
              <div className="flex gap-1 mb-3">
                {TABS.map((t, i) => (
                  <button
                    key={t}
                    onClick={() => setTab(i)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${tab === i ? "bg-brand-600 text-white" : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800"}`}
                  >
                    {t}
                  </button>
                ))}
              </div>
              <CodeBlock code={CODE[tab]} lang={LANGS[tab]} />
            </div>
          </div>
        </div>
      </section>

      {/* ── Pricing ─────────────────────────────────────────────────────────── */}
      <section id="pricing" className="max-w-7xl mx-auto px-6 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-3">Simple pricing</h2>
          <p className="text-gray-500 dark:text-gray-400">Start free, upgrade when you need more</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
          {[
            {
              name: "Free", price: "$0", period: "forever", limit: "100 req / hour",
              features: ["All file types (image, GIF, video)", "Google Vision + Claude AI", "Usage analytics dashboard", "Interactive playground", "Instant key revocation"],
              cta: "Get started free", highlight: false,
            },
            {
              name: "Pro", price: "$29", period: "/ month", limit: "1,000 req / hour",
              features: ["Everything in Free", "10× higher rate limit", "Priority support", "99.9% SLA", "Custom webhook callbacks"],
              cta: "Upgrade to Pro", highlight: true,
            },
          ].map(({ name, price, period, limit, features, cta, highlight }) => (
            <div
              key={name}
              className={`rounded-2xl p-7 border ${highlight
                ? "border-brand-500 bg-brand-50 dark:bg-brand-950/20"
                : "border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900"}`}
            >
              {highlight && (
                <div className="text-xs font-bold text-brand-600 dark:text-brand-400 uppercase tracking-wider mb-3">Most popular</div>
              )}
              <div className="font-bold text-gray-900 dark:text-white text-lg mb-1">{name}</div>
              <div className="mb-1">
                <span className="text-4xl font-black text-gray-900 dark:text-white">{price}</span>
                <span className="text-gray-400 text-sm ml-1">{period}</span>
              </div>
              <div className="text-brand-600 dark:text-brand-400 text-sm font-medium mb-6">{limit}</div>
              <ul className="space-y-2.5 mb-7">
                {features.map(f => (
                  <li key={f} className="flex items-start gap-2.5 text-sm text-gray-600 dark:text-gray-400">
                    <span className="text-green-500 mt-0.5 shrink-0">✓</span> {f}
                  </li>
                ))}
              </ul>
              <a
                href="/auth/google"
                className={`block text-center py-3 rounded-xl text-sm font-semibold transition-colors ${highlight
                  ? "bg-brand-600 hover:bg-brand-700 text-white shadow-lg shadow-brand-600/25"
                  : "border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:border-gray-400 dark:hover:border-gray-600"}`}
              >
                {cta}
              </a>
            </div>
          ))}
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────────────────── */}
      <footer className="border-t border-gray-200 dark:border-gray-800 py-10">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-brand-600 flex items-center justify-center text-white font-black text-xs">M</div>
            <span className="font-bold text-gray-700 dark:text-gray-300">ModMe</span>
          </div>
          <p className="text-sm text-gray-400">Content Moderation API · Powered by Google Cloud Vision &amp; Anthropic Claude</p>
          <div className="flex items-center gap-5 text-sm">
            <a href="/docs"        className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors">API Docs</a>
            <a href="/auth/google" className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors">Sign in</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
