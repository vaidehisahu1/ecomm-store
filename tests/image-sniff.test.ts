import { describe, expect, it } from "vitest";
import { sniffImageType } from "@/lib/image-sniff";

const bytes = (...parts: (number[] | string)[]) =>
  new Uint8Array(parts.flatMap((p) => (typeof p === "string" ? [...p].map((c) => c.charCodeAt(0)) : p)).concat(Array(32).fill(0)));
const u32 = (n: number) => [(n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255];

describe("sniffImageType", () => {
  it.each([
    ["JPEG", bytes([0xff, 0xd8, 0xff, 0xe0]), "image/jpeg"],
    ["PNG", bytes([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), "image/png"],
    ["WebP", bytes("RIFF", [0, 0, 0, 0], "WEBP"), "image/webp"],
    ["AVIF (major brand)", bytes(u32(24), "ftyp", "avif", [0, 0, 0, 0], "mif1", "miaf"), "image/avif"],
    ["AVIF (compatible brand)", bytes(u32(28), "ftyp", "mif1", [0, 0, 0, 0], "miaf", "avif", "MA1B"), "image/avif"],
    ["AVIF sequence", bytes(u32(20), "ftyp", "avis", [0, 0, 0, 0], "msf1"), "image/avif"],
  ])("detects %s from its bytes", (_name, data, mime) => {
    expect(sniffImageType(data)?.mime).toBe(mime);
  });

  it.each([
    ["HTML renamed .jpg", bytes("<!doctype html><script>alert(1)</script>")],
    ["SVG (can carry script)", bytes('<svg xmlns="http://www.w3.org/2000/svg"><script/></svg>')],
    ["GIF (not allowed)", bytes("GIF89a")],
    ["RIFF WAVE audio", bytes("RIFF", [0, 0, 0, 0], "WAVE")],
    ["MP4 video (ftyp without avif brand)", bytes(u32(24), "ftyp", "isom", [0, 0, 0, 0], "isom", "mp41")],
    ["PDF", bytes("%PDF-1.7")],
    ["empty/truncated", new Uint8Array([0xff, 0xd8])],
  ])("rejects %s", (_name, data) => {
    expect(sniffImageType(data)).toBeNull();
  });

  it("only looks for AVIF brands inside the ftyp box", () => {
    // Box claims 16 bytes, so an "avif" string after it must not count.
    expect(sniffImageType(bytes(u32(16), "ftyp", "isom", [0, 0, 0, 0], "avif"))).toBeNull();
  });
});
