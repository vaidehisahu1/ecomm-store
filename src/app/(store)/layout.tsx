import { auth } from "@/auth";
import { CartDrawer } from "@/components/cart/cart-drawer";
import { CartSync } from "@/components/cart/cart-sync";
import { AnnouncementBar } from "@/components/layout/announcement-bar";
import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import { WishlistHydrator } from "@/components/product/wishlist-button";
import { db } from "@/lib/db";
import { getCategories } from "@/lib/queries";

export default async function StoreLayout({ children }: { children: React.ReactNode }) {
  const [session, categories] = await Promise.all([auth(), getCategories()]);
  const wishlist = session?.user?.id
    ? await db.wishlistItem.findMany({ where: { userId: session.user.id }, select: { productId: true } })
    : [];
  const user = session?.user
    ? { name: session.user.name ?? "", email: session.user.email ?? "", role: session.user.role }
    : null;
  return (
    <>
      <AnnouncementBar />
      <Header user={user} categories={categories.map(({ name, slug, image, description }) => ({ name, slug, image, description }))} />
      <main id="main" className="min-h-[60vh]">
        {children}
      </main>
      <Footer />
      <CartDrawer />
      <CartSync userId={session?.user?.id ?? null} />
      <WishlistHydrator ids={wishlist.map((w) => w.productId)} />
    </>
  );
}
