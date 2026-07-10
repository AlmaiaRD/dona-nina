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
  const lowStock = searchParams.get('low_stock') === 'true'

  let q = supabase
    .from('inventory')
    .select('*, item:menu_items(name, code, category:menu_categories(name))')

  if (search) {
    q = q.or(`ingredient_name.ilike.%${search}%,item.name.ilike.%${search}%`)
  }

  const { data, error } = await q.order('ingredient_name')

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  let result = data || []
  if (lowStock) {
    result = result.filter((i: any) => Number(i.stock) <= Number(i.minimum_stock || 0))
  }

  return NextResponse.json({ data: result })
}
