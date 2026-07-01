import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"

export default auth((req) => {
  const isLoggedIn = !!req.auth
  const isAppRoute = req.nextUrl.pathname.startsWith("/app")
  const isApiRoute = req.nextUrl.pathname.startsWith("/api/v1")
  const isLoginPage = req.nextUrl.pathname === "/login"

  if (!isLoggedIn && (isAppRoute || isApiRoute)) {
    const loginUrl = new URL("/login", req.url)
    if (isAppRoute) {
      loginUrl.searchParams.set("callbackUrl", req.nextUrl.pathname)
    }
    return NextResponse.redirect(loginUrl)
  }

  if (isLoggedIn && isLoginPage) {
    return NextResponse.redirect(new URL("/app", req.url))
  }

  return NextResponse.next()
})

export const config = {
  matcher: ["/app/:path*", "/api/v1/:path*", "/login"],
}
