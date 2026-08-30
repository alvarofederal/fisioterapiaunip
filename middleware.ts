import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

const CANONICAL_HOST = "courtesyfy.com.br"

export function middleware(request: NextRequest) {
  // ✅ Redireciona o domínio Vercel para o domínio canônico em produção
  // Evita que o usuário fique preso em courtesyfy.vercel.app
  const host = request.headers.get("host") ?? ""
  if (host.includes("vercel.app") && process.env.NODE_ENV === "production") {
    const url = request.nextUrl.clone()
    url.protocol = "https:"
    url.host = CANONICAL_HOST
    return NextResponse.redirect(url, { status: 301 })
  }

  const { pathname } = request.nextUrl

  const publicRoutes = [
    "/login",
    "/register",
    "/verify-email",
    "/forgot-password",
    "/reset-password",
    "/auth",
    "/c/",          // landing page pública das chaves
  ]

  const isPublicRoute =
    pathname === "/" ||
    publicRoutes.some(route => pathname.startsWith(route))

  if (isPublicRoute) {
    return NextResponse.next()
  }

  // Verifica apenas cookie — sem Prisma no middleware
  const sessionToken =
    request.cookies.get("authjs.session-token")?.value ||
    request.cookies.get("__Secure-authjs.session-token")?.value

  if (!sessionToken) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}