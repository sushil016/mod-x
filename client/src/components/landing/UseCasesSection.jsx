import { useState } from "react";
import { Camera, CheckCircle2, MessageCircle, Store, Users } from "lucide-react";

const useCases = [
  {
    title: "Chat applications",
    icon: MessageCircle,
    upload: "message-image.png",
    decision: "flag",
    response: "AI checks the image before it appears inside a private or group chat.",
    detail: "Add a moderation layer before media appears in direct messages, group chats, and community threads.",
  },
  {
    title: "Profile picture protection",
    icon: Camera,
    upload: "avatar-upload.jpg",
    decision: "allow",
    response: "Safe avatars pass quickly; risky profile photos can be blocked before they become public.",
    detail: "Protect profile photos in social products, customer portals, marketplaces, HR tools, and user directories.",
  },
  {
    title: "Marketplace listings",
    icon: Store,
    upload: "listing-gallery.webp",
    decision: "block",
    response: "Product images are checked before a seller can publish the listing.",
    detail: "Screen seller images, catalog photos, review attachments, and customer-submitted product media.",
  },
  {
    title: "Creator communities",
    icon: Users,
    upload: "creator-video.mp4",
    decision: "flag",
    response: "Videos and GIFs are sampled into frames, then uncertain uploads get an AI reason.",
    detail: "Moderate richer media for communities, creator tools, learning platforms, and internal company portals.",
  },
];

const decisionStyles = {
  allow: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-300",
  flag: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-300",
  block: "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-300",
};

export default function UseCasesSection() {
  const [activeIndex, setActiveIndex] = useState(0);
  const active = useCases[activeIndex];
  const ActiveIcon = active.icon;

  return (
    <section id="use-cases" className="relative overflow-hidden border-y border-foreground/10 py-24 lg:py-32">
      <div className="mx-auto max-w-[1400px] px-6 lg:px-12">
        <div className="mb-16 grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
          <div>
            <span className="mb-6 inline-flex items-center gap-3 font-mono text-sm text-muted-foreground">
              <span className="h-px w-8 bg-foreground/30" />
              Use cases
            </span>
            <h2 className="font-display text-4xl tracking-tight lg:text-6xl">
              Built for products
              <br />
              that accept uploads.
            </h2>
          </div>
          <p className="max-w-2xl text-xl leading-relaxed text-muted-foreground">
            ModMe is for developers, startups, and companies that need one API to check user-uploaded images, GIFs, and videos before they become visible.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="grid gap-3">
            {useCases.map((item, index) => {
              const Icon = item.icon;
              const activeCard = activeIndex === index;
              return (
                <button
                  key={item.title}
                  onClick={() => setActiveIndex(index)}
                  className={`group grid gap-4 border p-5 text-left transition-all duration-300 sm:grid-cols-[48px_1fr] ${
                    activeCard
                      ? "border-foreground bg-foreground text-background"
                      : "border-foreground/10 bg-card text-foreground hover:border-foreground/30"
                  }`}
                >
                  <div className={`flex h-12 w-12 items-center justify-center border transition-colors ${
                    activeCard ? "border-background/20 bg-background text-foreground" : "border-foreground/10 bg-secondary"
                  }`}>
                    <Icon size={20} />
                  </div>
                  <div>
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="text-lg font-medium">{item.title}</h3>
                      <span className={`hidden rounded-full border px-2 py-1 font-mono text-[10px] uppercase sm:inline-flex ${activeCard ? "border-background/20 text-background/70" : "border-border text-muted-foreground"}`}>
                        0{index + 1}
                      </span>
                    </div>
                    <p className={`mt-2 text-sm leading-6 ${activeCard ? "text-background/70" : "text-muted-foreground"}`}>
                      {item.detail}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="product-frame">
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <ActiveIcon size={18} />
                </div>
                <div>
                  <div className="text-sm font-medium text-foreground">Upload protection flow</div>
                  <div className="text-xs text-muted-foreground">{active.title}</div>
                </div>
              </div>
              <span className={`rounded-md border px-2.5 py-1 text-xs font-medium uppercase ${decisionStyles[active.decision]}`}>
                {active.decision}
              </span>
            </div>

            <div className="grid gap-0 md:grid-cols-[1fr_260px]">
              <div className="border-b border-border p-6 md:border-b-0 md:border-r">
                <div className="rounded-lg border border-dashed border-border bg-secondary p-6">
                  <div className="mb-5 flex items-center justify-between">
                    <span className="font-mono text-xs text-muted-foreground">user upload</span>
                    <span className="rounded-full bg-card px-2 py-1 font-mono text-[10px] text-muted-foreground">before publish</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex h-16 w-16 items-center justify-center rounded-lg border border-border bg-card text-foreground">
                      <ActiveIcon size={26} />
                    </div>
                    <div className="min-w-0">
                      <div className="truncate font-mono text-sm text-foreground">{active.upload}</div>
                      <div className="mt-1 text-xs text-muted-foreground">image / GIF / video ready</div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 grid gap-3">
                  {["Detect media type", "Moderate content", "Return decision"].map((step, index) => (
                    <div key={step} className="flex items-center gap-3 rounded-lg border border-border bg-card p-3">
                      <CheckCircle2 size={16} className="text-emerald-500" />
                      <span className="text-sm text-foreground">{step}</span>
                      <span className="ml-auto font-mono text-xs text-muted-foreground">{index === 1 ? "AI" : `${index + 1}`}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-6">
                <div className="mb-4 font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">API response</div>
                <div className="space-y-3">
                  {[
                    ["finalDecision", active.decision],
                    ["sourceType", active.upload.endsWith(".mp4") ? "video" : "image"],
                    ["latency", active.decision === "allow" ? "287ms" : "1.4s"],
                    ["nextStep", active.decision === "allow" ? "publish" : active.decision === "flag" ? "review" : "reject"],
                  ].map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between gap-3">
                      <span className="font-mono text-xs text-muted-foreground">{key}</span>
                      <span className="rounded-md bg-secondary px-2 py-1 font-mono text-xs text-foreground">{value}</span>
                    </div>
                  ))}
                </div>
                <p className="mt-6 rounded-lg border border-border bg-secondary p-4 text-sm leading-6 text-muted-foreground">
                  {active.response}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
