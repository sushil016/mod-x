import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost } from "../lib/api.js";
import { ArrowLeft, BadgeCheck, Check, CreditCard, LockKeyhole, ShieldCheck, Sparkles } from "lucide-react";

const PLAN_DETAILS = {
  scale: {
    name: "Scale",
    planCode: "scale",
    price: 29,
    limit: "1,000 requests / hour",
    features: ["Gray-zone AI escalation", "Webhook callbacks", "Priority support", "Usage analytics"],
  },
  platform: {
    name: "Platform",
    planCode: "platform",
    price: 199,
    limit: "Custom limits and SLA",
    features: ["Dedicated thresholds", "Human review exports", "Volume limits", "Deployment guidance"],
  },
};

function formatCard(value) {
  return value.replace(/\D/g, "").slice(0, 19).replace(/(.{4})/g, "$1 ").trim();
}

function formatExpiry(value) {
  const clean = value.replace(/\D/g, "").slice(0, 4);
  if (clean.length <= 2) return clean;
  return `${clean.slice(0, 2)}/${clean.slice(2)}`;
}

function Completion({ plan, result }) {
  return (
    <div className="mx-auto max-w-3xl rounded-lg border border-emerald-200 bg-card p-8 text-center shadow-2xl shadow-emerald-950/5 dark:border-emerald-900/50 ">
      <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
        <BadgeCheck size={32} />
      </div>
      <h1 className="text-3xl font-black text-foreground">Payment verified</h1>
      <p className="mt-3 text-muted-foreground">
        Your account is now on the {plan.name} plan. Card ending in {result?.checkout?.card_last4} was recorded as paid.
      </p>
      <div className="mt-8 grid gap-3 sm:grid-cols-3">
        {["Plan updated", "Billing event saved", "API limits unlocked"].map((item) => (
          <div key={item} className="rounded-lg border border-border bg-secondary p-4 text-sm font-medium text-foreground">
            <Check size={16} className="mx-auto mb-2 text-emerald-500" />
            {item}
          </div>
        ))}
      </div>
      <a href="/dashboard" className="mt-8 inline-flex items-center justify-center rounded-lg bg-primary px-6 py-3 text-sm font-black text-primary-foreground">
        Open Dashboard
      </a>
    </div>
  );
}

export default function Checkout() {
  const qc = useQueryClient();
  const params = new URLSearchParams(window.location.search);
  const selectedPlan = params.get("plan") === "platform" ? "platform" : "scale";
  const plan = PLAN_DETAILS[selectedPlan];
  const authHref = import.meta.env.DEV ? "/auth/dev-login" : "/auth/google";
  const [complete, setComplete] = useState(null);
  const [form, setForm] = useState({
    billingEmail: "",
    cardName: "",
    cardNumber: "4242 4242 4242 4242",
    expiry: "12/30",
    cvc: "123",
  });

  const { data: user, isError } = useQuery({
    queryKey: ["me"],
    queryFn: () => apiGet("/api/me"),
    retry: false,
    staleTime: 30_000,
  });

  const payload = useMemo(() => ({
    plan: plan.planCode,
    billingEmail: form.billingEmail || user?.email || "",
    cardName: form.cardName,
    cardNumber: form.cardNumber,
    expiry: form.expiry,
    cvc: form.cvc,
  }), [form, plan.planCode, user?.email]);

  const checkout = useMutation({
    mutationFn: () => apiPost("/api/billing/checkout", payload),
    onSuccess: (result) => {
      qc.invalidateQueries({ queryKey: ["me"] });
      setComplete(result);
    },
  });

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  if (complete) {
    return (
      <div className="min-h-screen bg-background px-5 py-10">
        <Completion plan={plan} result={complete} />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen bg-background px-5 py-10">
        <div className="mx-auto max-w-lg rounded-lg border border-border bg-card p-8 text-center  ">
          <div className="mx-auto mb-6 flex items-center justify-center gap-2">
            <span className="font-display text-2xl leading-none">ModMe</span>
            <span className="font-mono text-xs text-muted-foreground">API</span>
          </div>
          <h1 className="font-display text-3xl text-foreground">Sign in to continue checkout</h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">Your plan and billing record attach to your developer account.</p>
          <a href={authHref} className="mt-6 inline-flex rounded-lg bg-brand-600 px-6 py-3 text-sm font-black text-white">Continue locally</a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-6xl px-5 py-8 sm:px-6">
        <div className="mb-8 flex items-center justify-between">
          <a href="/" className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground">
            <ArrowLeft size={16} />
            Back
          </a>
          <div className="flex items-center gap-2">
            <span className="font-display text-2xl leading-none">ModMe</span>
            <span className="font-mono text-xs text-muted-foreground">API</span>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_420px]">
          <section className="app-panel p-6 shadow-2xl shadow-foreground/5">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-brand-100 text-brand-700 dark:bg-brand-950 dark:text-brand-300">
                <CreditCard size={22} />
              </div>
              <div>
                <h1 className="font-display text-3xl text-foreground">Secure checkout</h1>
                <p className="text-sm text-muted-foreground">Test card ready: 4242 4242 4242 4242</p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="sm:col-span-2">
                <span className="mb-1.5 block text-sm font-bold text-card-foreground">Billing email</span>
                <input
                  value={form.billingEmail || user?.email || ""}
                  onChange={(e) => update("billingEmail", e.target.value)}
                  className="field-control"
                />
              </label>
              <label className="sm:col-span-2">
                <span className="mb-1.5 block text-sm font-bold text-card-foreground">Cardholder name</span>
                <input
                  value={form.cardName}
                  onChange={(e) => update("cardName", e.target.value)}
                  placeholder="Sushil Sahani"
                  className="field-control"
                />
              </label>
              <label className="sm:col-span-2">
                <span className="mb-1.5 block text-sm font-bold text-card-foreground">Card number</span>
                <input
                  value={form.cardNumber}
                  onChange={(e) => update("cardNumber", formatCard(e.target.value))}
                  inputMode="numeric"
                  className="field-control font-mono"
                />
              </label>
              <label>
                <span className="mb-1.5 block text-sm font-bold text-card-foreground">Expiry</span>
                <input
                  value={form.expiry}
                  onChange={(e) => update("expiry", formatExpiry(e.target.value))}
                  inputMode="numeric"
                  className="field-control font-mono"
                />
              </label>
              <label>
                <span className="mb-1.5 block text-sm font-bold text-card-foreground">CVC</span>
                <input
                  value={form.cvc}
                  onChange={(e) => update("cvc", e.target.value.replace(/\D/g, "").slice(0, 4))}
                  inputMode="numeric"
                  className="field-control font-mono"
                />
              </label>
            </div>

            {checkout.error && (
              <div className="mt-5 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-300">
                {checkout.error.message}
              </div>
            )}

            <button
              onClick={() => checkout.mutate()}
              disabled={checkout.isPending || !form.cardName.trim()}
              className="solid-button mt-6 w-full gap-2 py-3.5 disabled:opacity-50"
            >
              {checkout.isPending ? "Verifying payment..." : `Pay $${plan.price} and activate ${plan.name}`}
            </button>
          </section>

          <aside className="rounded-lg border border-border bg-slate-950 p-6 text-white shadow-2xl shadow-slate-950/20 ">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.18em] text-brand-300">Plan</p>
                <h2 className="mt-1 text-3xl font-black">{plan.name}</h2>
              </div>
              <Sparkles className="text-brand-400" size={28} />
            </div>
            <div className="mb-6">
              <span className="text-5xl font-black">${plan.price}</span>
              <span className="ml-1 text-sm font-bold text-slate-400">/ month</span>
              <p className="mt-2 text-sm text-slate-400">{plan.limit}</p>
            </div>
            <div className="space-y-3">
              {plan.features.map((feature) => (
                <div key={feature} className="flex items-center gap-3 text-sm font-semibold text-slate-200">
                  <Check size={16} className="text-emerald-400" />
                  {feature}
                </div>
              ))}
            </div>
            <div className="mt-8 rounded-lg border border-white/10 bg-white/[0.04] p-4">
              <div className="mb-2 flex items-center gap-2 text-sm font-black">
                <LockKeyhole size={15} className="text-brand-300" />
                Payment verification
              </div>
              <p className="text-xs leading-5 text-slate-400">This flow validates test card details, records a billing event, and updates your account plan. No raw card number is stored.</p>
            </div>
            <div className="mt-4 flex items-center gap-2 text-xs font-bold text-slate-400">
              <ShieldCheck size={14} />
              Protected checkout flow
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
