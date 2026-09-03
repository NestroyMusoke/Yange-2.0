import { validateImageFile } from "../../media/imagePipeline";

export interface WebInspirationReference {
  id: string;
  sourcePageUrl: string;
  imageUrl: string;
  sourceTitle: string;
  altText: string;
}

const MAX_REMOTE_BYTES = 12 * 1024 * 1024;
const allowedMimeTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const serverImportHosts = new Set(["i.pinimg.com"]);

function safeHttpsUrl(value: unknown, label: string): string {
  if (typeof value !== "string") throw new Error(`${label} is required.`);
  const trimmed = value.trim();
  const httpsMatch = trimmed.match(/https:\/\/[^\s<>`"']+/i);
  const candidate = (httpsMatch?.[0] ?? trimmed).replace(/[),.;]+$/, "");
  const url = new URL(candidate);
  if (url.protocol !== "https:" || url.username || url.password) {
    throw new Error(`${label} must be a credential-free HTTPS URL.`);
  }
  return url.href;
}

function boundedText(value: unknown, maximum: number): string {
  return typeof value === "string" ? value.trim().slice(0, maximum) : "";
}

export function parseWebInspiration(input: Record<string, unknown>): WebInspirationReference {
  return {
    id: `web-inspiration-${crypto.randomUUID()}`,
    sourcePageUrl: safeHttpsUrl(input.sourcePageUrl, "Source page URL"),
    imageUrl: safeHttpsUrl(input.imageUrl, "Image URL"),
    sourceTitle: boundedText(input.sourceTitle, 200),
    altText: boundedText(input.altText, 500),
  };
}

export async function fetchWebInspirationFile(
  reference: WebInspirationReference,
  signal?: AbortSignal,
  fetcher: typeof fetch = fetch,
): Promise<File> {
  let response: Response;
  try {
    response = await fetcher(reference.imageUrl, {
      method: "GET",
      credentials: "omit",
      mode: "cors",
      redirect: "follow",
      referrerPolicy: "no-referrer",
      signal,
    });
    if (!response.ok && serverImportHosts.has(new URL(reference.imageUrl).hostname.toLowerCase())) {
      response = await fetchThroughTrustedImport(reference.imageUrl, signal, fetcher);
    }
  } catch (cause) {
    if (!serverImportHosts.has(new URL(reference.imageUrl).hostname.toLowerCase())) throw cause;
    response = await fetchThroughTrustedImport(reference.imageUrl, signal, fetcher);
  }
  if (!response.ok) throw new Error(`The source returned ${response.status}. Use the image upload fallback.`);
  if (response.url) safeHttpsUrl(response.url, "Final image URL");
  const contentType = (response.headers.get("content-type") ?? "").split(";")[0].trim().toLowerCase();
  if (!allowedMimeTypes.has(contentType)) throw new Error("The source did not return a supported outfit image.");
  const declaredLength = Number(response.headers.get("content-length") ?? 0);
  if (declaredLength > MAX_REMOTE_BYTES) throw new Error("The outfit image is larger than 12 MB.");
  const blob = await response.blob();
  if (!blob.size || blob.size > MAX_REMOTE_BYTES) throw new Error("The outfit image is empty or larger than 12 MB.");
  const extension = contentType === "image/png" ? "png" : contentType === "image/webp" ? "webp" : "jpg";
  const file = new File([blob], `web-inspiration.${extension}`, { type: contentType, lastModified: Date.now() });
  await validateImageFile(file);
  return file;
}

async function fetchThroughTrustedImport(imageUrl: string, signal: AbortSignal | undefined, fetcher: typeof fetch): Promise<Response> {
  return fetcher("/api/import-image", {
    method: "POST",
    credentials: "same-origin",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ imageUrl }),
    signal,
  });
}
