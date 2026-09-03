import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

const MAX_REMOTE_BYTES = 12 * 1024 * 1024;
const MAX_REDIRECTS = 3;
const ALLOWED_HOSTS = new Set(["i.pinimg.com"]);
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

function publicHttpsUrl(value) {
  if (typeof value !== "string") throw new Error("imageUrl is required.");
  const url = new URL(value);
  if (url.protocol !== "https:" || url.username || url.password || (url.port && url.port !== "443")) {
    throw new Error("Only credential-free HTTPS image URLs are accepted.");
  }
  if (!ALLOWED_HOSTS.has(url.hostname.toLowerCase())) {
    throw new Error("This server-side importer supports Pinterest image URLs only.");
  }
  return url;
}

function isPrivateAddress(address) {
  if (isIP(address) === 6) {
    const value = address.toLowerCase();
    return value === "::" || value === "::1" || value.startsWith("fc") || value.startsWith("fd") || /^fe[89ab]/.test(value) || value.startsWith("::ffff:127.") || value.startsWith("::ffff:10.") || value.startsWith("::ffff:192.168.");
  }
  if (isIP(address) !== 4) return true;
  const [a, b] = address.split(".").map(Number);
  return a === 0 || a === 10 || a === 127 || (a === 100 && b >= 64 && b <= 127) || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 198 && (b === 18 || b === 19)) || a >= 224;
}

async function assertPublicDns(url, lookupImpl) {
  const records = await lookupImpl(url.hostname, { all: true, verbatim: true });
  if (!records.length || records.some(({ address }) => isPrivateAddress(address))) {
    throw new Error("The image host did not resolve to a public address.");
  }
}

async function boundedBytes(response) {
  const declared = Number(response.headers.get("content-length") ?? 0);
  if (declared > MAX_REMOTE_BYTES) throw new Error("The Pinterest image is larger than 12 MB.");
  if (!response.body) throw new Error("The Pinterest image response was empty.");
  const reader = response.body.getReader();
  const chunks = [];
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > MAX_REMOTE_BYTES) {
      await reader.cancel();
      throw new Error("The Pinterest image is larger than 12 MB.");
    }
    chunks.push(value);
  }
  if (!total) throw new Error("The Pinterest image response was empty.");
  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return bytes;
}

function hasValidSignature(bytes, contentType) {
  if (contentType === "image/jpeg") return bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (contentType === "image/png") return bytes.length >= 8 && [137, 80, 78, 71, 13, 10, 26, 10].every((value, index) => bytes[index] === value);
  if (contentType === "image/webp") return bytes.length >= 12 && String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" && String.fromCharCode(...bytes.slice(8, 12)) === "WEBP";
  return false;
}

async function fetchImage(initialUrl, fetchImpl, lookupImpl) {
  let url = publicHttpsUrl(initialUrl);
  for (let redirect = 0; redirect <= MAX_REDIRECTS; redirect += 1) {
    await assertPublicDns(url, lookupImpl);
    const response = await fetchImpl(url, {
      method: "GET",
      redirect: "manual",
      headers: { accept: "image/avif,image/webp,image/png,image/jpeg", "user-agent": "Yange-Public-Image-Importer/1.0" },
      signal: AbortSignal.timeout(8_000),
    });
    if ([301, 302, 303, 307, 308].includes(response.status)) {
      const location = response.headers.get("location");
      if (!location || redirect === MAX_REDIRECTS) throw new Error("The Pinterest image redirected too many times.");
      url = publicHttpsUrl(new URL(location, url).href);
      continue;
    }
    if (!response.ok) throw new Error(`Pinterest returned ${response.status}.`);
    const contentType = (response.headers.get("content-type") ?? "").split(";")[0].trim().toLowerCase();
    if (!ALLOWED_TYPES.has(contentType)) throw new Error("Pinterest did not return a supported image type.");
    const bytes = await boundedBytes(response);
    if (!hasValidSignature(bytes, contentType)) throw new Error("Pinterest returned bytes that do not match the declared image type.");
    return { bytes, contentType };
  }
  throw new Error("The Pinterest image could not be fetched.");
}

function readBody(request) {
  if (request.body && typeof request.body === "object") return request.body;
  if (typeof request.body === "string" && request.body.length <= 8_192) return JSON.parse(request.body);
  throw new Error("A small JSON request body is required.");
}

export function createImportHandler({ fetchImpl = fetch, lookupImpl = lookup } = {}) {
  return async function importImage(request, response) {
    response.setHeader("Cache-Control", "no-store");
    response.setHeader("X-Content-Type-Options", "nosniff");
    if (request.method !== "POST") {
      response.statusCode = 405;
      response.setHeader("Allow", "POST");
      return response.end(JSON.stringify({ error: "POST required." }));
    }
    try {
      const { imageUrl } = readBody(request);
      const imported = await fetchImage(imageUrl, fetchImpl, lookupImpl);
      response.statusCode = 200;
      response.setHeader("Content-Type", imported.contentType);
      response.setHeader("Content-Length", String(imported.bytes.byteLength));
      return response.end(Buffer.from(imported.bytes));
    } catch (cause) {
      response.statusCode = 400;
      response.setHeader("Content-Type", "application/json; charset=utf-8");
      return response.end(JSON.stringify({ error: cause instanceof Error ? cause.message : "The image could not be imported." }));
    }
  };
}

export default createImportHandler();
