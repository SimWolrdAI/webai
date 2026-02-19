import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// Serves the raw HTML — can be used for iframe or direct access
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const { data: site, error } = await supabase
    .from("published_sites")
    .select("html")
    .eq("slug", slug)
    .single();

  if (error || !site) {
    return new NextResponse("Not Found", { status: 404 });
  }

  return new NextResponse(site.html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, max-age=60, s-maxage=300",
    },
  });
}
