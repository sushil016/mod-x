import { ArrowRight } from "lucide-react";

export default function CtaSection({ user }) {
  const authHref = import.meta.env.DEV ? "/auth/dev-login" : "/auth/google";
  const href = user ? "/dashboard" : authHref;
  return (
    <section className="relative overflow-hidden py-24 lg:py-32">
      <div className="mx-auto max-w-[1400px] px-6 lg:px-12">
        <div className="relative border border-foreground">
          <div className="relative z-10 px-8 py-16 lg:px-16 lg:py-24">
            <div className="flex flex-col items-start justify-between gap-12 lg:flex-row lg:items-center">
              <div>
                <h2 className="mb-8 font-display text-4xl leading-[0.95] tracking-tight lg:text-7xl">Ready to protect<br />your uploads?</h2>
                <p className="max-w-xl text-xl leading-relaxed text-muted-foreground">Add real-time moderation to your app without rebuilding the pipeline from zero.</p>
              </div>
              <div className="flex flex-col gap-4 sm:flex-row">
                <a href={href} className="group inline-flex h-14 items-center rounded-full bg-foreground px-8 text-base text-background">
                  {user ? "Open dashboard" : "Get API key"}
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </a>
                <a href="/docs" className="inline-flex h-14 items-center rounded-full border border-foreground/20 px-8 text-base hover:bg-foreground/5">Read docs</a>
              </div>
            </div>
          </div>
          <div className="absolute right-0 top-0 h-32 w-32 border-b border-l border-foreground/10" />
          <div className="absolute bottom-0 left-0 h-32 w-32 border-r border-t border-foreground/10" />
        </div>
      </div>
    </section>
  );
}
