"use client";

import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatPrice } from "@/lib/utils";

const axisTick = { fill: "var(--muted-foreground)", fontSize: 12 };

function compactCurrency(cents: number) {
  const dollars = cents / 100;
  return dollars >= 1000 ? `$${(dollars / 1000).toFixed(dollars >= 10000 ? 0 : 1)}k` : `$${Math.round(dollars)}`;
}

function ChartTooltip({ active, payload, label, formatLabel }: { active?: boolean; payload?: { value: number; payload: Record<string, number | string> }[]; label?: string; formatLabel?: (l: string) => string }) {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload;
  return (
    <div className="rounded-lg border bg-popover px-3.5 py-2.5 text-sm shadow-lift">
      <p className="text-[12px] text-muted-foreground">{formatLabel && label ? formatLabel(label) : label}</p>
      <p className="mt-0.5 font-medium tabular-nums">{formatPrice(payload[0].value)}</p>
      {typeof row.orders === "number" && <p className="text-[12px] text-muted-foreground tabular-nums">{row.orders} orders</p>}
    </div>
  );
}

const shortDate = (iso: string) => new Date(`${iso}T12:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" });

export function RevenueChart({ data }: { data: { date: string; revenue: number; orders: number }[] }) {
  return (
    <div className="h-72 w-full" role="img" aria-label="Daily revenue over the selected period">
      <ResponsiveContainer>
        <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.22} />
              <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke="var(--border)" />
          <XAxis dataKey="date" tickFormatter={shortDate} tick={axisTick} tickLine={false} axisLine={false} minTickGap={32} tickMargin={10} />
          <YAxis tickFormatter={compactCurrency} tick={axisTick} tickLine={false} axisLine={false} width={52} />
          <Tooltip content={<ChartTooltip formatLabel={shortDate} />} cursor={{ stroke: "var(--foreground)", strokeOpacity: 0.25, strokeDasharray: "3 3" }} />
          <Area
            type="monotone"
            dataKey="revenue"
            stroke="var(--chart-1)"
            strokeWidth={2}
            fill="url(#revenueFill)"
            activeDot={{ r: 5, strokeWidth: 2, stroke: "var(--card)", fill: "var(--chart-1)" }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function CategoryChart({ data }: { data: { name: string; revenue: number }[] }) {
  return (
    <div className="w-full" style={{ height: Math.max(180, data.length * 44) }} role="img" aria-label="Revenue by category">
      <ResponsiveContainer>
        <BarChart data={data} layout="vertical" margin={{ top: 0, right: 16, left: 0, bottom: 0 }} barCategoryGap={10}>
          <CartesianGrid horizontal={false} stroke="var(--border)" />
          <XAxis type="number" tickFormatter={compactCurrency} tick={axisTick} tickLine={false} axisLine={false} />
          <YAxis type="category" dataKey="name" tick={axisTick} tickLine={false} axisLine={false} width={130} />
          <Tooltip content={<ChartTooltip />} cursor={{ fill: "var(--foreground)", fillOpacity: 0.04 }} />
          <Bar dataKey="revenue" fill="var(--chart-1)" radius={[0, 4, 4, 0]} maxBarSize={22} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
