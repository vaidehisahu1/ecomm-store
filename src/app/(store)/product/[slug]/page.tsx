import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { Reveal } from "@/components/common/reveal";
import { SectionHeading } from "@/components/common/section-heading";
import { ProductCard } from "@/components/product/product-card";
import { ProductView } from "@/components/product/product-view";
import { Reviews } from "@/components/product/reviews";
import { HashTabs } from "@/components/product/hash-tabs";
import { TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getProductBySlug, getRelatedProducts, parseSpecs } from "@/lib/queries";
import { site } from "@/lib/site";
import { absoluteUrl } from "@/lib/utils";

const TAB_VALUES = ["description", "specs", "reviews"];

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const product = await getProductBySlug((await params).slug);
  if (!product) return { title: "Product not found" };
  const image = product.images[0]?.url;
  return {
    title: product.name,
    description: `${product.tagline} ${product.description.slice(0, 120)}…`,
    alternates: { canonical: `/product/${product.slug}` },
    openGraph: {
      title: `${product.name} · ${site.name}`,
      description: product.tagline,
      url: absoluteUrl(`/product/${product.slug}`),
      images: image ? [{ url: image, width: 1200, height: 1500, alt: product.name }] : undefined,
    },
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();
  const [session, related] = await Promise.all([auth(), getRelatedProducts(product.id, product.categoryId)]);
  const specs = parseSpecs(product.specs);
  const totalStock = product.variants.reduce((s, v) => s + v.stock, 0);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    image: product.images.map((i) => i.url),
    sku: product.variants[0]?.sku,
    brand: { "@type": "Brand", name: site.name },
    category: product.category.name,
    ...(product.reviewCount > 0 && {
      aggregateRating: { "@type": "AggregateRating", ratingValue: product.rating, reviewCount: product.reviewCount },
    }),
    offers: {
      "@type": "Offer",
      priceCurrency: "USD",
      price: (product.price / 100).toFixed(2),
      availability: totalStock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      url: absoluteUrl(`/product/${product.slug}`),
    },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <div className="container-page pt-6 lg:pt-10">
        <nav aria-label="Breadcrumb" className="mb-6 text-[13px] text-muted-foreground lg:mb-8">
          <ol className="flex flex-wrap gap-2">
            <li>
              <Link href="/" className="hover:text-foreground">Home</Link>
            </li>
            <li aria-hidden>/</li>
            <li>
              <Link href={`/shop?category=${product.category.slug}`} className="hover:text-foreground">
                {product.category.name}
              </Link>
            </li>
            <li aria-hidden>/</li>
            <li aria-current="page" className="text-foreground">{product.name}</li>
          </ol>
        </nav>

        <ProductView
          product={{
            id: product.id,
            slug: product.slug,
            name: product.name,
            tagline: product.tagline,
            price: product.price,
            compareAt: product.compareAt,
            rating: product.rating,
            reviewCount: product.reviewCount,
            category: { name: product.category.name, slug: product.category.slug },
            images: product.images.map(({ id, url, alt }) => ({ id, url, alt })),
            variants: product.variants.map(({ id, size, color, colorHex, price, stock }) => ({ id, size, color, colorHex, price, stock })),
          }}
        />

        <section className="mt-24 lg:mt-32" id="reviews">
          <HashTabs defaultValue="description" values={TAB_VALUES}>
            <TabsList aria-label="Product information">
              <TabsTrigger value="description">Description</TabsTrigger>
              <TabsTrigger value="specs">Specifications</TabsTrigger>
              <TabsTrigger value="reviews">Reviews ({product.reviewCount})</TabsTrigger>
            </TabsList>
            <TabsContent value="description">
              <div className="grid gap-10 lg:grid-cols-[1fr_1fr] lg:gap-20">
                <p className="font-display text-display-sm">{product.tagline}</p>
                <div className="space-y-5 text-[17px] leading-relaxed text-muted-foreground">
                  <p>{product.description}</p>
                  <p>
                    Every {site.name} piece ships in plastic-free packaging with a care card written by the workshop that made it. If something
                    isn’t right, return it within 30 days — free.
                  </p>
                </div>
              </div>
            </TabsContent>
            <TabsContent value="specs">
              <dl className="grid max-w-3xl divide-y border-y">
                {specs.map((s) => (
                  <div key={s.label} className="grid grid-cols-[minmax(120px,200px)_1fr] gap-6 py-4">
                    <dt className="text-sm text-muted-foreground">{s.label}</dt>
                    <dd className="text-[15px]">{s.value}</dd>
                  </div>
                ))}
                <div className="grid grid-cols-[minmax(120px,200px)_1fr] gap-6 py-4">
                  <dt className="text-sm text-muted-foreground">SKU</dt>
                  <dd className="font-mono text-[13px]">{product.variants[0]?.sku.split("-")[0]}</dd>
                </div>
              </dl>
            </TabsContent>
            <TabsContent value="reviews">
              <Reviews productId={product.id} slug={product.slug} rating={product.rating} reviews={product.reviews} signedIn={Boolean(session?.user)} />
            </TabsContent>
          </HashTabs>
        </section>
      </div>

      {related.length > 0 && (
        <section className="container-page mt-28 lg:mt-36">
          <SectionHeading eyebrow="You may also like" title={<>Pairs <em>well with</em></>} href={`/shop?category=${product.category.slug}`} className="mb-10" />
          <ul className="grid grid-cols-2 gap-x-4 gap-y-10 lg:grid-cols-4 lg:gap-x-6">
            {related.map((p, i) => (
              <li key={p.id}>
                <Reveal delay={i * 0.06}>
                  <ProductCard product={p} />
                </Reveal>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
