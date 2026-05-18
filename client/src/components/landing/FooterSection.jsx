import { ArrowUpRight } from "lucide-react";
import AnimatedWave from "./AnimatedWave.jsx";

const footerLinks = {
  Product: [
    { name: "Features", href: "#features" },
    { name: "Use cases", href: "#use-cases" },
    { name: "Security", href: "#security" },
    { name: "Pricing", href: "#pricing" },
    { name: "Playground", href: "/playground" },
  ],
  Developers: [
    { name: "Documentation", href: "/docs" },
    { name: "API Reference", href: "/docs#endpoint" },
    { name: "Dashboard", href: "/dashboard" },
    { name: "GitHub", href: "https://github.com/sushil016/mod-x" },
  ],
  Moderation: [
    { name: "Images", href: "#features" },
    { name: "GIFs", href: "#features" },
    { name: "Videos", href: "#features" },
    { name: "Gray-zone AI", href: "#features" },
  ],
  Account: [
    { name: "Sign in", href: import.meta.env.DEV ? "/auth/dev-login" : "/auth/google" },
    { name: "Settings", href: "/settings" },
    { name: "Billing", href: "/checkout?plan=scale" },
  ],
};

const socialLinks = [
  { name: "GitHub", href: "https://github.com/sushil016/mod-x" },
];

export default function FooterSection() {
  return (
    <footer className="relative border-t border-foreground/10">
      <div className="pointer-events-none absolute inset-0 h-64 overflow-hidden opacity-20"><AnimatedWave /></div>
      <div className="relative z-10 mx-auto max-w-[1400px] px-6 lg:px-12">
        <div className="py-16 lg:py-24">
          <div className="grid grid-cols-2 gap-12 md:grid-cols-6 lg:gap-8">
            <div className="col-span-2">
              <a href="/" className="mb-6 inline-flex items-center gap-3">
                <span className="font-display text-2xl leading-none">ModMe</span>
                <span className="font-mono text-xs text-muted-foreground">API</span>
              </a>
              <p className="mb-8 max-w-xs leading-relaxed text-muted-foreground">Real-time moderation for images, GIFs, and videos with one developer-friendly API.</p>
              <div className="flex gap-6">
                {socialLinks.map((link) => (
                  <a key={link.name} href={link.href} className="group flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground">
                    {link.name}<ArrowUpRight className="h-3 w-3 -translate-x-1 opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100" />
                  </a>
                ))}
              </div>
            </div>
            {Object.entries(footerLinks).map(([title, links]) => (
              <div key={title}>
                <h3 className="mb-6 text-sm font-medium">{title}</h3>
                <ul className="space-y-4">
                  {links.map((link) => <li key={link.name}><a href={link.href} className="text-sm text-muted-foreground transition-colors hover:text-foreground">{link.name}</a></li>)}
                </ul>
              </div>
            ))}
          </div>
        </div>
        <div className="flex flex-col items-center justify-between gap-4 border-t border-foreground/10 py-8 md:flex-row">
          <p className="text-sm text-muted-foreground">2026 ModMe. Free and open source.</p>
          <div className="flex items-center gap-2 text-sm text-muted-foreground"><span className="h-2 w-2 rounded-full bg-green-500" />API ready</div>
        </div>
      </div>
    </footer>
  );
}
