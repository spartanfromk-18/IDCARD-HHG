"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toPng } from "html-to-image";
import IdCard from "@/components/IdCard";
import CropModal from "@/components/CropModal";
import { BRAND, PREVIEW_SCALE } from "@/lib/brandkit";
import { randomBuilderTitle } from "@/lib/titles";
import { isHeic, toJpegBlob } from "@/lib/image";
import type { CardData } from "@/lib/types";

const TWEET_TEXT = "Check out my HH Goa 2026 badge! #FrameInGoa";

type UploadResponse = { id: string; imageUrl: string; shareUrl: string };

const DEFAULT_DATA: CardData = {
  name: "",
  role: "",
  title: "Builder",
};

const PREVIEW_WIDTH = Math.round(BRAND.cardWidth * PREVIEW_SCALE);
const PREVIEW_HEIGHT = Math.round(BRAND.cardHeight * PREVIEW_SCALE);

async function compressDataUrl(dataUrl: string, quality = 0.85): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Canvas context unavailable"));
        return;
      }
      ctx.drawImage(img, 0, 0);
      resolve(canvas.toDataURL("image/jpeg", quality));
    };
    img.onerror = (err) => reject(err);
    img.src = dataUrl;
  });
}

export default function Home() {
  const [data, setData] = useState<CardData>(DEFAULT_DATA);
  const [photoSrc, setPhotoSrc] = useState<string | null>(null);
  const [cropSource, setCropSource] = useState<string | null>(null);
  const [isCropOpen, setIsCropOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastShareUrl, setLastShareUrl] = useState<string | null>(null);

  const cardRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const objectUrlsRef = useRef<string[]>([]);

  useEffect(() => {
    return () => {
      objectUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  const processFile = useCallback(async (file: File) => {
    setError(null);
    try {
      const blob = isHeic(file) ? await toJpegBlob(file) : file;
      const url = URL.createObjectURL(blob);
      objectUrlsRef.current.push(url);
      setCropSource(url);
      setIsCropOpen(true);
    } catch {
      setError(
        `Could not read "${file.name}". ${
          isHeic(file) ? "HEIC conversion failed in this browser." : ""
        }`,
      );
    }
  }, []);

  const handleFileChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;
      event.target.value = "";
      void processFile(file);
    },
    [processFile],
  );

  const handleCropConfirm = useCallback((dataUrl: string) => {
    setPhotoSrc(dataUrl);
    setIsCropOpen(false);
    setCropSource(null);
  }, []);

  const handleCropCancel = useCallback(() => {
    setIsCropOpen(false);
    setCropSource(null);
  }, []);

  const handleRandomizeTitle = useCallback(() => {
    setData((current) => ({
      ...current,
      title: randomBuilderTitle(current.title),
    }));
  }, []);

  // Direct local high-res download handler
  const handleDownloadHD = useCallback(async () => {
    const node = cardRef.current;
    if (!node) return;

    setIsGenerating(true);
    setError(null);
    try {
      await document.fonts.ready;
      const pngDataUrl = await toPng(node, {
        pixelRatio: 2,
        cacheBust: true,
        backgroundColor: BRAND.green,
      });

      const link = document.createElement("a");
      const safeName = data.name.trim() ? data.name.trim().toLowerCase().replace(/\s+/g, "-") : "builder";
      link.download = `hh-goa-2026-badge-${safeName}.png`;
      link.href = pngDataUrl;
      link.click();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to download badge image.",
      );
    } finally {
      setIsGenerating(false);
    }
  }, [data.name]);

  const handleGenerateAndShare = useCallback(async () => {
    const node = cardRef.current;
    if (!node) return;

    setIsGenerating(true);
    setError(null);
    setLastShareUrl(null);
    try {
      await document.fonts.ready;
      const pngDataUrl = await toPng(node, {
        pixelRatio: 2,
        cacheBust: true,
        backgroundColor: BRAND.green,
      });

      const compressedDataUrl = await compressDataUrl(pngDataUrl, 0.85);

      const res = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: compressedDataUrl }),
      });

      const responseData = (await res.json().catch(() => null)) as
        | (UploadResponse & { error?: string })
        | null;

      if (!res.ok) {
        throw new Error(responseData?.error ?? `Upload failed (HTTP ${res.status})`);
      }
      if (!responseData?.id) {
        throw new Error("Upload succeeded but returned no share id.");
      }

      const shareUrl = responseData.shareUrl || `${window.location.origin}/s/${responseData.id}`;
      const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
        TWEET_TEXT,
      )}&url=${encodeURIComponent(shareUrl)}`;

      navigator.clipboard?.writeText(shareUrl).catch(() => undefined);
      setLastShareUrl(shareUrl);
      window.open(tweetUrl, "_blank", "noopener,noreferrer,width=600,height=500");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong while generating or sharing your badge.",
      );
    } finally {
      setIsGenerating(false);
    }
  }, []);

  return (
    <main className="builder-page">
      <header className="builder-header">
        <p className="builder-kicker">Hacker House Goa</p>
        <h1>HH Goa 2026 ID Card</h1>
        <p className="muted">
          Upload a photo, fill in your details, download your HD badge directly to your laptop, or share it straight to X!
        </p>
      </header>

      <div className="builder-grid">
        <section className="builder-form">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileChange}
            className="hidden-input"
            id="photo-upload"
          />
          <label htmlFor="photo-upload" className="upload-btn">
            Upload photo
          </label>
          <p className="field-hint">HEIC/HEIF files are auto-converted before cropping.</p>

          <label className="field-label" htmlFor="name-input">
            Name
          </label>
          <input
            id="name-input"
            type="text"
            value={data.name}
            onChange={(event) =>
              setData((current) => ({ ...current, name: event.target.value }))
            }
            maxLength={28}
            placeholder="Your name"
            className="field-input"
          />

          <label className="field-label" htmlFor="role-input">
            Stack / Role
          </label>
          <input
            id="role-input"
            type="text"
            value={data.role}
            onChange={(event) =>
              setData((current) => ({ ...current, role: event.target.value }))
            }
            maxLength={24}
            placeholder="Your stack or role"
            className="field-input"
          />

          <label className="field-label" htmlFor="title-input">
            Builder Title
          </label>
          <div className="title-row">
            <input
              id="title-input"
              type="text"
              value={data.title}
              onChange={(event) =>
                setData((current) => ({ ...current, title: event.target.value }))
              }
              maxLength={32}
              placeholder="e.g. Full-Stack Alchemist"
              className="field-input"
            />
            <button
              type="button"
              onClick={handleRandomizeTitle}
              className="random-btn"
            >
              Random
            </button>
          </div>

          {error && <p className="error">{error}</p>}

          <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "8px" }}>
            <button
              type="button"
              onClick={handleDownloadHD}
              disabled={isGenerating}
              className="button"
              style={{ backgroundColor: "#10b981", color: "#fff" }}
            >
              {isGenerating ? "Preparing HD image..." : "📥 Download HD Badge (PNG)"}
            </button>

            <button
              type="button"
              onClick={handleGenerateAndShare}
              disabled={isGenerating}
              className="button"
            >
              {isGenerating ? "Generating & uploading…" : "🚀 Generate & Share to X"}
            </button>
          </div>

          {lastShareUrl && (
            <p className="success" style={{ marginTop: "12px" }}>
              Badge uploaded. Permalink: <code>{lastShareUrl}</code>
            </p>
          )}
        </section>

        <section className="preview-section">
          <div
            className="preview-frame"
            style={{ width: PREVIEW_WIDTH, height: PREVIEW_HEIGHT }}
          >
            <div
              style={{
                width: BRAND.cardWidth,
                height: BRAND.cardHeight,
                transform: `scale(${PREVIEW_SCALE})`,
                transformOrigin: "top left",
              }}
            >
              <IdCard ref={cardRef} data={data} photoDataUrl={photoSrc} />
            </div>
          </div>
          <p className="field-hint">
            Live preview · exports at {BRAND.cardWidth * 2}×{BRAND.cardHeight * 2}px
          </p>
        </section>
      </div>

      {isCropOpen && cropSource && (
        <CropModal
          imageSrc={cropSource}
          onCancel={handleCropCancel}
          onConfirm={handleCropConfirm}
        />
      )}
    </main>
  );
}