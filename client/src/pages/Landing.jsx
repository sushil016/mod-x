import { useState } from "react";
import { motion, useMotionValueEvent, useScroll } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "../lib/api.js";
import { useTheme } from "../context/ThemeContext.jsx";
import {
  Activity,
  ArrowRight,
  BadgeCheck,
  BarChart3,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Code2,
  Copy,
  FileVideo,
  Gauge,
  KeyRound,
  LayoutDashboard,
  LockKeyhole,
  Moon,
  ShieldCheck,
  Sparkles,
  Sun,
  UploadCloud,
  Webhook,
  Zap,
} from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } },
};

const stagger = (delay = 0.08) => ({
  hidden: {},
  show: { transition: { staggerChildren: delay } },
});

const viewOpts = { once: true, margin: "-80px" };

const CURL_EXAMPLE = `curl -X POST https://mod-x-409486837822.asia-south1.run.app/moderate \\
  -H "Authorization: Bearer mod_sk_live_..." \\
  -F "file=@upload.mp4"`;

const JS_EXAMPLE = `const form = new FormData();
form.append("file", file);

const res = await fetch("https://mod-x-409486837822.asia-south1.run.app/moderate", {
  method: "POST",
  headers: { Authorization: \`Bearer \${MODME_API_KEY}\` },
  body: form,
});

const result = await res.json();
if (result.finalDecision === "block") hideUpload();`;

const PYTHON_EXAMPLE = `import requests

with open("photo.jpg", "rb") as file:
    result = requests.post(
        "https://mod-x-409486837822.asia-south1.run.app/moderate",
        headers={"Authorization": "Bearer mod_sk_live_..."},
        files={"file": file},
    ).json()

print(result["finalDecision"])`;

const TABS = [
  { label: "cURL", code: CURL_EXAMPLE, lang: "bash" },
  { label: "JavaScript", code: JS_EXAMPLE, lang: "javascript" },
  { label: "Python", code: PYTHON_EXAMPLE, lang: "python" },
];

const PIPELINE = [
  {
    icon: UploadCloud,
    title: "One Upload",
    body: "Accept images, GIFs, WebP, MP4, WebM, and MOV through the same endpoint.",
  },
  {
    icon: Gauge,
    title: "Fast First Pass",
    body: "Google Vision handles the clear allow and block cases before costs rise.",
  },
  {
    icon: Sparkles,
    title: "Gray Zone AI",
    body: "Only uncertain media is escalated to context-aware review on Vertex AI.",
  },
  {
    icon: Webhook,
    title: "Ship Decisions",
    body: "Return allow, flag, or block with scores, reason, latency, and metadata.",
  },
];

const USE_CASES = [
  "Student creator platforms",
  "Social apps and communities",
  "Course uploads and LMS tools",
  "Marketplaces with media reviews",
  "Chat apps with image sharing",
  "UGC games and avatars",
];

const PLANS = [
  {
    name: "Launch",
    price: "$0",
    period: "to start",
    limit: "100 requests / hour",
    cta: "Create free API key",
    featured: false,
    features: ["Image, GIF, and video moderation", "API keys and playground", "Usage analytics", "Google Vision fast path"],
  },
  {
    name: "Scale",
    price: "$29",
    period: "/ month",
    limit: "1,000 requests / hour",
    cta: "Start Scale",
    featured: true,
    features: ["Higher rate limits", "Gray-zone AI escalation", "Webhook callbacks", "Priority support"],
  },
  {
    name: "Platform",
    price: "Custom",
    period: "",
    limit: "Custom limits and SLA",
    cta: "Talk to us",
    featured: false,
    features: ["Dedicated thresholds", "Human review exports", "Private deployment help", "Volume pricing"],
  },
];

function CodeBlock({ code, lang }) {
  const [copied, setCopied] = useState(false);
  function copy() {
    navigator.clipboard.writeText(code).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  return (
    <div className="overflow-hidden rounded-lg border border-slate-800 bg-slate-950 shadow-2xl shadow-slate-950/20">
      <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900 px-4 py-3">
        <span className="font-mono text-xs text-slate-400">{lang}</span>
        <button
          onClick={copy}
          className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-semibold text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
        >
          {copied ? <Check size={13} /> : <Copy size={13} />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="overflow-x-auto p-5 font-mono text-sm leading-7 text-slate-200">{code}</pre>
    </div>
  );
}

function DecisionRow({ status, label, layer, ms, tone }) {
  const tones = {
    allow: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-300",
    flag: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-300",
    block: "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-300",
  };

  return (
    <div className="decision-row-animate grid grid-cols-[88px_1fr_auto] items-center gap-3 border-b border-slate-200 px-4 py-3 last:border-b-0 dark:border-slate-800">
      <span className={`rounded-md border px-2 py-1 text-center text-xs font-extrabold uppercase ${tones[tone]}`}>{status}</span>
      <div className="min-w-0">
        <div className="truncate text-sm font-semibold text-slate-900 dark:text-white">{label}</div>
        <div className="text-xs text-slate-500 dark:text-slate-400">{layer}</div>
      </div>
      <span className="font-mono text-xs text-slate-500 dark:text-slate-400">{ms}ms</span>
    </div>
  );
}

function ProductConsole() {
  return (
    <div className="product-frame landing-console">
      <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-950 text-white dark:bg-white dark:text-slate-950">
            <ShieldCheck size={16} />
          </div>
          <div>
            <div className="text-sm font-extrabold text-slate-950 dark:text-white">Moderation Console</div>
            <div className="text-xs text-slate-500">Live product surface</div>
          </div>
        </div>
        <span className="console-status rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs font-bold text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300">
          API online
        </span>
      </div>

      <div className="grid gap-0 md:grid-cols-[1fr_220px]">
        <div className="border-b border-slate-200 p-5 dark:border-slate-800 md:border-b-0 md:border-r">
          <div className="mb-4 grid grid-cols-3 gap-3">
            {[
              ["312ms", "median latency"],
              ["15%", "AI escalated"],
              ["3", "media types"],
            ].map(([value, label]) => (
              <div key={label} className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900">
                <div className="text-xl font-extrabold text-slate-950 dark:text-white">{value}</div>
                <div className="text-xs text-slate-500 dark:text-slate-400">{label}</div>
              </div>
            ))}
          </div>
          <div className="overflow-hidden rounded-lg border border-slate-200 dark:border-slate-800">
            <DecisionRow status="allow" label="profile-photo.jpeg" layer="Google Vision fast path" ms="287" tone="allow" />
            <DecisionRow status="flag" label="student-short.mp4" layer="Vertex AI gray-zone review" ms="1840" tone="flag" />
            <DecisionRow status="block" label="chat-upload.gif" layer="Google Vision threshold" ms="341" tone="block" />
          </div>
        </div>

        <div className="p-5">
          <div className="mb-4 text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Result payload</div>
          <div className="space-y-3">
            {[
              ["finalDecision", "flag"],
              ["sourceType", "video"],
              ["adult", "0.50"],
              ["racy", "0.75"],
              ["layer", "claude_vertex"],
            ].map(([key, value]) => (
              <div key={key} className="flex items-center justify-between gap-3">
                <span className="font-mono text-xs text-slate-500">{key}</span>
                <span className="payload-pill rounded-md bg-slate-100 px-2 py-1 font-mono text-xs font-bold text-slate-800 dark:bg-slate-800 dark:text-slate-100">{value}</span>
              </div>
            ))}
          </div>
          <div className="mt-5 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200">
            Uncertain content is flagged instead of silently approved.
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Landing() {
  const { theme, toggleTheme } = useTheme();
  const [tab, setTab] = useState(1);
  const [navScrolled, setNavScrolled] = useState(false);
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (v) => setNavScrolled(v > 10));

  const { data: user } = useQuery({
    queryKey: ["me"],
    queryFn: () => apiGet("/api/me"),
    retry: false,
    staleTime: 60_000,
  });

  const primaryHref = user ? "/dashboard" : "/auth/google";
  const primaryLabel = user ? "Open Dashboard" : "Get API Key";

  return (
    <div className="min-h-screen overflow-x-hidden bg-stone-50 text-slate-950 dark:bg-slate-950 dark:text-slate-100">
      <nav className={`sticky top-0 z-40 border-b transition-colors ${navScrolled ? "border-slate-200 bg-stone-50/95 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/95" : "border-transparent bg-transparent"}`}>
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-6">
          <a href="/" className="flex items-center gap-3" aria-label="ModMe home">
            <img src="/logom.png" alt="ModMe" className="h-8 w-auto object-contain" />
            <span className="hidden rounded-md border border-slate-200 px-2 py-1 text-xs font-bold text-slate-500 dark:border-slate-800 dark:text-slate-400 sm:inline-flex">
              Moderation API
            </span>
          </a>
          <div className="flex items-center gap-2 sm:gap-5">
            <a href="#product" className="hidden text-sm font-semibold text-slate-600 hover:text-slate-950 dark:text-slate-400 dark:hover:text-white md:block">Product</a>
            <a href="/docs" className="hidden text-sm font-semibold text-slate-600 hover:text-slate-950 dark:text-slate-400 dark:hover:text-white md:block">Docs</a>
            <a href="#pricing" className="hidden text-sm font-semibold text-slate-600 hover:text-slate-950 dark:text-slate-400 dark:hover:text-white md:block">Pricing</a>
            <button onClick={toggleTheme} className="icon-btn" aria-label="Toggle theme">
              {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            <a href={primaryHref} className="inline-flex items-center gap-2 rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-extrabold text-white shadow-lg shadow-slate-950/10 transition-transform hover:-translate-y-0.5 dark:bg-white dark:text-slate-950">
              {user ? <LayoutDashboard size={16} /> : <KeyRound size={16} />}
              {primaryLabel}
            </a>
          </div>
        </div>
      </nav>

      <main>
        <section className="relative mx-auto grid min-h-[calc(100vh-76px)] max-w-7xl items-center gap-10 px-5 py-12 sm:px-6 lg:grid-cols-[0.95fr_1.05fr] lg:py-16">
          <motion.div variants={stagger()} initial="hidden" animate="show" className="flex flex-col justify-center">
            <motion.div variants={fadeUp} className="mb-6 inline-flex w-fit items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-extrabold uppercase tracking-[0.18em] text-slate-600 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
              <BadgeCheck size={14} className="text-brand-600" />
              Plug-and-play media safety
            </motion.div>
            <motion.h1 variants={fadeUp} className="max-w-4xl text-5xl font-extrabold leading-[0.98] tracking-normal text-slate-950 dark:text-white sm:text-6xl lg:text-7xl">
              Protect uploads with one moderation API.
            </motion.h1>
            <motion.p variants={fadeUp} className="mt-6 max-w-2xl text-lg leading-8 text-slate-600 dark:text-slate-300">
              ModMe gives apps a single endpoint for images, GIFs, and videos. Google Vision makes the fast call, Vertex AI handles the gray zone, and your product gets a clean allow, flag, or block response.
            </motion.p>
            <motion.div variants={fadeUp} className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a href={primaryHref} className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-600 px-6 py-3.5 text-sm font-extrabold text-white shadow-xl shadow-brand-600/20 transition-colors hover:bg-brand-700">
                {primaryLabel}
                <ArrowRight size={17} />
              </a>
              <a href="/docs" className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-6 py-3.5 text-sm font-extrabold text-slate-900 transition-colors hover:border-slate-950 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:hover:border-slate-400">
                View API Docs
                <ChevronRight size={17} />
              </a>
            </motion.div>
            <motion.div variants={fadeUp} className="mt-8 grid max-w-xl grid-cols-3 divide-x divide-slate-200 border-y border-slate-200 py-4 dark:divide-slate-800 dark:border-slate-800">
              {[
                ["<400ms", "fast path"],
                ["~15%", "AI review"],
                ["100MB", "uploads"],
              ].map(([value, label]) => (
                <div key={label} className="px-4 first:pl-0">
                  <div className="text-xl font-extrabold text-slate-950 dark:text-white">{value}</div>
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</div>
                </div>
              ))}
            </motion.div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18, duration: 0.65, ease: [0.22, 1, 0.36, 1] }} className="relative">
            <ProductConsole />
          </motion.div>
        </section>

        <section id="product" className="border-y border-slate-200 bg-white py-16 dark:border-slate-800 dark:bg-slate-900/40">
          <div className="mx-auto max-w-7xl px-5 sm:px-6">
            <motion.div variants={stagger()} initial="hidden" whileInView="show" viewport={viewOpts} className="grid gap-6 md:grid-cols-4">
              {PIPELINE.map(({ icon: Icon, title, body }) => (
                <motion.div key={title} variants={fadeUp} className="rounded-lg border border-slate-200 bg-stone-50 p-5 dark:border-slate-800 dark:bg-slate-950">
                  <Icon size={22} className="mb-5 text-brand-600" />
                  <h2 className="text-base font-extrabold text-slate-950 dark:text-white">{title}</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">{body}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        <section className="mx-auto grid max-w-7xl gap-10 px-5 py-20 sm:px-6 lg:grid-cols-[0.85fr_1.15fr]">
          <motion.div variants={stagger()} initial="hidden" whileInView="show" viewport={viewOpts}>
            <motion.div variants={fadeUp} className="mb-4 text-xs font-extrabold uppercase tracking-[0.18em] text-brand-700 dark:text-brand-400">Developer experience</motion.div>
            <motion.h2 variants={fadeUp} className="text-4xl font-extrabold leading-tight text-slate-950 dark:text-white sm:text-5xl">
              Your users upload media. Your app gets a verdict.
            </motion.h2>
            <motion.p variants={fadeUp} className="mt-5 text-lg leading-8 text-slate-600 dark:text-slate-300">
              The product is built as dependable infrastructure: API keys, rate limits, analytics, playground testing, and response payloads your customers can trust.
            </motion.p>
            <motion.div variants={fadeUp} className="mt-8 grid gap-3 sm:grid-cols-2">
              {USE_CASES.map((item) => (
                <div key={item} className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-3 py-3 text-sm font-semibold text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
                  <CheckCircle2 size={16} className="text-emerald-500" />
                  {item}
                </div>
              ))}
            </motion.div>
          </motion.div>

          <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={viewOpts}>
            <div className="mb-3 flex gap-2">
              {TABS.map((item, idx) => (
                <button
                  key={item.label}
                  onClick={() => setTab(idx)}
                  className={`rounded-md px-4 py-2 text-xs font-extrabold transition-colors ${tab === idx ? "bg-slate-950 text-white dark:bg-white dark:text-slate-950" : "border border-slate-200 bg-white text-slate-500 hover:text-slate-950 dark:border-slate-800 dark:bg-slate-900 dark:hover:text-white"}`}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <CodeBlock code={TABS[tab].code} lang={TABS[tab].lang} />
          </motion.div>
        </section>

        <section className="bg-slate-950 py-20 text-white">
          <div className="mx-auto max-w-7xl px-5 sm:px-6">
            <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
              <div>
                <div className="mb-4 text-xs font-extrabold uppercase tracking-[0.18em] text-brand-400">Why teams choose it</div>
                <h2 className="text-4xl font-extrabold leading-tight sm:text-5xl">A moderation layer that feels like infrastructure, not a script.</h2>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  [LockKeyhole, "API key control", "Create, revoke, and separate keys for production and testing."],
                  [BarChart3, "Usage analytics", "Track requests, blocked media, flagged media, and pass rate."],
                  [Clock3, "Cost discipline", "Avoid expensive AI calls when Vision can make a clear decision."],
                  [FileVideo, "Video ready", "Extract frames from GIFs and videos before scoring the worst moments."],
                  [Code2, "Simple payloads", "Return decisions developers can wire into product workflows immediately."],
                  [Zap, "Review queue ready", "Flag uncertain content for human review instead of risking approvals."],
                ].map(([Icon, title, body]) => (
                  <div key={title} className="rounded-lg border border-white/10 bg-white/[0.04] p-5">
                    <Icon size={20} className="mb-4 text-brand-400" />
                    <div className="font-extrabold">{title}</div>
                    <p className="mt-2 text-sm leading-6 text-slate-400">{body}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="pricing" className="mx-auto max-w-7xl px-5 py-20 sm:px-6">
          <div className="mb-10 max-w-2xl">
            <div className="mb-4 text-xs font-extrabold uppercase tracking-[0.18em] text-brand-700 dark:text-brand-400">Pricing</div>
            <h2 className="text-4xl font-extrabold text-slate-950 dark:text-white sm:text-5xl">Start free, scale when traffic grows.</h2>
            <p className="mt-4 text-lg leading-8 text-slate-600 dark:text-slate-300">Clear plans for prototypes, production apps, and larger platforms with custom limits.</p>
          </div>

          <div className="grid gap-5 lg:grid-cols-3">
            {PLANS.map((plan) => (
              <div key={plan.name} className={`rounded-lg border p-6 ${plan.featured ? "border-brand-500 bg-brand-50 shadow-2xl shadow-brand-600/10 dark:bg-brand-950/20" : "border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"}`}>
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-xl font-extrabold text-slate-950 dark:text-white">{plan.name}</h3>
                  {plan.featured && <span className="rounded-md bg-brand-600 px-2 py-1 text-xs font-extrabold text-white">Best value</span>}
                </div>
                <div className="mt-5">
                  <span className="text-5xl font-extrabold text-slate-950 dark:text-white">{plan.price}</span>
                  <span className="ml-1 text-sm font-semibold text-slate-500">{plan.period}</span>
                </div>
                <div className="mt-3 text-sm font-bold text-brand-700 dark:text-brand-300">{plan.limit}</div>
                <ul className="mt-6 space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
                      <Check size={16} className="text-emerald-500" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <a href={plan.name === "Launch" ? primaryHref : `/checkout?plan=${plan.name.toLowerCase()}`} className={`mt-8 inline-flex w-full items-center justify-center gap-2 rounded-lg px-5 py-3 text-sm font-extrabold transition-colors ${plan.featured ? "bg-brand-600 text-white hover:bg-brand-700" : "border border-slate-300 text-slate-900 hover:border-slate-950 dark:border-slate-700 dark:text-white dark:hover:border-slate-400"}`}>
                  {plan.cta}
                  <ArrowRight size={16} />
                </a>
              </div>
            ))}
          </div>
        </section>

        <section className="border-t border-slate-200 bg-white py-16 dark:border-slate-800 dark:bg-slate-900/40">
          <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-8 px-5 sm:px-6 lg:flex-row lg:items-center">
            <div>
              <div className="mb-3 flex items-center gap-2 text-sm font-extrabold text-slate-950 dark:text-white">
                <Activity size={16} className="text-brand-600" />
                Ready for launch
              </div>
              <h2 className="max-w-3xl text-3xl font-extrabold leading-tight text-slate-950 dark:text-white sm:text-4xl">
                Give your product a moderation API developers can understand in one minute and integrate in five.
              </h2>
            </div>
            <a href={primaryHref} className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-slate-950 px-6 py-3.5 text-sm font-extrabold text-white dark:bg-white dark:text-slate-950">
              {primaryLabel}
              <ArrowRight size={17} />
            </a>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 py-8 dark:border-slate-800">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-5 text-sm text-slate-500 dark:text-slate-400 sm:px-6 md:flex-row">
          <img src="/logom.png" alt="ModMe" className="h-7 w-auto object-contain" />
          <span>Content Moderation API for images, GIFs, and videos.</span>
          <div className="flex items-center gap-5">
            <a href="/docs" className="font-semibold hover:text-slate-950 dark:hover:text-white">Docs</a>
            <a href="#pricing" className="font-semibold hover:text-slate-950 dark:hover:text-white">Pricing</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
