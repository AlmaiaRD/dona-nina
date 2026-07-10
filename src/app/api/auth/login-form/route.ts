import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { createClient } from '@supabase/supabase-js'
import { rateLimit } from '@/lib/rate-limit'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: Request) {
  try {
    const { allowed } = rateLimit(request)
    if (!allowed) {
      return NextResponse.redirect(new URL('/login?error=Demasiados+intentos.+Intente+de+nuevo+en+1+minuto', request.url))
    }

    const formData = await request.formData()
    const email = (formData.get('email') as string) || ''
    const password = (formData.get('password') as string) || ''

    if (!email || !password) {
      return NextResponse.redirect(new URL('/login?error=Credenciales+requeridas', request.url))
    }

    const { data: users } = await supabase
      .from('users')
      .select('*')
      .eq('email', email.toLowerCase().trim())
      .limit(1)

    const user = users?.[0]

    if (!user || !user.password_hash) {
      return NextResponse.redirect(new URL('/login?error=Credenciales+inválidas', request.url))
    }

    const valid = bcrypt.compareSync(password, user.password_hash)
    if (!valid) {
      return NextResponse.redirect(new URL('/login?error=Credenciales+inválidas', request.url))
    }

    const permissions = user.permissions || []

    const token = jwt.sign(
      { sub: user.id, email: user.email, role: user.role, name: user.name, permissions },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    )

    const response = NextResponse.redirect(new URL('/dashboard', request.url))
    response.cookies.set('dn-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
    })
    return response
  } catch (err: any) {
    console.error('Login form error:', err)
    return NextResponse.redirect(new URL('/login?error=Error+del+servidor', request.url))
  }
}
