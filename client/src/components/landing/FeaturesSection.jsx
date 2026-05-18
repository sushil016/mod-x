import { useEffect, useRef, useState } from "react";

const features = [
  { number: "01", title: "Direct image moderation", description: "Static images go straight into SafeSearch for a fast first-pass decision." },
  { number: "02", title: "GIF and video frame sampling", description: "ffmpeg extracts representative frames so motion uploads are checked instead of treated like stills." },
  { number: "03", title: "Gray-zone reasoning", description: "Only uncertain content is escalated to Vertex AI with Google scores and the worst flagged frame." },
  { number: "04", title: "Developer-ready output", description: "Return allow, flag, or block with scores, reason, latency, and metadata your app can use immediately." },
];

function FeatureCard({ feature, index }) {
  const ref = useRef(null);
  const [isVisible, setIsVisible] = useState(false);
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => entry.isIntersecting && setIsVisible(true), { threshold: 0.2 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className={`group transition-all duration-700 ${isVisible ? "translate-y-0 opacity-100" : "translate-y-12 opacity-0"}`} style={{ transitionDelay: `${index * 100}ms` }}>
      <div className="flex flex-col gap-8 border-b border-foreground/10 py-12 lg:flex-row lg:gap-16 lg:py-20">
        <span className="shrink-0 font-mono text-sm text-muted-foreground">{feature.number}</span>
        <div className="grid flex-1 items-center gap-8 lg:grid-cols-[1fr_220px]">
          <div>
            <h3 className="mb-4 font-display text-3xl transition-transform duration-500 group-hover:translate-x-2 lg:text-4xl">{feature.title}</h3>
            <p className="text-lg leading-relaxed text-muted-foreground">{feature.description}</p>
          </div>
          <div className="relative h-32 border border-foreground/10">
            <span className="absolute inset-4 border border-foreground/10" />
            <span className="absolute inset-x-8 top-1/2 h-px bg-foreground/30" />
            <span className="absolute left-1/2 top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 bg-foreground" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function FeaturesSection() {
  return (
    <section id="features" className="relative py-24 lg:py-32">
      <div className="mx-auto max-w-[1400px] px-6 lg:px-12">
        <div className="mb-16 lg:mb-24">
          <span className="mb-6 inline-flex items-center gap-3 font-mono text-sm text-muted-foreground"><span className="h-px w-8 bg-foreground/30" />Capabilities</span>
          <h2 className="font-display text-4xl tracking-tight lg:text-6xl">Everything needed.<br /><span className="text-muted-foreground">Nothing extra.</span></h2>
        </div>
        {features.map((feature, index) => <FeatureCard key={feature.number} feature={feature} index={index} />)}
      </div>
    </section>
  );
}
