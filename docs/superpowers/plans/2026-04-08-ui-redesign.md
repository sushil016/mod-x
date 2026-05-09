# UI Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the entire frontend with dark/light theme switch, a marketing-focused landing page, a separate docs page, a sidebar-based production dashboard, and dark mode support across all pages.

**Architecture:** Add a ThemeContext (localStorage-persisted, `dark` class on `<html>`) and replace the top-nav layout with a left sidebar for authenticated pages. The landing page becomes a pure marketing page with an embedded playground preview section; API docs move to a dedicated `/docs` page. The dashboard becomes a full-page overview with sidebar navigation and profile.

**Tech Stack:** React 18, Vite, TailwindCSS 3 (darkMode: 'class'), TanStack Query v5, Recharts, lucide-react (add), React Router v6

---

## File Map

**New files:**
- `client/src/context/ThemeContext.jsx` — theme state + localStorage persistence
- `client/src/components/Sidebar.jsx` — left sidebar with nav, profile, theme toggle
- `client/src/pages/Docs.jsx` — full API documentation page

**Modified files:**
- `client/package.json` — add `lucide-react`
- `client/tailwind.config.js` — add `darkMode: 'class'`
- `client/src/main.jsx` — wrap with ThemeProvider
- `client/src/App.jsx` — new layout: sidebar for auth pages, /docs route
- `client/src/pages/Landing.jsx` — marketing focus, playground preview, theme toggle
- `client/src/pages/Dashboard.jsx` — overview page: stats cards + key management
- `client/src/pages/Playground.jsx` — dark mode + style polish
- `client/src/pages/Stats.jsx` — dark mode + style polish
- `client/src/pages/Admin.jsx` — dark mode + style polish
- `client/src/pages/Login.jsx` — dark mode + style polish
- `client/src/components/KeyCard.jsx` — dark mode support
- `client/src/components/VerdictBadge.jsx` — dark mode support
- `client/src/components/ScoreBar.jsx` — dark mode support
- `client/src/components/UsageChart.jsx` — dark mode support

---

### Task 1: Theme System + Install lucide-react

**Files:**
- Modify: `client/package.json`
- Modify: `client/tailwind.config.js`
- Create: `client/src/context/ThemeContext.jsx`
- Modify: `client/src/main.jsx`

- [ ] **Step 1: Add lucide-react to client/package.json**

```json
{
  "name": "mod-me-client",
  "private": true,
  "version": "0.0.1",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^6.23.1",
    "@tanstack/react-query": "^5.40.0",
    "recharts": "^2.12.7",
    "lucide-react": "^0.441.0"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.3.1",
    "autoprefixer": "^10.4.19",
    "postcss": "^8.4.38",
    "tailwindcss": "^3.4.4",
    "vite": "^5.3.1"
  }
}
```

- [ ] **Step 2: Run npm install in client/**

```bash
cd /Users/sushilsahani/devsushil/mod-me/client && npm install
```
Expected: `added N packages` with no errors.

- [ ] **Step 3: Enable Tailwind dark mode**

Write `client/tailwind.config.js`:
```js
/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        brand: { 500: "#6366f1", 600: "#4f46e5", 700: "#4338ca" },
      },
    },
  },
  plugins: [],
};
```

- [ ] **Step 4: Create ThemeContext**

Write `client/src/context/ThemeContext.jsx`:
```jsx
import { createContext, useContext, useEffect, useState } from "react";

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem("theme");
    if (saved) return saved;
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    localStorage.setItem("theme", theme);
  }, [theme]);

  function toggleTheme() {
    setTheme(t => (t === "dark" ? "light" : "dark"));
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
```

- [ ] **Step 5: Wrap app with ThemeProvider in main.jsx**

Write `client/src/main.jsx`:
```jsx
import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import App from "./App.jsx";
import { ThemeProvider } from "./context/ThemeContext.jsx";
import "./index.css";

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </QueryClientProvider>
  </React.StrictMode>
);
```

- [ ] **Step 6: Commit**

```bash
git add client/package.json client/package-lock.json client/tailwind.config.js client/src/context/ThemeContext.jsx client/src/main.jsx
git commit -m "feat: add theme system (dark/light) + lucide-react"
```

---

### Task 2: Sidebar Component + App Layout

**Files:**
- Create: `client/src/components/Sidebar.jsx`
- Modify: `client/src/App.jsx`

- [ ] **Step 1: Write Sidebar component**

Write `client/src/components/Sidebar.jsx`:
```jsx
import { NavLink, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "../lib/api.js";
import { useTheme } from "../context/ThemeContext.jsx";
import {
  Key, LayoutDashboard, FlaskConical, BarChart3,
  ShieldCheck, Sun, Moon, LogOut, ChevronRight
} from "lucide-react";

const NAV = [
  { to: "/dashboard",  label: "Dashboard",  icon: LayoutDashboard },
  { to: "/playground", label: "Playground", icon: FlaskConical },
  { to: "/stats",      label: "Analytics",  icon: BarChart3 },
  { to: "/keys",       label: "API Keys",   icon: Key },
];

export default function Sidebar() {
  const { theme, toggleTheme } = useTheme();
  const { data: user } = useQuery({
    queryKey: ["me"],
    queryFn: () => apiGet("/api/me"),
    retry: false,
  });

  function logout() {
    fetch("/auth/logout", { method: "POST", credentials: "include" })
      .then(() => { window.location = "/"; });
  }

  return (
    <aside className="fixed inset-y-0 left-0 w-60 flex flex-col bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 z-30">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-5 border-b border-gray-100 dark:border-gray-800">
        <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center text-white font-black text-sm shrink-0">M</div>
        <div>
          <div className="font-bold text-gray-900 dark:text-white text-sm leading-none">ModMe</div>
          <div className="text-xs text-gray-400 mt-0.5">Content Moderation</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {NAV.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors group ${
                isActive
                  ? "bg-brand-600 text-white shadow-sm shadow-brand-600/30"
                  : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={17} className={isActive ? "text-white" : "text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300"} />
                {label}
              </>
            )}
          </NavLink>
        ))}

        {user?.is_admin && (
          <NavLink
            to="/admin"
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors group ${
                isActive
                  ? "bg-brand-600 text-white"
                  : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <ShieldCheck size={17} className={isActive ? "text-white" : "text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300"} />
                Admin
              </>
            )}
          </NavLink>
        )}
      </nav>

      {/* Bottom: theme toggle + profile */}
      <div className="border-t border-gray-100 dark:border-gray-800 p-3 space-y-1">
        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          {theme === "dark"
            ? <Sun size={17} className="text-amber-400" />
            : <Moon size={17} className="text-gray-400" />}
          {theme === "dark" ? "Light mode" : "Dark mode"}
        </button>

        {/* Profile */}
        {user && (
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors group">
            <img
              src={user.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.email)}&background=4f46e5&color=fff`}
              alt=""
              className="w-7 h-7 rounded-full shrink-0"
            />
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium text-gray-800 dark:text-gray-200 truncate">{user.name || user.email.split("@")[0]}</div>
              <div className="text-xs text-gray-400 truncate">{user.plan || "free"}</div>
            </div>
            <button
              onClick={logout}
              title="Logout"
              className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-red-500"
            >
              <LogOut size={14} />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
```

- [ ] **Step 2: Rewrite App.jsx with sidebar layout and /docs route**

Write `client/src/App.jsx`:
```jsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "./lib/api.js";
import Sidebar from "./components/Sidebar.jsx";
import Landing from "./pages/Landing.jsx";
import Login from "./pages/Login.jsx";
import Docs from "./pages/Docs.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Keys from "./pages/Dashboard.jsx";
import Playground from "./pages/Playground.jsx";
import Stats from "./pages/Stats.jsx";
import Admin from "./pages/Admin.jsx";

function AuthGuard({ children, adminOnly = false }) {
  const { data: user, isLoading, isError } = useQuery({
    queryKey: ["me"],
    queryFn: () => apiGet("/api/me"),
    retry: false,
  });

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
      <div className="w-6 h-6 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );
  if (isError || !user) return <Navigate to="/login" replace />;
  if (adminOnly && !user.is_admin) return <Navigate to="/dashboard" replace />;

  return children;
}

function AppLayout() {
  return (
    <AuthGuard>
      <div className="flex min-h-screen bg-gray-50 dark:bg-gray-950">
        <Sidebar />
        <main className="ml-60 flex-1 min-h-screen overflow-y-auto">
          <div className="max-w-6xl mx-auto px-8 py-8">
            <Routes>
              <Route path="/dashboard"  element={<Dashboard />} />
              <Route path="/keys"       element={<Dashboard />} />
              <Route path="/playground" element={<Playground />} />
              <Route path="/stats"      element={<Stats />} />
              <Route path="/admin"      element={
                <AuthGuard adminOnly>
                  <Admin />
                </AuthGuard>
              } />
            </Routes>
          </div>
        </main>
      </div>
    </AuthGuard>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"       element={<Landing />} />
        <Route path="/login"  element={<Login />} />
        <Route path="/docs"   element={<Docs />} />
        <Route path="/*"      element={<AppLayout />} />
      </Routes>
    </BrowserRouter>
  );
}
```

- [ ] **Step 3: Verify the app compiles**

```bash
cd /Users/sushilsahani/devsushil/mod-me/client && npm run build 2>&1 | tail -20
```
Expected: Build succeeds or only shows minor warnings (not errors).

- [ ] **Step 4: Commit**

```bash
git add client/src/components/Sidebar.jsx client/src/App.jsx
git commit -m "feat: sidebar layout replacing top nav for authenticated pages"
```

---

### Task 3: Landing Page Redesign

**Files:**
- Modify: `client/src/pages/Landing.jsx`

The new landing page is a pure marketing page. It includes: nav with theme toggle, hero, how-it-works, playground preview (visual mockup, no auth required), plans, and footer. API docs link goes to /docs.

- [ ] **Step 1: Write the new Landing.jsx**

Write `client/src/pages/Landing.jsx`:
```jsx
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
              title="Toggle theme"
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
            {/* Toolbar */}
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

              {/* Simulated Result */}
              {demoRunning && (
                <div className="flex items-center gap-3 bg-brand-50 dark:bg-brand-950/30 border border-brand-200 dark:border-brand-800 rounded-xl p-4">
                  <div className="w-4 h-4 border-2 border-brand-600 border-t-transparent rounded-full animate-spin shrink-0" />
                  <p className="text-sm text-brand-700 dark:text-brand-300">Running moderation pipeline...</p>
                </div>
              )}

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
                    This is a simulated demo. <a href="/auth/google" className="text-brand-600 dark:text-brand-400 hover:underline">Sign in</a> to use the live playground with your own API keys.
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
```

- [ ] **Step 2: Build to verify no errors**

```bash
cd /Users/sushilsahani/devsushil/mod-me/client && npm run build 2>&1 | tail -10
```

- [ ] **Step 3: Commit**

```bash
git add client/src/pages/Landing.jsx
git commit -m "feat: redesign landing page with playground preview + theme toggle"
```

---

### Task 4: Docs Page

**Files:**
- Create: `client/src/pages/Docs.jsx`

A dedicated API documentation page accessible at `/docs` (no auth required). Includes nav with theme toggle, endpoint reference, request/response format, code examples, rate limit headers, and error codes.

- [ ] **Step 1: Write Docs.jsx**

Write `client/src/pages/Docs.jsx`:
```jsx
import { useState } from "react";
import { useTheme } from "../context/ThemeContext.jsx";
import { Sun, Moon, ArrowLeft } from "lucide-react";

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

const CURL = `curl -X POST https://mod-x-409486837822.asia-south1.run.app/moderate \\
  -H "Authorization: Bearer mod_sk_your_key" \\
  -F "file=@image.jpg"`;

const JS = `const form = new FormData();
form.append("file", fileInput.files[0]);

const res = await fetch("https://mod-x-409486837822.asia-south1.run.app/moderate", {
  method: "POST",
  headers: { Authorization: "Bearer mod_sk_your_key" },
  body: form,
});

const result = await res.json();
// result.finalDecision === "allow" | "flag" | "block"`;

const PYTHON = `import requests

with open("image.jpg", "rb") as f:
    res = requests.post(
        "https://mod-x-409486837822.asia-south1.run.app/moderate",
        headers={"Authorization": "Bearer mod_sk_your_key"},
        files={"file": f},
    )

data = res.json()
print(data["finalDecision"])  # "allow" | "flag" | "block"`;

function CodeBlock({ code, lang }) {
  const [copied, setCopied] = useState(false);
  function copy() {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }
  return (
    <div className="rounded-xl bg-gray-950 border border-gray-800 overflow-hidden text-left">
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

function Section({ id, title, children }) {
  return (
    <section id={id} className="scroll-mt-20 mb-14">
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 pb-3 border-b border-gray-200 dark:border-gray-800">{title}</h2>
      {children}
    </section>
  );
}

export default function Docs() {
  const { theme, toggleTheme } = useTheme();
  const [codeTab, setCodeTab] = useState(0);
  const TABS = ["cURL", "JavaScript", "Python"];
  const CODE  = [CURL, JS, PYTHON];
  const LANGS = ["bash", "javascript", "python"];

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 transition-colors">

      {/* Nav */}
      <nav className="sticky top-0 z-40 border-b border-gray-200 dark:border-gray-800 bg-white/90 dark:bg-gray-950/90 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <a href="/" className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
              <ArrowLeft size={14} /> Back
            </a>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-brand-600 flex items-center justify-center text-white font-black text-xs">M</div>
              <span className="font-bold text-gray-900 dark:text-white">API Reference</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={toggleTheme} className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              {theme === "dark" ? <Sun size={16} className="text-amber-400" /> : <Moon size={16} />}
            </button>
            <a href="/auth/google" className="bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
              Get API key
            </a>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-12 flex gap-12">
        {/* Sidebar TOC */}
        <aside className="hidden lg:block w-48 shrink-0 sticky top-24 self-start">
          <nav className="space-y-1">
            {[
              ["#overview",     "Overview"],
              ["#authentication","Authentication"],
              ["#endpoint",     "Endpoint"],
              ["#file-types",   "File Types"],
              ["#response",     "Response"],
              ["#errors",       "Errors"],
              ["#rate-limits",  "Rate Limits"],
              ["#examples",     "Examples"],
            ].map(([href, label]) => (
              <a key={href} href={href} className="block text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white py-1 transition-colors">
                {label}
              </a>
            ))}
          </nav>
        </aside>

        {/* Content */}
        <div className="flex-1 min-w-0 max-w-3xl">

          <Section id="overview" title="Overview">
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-4">
              ModMe provides a single REST API endpoint for content moderation. It accepts images, GIFs, and videos and returns a structured decision — <code className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded text-sm font-mono">allow</code>, <code className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded text-sm font-mono">flag</code>, or <code className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded text-sm font-mono">block</code>.
            </p>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              Moderation uses two AI layers: Google Cloud Vision SafeSearch for fast, cheap first-pass scoring, and Claude on Vertex AI for nuanced judgment in the gray zone (scores between 0.50 and 0.75). Only ~15% of content reaches Claude, keeping costs low.
            </p>
          </Section>

          <Section id="authentication" title="Authentication">
            <p className="text-gray-600 dark:text-gray-400 mb-4 leading-relaxed">
              All API requests must include your API key as a Bearer token in the <code className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded text-sm font-mono">Authorization</code> header.
            </p>
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 font-mono text-sm text-gray-300">
              Authorization: Bearer <span className="text-yellow-300">mod_sk_your_key_here</span>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-500 mt-3">
              Get your API key from the <a href="/dashboard" className="text-brand-600 dark:text-brand-400 hover:underline">dashboard</a> after signing in.
            </p>
          </Section>

          <Section id="endpoint" title="Endpoint">
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 mb-6">
              <div className="flex items-center gap-3 mb-4">
                <span className="bg-brand-600 text-white text-xs font-bold px-2.5 py-1 rounded-lg">POST</span>
                <code className="text-gray-900 dark:text-white font-mono text-sm">/moderate</code>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                Analyzes the uploaded file and returns a moderation decision. Accepts <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded font-mono text-xs">multipart/form-data</code>.
              </p>
              <div className="mb-4">
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Request Parameters</div>
                <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
                  <div className="flex items-center gap-4 px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                    <code className="text-brand-600 dark:text-brand-400 font-mono text-sm w-16">file</code>
                    <span className="text-xs text-gray-500 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 px-2 py-0.5 rounded-full">required</span>
                    <span className="text-sm text-gray-600 dark:text-gray-400">The media file to moderate (multipart form field)</span>
                  </div>
                  <div className="flex items-center gap-4 px-4 py-3">
                    <code className="text-brand-600 dark:text-brand-400 font-mono text-sm w-16">x-upload-id</code>
                    <span className="text-xs text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full border border-gray-200 dark:border-gray-700">header, optional</span>
                    <span className="text-sm text-gray-600 dark:text-gray-400">Your internal upload/asset ID (echoed in response.meta)</span>
                  </div>
                </div>
              </div>
            </div>
          </Section>

          <Section id="file-types" title="Supported File Types">
            <div className="flex flex-wrap gap-2 mb-4">
              {["image/jpeg", "image/png", "image/webp", "image/gif", "video/mp4", "video/webm", "video/quicktime"].map(t => (
                <code key={t} className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs px-2.5 py-1.5 rounded-lg font-mono border border-gray-200 dark:border-gray-700">{t}</code>
              ))}
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Maximum file size: <strong className="text-gray-700 dark:text-gray-300">100 MB</strong></p>
            <div className="mt-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-xl p-4 text-sm text-blue-800 dark:text-blue-300">
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
                <div key={field} className="flex items-start gap-3 py-2 border-b border-gray-100 dark:border-gray-800 last:border-0">
                  <code className="text-brand-600 dark:text-brand-400 font-mono text-xs w-36 shrink-0 mt-0.5">{field}</code>
                  <span className="text-xs text-yellow-600 dark:text-yellow-400 font-mono w-24 shrink-0 mt-0.5">{type}</span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">{desc}</span>
                </div>
              ))}
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Fast path response (Google Vision only)</p>
                <CodeBlock code={RESPONSE_EXAMPLE} lang="json" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Gray zone response (Claude escalation)</p>
                <CodeBlock code={GRAY_ZONE_EXAMPLE} lang="json" />
              </div>
            </div>
          </Section>

          <Section id="errors" title="Errors &amp; Status Codes">
            <div className="border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
              {[
                { code: "200", label: "allow",  color: "text-green-600 dark:text-green-400",  bg: "bg-green-50 dark:bg-green-900/20",  desc: "Content passed moderation — safe to publish" },
                { code: "422", label: "flag",   color: "text-yellow-600 dark:text-yellow-400", bg: "bg-yellow-50 dark:bg-yellow-900/20", desc: "Content flagged for human review — do not auto-publish" },
                { code: "422", label: "block",  color: "text-red-600 dark:text-red-400",    bg: "bg-red-50 dark:bg-red-900/20",    desc: "Content blocked — policy violation, reject upload" },
                { code: "400", label: "error",  color: "text-gray-600 dark:text-gray-400",  bg: "",                                 desc: "No file uploaded" },
                { code: "401", label: "error",  color: "text-gray-600 dark:text-gray-400",  bg: "",                                 desc: "Invalid or missing API key" },
                { code: "415", label: "error",  color: "text-gray-600 dark:text-gray-400",  bg: "",                                 desc: "Unsupported file type" },
                { code: "429", label: "error",  color: "text-yellow-600 dark:text-yellow-400", bg: "",                              desc: "Rate limit exceeded — check Retry-After header" },
                { code: "500", label: "error",  color: "text-red-600 dark:text-red-400",    bg: "",                                 desc: "Server error — request will not be billed" },
              ].map(({ code, label, color, bg, desc }) => (
                <div key={code + desc} className={`flex items-center gap-4 px-4 py-3 border-b border-gray-200 dark:border-gray-800 last:border-0 ${bg}`}>
                  <code className="font-mono text-sm text-gray-700 dark:text-gray-300 w-10 shrink-0">{code}</code>
                  <span className={`text-xs font-bold w-12 shrink-0 ${color}`}>{label}</span>
                  <span className="text-sm text-gray-600 dark:text-gray-400">{desc}</span>
                </div>
              ))}
            </div>
          </Section>

          <Section id="rate-limits" title="Rate Limits">
            <p className="text-gray-600 dark:text-gray-400 mb-4 text-sm leading-relaxed">
              Rate limits are enforced per API key using a sliding 1-hour window.
              Free accounts: 100 requests/hour. Pro accounts: 1,000 requests/hour.
            </p>
            <div className="border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden mb-4">
              {[
                { h: "X-RateLimit-Limit",     desc: "Total requests allowed in the current window" },
                { h: "X-RateLimit-Remaining", desc: "Requests remaining before you hit the limit" },
                { h: "X-RateLimit-Reset",     desc: "Unix timestamp (seconds) when the window resets" },
                { h: "Retry-After",            desc: "Seconds to wait before retrying (only present on 429)" },
              ].map(({ h, desc }) => (
                <div key={h} className="flex items-center gap-4 px-4 py-3 border-b border-gray-200 dark:border-gray-800 last:border-0">
                  <code className="font-mono text-xs text-brand-600 dark:text-brand-400 w-52 shrink-0">{h}</code>
                  <span className="text-sm text-gray-500 dark:text-gray-400">{desc}</span>
                </div>
              ))}
            </div>
          </Section>

          <Section id="examples" title="Code Examples">
            <div className="flex gap-1 mb-4">
              {TABS.map((t, i) => (
                <button
                  key={t}
                  onClick={() => setCodeTab(i)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${codeTab === i ? "bg-brand-600 text-white" : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800"}`}
                >
                  {t}
                </button>
              ))}
            </div>
            <CodeBlock code={CODE[codeTab]} lang={LANGS[codeTab]} />
          </Section>

        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Build to verify**

```bash
cd /Users/sushilsahani/devsushil/mod-me/client && npm run build 2>&1 | tail -10
```

- [ ] **Step 3: Commit**

```bash
git add client/src/pages/Docs.jsx
git commit -m "feat: add dedicated API documentation page at /docs"
```

---

### Task 5: Dashboard Home Redesign

**Files:**
- Modify: `client/src/pages/Dashboard.jsx`

The dashboard home is now a full overview: stats cards at the top (pulled from /api/stats), API keys section below with inline create, and a quick action row.

- [ ] **Step 1: Write new Dashboard.jsx**

Write `client/src/pages/Dashboard.jsx`:
```jsx
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost, apiPatch, apiDelete } from "../lib/api.js";
import { Key, Plus, TrendingUp, ShieldX, CheckCircle, Activity, Copy, MoreHorizontal, Trash2, Edit3, Check } from "lucide-react";

function StatCard({ label, value, icon: Icon, color = "brand", sub }) {
  const colors = {
    brand:  "bg-brand-50 dark:bg-brand-950/30 text-brand-600 dark:text-brand-400",
    green:  "bg-green-50 dark:bg-green-950/30 text-green-600 dark:text-green-400",
    red:    "bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400",
    yellow: "bg-yellow-50 dark:bg-yellow-950/30 text-yellow-600 dark:text-yellow-400",
  };
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-gray-500 dark:text-gray-400">{label}</span>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${colors[color]}`}>
          <Icon size={16} />
        </div>
      </div>
      <div className="text-2xl font-black text-gray-900 dark:text-white">{value ?? "—"}</div>
      {sub && <div className="text-xs text-gray-400 mt-1">{sub}</div>}
    </div>
  );
}

function KeyRow({ k, onRevoke, onRename }) {
  const [copied, setCopied] = useState(false);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(k.name);
  const isExpired = k.expires_at && new Date(k.expires_at) < new Date();
  const isActive = k.is_active && !isExpired;

  function copy() {
    navigator.clipboard.writeText(k.key);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function save() {
    onRename(k.id, name);
    setEditing(false);
  }

  return (
    <div className="flex items-center gap-4 px-5 py-4 border-b border-gray-100 dark:border-gray-800 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
      {/* Status dot */}
      <div className={`w-2 h-2 rounded-full shrink-0 ${isActive ? "bg-green-500" : "bg-gray-300 dark:bg-gray-600"}`} />

      {/* Name */}
      <div className="flex-1 min-w-0">
        {editing ? (
          <input
            className="bg-transparent border border-brand-300 dark:border-brand-700 rounded px-2 py-0.5 text-sm text-gray-900 dark:text-white focus:outline-none w-48"
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") save(); if (e.key === "Escape") setEditing(false); }}
            autoFocus
          />
        ) : (
          <div className="font-medium text-gray-900 dark:text-white text-sm">{k.name}</div>
        )}
        <div className="text-xs text-gray-400 mt-0.5">
          Created {new Date(k.created_at).toLocaleDateString()}
          {k.last_used_at && <span className="ml-2">· Used {new Date(k.last_used_at).toLocaleDateString()}</span>}
        </div>
      </div>

      {/* Key preview */}
      <div className="hidden md:flex items-center gap-2 bg-gray-100 dark:bg-gray-800 rounded-lg px-3 py-1.5">
        <code className="text-xs text-gray-600 dark:text-gray-400 font-mono">{k.key.slice(0, 20)}…</code>
        <button onClick={copy} className="text-gray-400 hover:text-brand-600 dark:hover:text-brand-400 transition-colors" title="Copy key">
          {copied ? <Check size={13} className="text-green-500" /> : <Copy size={13} />}
        </button>
      </div>

      {/* Status badge */}
      <span className={`text-xs px-2.5 py-1 rounded-full font-medium shrink-0 ${
        isExpired   ? "bg-gray-100 dark:bg-gray-800 text-gray-500"
        : isActive  ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-500"
      }`}>
        {isExpired ? "Expired" : isActive ? "Active" : "Revoked"}
      </span>

      {/* Actions */}
      <div className="flex items-center gap-1 shrink-0">
        {editing ? (
          <button onClick={save} className="p-1.5 rounded-lg text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors">
            <Check size={14} />
          </button>
        ) : (
          <button onClick={() => setEditing(true)} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <Edit3 size={14} />
          </button>
        )}
        {isActive && (
          <button
            onClick={() => { if (confirm(`Revoke "${k.name}"? This cannot be undone.`)) onRevoke(k.id); }}
            className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const qc = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newExpiry, setNewExpiry] = useState("");

  const { data: keys = [], isLoading: keysLoading } = useQuery({
    queryKey: ["keys"],
    queryFn: () => apiGet("/api/keys"),
  });

  const { data: stats } = useQuery({
    queryKey: ["stats"],
    queryFn: () => apiGet("/api/stats"),
  });

  const createKey = useMutation({
    mutationFn: () => apiPost("/api/keys", { name: newName.trim(), expiresAt: newExpiry || undefined }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["keys"] });
      setShowCreate(false);
      setNewName("");
      setNewExpiry("");
    },
  });

  const revokeKey = useMutation({
    mutationFn: (id) => apiDelete(`/api/keys/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["keys"] }),
  });

  const renameKey = useMutation({
    mutationFn: ({ id, name }) => apiPatch(`/api/keys/${id}`, { name }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["keys"] }),
  });

  const summary = stats?.summary;
  const allowedPct = summary?.total_requests
    ? Math.round(((summary.total_requests - (summary.total_blocked || 0) - (summary.total_flagged || 0)) / summary.total_requests) * 100)
    : null;

  const activeKeys = keys.filter(k => k.is_active && !(k.expires_at && new Date(k.expires_at) < new Date()));

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white">Dashboard</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Overview of your moderation activity</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors shadow-sm"
        >
          <Plus size={16} /> New API Key
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Requests"  value={summary?.total_requests?.toLocaleString()} icon={Activity}   color="brand" sub="last 30 days" />
        <StatCard label="Active Keys"     value={activeKeys.length}                          icon={Key}        color="green" />
        <StatCard label="Blocked"         value={summary?.total_blocked?.toLocaleString()}   icon={ShieldX}    color="red"   sub="last 30 days" />
        <StatCard label="Allowed"         value={allowedPct != null ? `${allowedPct}%` : null} icon={CheckCircle} color="green" sub="pass rate" />
      </div>

      {/* API Keys */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
          <div>
            <h2 className="font-bold text-gray-900 dark:text-white">API Keys</h2>
            <p className="text-xs text-gray-400 mt-0.5">{activeKeys.length} active {activeKeys.length === 1 ? "key" : "keys"}</p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-1.5 text-sm text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 font-medium transition-colors"
          >
            <Plus size={15} /> New key
          </button>
        </div>

        {keysLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-5 h-5 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : keys.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <Key size={22} className="text-gray-400" />
            </div>
            <p className="font-medium text-gray-700 dark:text-gray-300">No API keys yet</p>
            <p className="text-sm text-gray-400 mt-1 mb-4">Create your first key to start moderating content</p>
            <button
              onClick={() => setShowCreate(true)}
              className="bg-brand-600 hover:bg-brand-700 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-colors"
            >
              Create first key
            </button>
          </div>
        ) : (
          <div>
            {keys.map(k => (
              <KeyRow
                key={k.id}
                k={k}
                onRevoke={(id) => revokeKey.mutate(id)}
                onRename={(id, name) => renameKey.mutate({ id, name })}
              />
            ))}
          </div>
        )}
      </div>

      {/* Create modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/60 dark:bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 w-full max-w-md shadow-2xl border border-gray-200 dark:border-gray-800">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Create API Key</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">Give your key a name to identify where it's used.</p>

            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Key Name <span className="text-red-500">*</span></label>
            <input
              className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-brand-500 dark:focus:border-brand-500 mb-4"
              placeholder="e.g. Production, iOS App, Development"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => e.key === "Enter" && newName.trim() && createKey.mutate()}
              autoFocus
            />

            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Expiry Date <span className="text-gray-400 font-normal">(optional)</span></label>
            <input
              type="date"
              className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-brand-500 dark:focus:border-brand-500 mb-6"
              value={newExpiry}
              onChange={e => setNewExpiry(e.target.value)}
            />

            <div className="flex gap-3">
              <button
                onClick={() => createKey.mutate()}
                disabled={!newName.trim() || createKey.isPending}
                className="flex-1 bg-brand-600 hover:bg-brand-700 disabled:opacity-40 text-white py-2.5 rounded-xl text-sm font-medium transition-colors"
              >
                {createKey.isPending ? "Creating..." : "Create Key"}
              </button>
              <button
                onClick={() => { setShowCreate(false); setNewName(""); setNewExpiry(""); }}
                className="flex-1 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 py-2.5 rounded-xl text-sm font-medium transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Build to verify**

```bash
cd /Users/sushilsahani/devsushil/mod-me/client && npm run build 2>&1 | tail -10
```

- [ ] **Step 3: Commit**

```bash
git add client/src/pages/Dashboard.jsx
git commit -m "feat: redesign dashboard with stats overview and production-ready key management"
```

---

### Task 6: Dark Mode + Polish for Sub-pages and Components

**Files:**
- Modify: `client/src/pages/Playground.jsx`
- Modify: `client/src/pages/Stats.jsx`
- Modify: `client/src/pages/Admin.jsx`
- Modify: `client/src/pages/Login.jsx`
- Modify: `client/src/components/KeyCard.jsx` (no longer used by Dashboard but kept for Admin)
- Modify: `client/src/components/VerdictBadge.jsx`
- Modify: `client/src/components/ScoreBar.jsx`
- Modify: `client/src/components/UsageChart.jsx`

- [ ] **Step 1: Update Playground.jsx with dark mode**

Write `client/src/pages/Playground.jsx`:
```jsx
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
        {/* API Key */}
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
```

- [ ] **Step 2: Update Stats.jsx with dark mode**

Write `client/src/pages/Stats.jsx`:
```jsx
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "../lib/api.js";
import { DailyLineChart, DecisionDonut } from "../components/UsageChart.jsx";

function StatCard({ label, value, sub }) {
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5">
      <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
      <p className="text-3xl font-black text-gray-900 dark:text-white mt-1">{value ?? "—"}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

export default function Stats() {
  const { data, isLoading } = useQuery({
    queryKey: ["stats"],
    queryFn: () => apiGet("/api/stats"),
  });

  if (isLoading) return (
    <div className="flex items-center justify-center py-20">
      <div className="w-6 h-6 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const { summary, daily, decisions, topKey } = data || {};

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-black text-gray-900 dark:text-white">Analytics</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Last 30 days</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Requests"  value={summary?.total_requests?.toLocaleString()} />
        <StatCard label="Avg Latency"     value={summary?.avg_latency_ms ? `${summary.avg_latency_ms}ms` : null} />
        <StatCard label="Blocked"         value={summary?.total_blocked?.toLocaleString()} />
        <StatCard label="Top Key"         value={topKey?.name} sub={topKey ? `${topKey.call_count} calls` : null} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5">
          <p className="text-sm font-bold text-gray-900 dark:text-white mb-4">Requests Per Day</p>
          <DailyLineChart data={daily || []} />
        </div>
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5">
          <p className="text-sm font-bold text-gray-900 dark:text-white mb-4">Decision Breakdown</p>
          <DecisionDonut data={decisions || []} />
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Update Admin.jsx with dark mode**

Write `client/src/pages/Admin.jsx`:
```jsx
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPatch, apiDelete } from "../lib/api.js";

export default function Admin() {
  const qc = useQueryClient();
  const { data: stats }      = useQuery({ queryKey: ["admin-stats"], queryFn: () => apiGet("/api/admin/stats") });
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

  const th = "px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider";
  const td = "px-4 py-3 text-sm text-gray-700 dark:text-gray-300";

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-black text-gray-900 dark:text-white">Admin</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Platform management</p>
      </div>

      {stats && (
        <div className="grid grid-cols-3 gap-4">
          {[["Total Users", stats.total_users], ["Active Keys", stats.total_active_keys], ["Total Requests", stats.total_requests]].map(([label, val]) => (
            <div key={label} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
              <p className="text-3xl font-black text-gray-900 dark:text-white mt-1">{val?.toLocaleString() ?? "—"}</p>
            </div>
          ))}
        </div>
      )}

      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800">
          <h2 className="font-bold text-gray-900 dark:text-white">Users</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800">
              <tr>{["Email", "Plan", "Keys", "Calls", "Joined", "Admin"].map(h => <th key={h} className={th}>{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {users.map(u => (
                <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <td className={td}>{u.email}</td>
                  <td className={td}>
                    <select
                      value={u.plan}
                      onChange={e => updateUser.mutate({ id: u.id, plan: e.target.value })}
                      className="bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1 text-xs text-gray-700 dark:text-gray-300"
                    >
                      <option value="free">free</option>
                      <option value="pro">pro</option>
                    </select>
                  </td>
                  <td className={td}>{u.key_count}</td>
                  <td className={td}>{u.total_calls}</td>
                  <td className={`${td} text-gray-400`}>{new Date(u.created_at).toLocaleDateString()}</td>
                  <td className={td}>
                    <input
                      type="checkbox"
                      checked={u.is_admin}
                      onChange={e => updateUser.mutate({ id: u.id, isAdmin: e.target.checked })}
                      className="accent-brand-600"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800">
          <h2 className="font-bold text-gray-900 dark:text-white">All API Keys</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800">
              <tr>{["Name", "Owner", "Calls", "Last Used", "Status", ""].map(h => <th key={h} className={th}>{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {keys.map(k => (
                <tr key={k.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <td className={`${td} font-medium text-gray-900 dark:text-white`}>{k.name}</td>
                  <td className={td}>{k.owner_email}</td>
                  <td className={td}>{k.call_count}</td>
                  <td className={`${td} text-gray-400`}>{k.last_used_at ? new Date(k.last_used_at).toLocaleDateString() : "Never"}</td>
                  <td className={td}>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${k.is_active ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400" : "bg-gray-100 dark:bg-gray-800 text-gray-500"}`}>
                      {k.is_active ? "Active" : "Revoked"}
                    </span>
                  </td>
                  <td className={td}>
                    {k.is_active && (
                      <button onClick={() => revokeKey.mutate(k.id)} className="text-xs text-red-500 hover:text-red-700 dark:hover:text-red-400 transition-colors">
                        Revoke
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Update Login.jsx with dark mode**

Write `client/src/pages/Login.jsx`:
```jsx
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "../lib/api.js";
import { useTheme } from "../context/ThemeContext.jsx";
import { Sun, Moon } from "lucide-react";

export default function Login() {
  const { theme, toggleTheme } = useTheme();
  const { data: user } = useQuery({
    queryKey: ["me"],
    queryFn: () => apiGet("/api/me"),
    retry: false,
  });

  useEffect(() => {
    if (user) window.location = "/dashboard";
  }, [user]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center transition-colors relative">
      <button
        onClick={toggleTheme}
        className="absolute top-5 right-5 p-2 rounded-lg text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
      >
        {theme === "dark" ? <Sun size={16} className="text-amber-400" /> : <Moon size={16} />}
      </button>

      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-xl p-10 w-full max-w-sm text-center">
        <div className="w-12 h-12 rounded-2xl bg-brand-600 flex items-center justify-center text-white font-black text-xl mx-auto mb-4">M</div>
        <h1 className="text-2xl font-black text-gray-900 dark:text-white mb-1">ModMe</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">Content Moderation API Platform</p>

        <a
          href="/auth/google"
          className="flex items-center justify-center gap-3 w-full border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continue with Google
        </a>

        <p className="text-xs text-gray-400 dark:text-gray-600 mt-6">By signing in you agree to our terms of service.</p>
        <a href="/" className="text-xs text-brand-600 dark:text-brand-400 hover:underline mt-2 block">← Back to home</a>
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Update VerdictBadge, ScoreBar, UsageChart for dark mode**

Write `client/src/components/VerdictBadge.jsx`:
```jsx
const CONFIG = {
  allow: { label: "ALLOWED",  classes: "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800" },
  flag:  { label: "FLAGGED",  classes: "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800" },
  block: { label: "BLOCKED",  classes: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800" },
};

export default function VerdictBadge({ decision }) {
  const c = CONFIG[decision] || CONFIG.flag;
  return (
    <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-base font-black border ${c.classes}`}>
      {decision === "allow" ? "✅" : decision === "block" ? "🚫" : "⚠️"} {c.label}
    </span>
  );
}
```

Write `client/src/components/ScoreBar.jsx`:
```jsx
export default function ScoreBar({ label, score }) {
  const pct = Math.round((score || 0) * 100);
  const color = pct >= 75 ? "bg-red-500" : pct >= 50 ? "bg-yellow-500" : "bg-green-500";
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-gray-500 dark:text-gray-400 w-20 shrink-0 capitalize">{label}</span>
      <div className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-full h-2">
        <div className={`h-2 rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-sm font-mono text-gray-700 dark:text-gray-300 w-10 text-right">{pct}%</span>
    </div>
  );
}
```

Write `client/src/components/UsageChart.jsx`:
```jsx
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";

const COLORS = { allow: "#22c55e", flag: "#f59e0b", block: "#ef4444" };

export function DailyLineChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={data}>
        <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#9ca3af" }} tickFormatter={d => d.slice(5)} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
        <Tooltip
          contentStyle={{ background: "var(--tooltip-bg, #fff)", border: "1px solid #e5e7eb", borderRadius: "12px", fontSize: "12px" }}
        />
        <Line type="monotone" dataKey="count" stroke="#4f46e5" strokeWidth={2.5} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function DecisionDonut({ data }) {
  const formatted = data.map(d => ({ name: d.final_decision, value: d.count, fill: COLORS[d.final_decision] || "#94a3b8" }));
  return (
    <ResponsiveContainer width="100%" height={200}>
      <PieChart>
        <Pie data={formatted} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} innerRadius={40} paddingAngle={3}>
          {formatted.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
        </Pie>
        <Legend iconType="circle" iconSize={8} formatter={v => <span style={{ fontSize: "12px", color: "#9ca3af" }}>{v}</span>} />
        <Tooltip contentStyle={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: "12px", fontSize: "12px" }} />
      </PieChart>
    </ResponsiveContainer>
  );
}
```

- [ ] **Step 6: Final build check**

```bash
cd /Users/sushilsahani/devsushil/mod-me/client && npm run build 2>&1 | tail -10
```
Expected: Build successful, no errors.

- [ ] **Step 7: Commit all**

```bash
git add client/src/pages/Playground.jsx client/src/pages/Stats.jsx client/src/pages/Admin.jsx client/src/pages/Login.jsx client/src/components/VerdictBadge.jsx client/src/components/ScoreBar.jsx client/src/components/UsageChart.jsx
git commit -m "feat: dark mode + polish for playground, stats, admin, login and shared components"
```
