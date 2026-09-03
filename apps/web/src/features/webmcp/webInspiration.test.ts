import { describe, expect, it, vi } from "vitest";
import { fetchWebInspirationFile, parseWebInspiration } from "./webInspiration";

const png = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 0]);

describe("open-web inspiration handoff", () => {
  it("accepts bounded HTTPS references and strips excess text", () => {
    const reference = parseWebInspiration({
      sourcePageUrl: "https://example.com/look",
      imageUrl: "https://images.example.com/look.png",
      sourceTitle: "x".repeat(240),
    });
    expect(reference.sourcePageUrl).toBe("https://example.com/look");
    expect(reference.sourceTitle).toHaveLength(200);
  });

  it.each(["http://example.com/look.jpg", "data:image/png;base64,abc", "https://user:secret@example.com/look.jpg"])("rejects unsafe image reference %s", (imageUrl) => {
    expect(() => parseWebInspiration({ sourcePageUrl: "https://example.com/look", imageUrl })).toThrow();
  });

  it("fetches without credentials and revalidates the media signature", async () => {
    const fetcher = vi.fn(async () => new Response(png, {
      status: 200,
      headers: { "content-type": "image/png", "content-length": String(png.byteLength) },
    }));
    const reference = parseWebInspiration({ sourcePageUrl: "https://example.com/look", imageUrl: "https://images.example.com/look.png" });
    const file = await fetchWebInspirationFile(reference, undefined, fetcher as typeof fetch);
    expect(file.type).toBe("image/png");
    expect(fetcher).toHaveBeenCalledWith(reference.imageUrl, expect.objectContaining({ credentials: "omit", mode: "cors", referrerPolicy: "no-referrer" }));
  });

  it("rejects a response that only claims to be an image", async () => {
    const fetcher = vi.fn(async () => new Response("not an image", { status: 200, headers: { "content-type": "image/png" } }));
    const reference = parseWebInspiration({ sourcePageUrl: "https://example.com/look", imageUrl: "https://images.example.com/look.png" });
    await expect(fetchWebInspirationFile(reference, undefined, fetcher as typeof fetch)).rejects.toThrow();
  });

  it("uses the same-origin importer when Pinterest blocks browser CORS", async () => {
    const fetcher = vi.fn()
      .mockRejectedValueOnce(new TypeError("Failed to fetch"))
      .mockResolvedValueOnce(new Response(png, {
        status: 200,
        headers: { "content-type": "image/png", "content-length": String(png.byteLength) },
      }));
    const reference = parseWebInspiration({
      sourcePageUrl: "https://www.pinterest.com/pin/850547079653110679/",
      imageUrl: "https://i.pinimg.com/736x/example.jpg",
    });

    const file = await fetchWebInspirationFile(reference, undefined, fetcher as typeof fetch);

    expect(file.type).toBe("image/png");
    expect(fetcher).toHaveBeenNthCalledWith(2, "/api/import-image", expect.objectContaining({
      method: "POST",
      credentials: "same-origin",
      body: JSON.stringify({ imageUrl: reference.imageUrl }),
    }));
  });

  it("does not proxy an arbitrary blocked image host", async () => {
    const fetcher = vi.fn().mockRejectedValue(new TypeError("Failed to fetch"));
    const reference = parseWebInspiration({ sourcePageUrl: "https://example.com/look", imageUrl: "https://images.example.com/look.png" });

    await expect(fetchWebInspirationFile(reference, undefined, fetcher as typeof fetch)).rejects.toThrow("Failed to fetch");
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
});
