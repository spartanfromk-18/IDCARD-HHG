import { put } from "@vercel/blob";
import { SHARES_DIR } from "@/lib/uploads";

export const MAX_IMAGE_BYTES = 25 * 1024 * 1024;

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
    throw new ApiError(400, "Invalid image: expected a base64 PNG string or data URL.");
  }

  return validateImage(Buffer.from(base64, "base64"), "image/png");
}

function validateImage(bytes: Buffer, mime: string): { bytes: Buffer; mime: string } {
  if (bytes.byteLength === 0) {
    throw new ApiError(400, "Invalid image: empty payload.");
  }
  if (bytes.byteLength > MAX_IMAGE_BYTES) {
    throw new ApiError(400, `Image too large (${(bytes.byteLength / 1024 / 1024).toFixed(1)} MB, max ${Math.floor(MAX_IMAGE_BYTES / 1024 / 1024)} MB).`);
  }

  const isPng = bytes.length > 4 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47;
  const isJpeg = bytes.length > 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  const matches = mime === "image/png" ? isPng : mime === "image/jpeg" ? isJpeg : true;
  if (!matches) {
    throw new ApiError(400, `Invalid ${mime}: file signature does not match the declared content type.`);
  }

  return { bytes, mime };
}

function makeShareId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).slice(2, 8);
  return `hh-${timestamp}-${random}`;
}

/**
 * Resolve the deterministic public blob URL for a share id.
 * Requires the server-side `BLOB_READ_WRITE_TOKEN` (format: vercel_blob_rw_<storeId>_<secret>).
 */
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

/**
 * Verify the blob actually exists before advertising it as the OG image,
 * so the card NEVER points at a dead URL. Falls back to null when missing.
 */
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

/**
 * Upload a base64 PNG to Vercel Blob under a deterministic pathname
 * (`shares/<id>.png`) so the OG image URL is derivable from the id alone —
 * no database or KV store needed in generateMetadata.
 */
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

  const blob = await put(`${SHARES_DIR}/${id}.png`, bytes, {
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