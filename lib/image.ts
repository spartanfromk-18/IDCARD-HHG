import type { Area } from "react-easy-crop";

export function isHeic(file: File): boolean {
  return (
    file.type === "image/heic" ||
    file.type === "image/heif" ||
    /\.(heic|heif)$/i.test(file.name)
  );
}

export async function toJpegBlob(file: File): Promise<Blob> {
  const heic2any = (await import("heic2any")).default;

  const output = await heic2any({
    blob: file,
    toType: "image/jpeg",
    quality: 0.92,
  });
  return Array.isArray(output) ? output[0] : output;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });
}

export async function createCroppedImage(
  imageSrc: string,
  area: Area,
): Promise<string> {
  const image = await loadImage(imageSrc);
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(area.width);
  canvas.height = Math.round(area.height);

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D context unavailable");

  ctx.drawImage(
    image,
    area.x,
    area.y,
    area.width,
    area.height,
    0,
    0,
    canvas.width,
    canvas.height,
  );

  return canvas.toDataURL("image/jpeg", 0.95);
}