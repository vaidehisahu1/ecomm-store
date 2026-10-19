import type { Metadata } from "next";
import { CartView } from "@/components/cart/cart-view";
import { ProductCarousel } from "@/components/home/product-carousel";
import { getFeaturedProducts } from "@/lib/queries";

export const metadata: Metadata = { title: "Your bag", robots: { index: false } };

export default async function CartPage() {
  const recommended = await getFeaturedProducts(8);
  return (
    <>
      <div className="container-page pb-8 pt-14 lg:pt-20">
        <h1 className="mb-10 font-display text-display-xl">
          Your <em>bag</em>
        </h1>
        <CartView />
      </div>
      <div className="mt-24">
        <ProductCarousel products={recommended} eyebrow="Complete the look" title={<>You might <em>also like</em></>} href="/shop" />
      </div>
    </>
  );
}
