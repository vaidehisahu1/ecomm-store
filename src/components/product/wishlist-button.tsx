"use client";

import { useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Heart } from "lucide-react";
import { toast } from "sonner";
import { toggleWishlist } from "@/actions/wishlist";
import { useWishlist } from "@/lib/wishlist-store";
import { cn } from "@/lib/utils";

export function WishlistButton({
  productId,
  productName,
  variant = "floating",
  className,
}: {
  productId: string;
  productName: string;
  variant?: "floating" | "outline";
  className?: string;
}) {
  const router = useRouter();
  const saved = useWishlist((s) => s.ids.has(productId));
  const toggleLocal = useWishlist((s) => s.toggleLocal);
  const [pending, startTransition] = useTransition();

  function onClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const next = !saved;
    toggleLocal(productId, next);
    startTransition(async () => {
      const res = await toggleWishlist({ productId });
      if (!res.ok) {
        toggleLocal(productId, !next);
        if (res.reason === "auth") {
          toast("Sign in to save favourites", {
            description: "Your wishlist follows you across devices.",
            action: { label: "Sign in", onClick: () => router.push(`/login?callbackUrl=${encodeURIComponent(window.location.pathname)}`) },
          });
        }
        return;
      }
      toast(res.saved ? "Saved to wishlist" : "Removed from wishlist", { description: productName });
    });
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      aria-pressed={saved}
      aria-label={saved ? `Remove ${productName} from wishlist` : `Save ${productName} to wishlist`}
      className={cn(
        "grid place-items-center rounded-full transition active:scale-90",
        variant === "floating"
          ? "size-9 bg-background/80 shadow-soft backdrop-blur-md hover:bg-background"
          : "size-13 border border-foreground/15 hover:border-foreground/40",
        className,
      )}
    >
      <motion.span key={String(saved)} initial={{ scale: saved ? 0.4 : 1 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 500, damping: 15 }}>
        <Heart className={cn("size-4", saved && "fill-accent text-accent")} />
      </motion.span>
    </button>
  );
}

export function WishlistHydrator({ ids }: { ids: string[] }) {
  const set = useWishlist((s) => s.set);
  const key = ids.join(",");
  useEffect(() => {
    set(key ? key.split(",") : []);
  }, [key, set]);
  return null;
}
