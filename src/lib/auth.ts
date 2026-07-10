import jwt from 'jsonwebtoken'

export function getAuthUser(request: Request): { id: string; role: string } | null {
  try {
    let token: string | null = null
    const authHeader = request.headers.get('authorization')
    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.slice(7)
    } else {
      const cookieHeader = request.headers.get('cookie')
      if (cookieHeader) {
        const match = cookieHeader.match(/(?:^|;\s*)dn-token=([^;]*)/)
        token = match ? decodeURIComponent(match[1]) : null
      }
    }
    if (!token) return null
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any
    return { id: decoded.sub, role: decoded.role }
  } catch {
    return null
  }
}

export function getUserFromToken(token: string): { id: string; role: string } | null {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any
    return { id: decoded.sub, role: decoded.role }
  } catch {
    return null
  }
}

export function requireAdmin(request: Request): { id: string; role: string } | null {
  const auth = getAuthUser(request)
  if (!auth || auth.role !== 'admin') return null
  return auth
}

export function validateOrigin(request: Request): boolean {
  const origin = request.headers.get('origin')
  const referer = request.headers.get('referer')
  const allowedOrigins = [
    process.env.NEXT_PUBLIC_SITE_URL,
    process.env.NEXT_PUBLIC_VERCEL_URL,
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:3002',
  ].filter(Boolean).map(u => u?.replace(/\/+$/, ''))
  if (origin && allowedOrigins.some(a => origin.startsWith(a || ''))) return true
  if (referer && allowedOrigins.some(a => referer.startsWith(a || ''))) return true
  return false
}
