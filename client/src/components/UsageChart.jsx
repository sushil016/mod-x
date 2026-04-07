// client/src/components/UsageChart.jsx
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";

const COLORS = { allow: "#22c55e", flag: "#f59e0b", block: "#ef4444" };

export function DailyLineChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={data}>
        <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={d => d.slice(5)} />
        <YAxis tick={{ fontSize: 11 }} />
        <Tooltip />
        <Line type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function DecisionDonut({ data }) {
  const formatted = data.map(d => ({ name: d.final_decision, value: d.count, fill: COLORS[d.final_decision] || "#94a3b8" }));
  return (
    <ResponsiveContainer width="100%" height={200}>
      <PieChart>
        <Pie data={formatted} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={({ name, percent }) => `${name} ${Math.round(percent * 100)}%`}>
          {formatted.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
        </Pie>
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}
