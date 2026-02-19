import { z } from "zod";

// ─── Token Draft ─────────────────────────────────────────
export const tokenDraftSchema = z.object({
  name: z
    .string()
    .min(1, "Token name is required")
    .max(32, "Token name must be 32 chars or less")
    .regex(/^[a-zA-Z0-9\s]+$/, "Only letters, numbers, and spaces"),
  symbol: z
    .string()
    .min(1, "Symbol is required")
    .max(10, "Symbol must be 10 chars or less")
    .regex(/^[A-Z0-9]+$/, "Only uppercase letters and numbers"),
  description: z
    .string()
    .min(10, "Description must be at least 10 characters")
    .max(1000, "Description must be 1000 chars or less"),
  decimals: z.number().int().min(0).max(18).default(9),
  totalSupply: z.string().default("1000000000"),
  website: z.string().url().optional().or(z.literal("")),
  twitter: z.string().optional(),
  telegram: z.string().optional(),
  discord: z.string().optional(),
});

export type TokenDraftInput = z.infer<typeof tokenDraftSchema>;

// ─── Site Config ─────────────────────────────────────────
export const siteThemeSchema = z.object({
  primaryColor: z.string().default("#6366f1"),
  secondaryColor: z.string().default("#8b5cf6"),
  backgroundColor: z.string().default("#0f0f23"),
  textColor: z.string().default("#ffffff"),
  fontFamily: z.string().default("Inter"),
});

export type SiteTheme = z.infer<typeof siteThemeSchema>;

export const siteSectionSchema = z.object({
  id: z.string(),
  type: z.enum(["hero", "about", "tokenomics", "roadmap", "faq", "socials"]),
  title: z.string(),
  content: z.string(),
  enabled: z.boolean().default(true),
  order: z.number(),
});

export type SiteSection = z.infer<typeof siteSectionSchema>;

export const siteConfigInputSchema = z.object({
  subdomain: z
    .string()
    .min(3, "Subdomain must be at least 3 characters")
    .max(32, "Subdomain must be 32 chars or less")
    .regex(
      /^[a-z0-9][a-z0-9-]*[a-z0-9]$/,
      "Lowercase letters, numbers, hyphens only; cannot start/end with hyphen"
    ),
  templateId: z.enum(["modern", "minimal", "neon"]).default("modern"),
  theme: siteThemeSchema.optional(),
});

export type SiteConfigInput = z.infer<typeof siteConfigInputSchema>;

// ─── Create Project (combined) ───────────────────────────
export const createProjectSchema = z.object({
  token: tokenDraftSchema,
  site: siteConfigInputSchema,
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;

// ─── Moderation blocklist ────────────────────────────────
const BLOCKED_WORDS = [
  "scam",
  "rugpull",
  "rug pull",
  "ponzi",
  "hack",
  "steal",
  "fraud",
];

export function moderateText(text: string): { ok: boolean; reason?: string } {
  const lower = text.toLowerCase();
  for (const word of BLOCKED_WORDS) {
    if (lower.includes(word)) {
      return { ok: false, reason: `Blocked word detected: "${word}"` };
    }
  }
  return { ok: true };
}

