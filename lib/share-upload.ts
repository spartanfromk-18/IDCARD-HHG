import { put } from "@vercel/blob";
import { SHARES_DIR } from "@/lib/uploads";

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export function isBlobConfigReady(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

function decodeBase64Image(input: unknown): { bytes: Buffer; mime: string } {
  if (typeof input !== "string" || input.length === 0) {
    throw new ApiError(400, "Invalid payload: `image` must be a non-empty string.");
  }

  let base64 = input.trim();
  const dataUrlMatch = /^data:image\/(png|jpeg|webp);base64,([A-Za-z0-9+/=]+)$/.exec(base64);

  if (dataUrlMatch) {
    base64 = dataUrlMatch[2];
    const mime = dataUrlMatch[1] === "png" ? "image/png" : dataUrlMatch[1] === "jpeg" ? "image/jpeg" : "image/webp";
    return validateImage(Buffer.from(base64, "base64"), mime);
  }

  if (!/^[A-Za-z0-9+/=]+$/.test(base64)) {
    throw new ApiError(400, "Invalid image: expected a base64 string or data URL.");
  }

  return validateImage(Buffer.from(base64, "base64"), "image/jpeg");
}

function validateImage(bytes: Buffer, mime: string): { bytes: Buffer; mime: string } {
  if (bytes.byteLength === 0) {
    throw new ApiError(400, "Invalid image: empty payload.");
  }
  if (bytes.byteLength > MAX_IMAGE_BYTES) {
    throw new ApiError(400, `Image too large (${(bytes.byteLength / 1024 / 1024).toFixed(1)} MB, max ${Math.floor(MAX_IMAGE_BYTES / 1024 / 1024)} MB).`);
  }

  return { bytes, mime };
}

function makeShareId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).slice(2, 8);
  return `hh-${timestamp}-${random}`;
}

export function resolveShareImageUrl(id: string): string | null {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) return null;
  const parts = token.split("_");
  if (parts.length < 4 || parts[0] !== "vercel" || parts[2] !== "rw") return null;
  const storeId = parts[3];
  return `https://${storeId}.public.blob.vercel-storage.com/${SHARES_DIR}/${id}.png`;
}

export function buildShareUrl(origin: string, id: string): string {
  return `${origin}/s/${id}`;
}

export async function verifyShareImageUrl(url: string | null): Promise<string | null> {
  if (!url) return null;
  try {
    const res = await fetch(url, {
      method: "HEAD",
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    });
    return res.ok ? url : null;
  } catch {
    return null;
  }
}

export async function uploadShareImage(
  imageInput: unknown,
  origin: string
): Promise<{ id: string; imageUrl: string; shareUrl: string }> {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) {
    throw new ApiError(500, "BLOB_READ_WRITE_TOKEN is not configured.");
  }

  const { bytes, mime } = decodeBase64Image(imageInput);
  const id = makeShareId();
  const extension = mime === "image/png" ? "png" : mime === "image/webp" ? "webp" : "jpg";

  const blob = await put(`${SHARES_DIR}/${id}.${extension}`, bytes, {
    access: "public",
    addRandomSuffix: false,
    contentType: mime,
    cacheControlMaxAge: 60 * 60 * 24 * 365,
  });

  if (!blob.url) {
    throw new ApiError(500, "Failed to upload image to Vercel Blob.");
  }

  return { id, imageUrl: blob.url, shareUrl: buildShareUrl(origin, id) };
}