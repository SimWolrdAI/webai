"use client";

import { useParams } from "next/navigation";

export default function PublishedSitePage() {
  const params = useParams();
  const slug = params.slug as string;

  return (
    <iframe
      src={`/api/site/${slug}`}
      style={{
        position: "fixed",
        inset: 0,
        width: "100vw",
        height: "100vh",
        border: "none",
        margin: 0,
        padding: 0,
      }}
      title={slug}
    />
  );
}
