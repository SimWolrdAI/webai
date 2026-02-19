import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { SiteRenderer } from "@/components/site/SiteRenderer";

interface Props {
  params: Promise<{ subdomain: string }>;
}

export default async function TokenSitePage({ params }: Props) {
  const { subdomain } = await params;

  const siteConfig = await prisma.siteConfig.findUnique({
    where: { subdomain },
    include: {
      project: {
        include: {
          tokenDraft: true,
          assets: true,
        },
      },
    },
  });

  if (!siteConfig || !siteConfig.published) {
    notFound();
  }

  const theme = JSON.parse(siteConfig.theme || "{}");
  const sections = JSON.parse(siteConfig.sections || "[]");
  const seo = JSON.parse(siteConfig.seo || "{}");
  const token = siteConfig.project.tokenDraft;

  if (!token) {
    notFound();
  }

  return (
    <SiteRenderer
      templateId={siteConfig.templateId}
      theme={theme}
      sections={sections}
      seo={seo}
      token={{
        name: token.name,
        symbol: token.symbol,
        description: token.description,
        totalSupply: token.totalSupply,
        website: token.website,
        twitter: token.twitter,
        telegram: token.telegram,
      }}
    />
  );
}

// Generate metadata for SEO
export async function generateMetadata({ params }: Props) {
  const { subdomain } = await params;
  const siteConfig = await prisma.siteConfig.findUnique({
    where: { subdomain },
    include: { project: { include: { tokenDraft: true } } },
  });

  if (!siteConfig || !siteConfig.project.tokenDraft) {
    return { title: "Not Found" };
  }

  const seo = JSON.parse(siteConfig.seo || "{}");
  return {
    title: seo.title ?? siteConfig.project.tokenDraft.name,
    description: seo.description ?? siteConfig.project.tokenDraft.description,
  };
}

