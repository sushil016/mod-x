import { useQuery } from "@tanstack/react-query";
import { apiGet } from "../lib/api.js";
import { DailyLineChart, DecisionDonut } from "../components/UsageChart.jsx";
import { Activity, Gauge, ShieldX, Trophy } from "lucide-react";

function StatCard({ label, value, sub, icon: Icon }) {
  return (
    <div className="app-panel p-5 transition-transform hover:-translate-y-0.5">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-xs font-black uppercase tracking-wide text-muted-foreground">{label}</p>
        {Icon && <Icon size={18} className="text-brand-600 dark:text-brand-400" />}
      </div>
      <p className="mt-1 font-display text-3xl text-foreground">{value ?? "—"}</p>
      {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
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
      <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const { summary, daily, decisions, topKey } = data || {};

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="editorial-banner">
        <div className="app-kicker">Protection analytics</div>
        <h1 className="app-title">Upload decisions over time</h1>
        <p className="app-copy">Last 30 days across your active API keys</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard label="Total Requests" value={summary?.total_requests?.toLocaleString()} icon={Activity} />
        <StatCard label="Avg Latency"    value={summary?.avg_latency_ms ? `${summary.avg_latency_ms}ms` : null} icon={Gauge} />
        <StatCard label="Blocked"        value={summary?.total_blocked?.toLocaleString()} icon={ShieldX} />
        <StatCard label="Top Key"        value={topKey?.name} sub={topKey ? `${topKey.call_count} calls` : null} icon={Trophy} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        <div className="app-panel p-4 sm:p-5">
          <p className="text-sm font-black text-foreground mb-4">Requests Per Day</p>
          <DailyLineChart data={daily || []} />
        </div>
        <div className="app-panel p-4 sm:p-5">
          <p className="text-sm font-black text-foreground mb-4">Decision Breakdown</p>
          <DecisionDonut data={decisions || []} />
        </div>
      </div>
    </div>
  );
}
