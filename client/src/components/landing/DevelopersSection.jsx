import { useEffect, useRef, useState } from "react";
import { Check, Copy } from "lucide-react";

const examples = [
  {
    label: "cURL",
    code: `curl -X POST http://localhost:3000/moderate \\
  -H "Authorization: Bearer mod_sk_live_..." \\
  -F "file=@upload.mp4"`,
  },
  {
    label: "JavaScript",
    code: `const form = new FormData()
form.append("file", file)

const result = await fetch("/moderate", {
  method: "POST",
  headers: { Authorization: \`Bearer \${key}\` },
  body: form,
}).then((res) => res.json())`,
  },
  {
    label: "Python",
    code: `import requests

result = requests.post(
    "https://api.example.com/moderate",
    headers={"Authorization": "Bearer mod_sk_live_..."},
    files={"file": open("image.jpg", "rb")},
).json()`,
  },
];

const features = [
  { title: "One endpoint", description: "Use the same flow for images, GIFs, and videos." },
  { title: "Simple output", description: "Read allow, flag, or block without extra parsing." },
  { title: "Fast path", description: "Clear cases avoid unnecessary AI calls." },
  { title: "Audit ready", description: "Scores, reason, latency, and metadata are returned." },
];

export default function DevelopersSection() {
  const [activeTab, setActiveTab] = useState(0);
  const [copied, setCopied] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => entry.isIntersecting && setIsVisible(true), { threshold: 0.1 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  function copy() {
    navigator.clipboard.writeText(examples[activeTab].code).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  return (
    <section id="developers" ref={ref} className="relative overflow-hidden py-24 lg:py-32">
      <div className="mx-auto max-w-[1400px] px-6 lg:px-12">
        <div className="grid items-start gap-16 lg:grid-cols-2 lg:gap-24">
          <div className={`transition-all duration-700 ${isVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"}`}>
            <span className="mb-6 inline-flex items-center gap-3 font-mono text-sm text-muted-foreground"><span className="h-px w-8 bg-foreground/30" />For developers</span>
            <h2 className="mb-8 font-display text-4xl tracking-tight lg:text-6xl">Easy to wire.<br /><span className="text-muted-foreground">Clear to trust.</span></h2>
            <p className="mb-12 text-xl leading-relaxed text-muted-foreground">Build upload protection with HTTP primitives you already know. No SDK required.</p>
            <div className="grid grid-cols-2 gap-6">
              {features.map((feature, index) => (
                <div key={feature.title} className={`transition-all duration-500 ${isVisible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"}`} style={{ transitionDelay: `${index * 50 + 200}ms` }}>
                  <h3 className="mb-1 font-medium">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>

          <div className={`transition-all delay-200 duration-700 lg:sticky lg:top-32 ${isVisible ? "translate-x-0 opacity-100" : "translate-x-8 opacity-0"}`}>
            <div className="border border-foreground/10">
              <div className="flex items-center border-b border-foreground/10">
                {examples.map((example, index) => (
                  <button key={example.label} onClick={() => setActiveTab(index)} className={`relative px-6 py-4 font-mono text-sm transition-colors ${activeTab === index ? "text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
                    {example.label}
                    {activeTab === index && <span className="absolute bottom-0 left-0 right-0 h-px bg-foreground" />}
                  </button>
                ))}
                <div className="flex-1" />
                <button onClick={copy} className="px-4 py-4 text-muted-foreground hover:text-foreground">
                  {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                </button>
              </div>
              <pre className="min-h-[220px] overflow-x-auto bg-foreground/[0.01] p-8 font-mono text-sm leading-loose text-foreground/80">{examples[activeTab].code}</pre>
            </div>
            <div className="mt-6 flex items-center gap-6 text-sm">
              <a href="/docs" className="hover:underline">Read the docs</a>
              <span className="text-foreground/20">|</span>
              <a href="https://github.com/sushil016/mod-x" className="text-muted-foreground hover:text-foreground">View on GitHub</a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
