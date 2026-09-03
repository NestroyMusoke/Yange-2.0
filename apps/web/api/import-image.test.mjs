import { describe, expect, it, vi } from "vitest";
import { createImportHandler } from "../../../api/import-image.mjs";

const jpeg = new Uint8Array([0xff, 0xd8, 0xff, 0xdb, 0, 1]);
const publicLookup = vi.fn(async () => [{ address: "151.101.0.84", family: 4 }]);

function responseRecorder() {
  return {
    headers: new Map(),
    statusCode: 0,
    body: null,
    setHeader(name, value) { this.headers.set(name.toLowerCase(), String(value)); },
    end(value) { this.body = value; return this; },
  };
}

describe("Pinterest image import function", () => {
  it("returns a validated public Pinterest image", async () => {
    const fetchImpl = vi.fn(async () => new Response(jpeg, { status: 200, headers: { "content-type": "image/jpeg" } }));
    const handler = createImportHandler({ fetchImpl, lookupImpl: publicLookup });
    const response = responseRecorder();

    await handler({ method: "POST", body: { imageUrl: "https://i.pinimg.com/736x/look.jpg" } }, response);

    expect(response.statusCode).toBe(200);
    expect(response.headers.get("content-type")).toBe("image/jpeg");
    expect(response.body).toBeInstanceOf(Buffer);
  });

  it("rejects non-Pinterest hosts instead of becoming an open proxy", async () => {
    const fetchImpl = vi.fn();
    const handler = createImportHandler({ fetchImpl, lookupImpl: publicLookup });
    const response = responseRecorder();

    await handler({ method: "POST", body: { imageUrl: "https://example.com/look.jpg" } }, response);

    expect(response.statusCode).toBe(400);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("rejects a private DNS result before fetching", async () => {
    const fetchImpl = vi.fn();
    const lookupImpl = vi.fn(async () => [{ address: "127.0.0.1", family: 4 }]);
    const handler = createImportHandler({ fetchImpl, lookupImpl });
    const response = responseRecorder();

    await handler({ method: "POST", body: { imageUrl: "https://i.pinimg.com/736x/look.jpg" } }, response);

    expect(response.statusCode).toBe(400);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("rejects image MIME claims that do not match the bytes", async () => {
    const fetchImpl = vi.fn(async () => new Response("not an image", { status: 200, headers: { "content-type": "image/jpeg" } }));
    const handler = createImportHandler({ fetchImpl, lookupImpl: publicLookup });
    const response = responseRecorder();

    await handler({ method: "POST", body: { imageUrl: "https://i.pinimg.com/736x/look.jpg" } }, response);

    expect(response.statusCode).toBe(400);
  });
});
