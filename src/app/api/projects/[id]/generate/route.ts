import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generateSiteSections } from "@/lib/ai/generate";
import { logAudit } from "@/lib/audit";
import { checkRateLimit, AI_GENERATION_LIMIT } from "@/lib/rate-limit";

// POST /api/projects/[id]/generate — Regenerate AI content for the site
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const project = await prisma.project.findUnique({
    where: { id },
    include: { tokenDraft: true, siteConfig: true, user: true },
  });

  if (!project || !project.tokenDraft || !project.siteConfig) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  // Rate limit per user
  const rl = checkRateLimit(
    `generate:${project.userId}`,
    AI_GENERATION_LIMIT
  );
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Generation rate limit exceeded. Try again later." },
      { status: 429 }
    );
  }

  const sections = await generateSiteSections(project.tokenDraft);

  await prisma.siteConfig.update({
    where: { id: project.siteConfig.id },
    data: { sections: JSON.stringify(sections) },
  });

  await logAudit({
    userId: project.userId,
    projectId: id,
    action: "SITE_REGENERATED",
  });

  return NextResponse.json({ sections });
}

