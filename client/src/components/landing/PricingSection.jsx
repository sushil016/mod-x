import { ArrowRight, Check } from "lucide-react";

const plans = [
  { name: "Launch", description: "For prototypes and small apps", price: "$0", features: ["100 requests / hour", "All media types", "Playground access", "Usage analytics"], href: "/auth/dev-login" },
  { name: "Scale", description: "For production traffic", price: "$29", features: ["1,000 requests / hour", "Gray-zone AI review", "Webhook callbacks", "Priority support"], href: "/checkout?plan=scale", popular: true },
  { name: "Platform", description: "For custom operations", price: "Custom", features: ["Custom limits", "Dedicated thresholds", "Human review exports", "Volume pricing"], href: "/checkout?plan=platform" },
];

export default function PricingSection({ user }) {
  const authHref = import.meta.env.DEV ? "/auth/dev-login" : "/auth/google";
  return (
    <section id="pricing" className="relative border-t border-foreground/10 py-32 lg:py-40">
      <div className="mx-auto max-w-7xl px-6 lg:px-12">
        <div className="mb-20 max-w-3xl">
          <span className="mb-6 block font-mono text-xs uppercase tracking-widest text-muted-foreground">Pricing</span>
          <h2 className="mb-6 font-display text-5xl tracking-tight md:text-6xl lg:text-7xl">Simple, transparent<br /><span className="text-stroke">pricing</span></h2>
          <p className="max-w-xl text-lg text-muted-foreground">Start free and scale when upload traffic grows.</p>
        </div>
        <div className="grid gap-px bg-foreground/10 md:grid-cols-3">
          {plans.map((plan, index) => (
            <div key={plan.name} className={`relative bg-background p-8 lg:p-12 ${plan.popular ? "border-2 border-foreground md:-my-4 md:py-12 lg:py-16" : ""}`}>
              {plan.popular && <span className="absolute -top-3 left-8 bg-foreground px-3 py-1 font-mono text-xs uppercase tracking-widest text-primary-foreground">Most popular</span>}
              <div className="mb-8">
                <span className="font-mono text-xs text-muted-foreground">{String(index + 1).padStart(2, "0")}</span>
                <h3 className="mt-2 font-display text-3xl">{plan.name}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{plan.description}</p>
              </div>
              <div className="mb-8 border-b border-foreground/10 pb-8">
                <span className="font-display text-5xl lg:text-6xl">{plan.price}</span>
                {plan.price !== "Custom" && <span className="ml-2 text-muted-foreground">/month</span>}
              </div>
              <ul className="mb-10 space-y-4">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3 text-sm text-muted-foreground"><Check className="mt-0.5 h-4 w-4 shrink-0 text-foreground" />{feature}</li>
                ))}
              </ul>
              <a href={user && plan.name === "Launch" ? "/dashboard" : plan.name === "Launch" ? authHref : plan.href} className={`group flex w-full items-center justify-center gap-2 py-4 text-sm font-medium ${plan.popular ? "bg-foreground text-primary-foreground" : "border border-foreground/20 hover:bg-foreground/5"}`}>
                {plan.name === "Launch" && user ? "Open dashboard" : plan.name === "Launch" ? "Start free" : plan.name === "Platform" ? "Talk to us" : "Start Scale"}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
