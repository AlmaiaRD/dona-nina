import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getAuthUser } from '@/lib/auth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: Request) {
  const auth = getAuthUser(request)
  if (!auth) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status') || ''
  const clientId = searchParams.get('client_id') || ''

  let q = supabase
    .from('followups')
    .select('*, client:clients(full_name, phone, email)')

  if (status) {
    q = q.eq('status', status)
  }
  if (clientId) {
    q = q.eq('client_id', clientId)
  }

  const { data, error } = await q
    .order('next_followup_date', { ascending: true })
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data })
}
