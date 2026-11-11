import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { SkillDemandPoint } from "@/types";

export function SkillsBarChart({ data }: { data: SkillDemandPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke="var(--color-line)" />
        <XAxis dataKey="skill" tick={{ fontSize: 11, fill: "var(--color-muted)" }} axisLine={false} tickLine={false} interval={0} angle={-20} textAnchor="end" height={50} />
        <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: "var(--color-muted)" }} axisLine={false} tickLine={false} width={32} />
        <Tooltip
          cursor={{ fill: "var(--color-sunken)" }}
          formatter={(value) => [`${value}`, "Applicants matching this skill"]}
          contentStyle={{
            background: "var(--color-surface)",
            border: "1px solid var(--color-line)",
            borderRadius: 8,
            fontSize: 12,
            color: "var(--color-ink)",
          }}
        />
        <Bar dataKey="count" fill="var(--color-accent)" radius={[6, 6, 0, 0]} maxBarSize={32} />
      </BarChart>
    </ResponsiveContainer>
  );
}
