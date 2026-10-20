/**
 * Identifies an image from its leading bytes ("magic numbers"). The client-supplied MIME type and
 * filename are never trusted: a renamed HTML or SVG file must not be stored or served as an image.
 */
export type SniffedImage = { mime: "image/jpeg" | "image/png" | "image/webp" | "image/avif"; ext: "jpg" | "png" | "webp" | "avif" };

const ascii = (bytes: Uint8Array, start: number, end: number) => String.fromCharCode(...bytes.subarray(start, end));
const startsWith = (bytes: Uint8Array, sig: number[]) => sig.every((b, i) => bytes[i] === b);

export function sniffImageType(bytes: Uint8Array): SniffedImage | null {
  if (bytes.length < 12) return null;
  if (startsWith(bytes, [0xff, 0xd8, 0xff])) return { mime: "image/jpeg", ext: "jpg" };
  if (startsWith(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return { mime: "image/png", ext: "png" };
  if (ascii(bytes, 0, 4) === "RIFF" && ascii(bytes, 8, 12) === "WEBP") return { mime: "image/webp", ext: "webp" };
  if (isAvif(bytes)) return { mime: "image/avif", ext: "avif" };
  return null;
}

/** AVIF is an ISO-BMFF file whose leading `ftyp` box lists "avif"/"avis" as major or compatible brand. */
function isAvif(bytes: Uint8Array) {
  if (ascii(bytes, 4, 8) !== "ftyp") return false;
  const boxSize = ((bytes[0] << 24) | (bytes[1] << 16) | (bytes[2] << 8) | bytes[3]) >>> 0;
  const end = Math.min(boxSize, bytes.length);
  if (end < 16) return false;
  const brands = [ascii(bytes, 8, 12)];
  for (let i = 16; i + 4 <= end; i += 4) brands.push(ascii(bytes, i, i + 4));
  return brands.includes("avif") || brands.includes("avis");
}

export const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;
