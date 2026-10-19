"use client";

import { useState } from "react";
import { Menu } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { AdminNav } from "@/components/admin/admin-nav";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

export function AdminMobileNav({ unread }: { unread: number }) {
  const [open, setOpen] = useState(false);
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open admin menu">
          <Menu className="size-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="p-5">
        <SheetTitle className="sr-only">Admin navigation</SheetTitle>
        <SheetDescription className="sr-only">Navigate the admin dashboard</SheetDescription>
        <Logo className="mb-8 mt-2 h-[18px]" />
        <AdminNav unread={unread} onNavigate={() => setOpen(false)} />
      </SheetContent>
    </Sheet>
  );
}
