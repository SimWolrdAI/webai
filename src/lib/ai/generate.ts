import OpenAI from "openai";
import type { SiteSection, SiteTheme } from "@/lib/validation/schemas";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY ?? "" });

interface TokenInfo {
  name: string;
  symbol: string;
  description: string;
  totalSupply: string;
  website?: string | null;
  twitter?: string | null;
  telegram?: string | null;
  discord?: string | null;
}

// ─── Generate landing page sections via AI ───────────────
export async function generateSiteSections(
  token: TokenInfo
): Promise<SiteSection[]> {
  const prompt = `You are a crypto marketing expert. Generate website landing page content for a new token launch.

Token details:
- Name: ${token.name}
- Symbol: ${token.symbol}
- Description: ${token.description}
- Total Supply: ${token.totalSupply}
${token.website ? `- Website: ${token.website}` : ""}
${token.twitter ? `- Twitter: ${token.twitter}` : ""}
${token.telegram ? `- Telegram: ${token.telegram}` : ""}

Generate JSON array with these sections (in this order):
1. "hero" - Catchy headline (max 80 chars) and a subtitle (max 200 chars)
2. "about" - About section explaining what makes this token unique (2-3 paragraphs, use \\n for line breaks)
3. "tokenomics" - Tokenomics breakdown (supply, distribution ideas, formatted nicely)
4. "roadmap" - 4-phase roadmap (Q1-Q4 style)
5. "faq" - 5 common questions and answers about the token
6. "socials" - Call to action to join the community

Each object must have: { "id": string, "type": string, "title": string, "content": string, "enabled": true, "order": number }

Return ONLY a valid JSON array, no markdown formatting or code blocks.`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.8,
      max_tokens: 3000,
    });

    const text = response.choices[0]?.message?.content?.trim() ?? "[]";
    // Strip markdown code blocks if present
    const cleaned = text.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
    const sections: SiteSection[] = JSON.parse(cleaned);
    return sections;
  } catch (error) {
    console.error("AI generation failed, using fallback:", error);
    return generateFallbackSections(token);
  }
}

// ─── Fallback if AI is unavailable ───────────────────────
export function generateFallbackSections(token: TokenInfo): SiteSection[] {
  return [
    {
      id: "hero",
      type: "hero",
      title: `Welcome to ${token.name}`,
      content: `${token.symbol} — The next generation token built for the community. Join the revolution today.`,
      enabled: true,
      order: 0,
    },
    {
      id: "about",
      type: "about",
      title: `About ${token.name}`,
      content: token.description,
      enabled: true,
      order: 1,
    },
    {
      id: "tokenomics",
      type: "tokenomics",
      title: "Tokenomics",
      content: `Total Supply: ${token.totalSupply} ${token.symbol}\nDecimals: 9\nFair launch on Pump.fun — no presale, no team allocation.`,
      enabled: true,
      order: 2,
    },
    {
      id: "roadmap",
      type: "roadmap",
      title: "Roadmap",
      content:
        "Phase 1: Launch on Pump.fun & build community\nPhase 2: Website & social media growth\nPhase 3: DEX listings & partnerships\nPhase 4: Utility development & ecosystem expansion",
      enabled: true,
      order: 3,
    },
    {
      id: "faq",
      type: "faq",
      title: "FAQ",
      content: `Q: What is ${token.name}?\nA: ${token.description}\n\nQ: Where can I buy ${token.symbol}?\nA: ${token.symbol} launches on Pump.fun with fair distribution.\n\nQ: Is there a presale?\nA: No. 100% fair launch.\n\nQ: What is the total supply?\nA: ${token.totalSupply} ${token.symbol}`,
      enabled: true,
      order: 4,
    },
    {
      id: "socials",
      type: "socials",
      title: "Join the Community",
      content: `Follow us and be part of the ${token.name} movement!`,
      enabled: true,
      order: 5,
    },
  ];
}

// ─── Generate theme suggestion ───────────────────────────
export function generateThemeFromTemplate(
  templateId: string
): SiteTheme {
  const themes: Record<string, SiteTheme> = {
    modern: {
      primaryColor: "#6366f1",
      secondaryColor: "#8b5cf6",
      backgroundColor: "#0f0f23",
      textColor: "#ffffff",
      fontFamily: "Inter",
    },
    minimal: {
      primaryColor: "#10b981",
      secondaryColor: "#34d399",
      backgroundColor: "#111827",
      textColor: "#f9fafb",
      fontFamily: "Inter",
    },
    neon: {
      primaryColor: "#f43f5e",
      secondaryColor: "#fb923c",
      backgroundColor: "#0a0a0a",
      textColor: "#ffffff",
      fontFamily: "Space Grotesk",
    },
  };
  return themes[templateId] ?? themes.modern;
}

