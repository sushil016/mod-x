import { useEffect, useRef, useState } from "react";
import { FileCheck2, KeyRound, ScanSearch, ShieldCheck } from "lucide-react";

const safeguards = [
  {
    icon: KeyRound,
    title: "API-key access",
    description: "Each request is authenticated before moderation work starts.",
  },
  {
    icon: ScanSearch,
    title: "Frame-aware scanning",
    description: "GIFs and videos are sampled frame by frame instead of treated like still images.",
  },
  {
    icon: ShieldCheck,
    title: "Fail-safe decisions",
    description: "Uncertain media is escalated for reasoning instead of being silently approved.",
  },
  {
    icon: FileCheck2,
    title: "Audit-friendly output",
    description: "Every response returns scores, reason, layer, timing, and metadata your app can store.",
  },
];

const checks = ["Images", "GIFs", "Videos", "Gray-zone AI", "Structured logs"];

export default function SecuritySection() {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => entry.isIntersecting && setIsVisible(true), { threshold: 0.1 });
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section id="security" ref={sectionRef} className="relative overflow-hidden bg-foreground/[0.02] py-24 lg:py-32">
      <div className="mx-auto max-w-[1400px] px-6 lg:px-12">
        <div className="grid gap-16 lg:grid-cols-2 lg:gap-24">
          <div className={`transition-all duration-700 ${isVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"}`}>
            <span className="mb-6 inline-flex items-center gap-3 font-mono text-sm text-muted-foreground">
              <span className="h-px w-8 bg-foreground/30" />
              Safety layer
            </span>
            <h2 className="mb-8 font-display text-4xl tracking-tight lg:text-6xl">
              Built to make
              <br />
              safer decisions.
            </h2>
            <p className="mb-12 text-xl leading-relaxed text-muted-foreground">
              ModMe combines fast first-pass moderation with slower reasoning only when content is unclear, so teams get protection without making every upload expensive.
            </p>
            <div className="flex flex-wrap gap-3">
              {checks.map((check, index) => (
                <span
                  key={check}
                  className={`border border-foreground/10 px-4 py-2 font-mono text-sm transition-all duration-500 ${isVisible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"}`}
                  style={{ transitionDelay: `${index * 50 + 200}ms` }}
                >
                  {check}
                </span>
              ))}
            </div>
          </div>

          <div className="grid gap-6">
            {safeguards.map((feature, index) => (
              <div
                key={feature.title}
                className={`group border border-foreground/10 p-6 transition-all duration-500 hover:border-foreground/20 ${isVisible ? "translate-x-0 opacity-100" : "translate-x-8 opacity-0"}`}
                style={{ transitionDelay: `${index * 100}ms` }}
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center border border-foreground/10 transition-colors duration-300 group-hover:bg-foreground group-hover:text-background">
                    <feature.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="mb-1 text-lg font-medium transition-transform duration-300 group-hover:translate-x-1">{feature.title}</h3>
                    <p className="text-muted-foreground">{feature.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
