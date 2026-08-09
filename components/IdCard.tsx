"use client";

import { forwardRef } from "react";
import { ASSETS, BRAND, CARD_FONT } from "@/lib/brandkit";
import type { CardData } from "@/lib/types";

interface IdCardProps {
  data: CardData;
  photoDataUrl: string | null;
}

const IdCard = forwardRef<HTMLDivElement, IdCardProps>(function IdCard(
  { data, photoDataUrl },
  ref,
) {
  return (
    <div
      ref={ref}
      style={{
        position: "relative",
        overflow: "hidden",
        width: BRAND.cardWidth,
        height: BRAND.cardHeight,
        backgroundColor: BRAND.green,
        fontFamily: CARD_FONT,
        color: "#ffffff",
      }}
    >
      <img
        src={ASSETS.sunRise}
        alt=""
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          zIndex: 0,
        }}
      />

      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 10,
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          padding: "48px 64px 0",
        }}
      >
        <img src={ASSETS.goaHindi} alt="गोवा" style={{ width: 120 }} />
        <img
          src={ASSETS.wordmark}
          alt="Hacker House Studio"
          style={{ width: 150 }}
        />
      </div>

      <div
        style={{
          position: "absolute",
          top: 150,
          left: 0,
          right: 0,
          zIndex: 10,
          display: "flex",
          justifyContent: "center",
        }}
      >
        <img src={ASSETS.hackerHouse} alt="Hacker House" style={{ width: 760 }} />
      </div>

      <div
        style={{
          position: "absolute",
          top: 330,
          left: "50%",
          marginLeft: -230,
          zIndex: 10,
          width: 460,
          height: 575,
          overflow: "hidden",
          borderRadius: 36,
          border: `6px solid ${BRAND.yellow}`,
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.6)",
        }}
      >
        {photoDataUrl ? (
          <img
            src={photoDataUrl}
            alt="Builder portrait"
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : (
          <div
            style={{
              display: "flex",
              width: "100%",
              height: "100%",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "rgba(0, 0, 0, 0.25)",
              padding: 32,
              textAlign: "center",
              fontSize: 34,
              fontWeight: 500,
              color: BRAND.yellow,
            }}
          >
            Upload your photo
          </div>
        )}
      </div>

      <div
        style={{
          position: "absolute",
          top: 935,
          left: 0,
          right: 0,
          zIndex: 10,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          padding: "0 48px",
          textAlign: "center",
        }}
      >
        <p
          style={{
            margin: 0,
            fontSize: 62,
            fontWeight: 700,
            lineHeight: 1.08,
            color: "#ffffff",
            textShadow: "0 4px 14px rgba(0, 0, 0, 0.55)",
          }}
        >
          {data.name.trim() || "Your Name"}
        </p>
        <p
          style={{
            margin: "16px 0 0",
            fontSize: 42,
            fontWeight: 500,
            color: BRAND.yellow,
            textShadow: "0 4px 12px rgba(0, 0, 0, 0.55)",
          }}
        >
          {data.role.trim() || "Hacker"}
        </p>
        <p
          style={{
            margin: "24px 0 0",
            borderRadius: 9999,
            border: `2px solid ${BRAND.yellow}`,
            padding: "10px 40px",
            fontSize: 36,
            fontWeight: 700,
            color: BRAND.yellow,
            textShadow: "0 4px 12px rgba(0, 0, 0, 0.55)",
          }}
        >
          {data.title.trim() || "Builder"}
        </p>
      </div>

      <img
        src={ASSETS.footerTrees}
        alt=""
        aria-hidden
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          width: "100%",
          height: 520,
          objectFit: "cover",
          objectPosition: "bottom",
          zIndex: 5,
        }}
      />

      <p
        style={{
          position: "absolute",
          bottom: 40,
          left: 0,
          right: 0,
          zIndex: 20,
          margin: 0,
          textAlign: "center",
          fontSize: 32,
          fontWeight: 700,
          letterSpacing: "0.22em",
          color: BRAND.yellow,
        }}
      >
        {BRAND.footerText}
      </p>
    </div>
  );
});

export default IdCard;