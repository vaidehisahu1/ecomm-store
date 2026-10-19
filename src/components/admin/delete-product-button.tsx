"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deleteProduct } from "@/actions/admin";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export function DeleteProductButton({ id, name, redirectTo }: { id: string; name: string; redirectTo?: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function confirm() {
    startTransition(async () => {
      const res = await deleteProduct({ id });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success(`${name} deleted`);
      setOpen(false);
      if (redirectTo) router.push(redirectTo);
      else router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label={`Delete ${name}`}>
          <Trash2 className="text-destructive" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogTitle>Delete product?</DialogTitle>
        <DialogDescription>
          “{name}” and all its variants will be removed from the store. Past orders keep their line items. Consider hiding it instead if you might sell it again.
        </DialogDescription>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={confirm} disabled={pending}>
            {pending && <Loader2 className="animate-spin" />} Delete product
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
