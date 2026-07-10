import { NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'

export async function GET(request: Request) {
  const user = getAuthUser(request)
  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  return NextResponse.json({
    user: {
      id: user.id,
      email: null,
      name: null,
      role: user.role,
      permissions: [],
    },
  })
}
