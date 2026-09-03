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

function urlsFromInput(input: Record<string, unknown>): string[] {
  const strings: string[] = [];
  const visit = (value: unknown, depth = 0): void => {
    if (depth > 3) return;
    if (typeof value === "string") strings.push(value);
    else if (Array.isArray(value)) value.forEach((item) => visit(item, depth + 1));
    else if (value && typeof value === "object") Object.values(value as Record<string, unknown>).forEach((item) => visit(item, depth + 1));
  };
  visit(input);
  return strings
    .flatMap((value) => value.match(/https:\/\/[^\s<>`"']+/gi) ?? [])
    .map((value) => value.replace(/[),.;]+$/, ""))
    .filter((value, index, values) => values.indexOf(value) === index);
}

function boundedText(value: unknown, maximum: number): string {
  return typeof value === "string" ? value.trim().slice(0, maximum) : "";
}

export function parseWebInspiration(input: Record<string, unknown>): WebInspirationReference {
  const discovered = urlsFromInput(input);
  const namedSource = input.sourcePageUrl;
  const sourceCandidates = [namedSource, ...discovered].filter((value): value is string => typeof value === "string");
  const imageCandidates = [input.imageUrl, ...discovered].filter((value): value is string => typeof value === "string");
  const imageValue = imageCandidates.find((value) => {
    try { return new URL(safeHttpsUrl(value, "Image URL")).hostname.toLowerCase() === "i.pinimg.com"; } catch { return false; }
  }) ?? imageCandidates[0];
  const sourceValue = sourceCandidates.find((value) => {
    try {
      const host = new URL(safeHttpsUrl(value, "Source page URL")).hostname.toLowerCase();
      return host === "pinterest.com" || host.endsWith(".pinterest.com");
    } catch { return false; }
  }) ?? sourceCandidates.find((value) => value !== imageValue);
  if (!sourceValue) throw new Error("Source page URL is missing. Paste the Pinterest page URL into any text field.");
  if (!imageValue) throw new Error("Image URL is missing. Paste the i.pinimg.com image address into any text field.");
  return {
    id: `web-inspiration-${crypto.randomUUID()}`,
    sourcePageUrl: safeHttpsUrl(sourceValue, "Source page URL"),
    imageUrl: safeHttpsUrl(imageValue, "Image URL"),
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
