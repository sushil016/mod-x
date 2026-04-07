// client/src/components/VerdictBadge.jsx
const CONFIG = {
  allow: { label: "ALLOWED",  bg: "bg-green-100",  text: "text-green-700",  border: "border-green-200" },
  flag:  { label: "FLAGGED",  bg: "bg-yellow-100", text: "text-yellow-700", border: "border-yellow-200" },
  block: { label: "BLOCKED",  bg: "bg-red-100",    text: "text-red-700",    border: "border-red-200" },
};

export default function VerdictBadge({ decision }) {
  const c = CONFIG[decision] || CONFIG.flag;
  return (
    <span className={`inline-flex items-center px-4 py-2 rounded-full text-lg font-black border ${c.bg} ${c.text} ${c.border}`}>
      {decision === "allow" ? "✅" : decision === "block" ? "🚫" : "⚠️"} {c.label}
    </span>
  );
}
