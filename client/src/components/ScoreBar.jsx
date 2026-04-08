export default function ScoreBar({ label, score }) {
  const pct = Math.round((score || 0) * 100);
  const color = pct >= 75 ? "bg-red-500" : pct >= 50 ? "bg-yellow-500" : "bg-green-500";
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-gray-500 dark:text-gray-400 w-20 shrink-0 capitalize">{label}</span>
      <div className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-full h-2">
        <div className={`h-2 rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-sm font-mono text-gray-700 dark:text-gray-300 w-10 text-right">{pct}%</span>
    </div>
  );
}
