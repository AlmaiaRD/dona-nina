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
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
  const pageSize = Math.min(500, Math.max(1, parseInt(searchParams.get('pageSize') || '50')))
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  const search = searchParams.get('search') || ''
  const status = searchParams.get('status') || ''
  const clientId = searchParams.get('client_id') || ''
  const month = searchParams.get('month') || ''
  const year = searchParams.get('year') || ''

  async function fetchInvoices(extraFilters?: (q: any) => any) {
    let q = supabase
      .from('invoices')
      .select('*, client:clients(full_name, phone, email)', { count: 'exact' })
    if (status) q = q.eq('status', status)
    if (clientId) q = q.eq('client_id', clientId)
    if (month && year) {
      const m = Number(month)
      const startDate = `${year}-${String(m).padStart(2, '0')}-01`
      const endDate = m === 12 ? `${Number(year) + 1}-01-01` : `${year}-${String(m + 1).padStart(2, '0')}-01`
      q = q.gte('invoice_date', startDate).lt('invoice_date', endDate)
    } else if (year) {
      q = q.gte('invoice_date', `${year}-01-01`).lt('invoice_date', `${Number(year) + 1}-01-01`)
    }
    if (extraFilters) q = extraFilters(q)
    return q.order('created_at', { ascending: false }).range(from, to)
  }

  let result: { data: any; error: any; count: any }

  if (search) {
    const r1 = await fetchInvoices((q) => q.ilike('invoice_number', `%${search}%`))
    const r2 = await supabase
      .from('invoices')
      .select('*, client:clients!inner(full_name, phone, email)', { count: 'exact' })
      .ilike('clients.full_name', `%${search}%`)
      .order('created_at', { ascending: false })
      .range(from, to)

    const ids = new Set<string>()
    const merged = [...(r1.data || []), ...(r2.data || [])].filter((d: any) => {
      if (ids.has(d.id)) return false
      ids.add(d.id)
      return true
    })

    result = { data: merged, error: r1.error || r2.error, count: merged.length }
  } else {
    result = await fetchInvoices()
  }

  if (result.error) {
    return NextResponse.json({ error: result.error.message }, { status: 500 })
  }

  return NextResponse.json({ data: result.data, count: result.count, page, pageSize })
}
