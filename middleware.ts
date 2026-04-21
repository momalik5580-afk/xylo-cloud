import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// Paths that require an EXACT match
const PUBLIC_EXACT_PATHS = [
  "/",
  "/login",
  "/activate",
]

// Paths that can be prefix-matched (e.g., /api/auth/login, /api/auth/logout)
const PUBLIC_PREFIX_PATHS = [
  "/api/auth/",
  "/api/license",
  "/api/health",
]

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow static assets
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.match(/\.(png|jpg|svg|ico)$/)
  ) {
    return NextResponse.next()
  }

  // Allow public exact paths
  if (PUBLIC_EXACT_PATHS.includes(pathname)) {
    return NextResponse.next()
  }

  // Allow public prefix paths
  if (PUBLIC_PREFIX_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next()
  }

  // Check auth token
  const token =
    request.cookies.get("xylo-token")?.value ||
    request.headers.get("Authorization")?.replace("Bearer ", "")

  if (!token) {
    // If it's an API request, return 401 JSON
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    // Otherwise redirect to login
    return NextResponse.redirect(new URL("/login", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}