import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";

const COLORS = { allow: "#22c55e", flag: "#f59e0b", block: "#ef4444" };

export function DailyLineChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={data}>
        <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#9ca3af" }} tickFormatter={d => d.slice(5)} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
        <Tooltip contentStyle={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: "12px", fontSize: "12px" }} />
        <Line type="monotone" dataKey="count" stroke="#4f46e5" strokeWidth={2.5} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function DecisionDonut({ data }) {
  const formatted = data.map(d => ({ name: d.final_decision, value: d.count, fill: COLORS[d.final_decision] || "#94a3b8" }));
  return (
    <ResponsiveContainer width="100%" height={200}>
      <PieChart>
        <Pie data={formatted} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} innerRadius={40} paddingAngle={3}>
          {formatted.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
        </Pie>
        <Legend iconType="circle" iconSize={8} formatter={v => <span style={{ fontSize: "12px", color: "#9ca3af" }}>{v}</span>} />
        <Tooltip contentStyle={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: "12px", fontSize: "12px" }} />
      </PieChart>
    </ResponsiveContainer>
  );
}
