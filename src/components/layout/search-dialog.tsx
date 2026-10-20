"use client";

import { useEffect, useId, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpRight, CornerDownLeft, Loader2, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";

type Suggestion = { slug: string; name: string; price: number; category: string; image: string | null };
type Results = { products: Suggestion[]; categories: { name: string; slug: string }[]; error?: string };

const popular = ["Headphones", "Leather", "Watch", "Candle", "Denim", "Sneakers"];

export function SearchDialog() {
  const router = useRouter();
  const listId = useId();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Results | null>(null);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);

  // ⌘K / Ctrl+K opens search from anywhere.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    const q = query.trim();
    if (!q) {
      setResults(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`, { signal: controller.signal });
        setResults((await res.json()) as Results);
        setActive(-1);
      } catch {
        // Aborted by a newer keystroke.
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 160);
    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [query]);

  function go(href: string) {
    setOpen(false);
    setQuery("");
    router.push(href);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    const items = results?.products ?? [];
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, items.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, -1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (active >= 0 && items[active]) go(`/product/${items[active].slug}`);
      else if (query.trim()) go(`/shop?q=${encodeURIComponent(query.trim())}`);
    }
  }

  return (
    <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
      <DialogPrimitive.Trigger asChild>
        <Button variant="ghost" size="icon" aria-label="Search (⌘K)">
          <Search className="size-[18px]" />
        </Button>
      </DialogPrimitive.Trigger>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0" />
        <DialogPrimitive.Content
          onOpenAutoFocus={(e) => {
            e.preventDefault();
            inputRef.current?.focus();
          }}
          className="fixed inset-x-3 top-3 z-50 mx-auto max-w-2xl overflow-hidden rounded-2xl border bg-popover shadow-float outline-none data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:slide-in-from-top-4 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 duration-300 sm:top-[12vh]"
        >
          <DialogPrimitive.Title className="sr-only">Search the store</DialogPrimitive.Title>
          <DialogPrimitive.Description className="sr-only">Type to see instant product suggestions.</DialogPrimitive.Description>
          <div className="flex items-center gap-3 border-b px-5">
            {loading ? <Loader2 className="size-5 animate-spin text-muted-foreground" /> : <Search className="size-5 text-muted-foreground" />}
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Search jackets, leather, headphones…"
              className="h-16 flex-1 bg-transparent text-lg outline-none placeholder:text-muted-foreground/70"
              role="combobox"
              aria-expanded={Boolean(results?.products.length)}
              aria-controls={listId}
              aria-activedescendant={active >= 0 ? `${listId}-${active}` : undefined}
              aria-autocomplete="list"
            />
            <DialogPrimitive.Close className="grid size-8 place-items-center rounded-full hover:bg-foreground/[0.06]" aria-label="Close search">
              <X className="size-4" />
            </DialogPrimitive.Close>
          </div>

          <div className="max-h-[60vh] overflow-y-auto p-3">
            {!query.trim() && (
              <div className="p-3">
                <p className="eyebrow text-muted-foreground">Popular searches</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {popular.map((term) => (
                    <button
                      key={term}
                      onClick={() => setQuery(term)}
                      className="rounded-full border px-4 py-1.5 text-sm transition hover:border-foreground/40 hover:bg-foreground/[0.03]"
                    >
                      {term}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {results && (
              <AnimatePresence mode="popLayout">
                {results.categories.length > 0 && (
                  <div className="flex flex-wrap gap-2 px-3 pb-3 pt-1">
                    {results.categories.map((c) => (
                      <button
                        key={c.slug}
                        onClick={() => go(`/shop?category=${c.slug}`)}
                        className="inline-flex items-center gap-1.5 rounded-full bg-accent-soft px-3.5 py-1.5 text-sm text-accent transition hover:opacity-80"
                      >
                        {c.name} <ArrowUpRight className="size-3.5" />
                      </button>
                    ))}
                  </div>
                )}
                <ul id={listId} role="listbox" aria-label="Product suggestions">
                  {results.products.map((p, i) => (
                    <motion.li
                      key={p.slug}
                      id={`${listId}-${i}`}
                      role="option"
                      aria-selected={active === i}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.03 }}
                    >
                      <button
                        onClick={() => go(`/product/${p.slug}`)}
                        onMouseEnter={() => setActive(i)}
                        className="flex w-full items-center gap-4 rounded-xl p-2.5 text-left transition aria-selected:bg-foreground/[0.05] data-[active=true]:bg-foreground/[0.05]"
                        data-active={active === i}
                        tabIndex={-1}
                      >
                        <span className="relative size-14 shrink-0 overflow-hidden rounded-lg bg-muted">
                          {p.image && <Image src={p.image} alt="" fill sizes="56px" className="object-cover" />}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-medium">{p.name}</span>
                          <span className="block text-sm text-muted-foreground">{p.category}</span>
                        </span>
                        <span className="text-sm tabular-nums">{formatPrice(p.price)}</span>
                      </button>
                    </motion.li>
                  ))}
                </ul>
                {results.error ? (
                  <p role="alert" className="px-3 py-10 text-center text-muted-foreground">
                    {results.error}
                  </p>
                ) : results.products.length === 0 && !loading && (
                  <p className="px-3 py-10 text-center text-muted-foreground">
                    No matches for “{query}”. Try a broader term.
                  </p>
                )}
              </AnimatePresence>
            )}
          </div>

          {query.trim() && (
            <button
              onClick={() => go(`/shop?q=${encodeURIComponent(query.trim())}`)}
              className="flex w-full items-center justify-between border-t px-5 py-3.5 text-sm text-muted-foreground transition hover:bg-foreground/[0.03] hover:text-foreground"
            >
              <span>
                See all results for <span className="text-foreground">“{query.trim()}”</span>
              </span>
              <CornerDownLeft className="size-4" />
            </button>
          )}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
