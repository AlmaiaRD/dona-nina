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
  const month = searchParams.get('month') || ''
  const year = searchParams.get('year') || ''
  const category = searchParams.get('category') || ''

  let q = supabase
    .from('expenses')
    .select('*, category_info:expense_categories(name)')

  if (month && year) {
    const m = Number(month)
    const startDate = `${year}-${String(m).padStart(2, '0')}-01`
    const endDate = m === 12 ? `${Number(year) + 1}-01-01` : `${year}-${String(m + 1).padStart(2, '0')}-01`
    q = q.gte('expense_date', startDate).lt('expense_date', endDate)
  } else if (year) {
    q = q.gte('expense_date', `${year}-01-01`).lt('expense_date', `${Number(year) + 1}-01-01`)
  }

  if (category) {
    q = q.eq('category', category)
  }

  const { data, error } = await q.order('expense_date', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data })
}
