import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import jwt from 'jsonwebtoken'

if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required')
}

const protectedPaths = [
  '/dashboard', '/clientes', '/menu', '/facturacion', '/recibos', '/creditos',
  '/cuentas-por-cobrar', '/crm', '/comunicaciones', '/entregas', '/inventario',
  '/gastos', '/seguimiento', '/reportes', '/documentos', '/configuracion',
  '/aprendizaje',
]

const publicApiPaths = [
  '/api/auth/login',
  '/api/auth/login-form',
  '/api/auth/logout',
  '/api/auth/refresh',
]

const writeMethods = ['POST', 'PATCH', 'DELETE', 'PUT']

function isProtectedRoute(pathname: string): boolean {
  if (protectedPaths.some(p => pathname === p || pathname.startsWith(p + '/'))) return true
  if (pathname.startsWith('/api/') && !publicApiPaths.some(p => pathname === p || pathname.startsWith(p + '/'))) return true
  return false
}

function isAllowedOrigin(origin: string | null, referer: string | null): boolean {
  if (!origin && !referer) return true
  const allowed = [
    process.env.NEXT_PUBLIC_SITE_URL,
    process.env.NEXT_PUBLIC_VERCEL_URL,
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:3002',
  ].filter(Boolean).map(u => u?.replace(/\/+$/, ''))
  try {
    const checkUrl = (url: string) => {
      const parsed = new URL(url)
      return allowed.some(a => {
        try { return new URL(a!).origin === parsed.origin } catch { return false }
      })
    }
    if (origin && checkUrl(origin)) return true
    if (referer && checkUrl(referer)) return true
  } catch { return false }
  return false
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  if (pathname === '/') return NextResponse.next()

  if (!isProtectedRoute(pathname)) return NextResponse.next()

  // CSRF check for write methods on API routes
  if (writeMethods.includes(request.method) && pathname.startsWith('/api/') && !publicApiPaths.some(p => pathname === p || pathname.startsWith(p + '/'))) {
    if (!isAllowedOrigin(request.headers.get('origin'), request.headers.get('referer'))) {
      return new NextResponse(JSON.stringify({ error: 'Origen no permitido' }), {
        status: 403,
        headers: { 'content-type': 'application/json' },
      })
    }
  }

  const token = request.cookies.get('dn-token')?.value
  if (!token) {
    if (pathname.startsWith('/api/')) {
      return new NextResponse(JSON.stringify({ error: 'No autorizado' }), {
        status: 401,
        headers: { 'content-type': 'application/json' },
      })
    }
    return NextResponse.redirect(new URL('/login', request.url))
  }

  try {
    jwt.verify(token, process.env.JWT_SECRET!)
    return NextResponse.next()
  } catch {
    if (pathname.startsWith('/api/')) {
      return new NextResponse(JSON.stringify({ error: 'Token inválido' }), {
        status: 401,
        headers: { 'content-type': 'application/json' },
      })
    }
    return NextResponse.redirect(new URL('/login', request.url))
  }
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon\\.ico|icon|manifest\\.json|sw\\.js|register-sw\\.js|apple-touch-icon).*)',
  ],
}
