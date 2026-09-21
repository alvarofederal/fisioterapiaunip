import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

/**
 * Rotas abertas. Todo o resto exige cookie de sessão.
 *
 * O middleware roda no edge e NÃO consulta o Prisma: ele só verifica a
 * presença do cookie. A checagem real de papel e de conta ativa acontece
 * no servidor, dentro de cada página do painel.
 */
const ROTAS_PUBLICAS = ["/login", "/register"]

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  const ehPublica =
    pathname === "/" || ROTAS_PUBLICAS.some((rota) => pathname.startsWith(rota))

  if (ehPublica) return NextResponse.next()

  const cookieSessao =
    request.cookies.get("authjs.session-token")?.value ||
    request.cookies.get("__Secure-authjs.session-token")?.value

  if (!cookieSessao) {
    const destino = new URL("/login", request.url)
    destino.searchParams.set("redirect", pathname)
    return NextResponse.redirect(destino)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
