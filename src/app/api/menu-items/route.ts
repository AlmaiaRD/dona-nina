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
  const search = searchParams.get('search') || ''
  const categoryId = searchParams.get('category_id') || ''
  const active = searchParams.get('active')

  let q = supabase
    .from('menu_items')
    .select('*, category:menu_categories(name, sort_order)')

  if (search) {
    q = q.or(`name.ilike.%${search}%,code.ilike.%${search}%`)
  }
  if (categoryId) {
    q = q.eq('category_id', categoryId)
  }
  if (active === 'true') {
    q = q.eq('active', true)
  } else if (active === 'false') {
    q = q.eq('active', false)
  }

  const { data, error } = await q.order('name')

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data })
}
