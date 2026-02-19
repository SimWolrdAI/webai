import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { logAudit } from "@/lib/audit";

// POST /api/projects/[id]/publish — Publish / unpublish the site
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const publish = body.publish !== false;

  const project = await prisma.project.findUnique({
    where: { id },
    include: { siteConfig: true },
  });

  if (!project || !project.siteConfig) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  await prisma.siteConfig.update({
    where: { id: project.siteConfig.id },
    data: { published: publish },
  });

  if (publish) {
    await prisma.project.update({
      where: { id },
      data: { status: "SITE_PUBLISHED" },
    });
  }

  await logAudit({
    userId: project.userId,
    projectId: id,
    action: publish ? "SITE_PUBLISHED" : "SITE_UNPUBLISHED",
  });

  return NextResponse.json({ published: publish });
}

