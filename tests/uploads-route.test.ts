import { beforeEach, describe, expect, it, vi } from "vitest";

const findUnique = vi.fn();
vi.mock("@/lib/db", () => ({ db: { upload: { findUnique: (...args: unknown[]) => findUnique(...args) } } }));
const { GET } = await import("@/app/api/uploads/[name]/route");

const get = (name: string) => GET(new Request(`http://x/api/uploads/${name}`), { params: Promise.resolve({ name }) });
const jpeg = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, ...Array(16).fill(0)]);
const id = "cmabcdefghijklmnopqrstuv";

beforeEach(() => findUnique.mockReset());

describe("GET /api/uploads/[name]", () => {
  it("serves an image with nosniff, a locked-down CSP and the type detected from its bytes", async () => {
    findUnique.mockResolvedValue({ id, mimeType: "text/html", data: jpeg });
    const res = await get(`${id}.png`);
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe("image/jpeg"); // not the stored type, not the URL extension
    expect(res.headers.get("x-content-type-options")).toBe("nosniff");
    expect(res.headers.get("content-security-policy")).toBe("default-src 'none'");
  });

  it("refuses stored bytes that aren't an allowed image", async () => {
    findUnique.mockResolvedValue({ id, mimeType: "image/jpeg", data: new TextEncoder().encode("<!doctype html><script>alert(1)</script>") });
    const res = await get(`${id}.jpg`);
    expect(res.status).toBe(404);
    expect(res.headers.get("x-content-type-options")).toBe("nosniff");
  });

  it.each(["../../etc/passwd", `${id}.svg`, `${id}.html`, "short.jpg"])("404s malformed name %s without a database lookup", async (name) => {
    expect((await get(name)).status).toBe(404);
    expect(findUnique).not.toHaveBeenCalled();
  });

  it("404s unknown ids, with security headers", async () => {
    findUnique.mockResolvedValue(null);
    const res = await get(`${id}.jpg`);
    expect(res.status).toBe(404);
    expect(res.headers.get("content-security-policy")).toBe("default-src 'none'");
  });
});
