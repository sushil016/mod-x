import { AlertTriangle, Ban, CheckCircle2 } from "lucide-react";

const CONFIG = {
  allow: { label: "ALLOWED", icon: CheckCircle2, classes: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800" },
  flag:  { label: "FLAGGED", icon: AlertTriangle, classes: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800" },
  block: { label: "BLOCKED", icon: Ban, classes: "bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800" },
};

export default function VerdictBadge({ decision }) {
  const c = CONFIG[decision] || CONFIG.flag;
  const Icon = c.icon;
  return (
    <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-base font-black border ${c.classes}`}>
      <Icon size={18} /> {c.label}
    </span>
  );
}
