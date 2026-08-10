import type { Area } from "react-easy-crop";

export function isHeic(file: File): boolean {
  if (!file) return false;
  return (
    file.type === "image/heic" ||
    file.type === "image/heif" ||
    /\.(heic|heif)$/i.test(file.name)
  );
}

export async function toJpegBlob(file: File): Promise<Blob> {
  try {
    const heic2any = (await import("heic2any")).default;
    const output = await heic2any({
      blob: file,
      toType: "image/jpeg",
      quality: 0.85,
    });
    return Array.isArray(output) ? output[0] : output;
  } catch (err) {
    console.error("HEIC conversion failed:", err);
    throw new Error("Failed to process HEIC image. Please upload a standard JPG or PNG file.");
  }
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Failed to load image source for cropping."));
    image.src = src;
  });
}

export async function createCroppedImage(
  imageSrc: string,
  area: Area,
): Promise<string> {
  if (!imageSrc || !area) {
    throw new Error("Invalid image source or crop area provided.");
  }

  const image = await loadImage(imageSrc);
  const canvas = document.createElement("canvas");

  // Dynamically enforce safe minimum canvas bounds to prevent layout/index crashes
  const width = Math.max(1, Math.round(area.width));
  const height = Math.max(1, Math.round(area.height));

  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Canvas 2D rendering context unavailable");
  }

  ctx.drawImage(
    image,
    area.x,
    area.y,
    area.width,
    area.height,
    0,
    0,
    width,
    height,
  );

  // Export as high-performance compressed JPEG to keep payload light and prevent HTTP 413 errors
  return canvas.toDataURL("image/jpeg", 0.85);
}