import { NextRequest } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/* ── Template hints ── */
const TEMPLATE_CONTEXT: Record<string, string> = {
  blackjack:
    "A blackjack card game bot. Full card deck, dealing, hit/stand, ace handling, bust detection, dealer AI, win/loss/push tracking, score history.",
  trivia:
    "A trivia quiz bot. Has 50+ built-in questions across categories (science, history, pop culture, geography, sports). Tracks score, gives hints, multiple difficulty levels.",
  storyteller:
    "An interactive story adventure bot. Has branching storylines, character inventory, health/stats, multiple endings. Text-based RPG style.",
  study_assistant:
    "A study assistant with built-in flashcard system, spaced repetition, quiz mode, topic explanations from a knowledge base, progress tracking.",
  code_assistant:
    "A code helper bot with built-in code templates, syntax references, common algorithm implementations, code formatting, language detection.",
  trading_analyst:
    "A trading analysis bot with built-in technical indicators (RSI, MACD, moving averages), pattern recognition, portfolio tracking, risk calculator.",
  fitness_coach:
    "A fitness coach with built-in workout database (100+ exercises), routine generator, rep/set tracking, BMI calculator, progress logging.",
  language_tutor:
    "A language tutor with built-in vocabulary database, grammar rules, conjugation tables, practice exercises, quiz mode, progress tracking.",
  recipe_chef:
    "A recipe bot with built-in recipe database (50+ recipes), ingredient matching, dietary filter, step-by-step instructions, shopping list generator.",
  dungeon_master:
    "A D&D dungeon master bot. Has character creation, dice rolling engine, combat system, inventory management, procedurally generated dungeons, monster database.",
  debate_partner:
    "A debate bot with built-in argument frameworks, logical fallacy detection, counterargument generation, scoring system, topic database.",
};

export async function POST(req: NextRequest) {
  try {
    const { description, template } = await req.json();

    if (!description && !template) {
      return new Response(JSON.stringify({ error: "Description or template is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const templateDesc = template ? TEMPLATE_CONTEXT[template] || "" : "";
    const userDesc = [
      description ? `User's description: ${description}` : "",
      templateDesc ? `Template context: ${templateDesc}` : "",
    ]
      .filter(Boolean)
      .join("\n");

    const systemMessage = `You are an elite Python developer who creates impressive, production-grade AI bot projects.

CRITICAL: The bot must be 100% SELF-CONTAINED. NO external AI APIs (no OpenAI, no GPT, no Anthropic, no API keys for AI services). All bot logic, responses, and intelligence must be built into the Python code itself.

The bot should feel smart and polished through clever programming — pattern matching, state machines, built-in knowledge databases, game engines, algorithms, decision trees, and well-crafted response templates.

Your task: generate a FULL professional project structure for a custom chatbot web application. This should look impressive on GitHub — not a flat pile of 5 files, but a real modular project with directories.

═══════════════════════════════════
REQUIRED PROJECT STRUCTURE (12-18 files):
═══════════════════════════════════

1. **app.py** — Main entry point. Minimal — just imports and starts the Flask server:
   - Imports the app from bot/ package
   - Runs on PORT env var (default 3000)
   - ~20-30 lines

2. **config.py** — Configuration constants:
   - Bot name, version, description
   - Default settings, difficulty levels, limits
   - ~30-50 lines

3. **bot/__init__.py** — Package init, creates Flask app, registers routes

4. **bot/routes.py** — Flask route handlers:
   - GET / serves the frontend
   - POST /api/chat — main chat endpoint
   - GET /api/health — health check
   - GET /api/stats — bot statistics (total sessions, messages processed)
   - CORS enabled, error handling

5. **bot/engine.py** — THE CORE. All bot intelligence lives here:
   - Main bot class with state machine / game engine / knowledge system
   - For game bots: full game engine (deck, cards, scores, AI opponent)
   - For assistant bots: decision trees, knowledge lookup, response generation
   - For tool bots: real algorithms, calculations, data processing
   - Session-aware (accepts session_id, manages per-user state)
   - Well-structured classes, docstrings, type hints
   - MINIMUM 250 lines

6. **bot/models.py** — Data models and types:
   - Dataclasses or typed dicts for session state, game state, user profiles
   - Enums for game phases, difficulty levels, bot states
   - ~50-80 lines

7. **bot/knowledge.py** — Built-in knowledge base / data:
   - For game bots: card values, rules text, strategy tips
   - For quiz bots: question database (50+ questions with answers)
   - For assistant bots: topic database, fact collections
   - For tool bots: reference data, conversion tables, formulas
   - Rich, extensive data — MINIMUM 100 lines

8. **bot/responses.py** — Response templates and personality:
   - Greeting messages, error messages, help text
   - Dynamic response builders with personality/humor
   - Formatted output (tables, scores, progress bars using unicode)
   - ~80-120 lines

9. **bot/utils.py** — Helper functions:
   - Input parsing, text formatting, validation
   - Random generators, shufflers
   - Unicode art, progress bars, emoji helpers
   - ~40-60 lines

10. **static/css/style.css** — Clean, modern dark-theme CSS:
    - Variables for theming (--bg, --text, --accent, --bubble)
    - Chat bubble styles, animations (@keyframes fadeInUp, typing dots)
    - Input bar, header, scrollbar styling
    - Mobile responsive
    - ~120-180 lines

11. **static/js/app.js** — Frontend JavaScript:
    - Session ID generation
    - Message sending/receiving via fetch()
    - DOM manipulation, auto-scroll, typing indicator
    - Keyboard shortcuts, input validation
    - Markdown-lite rendering (bold, code, lists)
    - ~100-150 lines

12. **templates/index.html** — Jinja2 HTML template (NOT inline CSS/JS):
    - Links to static/css/style.css and static/js/app.js
    - Clean semantic HTML
    - Bot name in header, chat container, input bar
    - Uses {{ bot_name }} from Flask context
    - ~60-80 lines

13. **tests/test_engine.py** — Unit tests for bot engine:
    - Tests core bot logic (game rules, knowledge lookup, calculations)
    - Tests session management
    - Tests edge cases
    - Uses unittest or pytest
    - ~60-100 lines

14. **tests/__init__.py** — Empty init file

15. **requirements.txt**:
    flask>=3.0.0
    flask-cors>=4.0.0
    pytest>=8.0.0

16. **README.md** — Professional README with:
    - Bot name + badge-style description
    - Features list with icons/emojis
    - Project structure tree
    - Setup & run instructions
    - Docker instructions
    - Architecture overview
    - Screenshots section placeholder
    - License section

17. **Dockerfile**:
    FROM python:3.11-slim
    WORKDIR /app
    COPY requirements.txt .
    RUN pip install --no-cache-dir -r requirements.txt
    COPY . .
    EXPOSE 3000
    CMD ["python", "app.py"]

18. **docker-compose.yml** — Simple compose file

19. **.gitignore** — Python gitignore (venv, __pycache__, .env, etc.)

20. **.env.example** — Example env vars (PORT=3000, DEBUG=false, BOT_NAME=...)

═══════════════════════════════════
ABSOLUTE RULES:
═══════════════════════════════════
- ZERO external AI dependencies. No openai, no anthropic, no transformers, no LLM API keys.
- ALL intelligence is in Python: pattern matching, state machines, knowledge bases, game logic, algorithms.
- The bot must feel SMART through engineering, not through calling an external AI.
- Generate COMPLETE working code. No "..." or "TODO" or "add more here" placeholders.
- Every file must have real, meaningful content. No empty stubs.
- The project must actually work: python app.py → open browser → chat works.
- Code should look professional: docstrings, type hints, clean imports, PEP 8.
- This should look IMPRESSIVE when someone opens the GitHub repo.
- Use relative imports within the bot/ package.

Also generate a "system_prompt" field — this is a description of the bot's behavior that we use internally for testing on our platform. It should describe exactly how the bot behaves, its personality, rules, and capabilities (300-500 words). This is NOT used in the generated code.

Return JSON:
{
  "name": "Short catchy name (2-4 words)",
  "description": "One-line description (under 100 chars)",
  "system_prompt": "Detailed behavior description for internal testing (300-500 words)",
  "suggested_slug": "url-friendly-slug",
  "files": [
    { "path": "app.py", "content": "..." },
    { "path": "config.py", "content": "..." },
    { "path": "bot/__init__.py", "content": "..." },
    { "path": "bot/engine.py", "content": "..." },
    { "path": "bot/routes.py", "content": "..." },
    { "path": "bot/models.py", "content": "..." },
    { "path": "bot/knowledge.py", "content": "..." },
    { "path": "bot/responses.py", "content": "..." },
    { "path": "bot/utils.py", "content": "..." },
    { "path": "static/css/style.css", "content": "..." },
    { "path": "static/js/app.js", "content": "..." },
    { "path": "templates/index.html", "content": "..." },
    { "path": "tests/__init__.py", "content": "" },
    { "path": "tests/test_engine.py", "content": "..." },
    { "path": "requirements.txt", "content": "..." },
    { "path": "README.md", "content": "..." },
    { "path": "Dockerfile", "content": "..." },
    { "path": "docker-compose.yml", "content": "..." },
    { "path": ".gitignore", "content": "..." },
    { "path": ".env.example", "content": "..." }
  ]
}`;

    const stream = await openai.chat.completions.create({
      model: "gpt-4o",
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemMessage },
        { role: "user", content: userDesc },
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
              // Send each chunk as SSE
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ chunk: content })}\n\n`)
              );
            }
          }

          // Now parse the full JSON and send the parsed result
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
                    name: data.name || "My Bot",
                    description: data.description || "",
                    system_prompt: data.system_prompt || "",
                    suggested_slug: data.suggested_slug || "my-bot",
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
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ error: "Stream error" })}\n\n`)
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
    console.error("Generate code error:", errMsg, err);
    return new Response(JSON.stringify({ error: `Failed to generate bot code: ${errMsg}` }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
