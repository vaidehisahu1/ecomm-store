"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import type { OrderStatus } from "@prisma/client";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { updateOrderStatus } from "@/actions/admin";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

const options: { value: OrderStatus; label: string }[] = [
  { value: "PENDING", label: "Pending" },
  { value: "PAID", label: "Paid" },
  { value: "SHIPPED", label: "Shipped" },
  { value: "DELIVERED", label: "Delivered" },
  { value: "CANCELLED", label: "Cancelled" },
];

export function OrderStatusSelect({ id, number, status, className }: { id: string; number: string; status: OrderStatus; className?: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const locked = status === "CANCELLED";

  function change(next: string) {
    startTransition(async () => {
      const res = await updateOrderStatus({ id, status: next });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success(`${number} marked ${next.toLowerCase()}`, next === "CANCELLED" ? { description: "Items were returned to stock." } : undefined);
      router.refresh();
    });
  }

  return (
    <div className="flex items-center gap-2">
      <Select value={status} onValueChange={change} disabled={pending || locked}>
        <SelectTrigger className={cn("h-9 w-36 rounded-full text-[13px]", className)} aria-label={`Status for order ${number}`}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {pending && <Loader2 className="size-4 animate-spin text-muted-foreground" />}
    </div>
  );
}
