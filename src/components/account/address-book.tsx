"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2, MapPin, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deleteAddress, saveAddress, setDefaultAddress } from "@/actions/account";
import { AddressFields, emptyAddress, type AddressDraft } from "@/components/checkout/address-fields";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

type Address = AddressDraft & { id: string; isDefault: boolean };

export function AddressBook({ addresses }: { addresses: Address[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<{ id?: string; draft: AddressDraft; isDefault: boolean } | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function save() {
    if (!editing) return;
    startTransition(async () => {
      const res = await saveAddress({ ...editing.draft, id: editing.id, isDefault: editing.isDefault });
      if (res?.fieldErrors) {
        setErrors(res.fieldErrors);
        return;
      }
      toast.success(editing.id ? "Address updated" : "Address added");
      setEditing(null);
      setErrors({});
      router.refresh();
    });
  }

  function remove(id: string) {
    startTransition(async () => {
      const res = await deleteAddress({ id });
      if (res?.error) toast.error(res.error);
      else toast("Address removed");
      setConfirmDelete(null);
      router.refresh();
    });
  }

  function makeDefault(id: string) {
    startTransition(async () => {
      await setDefaultAddress({ id });
      toast.success("Default address updated");
      router.refresh();
    });
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <h2 className="font-display text-3xl">Saved addresses</h2>
        <Button onClick={() => setEditing({ draft: { ...emptyAddress }, isDefault: addresses.length === 0 })}>
          <Plus /> Add address
        </Button>
      </div>

      {addresses.length === 0 ? (
        <div className="mt-6 flex flex-col items-center rounded-2xl border border-dashed px-6 py-16 text-center">
          <MapPin className="size-9 text-muted-foreground" strokeWidth={1.4} />
          <p className="mt-4 font-medium">No saved addresses</p>
          <p className="mt-1 text-sm text-muted-foreground">Save an address for faster checkout.</p>
        </div>
      ) : (
        <ul className="mt-6 grid gap-4 sm:grid-cols-2">
          <AnimatePresence initial={false}>
            {addresses.map((a) => (
              <motion.li key={a.id} layout initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.97 }} className="flex flex-col rounded-2xl border bg-card p-6">
                <div className="flex items-center justify-between">
                  <p className="font-medium">{a.label}</p>
                  {a.isDefault && <span className="rounded-full bg-foreground px-2.5 py-0.5 text-[11px] text-background">Default</span>}
                </div>
                <address className="mt-3 flex-1 text-sm not-italic leading-relaxed text-muted-foreground">
                  {a.fullName}
                  <br />
                  {a.line1}
                  {a.line2 && <>, {a.line2}</>}
                  <br />
                  {a.city}, {a.state} {a.postalCode}
                  <br />
                  {a.country} · {a.phone}
                </address>
                <div className="mt-5 flex flex-wrap items-center gap-2 border-t pt-4">
                  <Button variant="ghost" size="sm" onClick={() => setEditing({ id: a.id, draft: a, isDefault: a.isDefault })}>
                    <Pencil /> Edit
                  </Button>
                  {confirmDelete === a.id ? (
                    <>
                      <Button variant="destructive" size="sm" onClick={() => remove(a.id)} disabled={pending}>
                        Confirm delete
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => setConfirmDelete(null)}>
                        Keep
                      </Button>
                    </>
                  ) : (
                    <Button variant="ghost" size="sm" onClick={() => setConfirmDelete(a.id)}>
                      <Trash2 /> Delete
                    </Button>
                  )}
                  {!a.isDefault && (
                    <Button variant="link" size="sm" className="ml-auto" onClick={() => makeDefault(a.id)} disabled={pending}>
                      Set as default
                    </Button>
                  )}
                </div>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      )}

      <Dialog open={editing !== null} onOpenChange={(open) => !open && (setEditing(null), setErrors({}))}>
        <DialogContent className="max-w-xl">
          <DialogTitle>{editing?.id ? "Edit address" : "New address"}</DialogTitle>
          <DialogDescription>Used for shipping and order updates.</DialogDescription>
          {editing && (
            <>
              <AddressFields value={editing.draft} onChange={(draft) => setEditing({ ...editing, draft })} errors={errors} idPrefix="book" showLabel />
              <div className="flex items-center gap-3">
                <Checkbox id="default" checked={editing.isDefault} onCheckedChange={(v) => setEditing({ ...editing, isDefault: v === true })} />
                <Label htmlFor="default" className="font-normal">
                  Make this my default address
                </Label>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="ghost" onClick={() => setEditing(null)}>
                  Cancel
                </Button>
                <Button onClick={save} disabled={pending}>
                  {pending && <Loader2 className="animate-spin" />} Save address
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
