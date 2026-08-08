import { useQuery } from "@tanstack/react-query";
import { apiGet } from "../lib/api.js";
import { ShieldCheck } from "lucide-react";
import Navigation from "../components/landing/Navigation.jsx";
import HeroSection from "../components/landing/HeroSection.jsx";
import FeaturesSection from "../components/landing/FeaturesSection.jsx";
import UseCasesSection from "../components/landing/UseCasesSection.jsx";
import SecuritySection from "../components/landing/SecuritySection.jsx";
import DevelopersSection from "../components/landing/DevelopersSection.jsx";
import TestimonialsSection from "../components/landing/TestimonialsSection.jsx";
import PricingSection from "../components/landing/PricingSection.jsx";
import CtaSection from "../components/landing/CtaSection.jsx";
import FooterSection from "../components/landing/FooterSection.jsx";

function DecisionRow({ status, label, layer, ms, tone }) {
  const tones = {
    allow: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-300",
    flag: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-300",
    block: "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-300",
  };

  return (
    <div className="decision-row-animate grid grid-cols-[88px_1fr_auto] items-center gap-3 border-b border-border px-4 py-3 last:border-b-0 ">
      <span className={`rounded-md border px-2 py-1 text-center text-xs font-extrabold uppercase ${tones[tone]}`}>{status}</span>
      <div className="min-w-0">
        <div className="truncate text-sm font-semibold text-foreground">{label}</div>
        <div className="text-xs text-muted-foreground">{layer}</div>
      </div>
      <span className="font-mono text-xs text-muted-foreground">{ms}ms</span>
    </div>
  );
}

function ProductConsole() {
  return (
    <div className="product-frame landing-console">
      <div className="flex items-center justify-between border-b border-border px-4 py-3 ">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <ShieldCheck size={16} />
          </div>
          <div>
            <div className="text-sm font-extrabold text-foreground">Moderation Console</div>
            <div className="text-xs text-muted-foreground">Live product surface</div>
          </div>
        </div>
        <span className="console-status rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs font-bold text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300">
          API online
        </span>
      </div>

      <div className="grid gap-0 md:grid-cols-[1fr_220px]">
        <div className="border-b border-border p-5  md:border-b-0 md:border-r">
          <div className="mb-4 grid grid-cols-3 gap-3">
            {[
              ["312ms", "median latency"],
              ["15%", "AI escalated"],
              ["3", "media types"],
            ].map(([value, label]) => (
              <div key={label} className="rounded-lg border border-border bg-secondary p-3  ">
                <div className="text-xl font-extrabold text-foreground">{value}</div>
                <div className="text-xs text-muted-foreground">{label}</div>
              </div>
            ))}
          </div>
          <div className="overflow-hidden rounded-lg border border-border">
            <DecisionRow status="allow" label="profile-photo.jpeg" layer="Google Vision fast path" ms="287" tone="allow" />
            <DecisionRow status="flag" label="student-short.mp4" layer="NVIDIA LLM gray-zone review" ms="1840" tone="flag" />
            <DecisionRow status="block" label="chat-upload.gif" layer="Google Vision threshold" ms="341" tone="block" />
          </div>
        </div>

        <div className="p-5">
          <div className="mb-4 text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">Result payload</div>
          <div className="space-y-3">
            {[
              ["finalDecision", "flag"],
              ["sourceType", "video"],
              ["adult", "0.50"],
              ["racy", "0.75"],
              ["layer", "nvidia_llm"],
            ].map(([key, value]) => (
              <div key={key} className="flex items-center justify-between gap-3">
                <span className="font-mono text-xs text-muted-foreground">{key}</span>
                <span className="payload-pill rounded-md bg-secondary px-2 py-1 font-mono text-xs font-bold text-foreground">{value}</span>
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
  const { data: user } = useQuery({
    queryKey: ["me"],
    queryFn: () => apiGet("/api/me"),
    retry: false,
    staleTime: 60_000,
  });

  return (
    <div className="min-h-screen overflow-x-hidden bg-background text-foreground">
      <Navigation user={user} />
      <main>
        <HeroSection user={user} consoleSlot={<ProductConsole />} />
        <FeaturesSection />
        <UseCasesSection />
        <SecuritySection />
        <DevelopersSection />
        <TestimonialsSection />
        <PricingSection user={user} />
        <CtaSection user={user} />
      </main>
      <FooterSection />
    </div>
  );
}
