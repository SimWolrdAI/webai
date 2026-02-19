import { NextRequest } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const { files, instruction, botName, botDescription } = await req.json();

    if (!files || !Array.isArray(files) || files.length === 0) {
      return new Response(JSON.stringify({ error: "Files are required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!instruction || typeof instruction !== "string" || !instruction.trim()) {
      return new Response(JSON.stringify({ error: "Instruction is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Build a summary of current files for the AI
    const filesSummary = files
      .map((f: { path: string; content: string }) => `═══ ${f.path} ═══\n${f.content}`)
      .join("\n\n");

    const systemMessage = `You are an elite Python developer. The user has an existing bot project and wants to modify it.

Below is the COMPLETE current source code of the project:

${filesSummary}

═══════════════════════════════════
YOUR TASK:
═══════════════════════════════════

The user wants the following change:
"${instruction}"

Apply the requested changes to the project. You may:
- Modify existing files
- Add new files if the change requires it
- Remove files (by not including them) if they're no longer needed

RULES:
- Return ALL files, not just the changed ones. The response replaces the entire project.
- Keep the same project structure (bot/, static/, templates/, tests/, etc.)
- Maintain code quality: docstrings, type hints, clean architecture.
- The bot must remain 100% self-contained — NO external AI APIs.
- All code must be complete and working. No "..." or "TODO" placeholders.
- If the user asks for something that would require an external API, implement it with built-in logic instead.
- Keep the existing bot personality and features unless the user explicitly asks to change them.
- Update README.md if the change adds significant new features.
- Update tests if the change affects testable logic.

Also update "name", "description", and "system_prompt" if the change warrants it. Otherwise keep them the same.

Return JSON:
{
  "name": "${botName || "My Bot"}",
  "description": "${botDescription || ""}",
  "system_prompt": "Updated behavior description (300-500 words)",
  "suggested_slug": "url-friendly-slug",
  "change_summary": "Brief 1-2 sentence summary of what was changed",
  "files": [
    { "path": "app.py", "content": "..." },
    { "path": "bot/engine.py", "content": "..." },
    ...all files...
  ]
}`;

    const stream = await openai.chat.completions.create({
      model: "gpt-4o",
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemMessage },
        { role: "user", content: `Apply this change to my bot: ${instruction}` },
      ],
      max_tokens: 16000,
      temperature: 0.7,
      stream: true,
    });

    const encoder = new TextEncoder();

    const readable = new ReadableStream({
      async start(controller) {
        let fullContent = "";
        try {
          for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content || "";
            if (content) {
              fullContent += content;
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ chunk: content })}\n\n`)
              );
            }
          }

          // Parse the complete JSON
          try {
            const data = JSON.parse(fullContent);

            if (!data.files || !Array.isArray(data.files) || data.files.length === 0) {
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ error: "AI did not return valid file structure" })}\n\n`)
              );
            } else {
              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({
                    done: true,
                    name: data.name || botName || "My Bot",
                    description: data.description || botDescription || "",
                    system_prompt: data.system_prompt || "",
                    suggested_slug: data.suggested_slug || "",
                    change_summary: data.change_summary || "Changes applied",
                    files: data.files,
                  })}\n\n`
                )
              );
            }
          } catch {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ error: "Failed to parse AI response" })}\n\n`)
            );
          }

          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        } catch (err) {
          const msg = err instanceof Error ? err.message : "Stream error";
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ error: msg })}\n\n`)
          );
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    console.error("Refine code error:", errMsg);
    return new Response(JSON.stringify({ error: `Failed to refine bot code: ${errMsg}` }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

