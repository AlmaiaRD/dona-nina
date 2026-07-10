import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { createClient } from '@supabase/supabase-js'
import { requireAdmin } from '@/lib/auth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function audit(userId: string, action: string, entityId: string, description: string) {
  try { await supabase.from('audit_logs').insert({ user_id: userId, action, entity: 'user', entity_id: entityId, description }) } catch {}
}

export async function GET(request: Request) {
  const auth = requireAdmin(request)
  if (!auth) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const { data, error } = await supabase
    .from('users')
    .select('id, name, email, role, permissions, created_at')
    .order('created_at', { ascending: true })

  if (error) {
    return NextResponse.json({ error: 'Error al obtener usuarios' }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function POST(request: Request) {
  const auth = requireAdmin(request)
  if (!auth) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const { name, email, password, role, permissions } = await request.json()

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Nombre, email y contraseña requeridos' }, { status: 400 })
    }

    if (password.length < 8) {
      return NextResponse.json({ error: 'La contraseña debe tener al menos 8 caracteres' }, { status: 400 })
    }
    if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
      return NextResponse.json({ error: 'La contraseña debe contener al menos una letra y un número' }, { status: 400 })
    }

    const emailLower = email.toLowerCase().trim()

    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('email', emailLower)
      .limit(1)

    if (existing && existing.length > 0) {
      return NextResponse.json({ error: 'El email ya está registrado' }, { status: 409 })
    }

    const passwordHash = bcrypt.hashSync(password, 10)

    const { data, error } = await supabase
      .from('users')
      .insert({
        name,
        email: emailLower,
        role: role || 'seller',
        password_hash: passwordHash,
        permissions: permissions || [],
      })
      .select('id, name, email, role, permissions, created_at')
      .single()

    if (error) {
      console.error('Error creating user:', error)
      return NextResponse.json({ error: 'Error al crear usuario' }, { status: 500 })
    }

    audit(auth.id, 'create', data.id, `Usuario ${emailLower} creado con rol ${role || 'seller'}`)

    return NextResponse.json(data, { status: 201 })
  } catch (err: any) {
    console.error('Create user error:', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
