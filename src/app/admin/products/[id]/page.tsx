import { notFound } from "next/navigation";
import { DeleteProductButton } from "@/components/admin/delete-product-button";
import { ProductForm } from "@/components/admin/product-form";
import { AdminPageHeader } from "@/components/admin/page-header";
import { db } from "@/lib/db";
import { parseSpecs } from "@/lib/queries";

export const metadata = { title: "Edit product" };

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [product, categories] = await Promise.all([
    db.product.findUnique({ where: { id }, include: { images: { orderBy: { position: "asc" } }, variants: { orderBy: { sku: "asc" } } } }),
    db.category.findMany({ orderBy: { sortOrder: "asc" }, select: { id: true, name: true } }),
  ]);
  if (!product) notFound();

  return (
    <>
      <AdminPageHeader title={product.name} description="Edit details, imagery, variants and stock.">
        <DeleteProductButton id={product.id} name={product.name} redirectTo="/admin/products" />
      </AdminPageHeader>
      <ProductForm
        categories={categories}
        initial={{
          id: product.id,
          name: product.name,
          slug: product.slug,
          tagline: product.tagline,
          description: product.description,
          price: product.price,
          compareAt: product.compareAt,
          categoryId: product.categoryId,
          featured: product.featured,
          isActive: product.isActive,
          images: product.images.map(({ url, alt }) => ({ url, alt })),
          variants: product.variants.map(({ id, sku, size, color, colorHex, price, stock }) => ({ id, sku, size, color, colorHex, price, stock })),
          specs: parseSpecs(product.specs),
        }}
      />
    </>
  );
}
