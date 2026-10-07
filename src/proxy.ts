import { NextResponse, type NextRequest } from "next/server";

const SESSION_COOKIES = ["tdp.session_token", "__Secure-tdp.session_token"];

/**
 * Optimistic gate for signed-in areas: if no session cookie exists at all, redirect to sign-in
 * before rendering anything. This is a UX shortcut only — every page, action and route handler
 * still verifies the session and permissions on the server.
 */
export function proxy(request: NextRequest) {
  const hasSession = SESSION_COOKIES.some((name) => request.cookies.has(name));
  if (hasSession) return NextResponse.next();
  const url = request.nextUrl.clone();
  url.pathname = "/sign-in";
  url.search = `?next=${encodeURIComponent(`${request.nextUrl.pathname}${request.nextUrl.search}`)}`;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/account/:path*", "/admin/:path*"],
};
