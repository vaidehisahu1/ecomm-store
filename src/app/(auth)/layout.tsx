import Image from "next/image";
import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { ThemeToggle } from "@/components/layout/theme-toggle";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      <div className="flex flex-col px-6 py-6 sm:px-12">
        <div className="flex items-center justify-between">
          <Link href="/" aria-label="Halden home">
            <Logo className="h-[18px]" />
          </Link>
          <ThemeToggle />
        </div>
        <main id="main" className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-16">
          {children}
        </main>
        <p className="text-center text-[12px] text-muted-foreground">
          Protected by industry-standard encryption. <Link href="/privacy" className="underline underline-offset-2">Privacy</Link>
        </p>
      </div>
      <div className="relative hidden overflow-hidden bg-muted lg:block">
        <Image
          src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1600&q=80"
          alt="Neutral-toned clothing hanging on a minimal rail"
          fill
          priority
          sizes="50vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
        <figure className="absolute inset-x-12 bottom-12 text-white">
          <blockquote className="font-display text-4xl leading-tight">“The best things in life are the ones you get to keep for a long time.”</blockquote>
          <figcaption className="mt-5 text-sm text-white/70">— From the Halden studio journal</figcaption>
        </figure>
      </div>
    </div>
  );
}
