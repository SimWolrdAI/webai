import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const response = NextResponse.next();
  const { pathname } = req.nextUrl;

  // ─── CSP for token landing pages (rendered via /site/[subdomain]) ───
  if (pathname.startsWith("/site/")) {
    response.headers.set(
      "Content-Security-Policy",
      [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline'", // Next.js needs inline scripts
        "style-src 'self' 'unsafe-inline'",  // Inline styles for themed rendering
        "img-src 'self' data: https:",       // Allow images from our storage + HTTPS
        "font-src 'self' https://fonts.gstatic.com",
        "connect-src 'self'",
        "frame-ancestors 'none'",            // Prevent clickjacking
        "base-uri 'self'",
        "form-action 'self'",
      ].join("; ")
    );
    // Prevent iframing of token sites
    response.headers.set("X-Frame-Options", "DENY");
    response.headers.set("X-Content-Type-Options", "nosniff");
    response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  }

  // ─── General security headers for all pages ───
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

  return response;
}

export const config = {
  matcher: [
    // Match all pages except static assets and API health
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};

