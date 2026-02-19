import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const { description, template } = await req.json();

    if (!description && !template) {
      return NextResponse.json(
        { error: "Description or template required" },
        { status: 400 }
      );
    }

    const userInput = [
      description ? `User description: ${description}` : "",
      template ? `Template category: ${template}` : "",
    ]
      .filter(Boolean)
      .join("\n");

    const res = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `You are an expert AI prompt engineer. Given a description of a desired AI assistant, generate an optimized system prompt that will make the assistant perform excellently.

Return JSON with these fields:
{
  "name": "Short catchy name for the bot (2-4 words)",
  "system_prompt": "The full system prompt (detailed, specific, with personality, tone, capabilities, and behavior rules). Make it 200-400 words. Be very specific about what the bot should and shouldn't do.",
  "description": "One-line description of the bot (under 100 chars)",
  "suggested_slug": "url-friendly-slug"
}

Guidelines for the system prompt:
- Start with a clear identity statement ("You are...")
- Define personality and tone
- List specific capabilities
- Add behavior rules (what to do and what NOT to do)
- Include formatting instructions (use markdown, code blocks, etc where appropriate)
- Make it engaging and professional
- If the bot is about crypto/trading, add disclaimers about not being financial advice`,
        },
        {
          role: "user",
          content: userInput,
        },
      ],
      max_tokens: 1000,
      temperature: 0.8,
    });

    const content = res.choices[0]?.message?.content;
    if (!content) throw new Error("No response from AI");

    const data = JSON.parse(content);

    return NextResponse.json(data);
  } catch (err) {
    console.error("Generate prompt error:", err);
    return NextResponse.json(
      { error: "Failed to generate prompt" },
      { status: 500 }
    );
  }
}

