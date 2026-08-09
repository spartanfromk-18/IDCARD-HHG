import { NextRequest, NextResponse } from "next/server";
import { ApiError, isBlobConfigReady, uploadShareImage } from "@/lib/share-upload";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const origin = new URL(request.url).origin;

  try {
    if (!isBlobConfigReady()) {
      return NextResponse.json(
        { error: "Storage is not configured on the server. Set BLOB_READ_WRITE_TOKEN and deploy again." },
        { status: 503 }
      );
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid request: expected JSON with an `image` field." },
        { status: 400 }
      );
    }
    const image = (body as { image?: unknown } | null)?.image;

    const { id, imageUrl, shareUrl } = await uploadShareImage(image, origin);

    return NextResponse.json(
      { id, imageUrl, shareUrl },
      {
        status: 201,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("[api/upload] unexpected error:", error);
    return NextResponse.json(
      { error: "Upload failed. The badge was not saved, so no share link was created." },
      { status: 500 }
    );
  }
}
