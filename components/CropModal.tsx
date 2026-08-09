"use client";

import { useCallback, useRef, useState } from "react";
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
  const [isProcessing, setIsProcessing] = useState(false);
  const croppedAreaRef = useRef<Area | null>(null);

  const onCropComplete = useCallback(
    (_croppedArea: Area, croppedAreaPixels: Area) => {
      croppedAreaRef.current = croppedAreaPixels;
    },
    [],
  );

  const handleConfirm = async () => {
    const area = croppedAreaRef.current;
    if (!area) return;
    setIsProcessing(true);
    try {
      const dataUrl = await createCroppedImage(imageSrc, area);
      onConfirm(dataUrl);
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
          aspect={PHOTO_ASPECT}
          objectFit="cover"
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onCropComplete={onCropComplete}
          showGrid
        />
      </div>

      <div className="crop-bar">
        <div className="crop-zoom">
          <span className="crop-zoom-label">Zoom</span>
          <input
            type="range"
            min={1}
            max={3}
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