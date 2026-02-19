import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createProjectSchema, moderateText } from "@/lib/validation/schemas";
import { generateSiteSections, generateThemeFromTemplate } from "@/lib/ai/generate";
import { logAudit } from "@/lib/audit";
import { checkRateLimit, AI_GENERATION_LIMIT } from "@/lib/rate-limit";

// POST /api/projects — Create a new project with token draft + site config
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { walletAddress, token, site } = body;

    if (!walletAddress || typeof walletAddress !== "string") {
      return NextResponse.json(
        { error: "walletAddress is required" },
        { status: 400 }
      );
    }

    // Rate limit
    const rl = checkRateLimit(`create:${walletAddress}`, AI_GENERATION_LIMIT);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 }
      );
    }

    // Validate input
    const parsed = createProjectSchema.safeParse({ token, site });
    if (!parsed.success) {
      const firstError = parsed.error.issues[0];
      return NextResponse.json(
        { error: firstError?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const { token: tokenData, site: siteData } = parsed.data;

    // Moderation check
    const modName = moderateText(tokenData.name);
    if (!modName.ok) {
      return NextResponse.json({ error: modName.reason }, { status: 400 });
    }
    const modDesc = moderateText(tokenData.description);
    if (!modDesc.ok) {
      return NextResponse.json({ error: modDesc.reason }, { status: 400 });
    }

    // Check subdomain uniqueness
    const existing = await prisma.siteConfig.findUnique({
      where: { subdomain: siteData.subdomain },
    });
    if (existing) {
      return NextResponse.json(
        { error: "This subdomain is already taken" },
        { status: 409 }
      );
    }

    // Upsert user
    const user = await prisma.user.upsert({
      where: { walletAddress },
      create: { walletAddress },
      update: {},
    });

    // Generate AI content
    const sections = await generateSiteSections(tokenData);
    const theme = siteData.theme ?? generateThemeFromTemplate(siteData.templateId);

    // Create project with all related data in a transaction
    const project = await prisma.project.create({
      data: {
        userId: user.id,
        status: "SITE_GENERATING",
        tokenDraft: {
          create: {
            name: tokenData.name,
            symbol: tokenData.symbol,
            description: tokenData.description,
            decimals: tokenData.decimals ?? 9,
            totalSupply: tokenData.totalSupply ?? "1000000000",
            website: tokenData.website,
            twitter: tokenData.twitter,
            telegram: tokenData.telegram,
          },
        },
        siteConfig: {
          create: {
            subdomain: siteData.subdomain,
            templateId: siteData.templateId,
            theme: JSON.stringify(theme),
            sections: JSON.stringify(sections),
            seo: JSON.stringify({
              title: `${tokenData.name} (${tokenData.symbol})`,
              description: tokenData.description.slice(0, 160),
            }),
            published: false,
          },
        },
      },
    });

    // Mark as published (in MVP, generation is immediate)
    await prisma.project.update({
      where: { id: project.id },
      data: { status: "SITE_PUBLISHED" },
    });
    await prisma.siteConfig.update({
      where: { projectId: project.id },
      data: { published: true },
    });

    // Audit
    await logAudit({
      userId: user.id,
      projectId: project.id,
      action: "PROJECT_CREATED",
      details: { subdomain: siteData.subdomain, symbol: tokenData.symbol },
      ip: req.headers.get("x-forwarded-for") ?? undefined,
    });

    return NextResponse.json({ projectId: project.id }, { status: 201 });
  } catch (err) {
    console.error("Create project error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// GET /api/projects?wallet=<address> — List user's projects
export async function GET(req: NextRequest) {
  const wallet = req.nextUrl.searchParams.get("wallet");
  if (!wallet) {
    return NextResponse.json(
      { error: "wallet query param required" },
      { status: 400 }
    );
  }

  const user = await prisma.user.findUnique({
    where: { walletAddress: wallet },
    include: {
      projects: {
        include: { tokenDraft: true, siteConfig: true },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  return NextResponse.json({ projects: user?.projects ?? [] });
}

