import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// Create / Publish a bot
export async function POST(req: NextRequest) {
  try {
    const { slug, name, description, systemPrompt, template, avatar, walletAddress } =
      await req.json();

    if (!slug || !name || !systemPrompt) {
      return NextResponse.json(
        { error: "slug, name, and systemPrompt are required" },
        { status: 400 }
      );
    }

    const cleanSlug = slug
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");

    if (!cleanSlug || cleanSlug.length < 2) {
      return NextResponse.json({ error: "Slug must be at least 2 characters" }, { status: 400 });
    }

    // Check if slug exists
    const { data: existing } = await supabase
      .from("bots")
      .select("id, wallet_address")
      .eq("slug", cleanSlug)
      .single();

    if (existing) {
      // Update
      const { error } = await supabase
        .from("bots")
        .update({
          name,
          description: description || "",
          system_prompt: systemPrompt,
          template: template || null,
          avatar: avatar || null,
          wallet_address: walletAddress || existing.wallet_address,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id);

      if (error) throw error;

      return NextResponse.json({ id: existing.id, slug: cleanSlug, updated: true });
    }

    // Create new
    const { data: bot, error } = await supabase
      .from("bots")
      .insert({
        slug: cleanSlug,
        name,
        description: description || "",
        system_prompt: systemPrompt,
        template: template || null,
        avatar: avatar || null,
        wallet_address: walletAddress || null,
      })
      .select("id, slug")
      .single();

    if (error) throw error;

    return NextResponse.json({ id: bot.id, slug: bot.slug });
  } catch (err) {
    console.error("Create bot error:", err);
    return NextResponse.json({ error: "Failed to create bot" }, { status: 500 });
  }
}

// List bots (gallery)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const wallet = searchParams.get("wallet");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 50);
    const offset = (page - 1) * limit;

    let query = supabase
      .from("bots")
      .select("id, slug, name, description, template, avatar, wallet_address, message_count, created_at", { count: "exact" })
      .order("created_at", { ascending: false });

    if (wallet) {
      query = query.eq("wallet_address", wallet);
    } else {
      query = query.eq("is_public", true);
    }

    const { data: bots, error, count } = await query.range(offset, offset + limit - 1);

    if (error) throw error;

    return NextResponse.json({ bots: bots ?? [], total: count ?? 0, page, limit });
  } catch (err) {
    console.error("List bots error:", err);
    return NextResponse.json({ error: "Failed to load bots" }, { status: 500 });
  }
}

// Delete a bot
export async function DELETE(req: NextRequest) {
  try {
    const { id, wallet } = await req.json();

    if (!id || !wallet) {
      return NextResponse.json({ error: "id and wallet required" }, { status: 400 });
    }

    const { data: bot } = await supabase
      .from("bots")
      .select("id, wallet_address")
      .eq("id", id)
      .single();

    if (!bot || bot.wallet_address !== wallet) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    const { error } = await supabase.from("bots").delete().eq("id", id);
    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Delete bot error:", err);
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}

