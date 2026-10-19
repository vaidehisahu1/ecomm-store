"use client";

import { useRef, useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, ImagePlus, Link2, Loader2, Plus, Trash2, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { saveProduct, uploadImage } from "@/actions/admin";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Input, Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { cn, slugify } from "@/lib/utils";
import { isAllowedImageUrl } from "@/lib/validators";

type VariantRow = { key: string; id?: string; sku: string; size: string; color: string; colorHex: string; price: string; stock: string };
type ImageRow = { key: string; url: string; alt: string };
type SpecRow = { key: string; label: string; value: string };

export type ProductFormValues = {
  id?: string;
  name: string;
  slug: string;
  tagline: string;
  description: string;
  price: number;
  compareAt: number | null;
  categoryId: string;
  featured: boolean;
  isActive: boolean;
  images: { url: string; alt: string }[];
  variants: { id?: string; sku: string; size: string | null; color: string | null; colorHex: string | null; price: number | null; stock: number }[];
  specs: { label: string; value: string }[];
};

const uid = () => Math.random().toString(36).slice(2, 10);
const toDollars = (cents: number | null) => (cents == null ? "" : (cents / 100).toFixed(2).replace(/\.00$/, ""));
const toCents = (value: string) => (value.trim() === "" ? null : Math.round(Number(value) * 100));

function Section({ title, description, children, action }: { title: string; description?: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <section className="rounded-2xl border bg-card p-5 sm:p-6">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h2 className="font-medium">{title}</h2>
          {description && <p className="mt-1 text-[13px] text-muted-foreground">{description}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

export function ProductForm({ categories, initial }: { categories: { id: string; name: string }[]; initial?: ProductFormValues }) {
  const router = useRouter();
  const fileInput = useRef<HTMLInputElement>(null);
  const [pending, startTransition] = useTransition();
  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [slugTouched, setSlugTouched] = useState(Boolean(initial));
  const [imageUrl, setImageUrl] = useState("");

  const [form, setForm] = useState({
    name: initial?.name ?? "",
    slug: initial?.slug ?? "",
    tagline: initial?.tagline ?? "",
    description: initial?.description ?? "",
    price: toDollars(initial?.price ?? null),
    compareAt: toDollars(initial?.compareAt ?? null),
    categoryId: initial?.categoryId ?? categories[0]?.id ?? "",
    featured: initial?.featured ?? false,
    isActive: initial?.isActive ?? true,
  });
  const [images, setImages] = useState<ImageRow[]>(initial?.images.map((i) => ({ ...i, key: uid() })) ?? []);
  const [variants, setVariants] = useState<VariantRow[]>(
    initial?.variants.map((v) => ({
      key: uid(),
      id: v.id,
      sku: v.sku,
      size: v.size ?? "",
      color: v.color ?? "",
      colorHex: v.colorHex ?? "",
      price: toDollars(v.price),
      stock: String(v.stock),
    })) ?? [{ key: uid(), sku: "", size: "", color: "", colorHex: "", price: "", stock: "10" }],
  );
  const [specs, setSpecs] = useState<SpecRow[]>(initial?.specs.map((s) => ({ ...s, key: uid() })) ?? []);

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => setForm((f) => ({ ...f, [key]: value }));
  const updateVariant = (key: string, patch: Partial<VariantRow>) => setVariants((vs) => vs.map((v) => (v.key === key ? { ...v, ...patch } : v)));
  const moveImage = (index: number, dir: -1 | 1) =>
    setImages((imgs) => {
      const next = [...imgs];
      const [item] = next.splice(index, 1);
      next.splice(index + dir, 0, item);
      return next;
    });

  function addImageUrl() {
    const url = imageUrl.trim();
    if (!isAllowedImageUrl(url)) {
      toast.error("Use an images.unsplash.com URL, or upload a file");
      return;
    }
    setImages((imgs) => [...imgs, { key: uid(), url, alt: form.name }]);
    setImageUrl("");
  }

  async function onUpload(files: FileList | null) {
    if (!files?.length) return;
    setUploading(true);
    for (const file of Array.from(files)) {
      const data = new FormData();
      data.append("file", file);
      const res = await uploadImage(data);
      if (res.ok) setImages((imgs) => [...imgs, { key: uid(), url: res.url, alt: form.name }]);
      else toast.error(res.error);
    }
    setUploading(false);
    if (fileInput.current) fileInput.current.value = "";
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const payload = {
      name: form.name,
      slug: form.slug,
      tagline: form.tagline,
      description: form.description,
      price: toCents(form.price) ?? 0,
      compareAt: toCents(form.compareAt),
      categoryId: form.categoryId,
      featured: form.featured,
      isActive: form.isActive,
      images: images.map(({ url, alt }) => ({ url, alt })),
      variants: variants.map((v) => ({
        id: v.id,
        sku: v.sku,
        size: v.size,
        color: v.color,
        colorHex: v.colorHex,
        price: toCents(v.price),
        stock: Number.parseInt(v.stock || "0", 10),
      })),
      specs: specs.filter((s) => s.label.trim() || s.value.trim()).map(({ label, value }) => ({ label, value })),
    };
    startTransition(async () => {
      const res = await saveProduct(payload, initial?.id);
      if (!res.ok) {
        setErrors(res.fieldErrors ?? {});
        toast.error(res.error);
        return;
      }
      setErrors({});
      toast.success(initial ? "Product saved" : "Product created");
      router.push("/admin/products");
      router.refresh();
    });
  }

  const variantError = Object.entries(errors).find(([k]) => k.startsWith("variants"))?.[1];
  const imageError = Object.entries(errors).find(([k]) => k.startsWith("images"))?.[1];
  const cell = "h-10 w-full rounded-md border border-input bg-background px-2.5 text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/15";

  return (
    <form onSubmit={submit} className="grid gap-4 xl:grid-cols-[1fr_340px]" noValidate>
      <div className="min-w-0 space-y-4">
        <Section title="Details">
          <div className="grid gap-5">
            <FormField id="name" label="Name" error={errors.name}>
              <Input
                value={form.name}
                onChange={(e) => {
                  set("name", e.target.value);
                  if (!slugTouched) set("slug", slugify(e.target.value));
                }}
              />
            </FormField>
            <FormField id="slug" label="URL slug" error={errors.slug} hint={`/product/${form.slug || "…"}`}>
              <Input
                value={form.slug}
                onChange={(e) => {
                  setSlugTouched(true);
                  set("slug", e.target.value);
                }}
                className="font-mono text-sm"
              />
            </FormField>
            <FormField id="tagline" label="Tagline" error={errors.tagline}>
              <Input value={form.tagline} onChange={(e) => set("tagline", e.target.value)} />
            </FormField>
            <FormField id="description" label="Description" error={errors.description}>
              <Textarea value={form.description} onChange={(e) => set("description", e.target.value)} rows={6} />
            </FormField>
          </div>
        </Section>

        <Section
          title="Images"
          description="The first image is the cover. Upload files or paste an image URL."
          action={
            <Button type="button" variant="outline" size="sm" onClick={() => fileInput.current?.click()} disabled={uploading}>
              {uploading ? <Loader2 className="animate-spin" /> : <Upload />} Upload
            </Button>
          }
        >
          <input ref={fileInput} type="file" accept="image/jpeg,image/png,image/webp,image/avif" multiple hidden onChange={(e) => onUpload(e.target.files)} />
          {images.length === 0 ? (
            <button
              type="button"
              onClick={() => fileInput.current?.click()}
              className={cn("flex w-full flex-col items-center rounded-xl border border-dashed py-10 text-sm text-muted-foreground transition hover:border-foreground/40", imageError && "border-destructive")}
            >
              <ImagePlus className="size-7" strokeWidth={1.5} />
              <span className="mt-2">Add product images</span>
            </button>
          ) : (
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {images.map((img, i) => (
                <li key={img.key} className="group relative">
                  <div className="relative aspect-[4/5] overflow-hidden rounded-lg bg-muted">
                    <Image src={img.url} alt={img.alt} fill sizes="200px" className="object-cover" />
                    {i === 0 && <span className="absolute left-2 top-2 rounded-full bg-foreground px-2 py-0.5 text-[10px] text-background">Cover</span>}
                    <div className="absolute inset-x-2 bottom-2 flex justify-between opacity-0 transition group-focus-within:opacity-100 group-hover:opacity-100">
                      <div className="flex gap-1">
                        <button type="button" disabled={i === 0} onClick={() => moveImage(i, -1)} className="grid size-7 place-items-center rounded-full bg-background/90 disabled:opacity-40" aria-label="Move image earlier">
                          <ArrowUp className="size-3.5 -rotate-90" />
                        </button>
                        <button type="button" disabled={i === images.length - 1} onClick={() => moveImage(i, 1)} className="grid size-7 place-items-center rounded-full bg-background/90 disabled:opacity-40" aria-label="Move image later">
                          <ArrowDown className="size-3.5 -rotate-90" />
                        </button>
                      </div>
                      <button type="button" onClick={() => setImages((imgs) => imgs.filter((x) => x.key !== img.key))} className="grid size-7 place-items-center rounded-full bg-background/90 text-destructive" aria-label="Remove image">
                        <X className="size-3.5" />
                      </button>
                    </div>
                  </div>
                  <label className="sr-only" htmlFor={`alt-${img.key}`}>
                    Alt text for image {i + 1}
                  </label>
                  <input
                    id={`alt-${img.key}`}
                    value={img.alt}
                    onChange={(e) => setImages((imgs) => imgs.map((x) => (x.key === img.key ? { ...x, alt: e.target.value } : x)))}
                    placeholder="Alt text"
                    className="mt-2 h-8 w-full rounded-md border border-input bg-background px-2 text-[12px] outline-none focus:border-ring"
                  />
                </li>
              ))}
            </ul>
          )}
          <div className="mt-4 flex gap-2">
            <div className="relative flex-1">
              <Link2 className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <label htmlFor="image-url" className="sr-only">
                Image URL
              </label>
              <input
                id="image-url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addImageUrl();
                  }
                }}
                placeholder="https://images.unsplash.com/…"
                className="h-10 w-full rounded-full border border-input bg-background pl-9 pr-3 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/15"
              />
            </div>
            <Button type="button" variant="secondary" size="sm" className="h-10" onClick={addImageUrl}>
              Add URL
            </Button>
          </div>
          {imageError && (
            <p role="alert" className="mt-2 text-[13px] text-destructive">
              {imageError}
            </p>
          )}
        </Section>

        <Section
          title="Variants & inventory"
          description="Each sellable combination of colour and size. Leave price empty to use the base price."
          action={
            <Button type="button" variant="outline" size="sm" onClick={() => setVariants((vs) => [...vs, { key: uid(), sku: "", size: "", color: vs.at(-1)?.color ?? "", colorHex: vs.at(-1)?.colorHex ?? "", price: "", stock: "10" }])}>
              <Plus /> Add variant
            </Button>
          }
        >
          <div className="-mx-5 overflow-x-auto px-5 sm:-mx-6 sm:px-6">
            <table className="w-full min-w-[680px] text-sm">
              <thead className="text-left text-[12px] text-muted-foreground">
                <tr>
                  <th className="pb-2 pr-2 font-medium">SKU</th>
                  <th className="pb-2 pr-2 font-medium">Colour</th>
                  <th className="w-24 pb-2 pr-2 font-medium">Swatch</th>
                  <th className="w-20 pb-2 pr-2 font-medium">Size</th>
                  <th className="w-24 pb-2 pr-2 font-medium">Price $</th>
                  <th className="w-20 pb-2 pr-2 font-medium">Stock</th>
                  <th className="w-10 pb-2" />
                </tr>
              </thead>
              <tbody>
                {variants.map((v, i) => (
                  <tr key={v.key}>
                    <td className="py-1 pr-2">
                      <input aria-label={`Variant ${i + 1} SKU`} value={v.sku} onChange={(e) => updateVariant(v.key, { sku: e.target.value.toUpperCase() })} className={cn(cell, "font-mono text-[12px]", errors[`variants.${i}.sku`] && "border-destructive")} />
                    </td>
                    <td className="py-1 pr-2">
                      <input aria-label={`Variant ${i + 1} colour`} value={v.color} onChange={(e) => updateVariant(v.key, { color: e.target.value })} className={cell} />
                    </td>
                    <td className="py-1 pr-2">
                      <div className="flex items-center gap-1.5">
                        <input
                          type="color"
                          aria-label={`Variant ${i + 1} swatch colour`}
                          value={v.colorHex || "#000000"}
                          onChange={(e) => updateVariant(v.key, { colorHex: e.target.value })}
                          className="size-10 shrink-0 cursor-pointer rounded-md border border-input bg-background p-1"
                        />
                        {v.colorHex && (
                          <button type="button" onClick={() => updateVariant(v.key, { colorHex: "" })} aria-label="Clear swatch" className="text-muted-foreground hover:text-foreground">
                            <X className="size-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="py-1 pr-2">
                      <input aria-label={`Variant ${i + 1} size`} value={v.size} onChange={(e) => updateVariant(v.key, { size: e.target.value })} className={cell} />
                    </td>
                    <td className="py-1 pr-2">
                      <input aria-label={`Variant ${i + 1} price override`} inputMode="decimal" value={v.price} onChange={(e) => updateVariant(v.key, { price: e.target.value.replace(/[^\d.]/g, "") })} placeholder="—" className={cell} />
                    </td>
                    <td className="py-1 pr-2">
                      <input aria-label={`Variant ${i + 1} stock`} inputMode="numeric" value={v.stock} onChange={(e) => updateVariant(v.key, { stock: e.target.value.replace(/\D/g, "") })} className={cn(cell, "tabular-nums", Number(v.stock) === 0 && "text-destructive")} />
                    </td>
                    <td className="py-1">
                      <Button type="button" variant="ghost" size="icon-sm" disabled={variants.length === 1} onClick={() => setVariants((vs) => vs.filter((x) => x.key !== v.key))} aria-label={`Remove variant ${i + 1}`}>
                        <Trash2 />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-[13px] text-muted-foreground tabular-nums">
            Total stock: {variants.reduce((s, v) => s + (Number.parseInt(v.stock, 10) || 0), 0)} units
          </p>
          {variantError && (
            <p role="alert" className="mt-2 text-[13px] text-destructive">
              {variantError}
            </p>
          )}
        </Section>

        <Section
          title="Specifications"
          description="Shown in the Specifications tab on the product page."
          action={
            <Button type="button" variant="outline" size="sm" onClick={() => setSpecs((s) => [...s, { key: uid(), label: "", value: "" }])}>
              <Plus /> Add row
            </Button>
          }
        >
          {specs.length === 0 ? (
            <p className="text-sm text-muted-foreground">No specifications yet.</p>
          ) : (
            <ul className="space-y-2">
              {specs.map((s, i) => (
                <li key={s.key} className="grid grid-cols-[1fr_2fr_auto] gap-2">
                  <input aria-label={`Spec ${i + 1} label`} value={s.label} onChange={(e) => setSpecs((rows) => rows.map((r) => (r.key === s.key ? { ...r, label: e.target.value } : r)))} placeholder="Material" className={cell} />
                  <input aria-label={`Spec ${i + 1} value`} value={s.value} onChange={(e) => setSpecs((rows) => rows.map((r) => (r.key === s.key ? { ...r, value: e.target.value } : r)))} placeholder="100% organic cotton" className={cell} />
                  <Button type="button" variant="ghost" size="icon-sm" className="self-center" onClick={() => setSpecs((rows) => rows.filter((r) => r.key !== s.key))} aria-label={`Remove spec ${i + 1}`}>
                    <Trash2 />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </Section>
      </div>

      <div className="space-y-4 xl:sticky xl:top-24 xl:self-start">
        <Section title="Status">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="isActive" className="font-normal">
                Visible in store
              </Label>
              <Switch id="isActive" checked={form.isActive} onCheckedChange={(v) => set("isActive", v)} />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="featured" className="font-normal">
                Featured on home page
              </Label>
              <Switch id="featured" checked={form.featured} onCheckedChange={(v) => set("featured", v)} />
            </div>
          </div>
        </Section>
        <Section title="Organisation & pricing">
          <div className="grid gap-5">
            <div className="grid gap-2">
              <Label htmlFor="categoryId">Category</Label>
              <Select value={form.categoryId} onValueChange={(v) => set("categoryId", v)}>
                <SelectTrigger id="categoryId" aria-invalid={Boolean(errors.categoryId)}>
                  <SelectValue placeholder="Choose a category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <FormField id="price" label="Price ($)" error={errors.price}>
              <Input inputMode="decimal" value={form.price} onChange={(e) => set("price", e.target.value.replace(/[^\d.]/g, ""))} />
            </FormField>
            <FormField id="compareAt" label="Compare-at price ($)" hint="Shows as a sale when higher than the price" error={errors.compareAt}>
              <Input inputMode="decimal" value={form.compareAt} onChange={(e) => set("compareAt", e.target.value.replace(/[^\d.]/g, ""))} />
            </FormField>
          </div>
        </Section>
        <div className="flex gap-2">
          <Button type="submit" className="flex-1" disabled={pending}>
            {pending && <Loader2 className="animate-spin" />} {initial ? "Save changes" : "Create product"}
          </Button>
          <Button asChild variant="outline">
            <Link href="/admin/products">Cancel</Link>
          </Button>
        </div>
        {initial && (
          <Link href={`/product/${initial.slug}`} target="_blank" className="block text-center text-[13px] text-muted-foreground hover:text-foreground hover:underline">
            View in store ↗
          </Link>
        )}
      </div>
    </form>
  );
}
