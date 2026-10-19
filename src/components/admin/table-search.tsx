"use client";

import { useEffect, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Loader2, Search } from "lucide-react";

/** Debounced search box that syncs to the `q` URL param. */
export function TableSearch({ placeholder }: { placeholder: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [value, setValue] = useState(params.get("q") ?? "");
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    const current = params.get("q") ?? "";
    if (value.trim() === current) return;
    const t = window.setTimeout(() => {
      const next = new URLSearchParams(params.toString());
      if (value.trim()) next.set("q", value.trim());
      else next.delete("q");
      next.delete("page");
      startTransition(() => router.replace(`${pathname}?${next.toString()}`));
    }, 250);
    return () => window.clearTimeout(t);
  }, [value, params, pathname, router]);

  return (
    <div className="relative">
      {pending ? (
        <Loader2 className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 animate-spin text-muted-foreground" />
      ) : (
        <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      )}
      <label htmlFor="table-search" className="sr-only">
        {placeholder}
      </label>
      <input
        id="table-search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        className="h-10 w-full rounded-full border border-input bg-card pl-10 pr-4 text-sm outline-none transition focus:border-ring focus:ring-4 focus:ring-ring/15 sm:w-72"
      />
    </div>
  );
}
