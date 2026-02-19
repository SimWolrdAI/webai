import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const { data: bot, error } = await supabase
    .from("bots")
    .select("name, description, slug, template, avatar, message_count")
    .eq("slug", slug)
    .single();

  if (error || !bot) {
    return NextResponse.json({ error: "Bot not found" }, { status: 404 });
  }

  return NextResponse.json(bot);
}

