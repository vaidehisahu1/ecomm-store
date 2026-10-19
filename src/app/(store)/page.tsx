import { Reveal } from "@/components/common/reveal";
import { SectionHeading } from "@/components/common/section-heading";
import { CategoryGrid } from "@/components/home/category-grid";
import { Editorial } from "@/components/home/editorial";
import { Hero } from "@/components/home/hero";
import { NewsletterSection } from "@/components/home/newsletter-section";
import { ProductCarousel } from "@/components/home/product-carousel";
import { PromoBanner } from "@/components/home/promo-banner";
import { Testimonials } from "@/components/home/testimonials";
import { ValuesStrip } from "@/components/home/values-strip";
import { ProductCard } from "@/components/product/product-card";
import { getCategories, getFeaturedProducts, getNewArrivals } from "@/lib/queries";

export default async function HomePage() {
  const [categories, trending, arrivals] = await Promise.all([getCategories(), getFeaturedProducts(10), getNewArrivals(4)]);
  const spotlight = arrivals[0];

  return (
    <div className="space-y-28 lg:space-y-40">
      <Hero
        spotlight={
          spotlight ? { slug: spotlight.slug, name: spotlight.name, price: spotlight.price, image: spotlight.images[0]?.url ?? "" } : null
        }
      />

      <section className="container-page">
        <SectionHeading eyebrow="Shop by category" title={<>Everything, <em>considered.</em></>} href="/shop" linkLabel="Shop all" className="mb-10" />
        <CategoryGrid categories={categories} />
      </section>

      <ProductCarousel products={trending} eyebrow="Trending now" title={<>The most-wanted <em>this week</em></>} href="/shop?sort=popular" />

      <PromoBanner />

      <section className="container-page">
        <SectionHeading eyebrow="Just landed" title={<>New <em>arrivals</em></>} href="/shop?sort=newest" className="mb-10" />
        <div className="grid grid-cols-2 gap-x-4 gap-y-10 lg:grid-cols-4 lg:gap-x-6">
          {arrivals.map((p, i) => (
            <Reveal key={p.id} delay={i * 0.06}>
              <ProductCard product={p} />
            </Reveal>
          ))}
        </div>
      </section>

      <Editorial />
      <ValuesStrip />
      <Testimonials />
      <NewsletterSection />
    </div>
  );
}
