import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

export function StatCard({ label, value, delta, note }: { label: string; value: string; delta: number | null; note?: string }) {
  const up = delta !== null && delta > 0.005;
  const down = delta !== null && delta < -0.005;
  const Icon = up ? ArrowUpRight : down ? ArrowDownRight : Minus;
  return (
    <div className="rounded-2xl border bg-card p-5 sm:p-6">
      <p className="text-[13px] text-muted-foreground">{label}</p>
      <p className="mt-3 font-display text-4xl tabular-nums">{value}</p>
      <p className="mt-3 flex items-center gap-1.5 text-[12px] text-muted-foreground">
        {delta !== null ? (
          <span className={cn("inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 font-medium", up && "bg-success/10 text-success", down && "bg-destructive/10 text-destructive")}>
            <Icon className="size-3.5" aria-hidden />
            <span className="sr-only">{up ? "Up" : down ? "Down" : "Flat"}</span>
            {Math.abs(delta * 100).toFixed(1)}%
          </span>
        ) : (
          <span>—</span>
        )}
        {note ?? "vs previous period"}
      </p>
    </div>
  );
}
