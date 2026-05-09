import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "../lib/api.js";
import { useTheme } from "../context/ThemeContext.jsx";
import { Sun, Moon, ShieldCheck } from "lucide-react";

export default function Login() {
  const { theme, toggleTheme } = useTheme();
  const { data: user } = useQuery({
    queryKey: ["me"],
    queryFn: () => apiGet("/api/me"),
    retry: false,
  });

  useEffect(() => {
    if (user) window.location.href = "/dashboard";
  }, [user]);

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-slate-950 flex items-center justify-center transition-colors relative overflow-hidden px-5">
      <div className="absolute inset-0 opacity-70">
        <div className="mod-grid" />
        <div className="scan-beam" />
      </div>
      <button
        onClick={toggleTheme}
        className="icon-btn absolute top-5 right-5 z-10"
        aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      >
        {theme === "dark" ? <Sun size={16} className="text-amber-400" /> : <Moon size={16} />}
      </button>

      <div className="relative z-10 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-lg shadow-2xl shadow-slate-950/10 p-10 w-full max-w-sm text-center">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-slate-950 text-white dark:bg-white dark:text-slate-950">
          <ShieldCheck size={26} />
        </div>
        <div className="flex items-center justify-center gap-2.5 mb-5">
          <img src="/logom.png" alt="ModMe" className="h-9 w-auto object-contain" />
        </div>
        <h1 className="text-2xl font-black text-slate-950 dark:text-white">Protect uploads faster</h1>
        <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400 mb-8">Sign in to manage API keys, test moderation, and activate higher limits.</p>

        <a
          href="/auth/google"
          className="flex items-center justify-center gap-3 w-full border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-3 text-sm font-black text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
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
        <a href="/" className="text-xs text-brand-500 dark:text-brand-400 hover:underline mt-2 block">← Back to home</a>
      </div>
    </div>
  );
}
