import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

/**
 * Rotas abertas. Todo o resto exige cookie de sessão.
 *
 * O middleware roda no edge e NÃO consulta o Prisma: ele só verifica a
 * presença do cookie. A checagem real de papel e de conta ativa acontece
 * no servidor, dentro de cada página do painel.
 *
 * Toda página pública nova precisa entrar nesta lista. `/avisos` ficou de
 * fora quando foi criada, e quem clicava em "Avisos" na barra caía no login.
 */
const ROTAS_PUBLICAS = ["/login", "/register", "/noticias", "/avisos"]

/**
 * O arquivo mora em src/, ao lado de app/, que é onde o Next procura quando o
 * projeto usa a pasta src. Na raiz ele era lido pelo build de produção mas
 * ignorado pelo servidor de desenvolvimento — a checagem só existia na
 * Vercel, e um teste local nunca conseguia reproduzir o bloqueio.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  const ehPublica =
    pathname === "/" ||
    ROTAS_PUBLICAS.some((rota) => pathname === rota || pathname.startsWith(rota + "/"))

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
