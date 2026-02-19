import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { checkRateLimit, UPLOAD_LIMIT } from "@/lib/rate-limit";
import { logAudit } from "@/lib/audit";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { v4 as uuidv4 } from "uuid";

const MAX_SIZE = (parseInt(process.env.MAX_UPLOAD_SIZE_MB ?? "5") || 5) * 1024 * 1024;
const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif", "image/svg+xml"];

// POST /api/upload — Upload an asset (logo, banner, etc.)
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const projectId = formData.get("projectId") as string | null;
    const assetType = (formData.get("type") as string) ?? "OTHER";
    const walletAddress = formData.get("walletAddress") as string | null;

    if (!file || !projectId) {
      return NextResponse.json(
        { error: "file and projectId are required" },
        { status: 400 }
      );
    }

    // Rate limit
    if (walletAddress) {
      const rl = checkRateLimit(`upload:${walletAddress}`, UPLOAD_LIMIT);
      if (!rl.allowed) {
        return NextResponse.json(
          { error: "Upload rate limit exceeded" },
          { status: 429 }
        );
      }
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: `Invalid file type: ${file.type}. Allowed: ${ALLOWED_TYPES.join(", ")}` },
        { status: 400 }
      );
    }

    // Validate size
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: `File too large. Max: ${MAX_SIZE / 1024 / 1024}MB` },
        { status: 400 }
      );
    }

    // Verify project exists
    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Save file
    const ext = file.name.split(".").pop() ?? "png";
    const filename = `${uuidv4()}.${ext}`;
    const uploadDir = path.join(process.cwd(), "public", "uploads", projectId);
    await mkdir(uploadDir, { recursive: true });
    const filePath = path.join(uploadDir, filename);

    const bytes = await file.arrayBuffer();
    await writeFile(filePath, Buffer.from(bytes));

    const publicPath = `/uploads/${projectId}/${filename}`;

    // Save to DB
    const asset = await prisma.asset.create({
      data: {
        projectId,
        type: assetType as "LOGO" | "BANNER" | "FAVICON" | "OTHER",
        filename: file.name,
        path: publicPath,
        mimeType: file.type,
        sizeBytes: file.size,
      },
    });

    await logAudit({
      userId: project.userId,
      projectId,
      action: "ASSET_UPLOADED",
      details: { assetId: asset.id, type: assetType, filename: file.name },
    });

    return NextResponse.json({
      assetId: asset.id,
      path: publicPath,
    });
  } catch (err) {
    console.error("Upload error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

