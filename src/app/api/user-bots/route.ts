import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

/**
 * GET /api/user-bots?browser_id=xxx
 * Fetch all bots for a specific browser
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const browserId = searchParams.get("browser_id");

    if (!browserId) {
      return NextResponse.json(
        { error: "browser_id is required" },
        { status: 400 }
      );
    }

    const { data: bots, error } = await supabase
      .from("user_bots")
      .select("*")
      .eq("browser_id", browserId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json({ bots: bots ?? [] });
  } catch (err) {
    console.error("Fetch user bots error:", err);
    return NextResponse.json(
      { error: "Failed to fetch bots" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/user-bots
 * Save a new bot for a browser
 */
export async function POST(req: NextRequest) {
  try {
    const { browser_id, name, description, type, url, repo_name, slug } =
      await req.json();

    if (!browser_id || !name || !type || !url) {
      return NextResponse.json(
        { error: "browser_id, name, type, and url are required" },
        { status: 400 }
      );
    }

    // Check if bot with this URL already exists for this browser
    const { data: existing } = await supabase
      .from("user_bots")
      .select("id")
      .eq("browser_id", browser_id)
      .eq("url", url)
      .single();

    if (existing) {
      return NextResponse.json({ id: existing.id, exists: true });
    }

    const { data: bot, error } = await supabase
      .from("user_bots")
      .insert({
        browser_id,
        name,
        description: description || "",
        type,
        url,
        repo_name: repo_name || null,
        slug: slug || null,
      })
      .select("id")
      .single();

    if (error) throw error;

    return NextResponse.json({ id: bot.id, created: true });
  } catch (err) {
    console.error("Save user bot error:", err);
    return NextResponse.json(
      { error: "Failed to save bot" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/user-bots
 * Delete a bot by id + browser_id
 */
export async function DELETE(req: NextRequest) {
  try {
    const { id, browser_id } = await req.json();

    if (!id || !browser_id) {
      return NextResponse.json(
        { error: "id and browser_id are required" },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("user_bots")
      .delete()
      .eq("id", id)
      .eq("browser_id", browser_id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Delete user bot error:", err);
    return NextResponse.json(
      { error: "Failed to delete bot" },
      { status: 500 }
    );
  }
}

