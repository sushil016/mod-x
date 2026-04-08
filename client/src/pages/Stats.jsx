import { useQuery } from "@tanstack/react-query";
import { apiGet } from "../lib/api.js";
import { DailyLineChart, DecisionDonut } from "../components/UsageChart.jsx";

function StatCard({ label, value, sub }) {
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5">
      <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
      <p className="text-3xl font-black text-gray-900 dark:text-white mt-1">{value ?? "—"}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

export default function Stats() {
  const { data, isLoading } = useQuery({
    queryKey: ["stats"],
    queryFn: () => apiGet("/api/stats"),
  });

  if (isLoading) return (
    <div className="flex items-center justify-center py-20">
      <div className="w-6 h-6 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const { summary, daily, decisions, topKey } = data || {};

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-black text-gray-900 dark:text-white">Analytics</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Last 30 days</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Requests" value={summary?.total_requests?.toLocaleString()} />
        <StatCard label="Avg Latency"    value={summary?.avg_latency_ms ? `${summary.avg_latency_ms}ms` : null} />
        <StatCard label="Blocked"        value={summary?.total_blocked?.toLocaleString()} />
        <StatCard label="Top Key"        value={topKey?.name} sub={topKey ? `${topKey.call_count} calls` : null} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5">
          <p className="text-sm font-bold text-gray-900 dark:text-white mb-4">Requests Per Day</p>
          <DailyLineChart data={daily || []} />
        </div>
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5">
          <p className="text-sm font-bold text-gray-900 dark:text-white mb-4">Decision Breakdown</p>
          <DecisionDonut data={decisions || []} />
        </div>
      </div>
    </div>
  );
}
