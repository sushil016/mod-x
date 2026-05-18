import { useEffect, useState } from "react";
import { Menu, Moon, Sun, X } from "lucide-react";
import { useTheme } from "../../context/ThemeContext.jsx";

const links = [
  { name: "Features", href: "#features" },
  { name: "Use cases", href: "#use-cases" },
  { name: "Security", href: "#security" },
  { name: "Developers", href: "#developers" },
  { name: "Pricing", href: "#pricing" },
];

export default function Navigation({ user }) {
  const { theme, toggleTheme } = useTheme();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const authHref = import.meta.env.DEV ? "/auth/dev-login" : "/auth/google";
  const ctaHref = user ? "/dashboard" : authHref;
  const ctaLabel = user ? "Dashboard" : "Get API key";

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className={`fixed z-50 transition-all duration-500 ${isScrolled ? "left-4 right-4 top-4" : "left-0 right-0 top-0"}`}>
      <nav className={`mx-auto transition-all duration-500 ${isScrolled || isMobileMenuOpen ? "max-w-[1200px] rounded-2xl border border-border bg-background/80 shadow-lg backdrop-blur-xl" : "max-w-[1400px] bg-transparent"}`}>
        <div className={`flex items-center justify-between px-6 transition-all duration-500 lg:px-8 ${isScrolled ? "h-14" : "h-20"}`}>
          <a href="/" className="flex items-center gap-3">
            <span className="font-display text-2xl leading-none">ModMe</span>
            <span className="font-mono text-xs text-muted-foreground">API</span>
          </a>

          <div className="hidden items-center gap-12 md:flex">
            {links.map((link) => (
              <a key={link.name} href={link.href} className="group relative text-sm text-foreground/70 transition-colors hover:text-foreground">
                {link.name}
                <span className="absolute -bottom-1 left-0 h-px w-0 bg-foreground transition-all duration-300 group-hover:w-full" />
              </a>
            ))}
          </div>

          <div className="hidden items-center gap-3 md:flex">
            <button onClick={toggleTheme} className="icon-btn" aria-label="Toggle theme">
              {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            <a href="/docs" className="text-sm text-foreground/70 transition-colors hover:text-foreground">Docs</a>
            <a href={ctaHref} className="rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90">
              {ctaLabel}
            </a>
          </div>

          <button onClick={() => setIsMobileMenuOpen((open) => !open)} className="md:hidden p-2" aria-label="Toggle menu">
            {isMobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </nav>

      <div className={`fixed inset-0 z-40 bg-background transition-all duration-500 md:hidden ${isMobileMenuOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"}`}>
        <div className="flex h-full flex-col px-8 pb-8 pt-28">
          <div className="flex flex-1 flex-col justify-center gap-8">
            {links.map((link, index) => (
              <a key={link.name} href={link.href} onClick={() => setIsMobileMenuOpen(false)} className={`font-display text-5xl transition-all duration-500 ${isMobileMenuOpen ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"}`} style={{ transitionDelay: isMobileMenuOpen ? `${index * 75}ms` : "0ms" }}>
                {link.name}
              </a>
            ))}
          </div>
          <div className="flex gap-4 border-t border-border pt-8">
            <button onClick={toggleTheme} className="icon-btn shrink-0">
              {theme === "dark" ? <Sun /> : <Moon />}
            </button>
            <a href="/docs" className="flex flex-1 items-center justify-center rounded-full border border-border">Docs</a>
            <a href={ctaHref} className="flex flex-1 items-center justify-center rounded-full bg-primary text-primary-foreground">{ctaLabel}</a>
          </div>
        </div>
      </div>
    </header>
  );
}
