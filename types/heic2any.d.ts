declare module "heic2any" {
  export default function heic2any(options: {
    blob: Blob;
    toType?: string | "image/jpeg" | "image/png" | "image/gif" | "image/webp";
    quality?: number;
  }): Promise<Blob | Blob[]>;
}