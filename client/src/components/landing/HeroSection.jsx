import { useEffect, useState } from "react";
import { ArrowRight, ShieldCheck } from "lucide-react";
import AnimatedSphere from "./AnimatedSphere.jsx";

const words = ["images", "GIFs", "videos"];

export default function HeroSection({ user, consoleSlot }) {
  const [isVisible, setIsVisible] = useState(false);
  const [wordIndex, setWordIndex] = useState(0);
  const authHref = import.meta.env.DEV ? "/auth/dev-login" : "/auth/google";
  const ctaHref = user ? "/dashboard" : authHref;
  const ctaLabel = user ? "Open dashboard" : "Get API key";

  useEffect(() => setIsVisible(true), []);
  useEffect(() => {
    const interval = setInterval(() => setWordIndex((index) => (index + 1) % words.length), 2400);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="relative flex min-h-screen flex-col justify-center overflow-hidden pt-24">
      <div className="pointer-events-none absolute right-0 top-1/2 h-[520px] w-[520px] -translate-y-1/2 opacity-30 lg:h-[760px] lg:w-[760px]">
        <AnimatedSphere />
      </div>
      <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-30">
        {[...Array(8)].map((_, index) => <div key={`h-${index}`} className="absolute h-px bg-foreground/10" style={{ top: `${12.5 * (index + 1)}%`, left: 0, right: 0 }} />)}
        {[...Array(12)].map((_, index) => <div key={`v-${index}`} className="absolute w-px bg-foreground/10" style={{ left: `${8.33 * (index + 1)}%`, top: 0, bottom: 0 }} />)}
      </div>

      <div className="relative z-10 mx-auto grid w-full max-w-[1400px] gap-12 px-6 pb-28 pt-16 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:px-12">
        <div>
          <div className={`mb-8 transition-all duration-700 ${isVisible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"}`}>
            <span className="inline-flex items-center gap-3 text-sm font-mono text-muted-foreground">
              <span className="h-px w-8 bg-foreground/30" />
              <ShieldCheck size={15} />
              Upload protection API
            </span>
          </div>
          <h1 className={`font-display text-[clamp(2.75rem,8vw,6.8rem)] leading-[0.9] tracking-tight transition-all duration-1000 ${isVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"}`}>
            <span className="block">Protect</span>
            <span className="block">
              your{" "}
              <span className="relative inline-block min-w-[6ch]">
                <span key={wordIndex} className="inline-flex">
                  {words[wordIndex].split("").map((char, index) => (
                    <span key={`${wordIndex}-${index}`} className="animate-char-in inline-block" style={{ animationDelay: `${index * 50}ms` }}>{char}</span>
                  ))}
                </span>
                <span className="absolute -bottom-2 left-0 right-0 h-3 bg-foreground/10" />
              </span>
            </span>
          </h1>
          <p className={`mt-10 max-w-xl text-xl leading-relaxed text-muted-foreground transition-all delay-200 duration-700 ${isVisible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"}`}>
            Protects your website uploads like images, GIFs, and videos like Racy, Sexual, Violence, Blood. Get clear allow, flag, or block responses without building the whole pipeline yourself.
          </p>
          <div className={`mt-10 flex flex-col gap-4 transition-all delay-300 duration-700 sm:flex-row ${isVisible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"}`}>
            <a href={ctaHref} className="group inline-flex h-14 items-center justify-center rounded-full bg-primary px-8 text-base text-primary-foreground">
              {ctaLabel}
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </a>
            <a href="/docs" className="inline-flex h-14 items-center justify-center rounded-full border border-foreground/20 px-8 text-base hover:bg-accent">Read docs</a>
          </div>
        </div>

        <div className={`transition-all delay-200 duration-1000 ${isVisible ? "translate-x-0 opacity-100" : "translate-x-8 opacity-0"}`}>
          {consoleSlot}
        </div>
      </div>

      <div className={`absolute bottom-12 left-0 right-0 transition-opacity delay-500 duration-700 ${isVisible ? "opacity-100" : "opacity-0"}`}>
        <div className="marquee flex gap-16 whitespace-nowrap">
          {[...Array(2)].map((_, setIndex) => (
            <div key={setIndex} className="flex gap-16">
              {[
                { value: "<400ms", label: "fast path" },
                { value: "~15%", label: "AI escalated" },
                { value: "3 types", label: "image / GIF / video" },
                { value: "100MB", label: "upload cap" },
              ].map((stat) => (
                <div key={`${setIndex}-${stat.label}`} className="flex items-baseline gap-4">
                  <span className="font-display text-4xl lg:text-5xl">{stat.value}</span>
                  <span className="text-sm text-muted-foreground">{stat.label}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
