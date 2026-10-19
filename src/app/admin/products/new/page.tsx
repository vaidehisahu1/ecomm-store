import { ProductForm } from "@/components/admin/product-form";
import { AdminPageHeader } from "@/components/admin/page-header";
import { db } from "@/lib/db";

export const metadata = { title: "New product" };

export default async function NewProductPage() {
  const categories = await db.category.findMany({ orderBy: { sortOrder: "asc" }, select: { id: true, name: true } });
  return (
    <>
      <AdminPageHeader title="New product" description="Add a product to the catalogue." />
      <ProductForm categories={categories} />
    </>
  );
}
