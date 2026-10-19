import Link from "next/link";
import { ArrowLeft, Lock } from "lucide-react";
import { auth } from "@/auth";
import { Logo } from "@/components/brand/logo";
import { CartSync } from "@/components/cart/cart-sync";
import { ThemeToggle } from "@/components/layout/theme-toggle";

export default async function CheckoutLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  return (
    <>
      <header className="border-b">
        <div className="container-page grid h-16 grid-cols-[1fr_auto_1fr] items-center lg:h-20">
          <Link href="/cart" className="inline-flex items-center gap-2 text-sm text-muted-foreground transition hover:text-foreground">
            <ArrowLeft className="size-4" /> <span className="hidden sm:inline">Back to bag</span>
          </Link>
          <Link href="/" aria-label="Halden home">
            <Logo className="h-[18px]" />
          </Link>
          <div className="flex items-center justify-end gap-2 text-sm text-muted-foreground">
            <Lock className="size-4" /> <span className="hidden sm:inline">Secure checkout</span>
            <ThemeToggle />
          </div>
        </div>
      </header>
      <main id="main" className="container-page pb-24 pt-10 lg:pt-14">
        {children}
      </main>
      <CartSync userId={session?.user?.id ?? null} />
    </>
  );
}
