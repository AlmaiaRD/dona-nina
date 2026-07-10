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

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = requireAdmin(request)
  if (!auth) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const { id } = await params
    const body = await request.json()
    const updates: any = {}

    if (body.name) updates.name = body.name
    if (body.email) updates.email = body.email.toLowerCase().trim()
    if (body.role) updates.role = body.role
    if (body.permissions) updates.permissions = body.permissions
    if (body.password) updates.password_hash = bcrypt.hashSync(body.password, 10)

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No hay datos para actualizar' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', id)
      .select('id, name, email, role, permissions, created_at')
      .single()

    if (error) {
      return NextResponse.json({ error: 'Error al actualizar usuario' }, { status: 500 })
    }

    audit(auth.id, 'update', id, `Usuario ${data.email} actualizado`)

    return NextResponse.json(data)
  } catch (err: any) {
    console.error('Update user error:', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = requireAdmin(request)
  if (!auth) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const { id } = await params

    if (id === auth.id) {
      return NextResponse.json({ error: 'No puedes eliminar tu propio usuario' }, { status: 400 })
    }

    const { error } = await supabase.from('users').delete().eq('id', id)

    if (error) {
      return NextResponse.json({ error: 'Error al eliminar usuario' }, { status: 500 })
    }

    audit(auth.id, 'delete', id, `Usuario eliminado`)

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('Delete user error:', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
