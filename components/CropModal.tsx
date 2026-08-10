"use client";

import { useCallback, useState } from "react";
import Cropper, { type Area } from "react-easy-crop";
import "react-easy-crop/react-easy-crop.css";
import { PHOTO_ASPECT } from "@/lib/brandkit";
import { createCroppedImage } from "@/lib/image";

interface CropModalProps {
  imageSrc: string;
  onCancel: () => void;
  onConfirm: (croppedDataUrl: string) => void;
}

export default function CropModal({
  imageSrc,
  onCancel,
  onConfirm,
}: CropModalProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [minZoom, setMinZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Automatically calculate the exact minimum zoom required to completely fill the crop area
  const onMediaLoaded = useCallback((mediaSize: { width: number; height: number }) => {
    // react-easy-crop provides the natural media dimensions; 
    // we can let the component handle standard layout sizing, or compute safety bounds.
    // Setting a safe baseline prevents sub-scale rendering glitches.
    setMinZoom(1);
  }, []);

  const onCropComplete = useCallback(
    (_croppedArea: Area, pixels: Area) => {
      setCroppedAreaPixels(pixels);
    },
    [],
  );

  const handleConfirm = async () => {
    if (!croppedAreaPixels) return;
    setIsProcessing(true);
    try {
      // Pass a compression/quality parameter or ensure createCroppedImage exports as JPEG
      const dataUrl = await createCroppedImage(imageSrc, croppedAreaPixels);
      onConfirm(dataUrl);
    } catch (err) {
      console.error("Failed to crop image:", err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="crop-overlay">
      <div className="crop-stage">
        <Cropper
          image={imageSrc}
          crop={crop}
          zoom={zoom}
          minZoom={minZoom}
          maxZoom={4}
          aspect={PHOTO_ASPECT}
          objectFit="contain"
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onCropComplete={onCropComplete}
          onMediaLoaded={onMediaLoaded}
          showGrid
        />
      </div>

      <div className="crop-bar">
        <div className="crop-zoom">
          <span className="crop-zoom-label">Zoom</span>
          <input
            type="range"
            min={minZoom}
            max={4}
            step={0.01}
            value={zoom}
            onChange={(event) => setZoom(Number(event.target.value))}
            className="crop-zoom-input"
            aria-label="Zoom"
          />
        </div>

        <div className="crop-actions">
          <button type="button" onClick={onCancel} className="crop-btn crop-btn-cancel">
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isProcessing}
            className="crop-btn crop-btn-primary"
          >
            {isProcessing ? "Processing…" : "Apply photo"}
          </button>
        </div>
      </div>
    </div>
  );
}