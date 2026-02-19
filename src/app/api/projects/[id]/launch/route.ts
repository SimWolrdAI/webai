import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { buildLaunchPayload, submitViaApi, verifyLaunch } from "@/lib/solana/pumpfun";
import { logAudit } from "@/lib/audit";
import { checkRateLimit, LAUNCH_LIMIT } from "@/lib/rate-limit";

// POST /api/projects/[id]/launch — Prepare or confirm a launch
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const { action, walletAddress, txSignature } = body;

  const project = await prisma.project.findUnique({
    where: { id },
    include: { tokenDraft: true, siteConfig: true },
  });

  if (!project || !project.tokenDraft) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  // Rate limit
  const rl = checkRateLimit(`launch:${project.userId}`, LAUNCH_LIMIT);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Launch rate limit exceeded." },
      { status: 429 }
    );
  }

  // ─── PREPARE: build payload for user to sign ───────────
  if (action === "prepare") {
    if (!walletAddress) {
      return NextResponse.json(
        { error: "walletAddress required" },
        { status: 400 }
      );
    }

    const td = project.tokenDraft;
    const payload = await buildLaunchPayload(
      {
        name: td.name,
        symbol: td.symbol,
        description: td.description,
        totalSupply: td.totalSupply,
        decimals: td.decimals,
        website: td.website ?? undefined,
        twitter: td.twitter ?? undefined,
        telegram: td.telegram ?? undefined,
      },
      walletAddress
    );

    // Create a launch attempt record
    const attempt = await prisma.launchAttempt.create({
      data: {
        projectId: id,
        status: "AWAITING_SIGNATURE",
        payload: JSON.stringify(payload),
      },
    });

    await prisma.project.update({
      where: { id },
      data: { status: "LAUNCHING" },
    });

    await logAudit({
      userId: project.userId,
      projectId: id,
      action: "LAUNCH_PREPARED",
      details: { attemptId: attempt.id, method: payload.method },
    });

    return NextResponse.json({
      attemptId: attempt.id,
      payload,
    });
  }

  // ─── CONFIRM: user has signed, verify on-chain ─────────
  if (action === "confirm") {
    const { attemptId } = body;

    if (!attemptId) {
      return NextResponse.json(
        { error: "attemptId required" },
        { status: 400 }
      );
    }

    const attempt = await prisma.launchAttempt.findUnique({
      where: { id: attemptId },
    });
    if (!attempt) {
      return NextResponse.json(
        { error: "Launch attempt not found" },
        { status: 404 }
      );
    }

    // If API method, submit server-side
    const payload = JSON.parse(attempt.payload);
    if (payload.method === "api" && payload.apiPayload) {
      const result = await submitViaApi(payload.apiPayload);
      if (result.success) {
        await prisma.launchAttempt.update({
          where: { id: attemptId },
          data: {
            status: "CONFIRMED",
            txSignature: result.txSignature,
          },
        });
        await prisma.project.update({
          where: { id },
          data: { status: "LAUNCHED" },
        });

        await logAudit({
          userId: project.userId,
          projectId: id,
          action: "LAUNCH_CONFIRMED",
          details: { txSignature: result.txSignature },
        });

        return NextResponse.json({
          success: true,
          txSignature: result.txSignature,
        });
      } else {
        await prisma.launchAttempt.update({
          where: { id: attemptId },
          data: { status: "FAILED", errorMessage: result.error },
        });
        await prisma.project.update({
          where: { id },
          data: { status: "FAILED" },
        });
        return NextResponse.json(
          { error: result.error },
          { status: 500 }
        );
      }
    }

    // For on-chain method, verify user-provided txSignature
    if (txSignature) {
      const verified = await verifyLaunch(txSignature);
      await prisma.launchAttempt.update({
        where: { id: attemptId },
        data: {
          status: verified.confirmed ? "CONFIRMED" : "FAILED",
          txSignature,
          mintAddress: verified.mintAddress,
          errorMessage: verified.confirmed
            ? undefined
            : "Transaction not confirmed",
        },
      });

      if (verified.confirmed) {
        await prisma.project.update({
          where: { id },
          data: { status: "LAUNCHED" },
        });
      }

      await logAudit({
        userId: project.userId,
        projectId: id,
        action: verified.confirmed ? "LAUNCH_CONFIRMED" : "LAUNCH_FAILED",
        details: { txSignature },
      });

      return NextResponse.json({
        success: verified.confirmed,
        txSignature,
        mintAddress: verified.mintAddress,
      });
    }

    return NextResponse.json(
      { error: "txSignature required for on-chain method" },
      { status: 400 }
    );
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}

