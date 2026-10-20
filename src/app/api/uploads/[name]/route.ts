import { db } from "@/lib/db";

export async function GET(_request: Request, { params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  // URLs look like /api/uploads/<cuid>.<ext>; the extension is cosmetic, the stored MIME type wins.
  const match = /^([a-z0-9]{20,40})\.(jpg|png|webp|avif)$/.exec(name);
  if (!match) return new Response("Not found", { status: 404 });
  const upload = await db.upload.findUnique({ where: { id: match[1] } });
  if (!upload) return new Response("Not found", { status: 404 });
  return new Response(upload.data, {
    headers: { "Content-Type": upload.mimeType, "Cache-Control": "public, max-age=31536000, immutable" },
  });
}
