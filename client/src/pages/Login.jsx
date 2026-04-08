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
    if (user) window.location.href = "/dashboard";
  }, [user]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center transition-colors relative">
      <button
        onClick={toggleTheme}
        className="absolute top-5 right-5 p-2 rounded-lg text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
        aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
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
