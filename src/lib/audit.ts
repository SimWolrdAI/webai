import { prisma } from "@/lib/db";

export async function logAudit(params: {
  userId?: string;
  projectId?: string;
  action: string;
  details?: Record<string, unknown>;
  ip?: string;
}) {
  try {
    await prisma.auditLog.create({
      data: {
        userId: params.userId,
        projectId: params.projectId,
        action: params.action,
        details: JSON.stringify(params.details ?? {}),
        ip: params.ip,
      },
    });
  } catch (err) {
    // Don't let audit logging failures break the main flow
    console.error("Audit log failed:", err);
  }
}

