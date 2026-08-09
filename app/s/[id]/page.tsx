import type { Metadata } from "next";
import Link from "next/link";
import { isBlocklistedId } from "@/lib/uploads";
import { resolveShareImageUrl, verifyShareImageUrl } from "@/lib/share-upload";

export const dynamic = "force-dynamic";

const FALLBACK_OG_IMAGE = "/og-default.png";
const CARD_TITLE = "My HH Goa 2026 badge";
const CARD_DESCRIPTION = "Made at FrameInGoa — ID card generator for Hacker House Goa 2026";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;

  const url = isBlocklistedId(id) ? null : resolveShareImageUrl(id);
  const liveImage = await verifyShareImageUrl(url);
  const found = liveImage !== null;

  return {
    title: found ? CARD_TITLE : "Badge not found – HH Goa 2026",
    description: found ? CARD_DESCRIPTION : "This badge link doesn't exist or its image was removed.",
    openGraph: {
      title: found ? CARD_TITLE : "Hacker House Goa 2026",
      description: found ? CARD_DESCRIPTION : "Badge from FrameInGoa 2026.",
      type: "website",
      url: `/s/${id}`,
      siteName: "Hacker House Goa 2026",
      locale: "en_US",
      images: [
        {
          url: found ? liveImage : FALLBACK_OG_IMAGE,
          width: 1200,
          height: 675,
          alt: found ? "My HH Goa 2026 ID badge" : "Hacker House Goa 2026",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: found ? CARD_TITLE : "Hacker House Goa 2026",
      description: found ? CARD_DESCRIPTION : "Badge from FrameInGoa 2026.",
      images: [found ? liveImage : FALLBACK_OG_IMAGE],
    },
  };
}

export default async function SharePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const blocked = isBlocklistedId(id);
  const url = blocked ? null : resolveShareImageUrl(id);

  return (
    <main className="page">
      <p className="kicker">Hacker House Goa</p>
      <>
        {blocked ? (
          <p className="muted">
            This badge link doesn&apos;t exist. If you just generated it, the upload may have
            failed — try sharing again.
          </p>
        ) : (
          <>
            <h1>My badge • {id}</h1>
            <p className="muted">
              This page exists so X/Twitter&apos;s crawler can render the card. The badge image
              is served from Vercel Blob via the og:image tag.
            </p>
            <div className="panel">
              <p className="muted" style={{ marginBottom: "0.5rem" }}>
                og:image →
              </p>
              <code>{url ?? "unresolved (missing BLOB_READ_WRITE_TOKEN)"}</code>
            </div>
            <Link href="/" className="button">
              Make your own badge
            </Link>
          </>
        )}
      </>
    </main>
  );
}