const CONFIG = {
  allow: { label: "ALLOWED", classes: "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800" },
  flag:  { label: "FLAGGED", classes: "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800" },
  block: { label: "BLOCKED", classes: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800" },
};

export default function VerdictBadge({ decision }) {
  const c = CONFIG[decision] || CONFIG.flag;
  return (
    <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-base font-black border ${c.classes}`}>
      {decision === "allow" ? "✅" : decision === "block" ? "🚫" : "⚠️"} {c.label}
    </span>
  );
}
