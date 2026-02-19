/**
 * Browser-based bot tracking.
 * Primary: Supabase (persistent across sessions)
 * Fallback: localStorage (if Supabase unavailable)
 */

export interface SavedBot {
  id: string;
  name: string;
  description: string;
  type: "github" | "webai";
  url: string;
  repoName?: string;
  slug?: string;
  createdAt: string;
}

const BROWSER_ID_KEY = "webai_browser_id";
const BOTS_KEY = "webai_my_bots";

/** Get or create a persistent browser ID */
export function getBrowserId(): string {
  if (typeof window === "undefined") return "";
  let id = localStorage.getItem(BROWSER_ID_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(BROWSER_ID_KEY, id);
  }
  return id;
}

/** Save bot to Supabase + localStorage fallback */
export async function saveBotToServer(bot: {
  name: string;
  description: string;
  type: "github" | "webai";
  url: string;
  repoName?: string;
  slug?: string;
}): Promise<void> {
  const browserId = getBrowserId();

  // Always save to localStorage as fallback
  saveBotLocal(bot);

  // Try Supabase
  try {
    await fetch("/api/user-bots", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        browser_id: browserId,
        name: bot.name,
        description: bot.description,
        type: bot.type,
        url: bot.url,
        repo_name: bot.repoName || null,
        slug: bot.slug || null,
      }),
    });
  } catch {
    // Supabase save failed, localStorage fallback already done
  }
}

/** Fetch bots from Supabase, fallback to localStorage */
export async function fetchBots(): Promise<SavedBot[]> {
  const browserId = getBrowserId();

  try {
    const res = await fetch(`/api/user-bots?browser_id=${browserId}`);
    if (!res.ok) throw new Error("API failed");
    const data = await res.json();

    if (data.bots && data.bots.length > 0) {
      return data.bots.map((b: any) => ({
        id: b.id,
        name: b.name,
        description: b.description || "",
        type: b.type,
        url: b.url,
        repoName: b.repo_name,
        slug: b.slug,
        createdAt: b.created_at,
      }));
    }
  } catch {
    // Supabase failed, fall through to localStorage
  }

  // Fallback: localStorage
  return getBotsLocal();
}

/** Delete bot from Supabase + localStorage */
export async function deleteBotFromServer(id: string): Promise<void> {
  const browserId = getBrowserId();

  // Remove from localStorage
  deleteBotLocal(id);

  // Try Supabase
  try {
    await fetch("/api/user-bots", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, browser_id: browserId }),
    });
  } catch {
    // Supabase delete failed, localStorage already cleared
  }
}

/* ══════════════════════════════════
   localStorage helpers (fallback)
   ══════════════════════════════════ */

function getBotsLocal(): SavedBot[] {
  try {
    const raw = localStorage.getItem(BOTS_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as SavedBot[];
  } catch {
    return [];
  }
}

function saveBotLocal(bot: {
  name: string;
  description: string;
  type: "github" | "webai";
  url: string;
  repoName?: string;
  slug?: string;
}): void {
  const bots = getBotsLocal();

  // Check duplicate
  if (bots.some((b) => b.url === bot.url)) return;

  const newBot: SavedBot = {
    ...bot,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  };
  bots.unshift(newBot);
  localStorage.setItem(BOTS_KEY, JSON.stringify(bots));
}

function deleteBotLocal(id: string): void {
  const bots = getBotsLocal().filter((b) => b.id !== id);
  localStorage.setItem(BOTS_KEY, JSON.stringify(bots));
}
