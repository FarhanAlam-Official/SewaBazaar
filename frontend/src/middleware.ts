import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const token = request.cookies.get("access_token")?.value
  const isAuthPage = pathname.startsWith("/login") || pathname.startsWith("/register")
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

  // If trying to access wrong role's dashboard
  if (isDashboardPage) {
    const requestedRole = pathname.split("/")[2] // e.g., /dashboard/admin -> admin
    if (requestedRole && requestedRole !== userRole) {
      const correctPath = `/dashboard/${userRole}`
      return NextResponse.redirect(new URL(correctPath, request.url))
    }
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