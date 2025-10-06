import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const token = request.cookies.get("access_token")?.value
  const isAuthPage = pathname.startsWith("/login") || pathname.startsWith("/register")
  // Protect dashboard routes lightly: auth check and root redirect only
  const isDashboardPage = pathname.startsWith("/dashboard")

  // Get user role from cookie if available
  const userRole = request.cookies.get("user_role")?.value || "customer"

  // If trying to access auth pages while logged in, redirect to role-specific dashboard
  if (isAuthPage && token) {
    const dashboardPath = `/dashboard/${userRole}`
    return NextResponse.redirect(new URL(dashboardPath, request.url))
  }

  // If trying to access protected pages without being logged in
  if (isDashboardPage && !token) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  // Do not enforce role-based redirects here; let client render unauthorized page

  // If trying to access /dashboard directly, redirect to role-specific dashboard
  if (pathname === "/dashboard" && token) {
    const correctPath = `/dashboard/${userRole}`
    return NextResponse.redirect(new URL(correctPath, request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/login/:path*",
    "/register/:path*",
    "/dashboard/:path*",
  ],
} 