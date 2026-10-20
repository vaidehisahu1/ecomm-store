import { db } from "@/lib/db";
import { sniffImageType } from "@/lib/image-sniff";

const SECURITY_HEADERS = {
  // Never let a browser second-guess the declared type (e.g. render bytes as HTML).
  "X-Content-Type-Options": "nosniff",
  // Even if something non-image slipped in, it can't run scripts or load anything.
  "Content-Security-Policy": "default-src 'none'",
};

export async function GET(_request: Request, { params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  // URLs look like /api/uploads/<cuid>.<ext>; the extension is cosmetic.
  const match = /^([a-z0-9]{20,40})\.(jpg|png|webp|avif)$/.exec(name);
  if (!match) return new Response("Not found", { status: 404, headers: SECURITY_HEADERS });
  const upload = await db.upload.findUnique({ where: { id: match[1] } });
  // Re-check the bytes on the way out too, so rows stored before byte sniffing existed are covered.
  const image = upload ? sniffImageType(upload.data) : null;
  if (!upload || !image) return new Response("Not found", { status: 404, headers: SECURITY_HEADERS });
  return new Response(upload.data, {
    headers: { ...SECURITY_HEADERS, "Content-Type": image.mime, "Cache-Control": "public, max-age=31536000, immutable" },
  });
}
