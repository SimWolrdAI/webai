import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  return { title: slug };
}

export default async function PublishedSitePage({ params }: Props) {
  const { slug } = await params;

  const site = await prisma.publishedSite.findUnique({
    where: { slug },
  });

  if (!site) {
    notFound();
  }

  return (
    <>
      {/* Full-screen iframe pointing to the raw HTML API */}
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
    </>
  );
}
