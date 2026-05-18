import { useState } from "react";
import { useTheme } from "../context/ThemeContext.jsx";
import { Sun, Moon, ArrowLeft, ShieldCheck } from "lucide-react";

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
  "timestamp": "2026-04-08T10:22:31.000Z"
}`;

const GRAY_ZONE_EXAMPLE = `{
  "finalDecision": "flag",
  "layer": "claude_vertex",
  "sourceType": "image",
  "googleScores": { "adult": 0.5, "violence": 0.25, "racy": 0.75 },
  "googleReason": "Google Vision: gray zone — escalating to Claude",
  "claude": {
    "action": "flag",
    "confidence": 0.82,
    "reason": "Image contains suggestive content unsuitable for a children's platform",
    "categories": { "nudity": 0.6, "violence": 0.0, "hate_symbols": 0.0, "weapons": 0.0, "drugs": 0.0 }
  },
  "performance": { "googleMs": 290, "claudeMs": 1840, "totalMs": 2130 },
  "timestamp": "2026-04-08T10:23:15.000Z"
}`;

const CURL = `curl -X POST http://localhost:3000/moderate \\
  -H "Authorization: Bearer mod_sk_your_key" \\
  -F "file=@image.jpg"`;

const JS = `const form = new FormData();
form.append("file", fileInput.files[0]);

const res = await fetch("/moderate", {
  method: "POST",
  headers: { Authorization: "Bearer mod_sk_your_key" },
  body: form,
});

const result = await res.json();
// result.finalDecision === "allow" | "flag" | "block"`;

const PYTHON = `import requests

with open("image.jpg", "rb") as f:
    res = requests.post(
        "http://localhost:3000/moderate",
        headers={"Authorization": "Bearer mod_sk_your_key"},
        files={"file": f},
    )

data = res.json()
print(data["finalDecision"])  # "allow" | "flag" | "block"`;

const EXAMPLES = [
  { tab: "cURL",       code: CURL,   lang: "bash" },
  { tab: "JavaScript", code: JS,     lang: "javascript" },
  { tab: "Python",     code: PYTHON, lang: "python" },
];

function CodeBlock({ code, lang }) {
  const [copied, setCopied] = useState(false);
  function copy() {
    navigator.clipboard.writeText(code).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-primary text-left text-primary-foreground">
      <div className="flex items-center justify-between border-b border-primary-foreground/10 px-4 py-2">
        <span className="font-mono text-xs text-primary-foreground/60">{lang}</span>
        <button onClick={copy} className="text-xs text-primary-foreground/70 transition-colors hover:text-primary-foreground">
          {copied ? "✓ Copied" : "Copy"}
        </button>
      </div>
      <pre className="overflow-x-auto whitespace-pre p-4 font-mono text-sm leading-relaxed text-primary-foreground/80">{code}</pre>
    </div>
  );
}

function Section({ id, title, children }) {
  return (
    <section id={id} className="scroll-mt-20 mb-14">
      <h2 className="mb-6 border-b border-border pb-3 font-display text-2xl text-foreground">{title}</h2>
      {children}
    </section>
  );
}

const TOC = [
  ["#overview",      "Overview"],
  ["#authentication","Authentication"],
  ["#endpoint",      "Endpoint"],
  ["#file-types",    "File Types"],
  ["#response",      "Response"],
  ["#errors",        "Errors"],
  ["#rate-limits",   "Rate Limits"],
  ["#examples",      "Examples"],
];

export default function Docs() {
  const { theme, toggleTheme } = useTheme();
  const [exampleIdx, setExampleIdx] = useState(0);
  const authHref = import.meta.env.DEV ? "/auth/dev-login" : "/auth/google";

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors">

      {/* Nav */}
      <nav className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <a href="/" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft size={14} /> Back
            </a>
            <div className="flex items-center gap-2">
              <ShieldCheck size={18} className="text-brand-600" />
              <span className="font-display text-xl text-foreground">API Reference</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-muted-foreground hover:bg-accent transition-colors"
              aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            >
              {theme === "dark" ? <Sun size={16} className="text-amber-400" /> : <Moon size={16} />}
            </button>
            <a href={authHref} className="solid-button">
              Get API key
            </a>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-12 flex gap-12">
        {/* TOC sidebar */}
        <aside className="hidden lg:block w-48 shrink-0 sticky top-24 self-start">
          <nav className="space-y-1">
            {TOC.map(([href, label]) => (
              <a key={href} href={href} className="block text-sm text-muted-foreground hover:text-foreground py-1 transition-colors">
                {label}
              </a>
            ))}
          </nav>
        </aside>

        {/* Content */}
        <div className="flex-1 min-w-0 max-w-3xl">
          <div className="editorial-banner mb-10">
            <div className="app-kicker">Developer docs</div>
            <h1 className="app-title">Protect uploads from your first API call.</h1>
            <p className="app-copy">Use one endpoint for image, GIF, and video moderation. Responses stay simple enough for product workflows and detailed enough for audits.</p>
          </div>

          <Section id="overview" title="Overview">
            <p className="text-muted-foreground leading-relaxed mb-4">
              ModMe provides a single REST API endpoint for content moderation. It accepts images, GIFs, and videos and returns a structured decision —{" "}
              <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono">allow</code>,{" "}
              <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono">flag</code>, or{" "}
              <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono">block</code>.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              Moderation uses two AI layers: Google Cloud Vision SafeSearch for fast, cheap first-pass scoring, and Claude on Vertex AI for nuanced judgment in the gray zone (scores between 0.50 and 0.75). Only ~15% of content reaches Claude, keeping costs low.
            </p>
          </Section>

          <Section id="authentication" title="Authentication">
            <p className="text-muted-foreground mb-4 leading-relaxed">
              All API requests must include your API key as a Bearer token in the{" "}
              <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono">Authorization</code> header.
            </p>
            <div className="mb-3 rounded-lg border border-border bg-primary p-4 font-mono text-sm text-primary-foreground/80">
              Authorization: Bearer <span className="text-yellow-300">mod_sk_your_key_here</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Get your API key from the{" "}
              <a href="/dashboard" className="text-brand-600 dark:text-brand-400 hover:underline">dashboard</a>{" "}
              after signing in.
            </p>
          </Section>

          <Section id="endpoint" title="Endpoint">
            <div className="app-panel mb-6 p-6">
              <div className="flex items-center gap-3 mb-4">
                <span className="bg-brand-600 text-white text-xs font-bold px-2.5 py-1 rounded-lg">POST</span>
                <code className="text-foreground font-mono text-sm">/moderate</code>
              </div>
              <p className="text-sm text-muted-foreground mb-6">
                Analyzes the uploaded file and returns a moderation decision. Accepts{" "}
                <code className="bg-muted px-1 rounded font-mono text-xs">multipart/form-data</code>.
              </p>
              <div>
                <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Request Parameters</div>
                <div className="border border-border dark:border-gray-700 rounded-xl overflow-hidden">
                  <div className="flex items-start gap-4 px-4 py-3 border-b border-border dark:border-gray-700 bg-secondary">
                    <code className="text-brand-600 dark:text-brand-400 font-mono text-sm w-20 shrink-0 mt-0.5">file</code>
                    <span className="text-xs bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 px-2 py-0.5 rounded-full shrink-0 mt-0.5">required</span>
                    <span className="text-sm text-muted-foreground">The media file to moderate (multipart form field)</span>
                  </div>
                  <div className="flex items-start gap-4 px-4 py-3">
                    <code className="text-brand-600 dark:text-brand-400 font-mono text-sm w-20 shrink-0 mt-0.5">x-upload-id</code>
                    <span className="text-xs bg-muted text-gray-500 border border-border dark:border-gray-700 px-2 py-0.5 rounded-full shrink-0 mt-0.5">header</span>
                    <span className="text-sm text-muted-foreground">Your internal asset ID (echoed in response.meta)</span>
                  </div>
                </div>
              </div>
            </div>
          </Section>

          <Section id="file-types" title="Supported File Types">
            <div className="flex flex-wrap gap-2 mb-4">
              {["image/jpeg", "image/png", "image/webp", "image/gif", "video/mp4", "video/webm", "video/quicktime"].map(t => (
                <code key={t} className="bg-muted text-card-foreground text-xs px-2.5 py-1.5 rounded-lg font-mono border border-border dark:border-gray-700">{t}</code>
              ))}
            </div>
            <p className="text-sm text-muted-foreground mb-4">Maximum file size: <strong className="text-card-foreground">100 MB</strong></p>
            <div className="bg-brand-50 dark:bg-brand-950/30 border border-brand-200 dark:border-brand-800/60 rounded-xl p-4 text-sm text-brand-800 dark:text-brand-300">
              <strong>GIFs and videos</strong> are analyzed frame-by-frame. GIFs extract 6 evenly-spaced frames; videos extract 1 frame every 2 seconds (max 30 frames). The worst frame drives the final decision.
            </div>
          </Section>

          <Section id="response" title="Response Format">
            <div className="space-y-3 mb-6">
              {[
                { field: "finalDecision", type: "string",      desc: '"allow" | "flag" | "block"' },
                { field: "layer",         type: "string",      desc: '"google_vision" | "claude_vertex" — which AI made the final call' },
                { field: "sourceType",    type: "string",      desc: '"image" | "gif" | "video"' },
                { field: "googleScores",  type: "object",      desc: "adult, violence, racy, medical, spoof — float 0–1" },
                { field: "googleReason",  type: "string",      desc: "Human-readable reason from the Google Vision layer" },
                { field: "claude",        type: "object|null", desc: "Present only when escalated: action, confidence, reason, categories" },
                { field: "performance",   type: "object",      desc: "googleMs, claudeMs, totalMs in milliseconds" },
                { field: "meta",          type: "object",      desc: "Echoes x-upload-id and x-user-id headers if provided" },
                { field: "timestamp",     type: "string",      desc: "ISO 8601 UTC timestamp" },
              ].map(({ field, type, desc }) => (
                <div key={field} className="flex items-start gap-3 border-b border-border py-2 last:border-0">
                  <code className="text-brand-600 dark:text-brand-400 font-mono text-xs w-36 shrink-0 mt-0.5">{field}</code>
                  <span className="text-xs text-yellow-600 dark:text-yellow-400 font-mono w-24 shrink-0 mt-0.5">{type}</span>
                  <span className="text-sm text-muted-foreground">{desc}</span>
                </div>
              ))}
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-semibold text-card-foreground mb-2">Fast path (Google Vision only)</p>
                <CodeBlock code={RESPONSE_EXAMPLE} lang="json" />
              </div>
              <div>
                <p className="text-sm font-semibold text-card-foreground mb-2">Gray zone (Claude escalation)</p>
                <CodeBlock code={GRAY_ZONE_EXAMPLE} lang="json" />
              </div>
            </div>
          </Section>

          <Section id="errors" title="Errors & Status Codes">
            <div className="border border-border rounded-xl overflow-hidden">
              {[
                { code: "200", label: "allow",  color: "text-green-600 dark:text-green-400",   bg: "bg-green-50 dark:bg-green-900/20",   desc: "Content passed — safe to publish" },
                { code: "422", label: "flag",   color: "text-yellow-600 dark:text-yellow-400", bg: "bg-yellow-50 dark:bg-yellow-900/20", desc: "Flagged for human review — do not auto-publish" },
                { code: "422", label: "block",  color: "text-red-600 dark:text-red-400",       bg: "bg-red-50 dark:bg-red-900/20",       desc: "Blocked — policy violation, reject upload" },
                { code: "400", label: "error",  color: "text-gray-500",                        bg: "",                                   desc: "No file uploaded" },
                { code: "401", label: "error",  color: "text-gray-500",                        bg: "",                                   desc: "Invalid or missing API key" },
                { code: "415", label: "error",  color: "text-gray-500",                        bg: "",                                   desc: "Unsupported file type" },
                { code: "429", label: "error",  color: "text-yellow-600 dark:text-yellow-400", bg: "",                                   desc: "Rate limit exceeded — check Retry-After header" },
                { code: "500", label: "error",  color: "text-red-600 dark:text-red-400",       bg: "",                                   desc: "Server error — request will not be billed" },
              ].map(({ code, label, color, bg, desc }) => (
                <div key={code + desc} className={`flex items-center gap-4 px-4 py-3 border-b border-border last:border-0 ${bg}`}>
                  <code className="font-mono text-sm text-card-foreground w-10 shrink-0">{code}</code>
                  <span className={`text-xs font-bold w-12 shrink-0 ${color}`}>{label}</span>
                  <span className="text-sm text-muted-foreground">{desc}</span>
                </div>
              ))}
            </div>
          </Section>

          <Section id="rate-limits" title="Rate Limits">
            <p className="text-muted-foreground mb-4 text-sm leading-relaxed">
              Rate limits are enforced per API key using a sliding 1-hour window.
              Free accounts: 100 req/hour. Pro accounts: 1,000 req/hour.
            </p>
            <div className="border border-border rounded-xl overflow-hidden">
              {[
                { h: "X-RateLimit-Limit",     desc: "Total requests allowed in the current window" },
                { h: "X-RateLimit-Remaining", desc: "Requests remaining before you hit the limit" },
                { h: "X-RateLimit-Reset",     desc: "Unix timestamp (seconds) when the window resets" },
                { h: "Retry-After",            desc: "Seconds to wait before retrying (only present on 429)" },
              ].map(({ h, desc }) => (
                <div key={h} className="flex items-center gap-4 px-4 py-3 border-b border-border last:border-0">
                  <code className="font-mono text-xs text-brand-600 dark:text-brand-400 w-52 shrink-0">{h}</code>
                  <span className="text-sm text-muted-foreground">{desc}</span>
                </div>
              ))}
            </div>
          </Section>

          <Section id="examples" title="Code Examples">
            <div className="flex gap-1 mb-4">
              {EXAMPLES.map(({ tab }, i) => (
                <button
                  key={tab}
                  onClick={() => setExampleIdx(i)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${exampleIdx === i ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-accent"}`}
                >
                  {tab}
                </button>
              ))}
            </div>
            <CodeBlock code={EXAMPLES[exampleIdx].code} lang={EXAMPLES[exampleIdx].lang} />
          </Section>

        </div>
      </div>
    </div>
  );
}
