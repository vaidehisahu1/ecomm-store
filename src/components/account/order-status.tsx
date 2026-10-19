import type { OrderStatus } from "@prisma/client";
import { Check, CircleDot, Package, Truck, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn, formatDate } from "@/lib/utils";

const statusMeta: Record<OrderStatus, { label: string; variant: "warning" | "soft" | "outline" | "success" | "destructive" }> = {
  PENDING: { label: "Pending payment", variant: "warning" },
  PAID: { label: "Processing", variant: "soft" },
  SHIPPED: { label: "Shipped", variant: "outline" },
  DELIVERED: { label: "Delivered", variant: "success" },
  CANCELLED: { label: "Cancelled", variant: "destructive" },
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const meta = statusMeta[status];
  return <Badge variant={meta.variant}>{meta.label}</Badge>;
}

const timeline = [
  { status: "PAID", label: "Order confirmed", icon: Check },
  { status: "PROCESSING", label: "Packed in studio", icon: Package },
  { status: "SHIPPED", label: "On its way", icon: Truck },
  { status: "DELIVERED", label: "Delivered", icon: CircleDot },
] as const;

/** Visual tracker. Dates are estimated from the order date for display purposes. */
export function OrderTracker({ status, createdAt }: { status: OrderStatus; createdAt: Date }) {
  if (status === "CANCELLED") {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-destructive/25 bg-destructive/[0.05] p-5 text-sm text-destructive">
        <X className="size-5" /> This order was cancelled. Any payment has been refunded to the original method.
      </div>
    );
  }
  const reached = { PENDING: 0, PAID: 2, SHIPPED: 3, DELIVERED: 4 }[status];
  const dayOffsets = [0, 1, 2, 5];
  return (
    <ol className="grid grid-cols-4 gap-2" aria-label="Order progress">
      {timeline.map((t, i) => {
        const done = i < reached;
        const date = new Date(createdAt.getTime() + dayOffsets[i] * 86400000);
        return (
          <li key={t.label} className="relative">
            {i < timeline.length - 1 && (
              <span className={cn("absolute left-5 right-[-0.5rem] top-5 h-0.5 -translate-y-1/2", i < reached - 1 ? "bg-foreground" : "bg-border")} aria-hidden />
            )}
            <span className={cn("relative grid size-10 place-items-center rounded-full border-2 bg-background transition", done ? "border-foreground bg-foreground text-background" : "text-muted-foreground")}>
              <t.icon className="size-4" />
            </span>
            <p className={cn("mt-3 text-[13px] font-medium", !done && "text-muted-foreground")}>{t.label}</p>
            <p className="text-[12px] text-muted-foreground">{done ? formatDate(date, { month: "short", day: "numeric" }) : "Pending"}</p>
            <span className="sr-only">{done ? "completed" : "not yet"}</span>
          </li>
        );
      })}
    </ol>
  );
}
