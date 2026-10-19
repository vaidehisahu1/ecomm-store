import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AccountNav } from "@/components/account/account-nav";

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/account");
  return (
    <div className="container-page pt-12 lg:pt-16">
      <p className="eyebrow text-accent">Your account</p>
      <h1 className="mt-3 font-display text-display-lg">
        Hello, <em>{session.user.name?.split(" ")[0]}</em>
      </h1>
      <div className="mt-10 grid gap-10 lg:mt-14 lg:grid-cols-[220px_1fr] lg:gap-16">
        <aside>
          <div className="lg:sticky lg:top-28">
            <AccountNav />
          </div>
        </aside>
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
