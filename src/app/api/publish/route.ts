import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const { slug, html, walletAddress, siteName, template, description } =
      await req.json();

    if (!slug || !html) {
      return NextResponse.json(
        { error: "slug and html are required" },
        { status: 400 }
      );
    }

    // Sanitize slug
    const cleanSlug = slug
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");

    if (!cleanSlug || cleanSlug.length < 2) {
      return NextResponse.json(
        { error: "Slug must be at least 2 characters" },
        { status: 400 }
      );
    }

    if (cleanSlug.length > 64) {
      return NextResponse.json(
        { error: "Slug must be under 64 characters" },
        { status: 400 }
      );
    }

    // Check if slug already exists
    const { data: existing } = await supabase
      .from("published_sites")
      .select("id, wallet_address")
      .eq("slug", cleanSlug)
      .single();

    if (existing) {
      // Update existing site (only if same wallet or no wallet)
      const { error: updateError } = await supabase
        .from("published_sites")
        .update({
          html,
          site_name: siteName || cleanSlug,
          template: template || null,
          description: description || null,
          wallet_address: walletAddress || existing.wallet_address,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id);

      if (updateError) throw updateError;

      return NextResponse.json({
        id: existing.id,
        slug: cleanSlug,
        url: `/s/${cleanSlug}`,
        updated: true,
      });
    }

    // Create new site
    const { data: site, error: insertError } = await supabase
      .from("published_sites")
      .insert({
        slug: cleanSlug,
        html,
        site_name: siteName || cleanSlug,
        wallet_address: walletAddress || null,
        template: template || null,
        description: description || null,
      })
      .select("id, slug")
      .single();

    if (insertError) throw insertError;

    return NextResponse.json({
      id: site.id,
      slug: site.slug,
      url: `/s/${site.slug}`,
    });
  } catch (err) {
    console.error("Publish error:", err);
    return NextResponse.json(
      { error: "Failed to publish" },
      { status: 500 }
    );
  }
}
