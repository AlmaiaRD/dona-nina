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

  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)

  const monthStart = new Date()
  monthStart.setDate(1)
  monthStart.setHours(0, 0, 0, 0)

  try {
    const [
      { count: todaySales },
      { count: monthSales },
      { count: pendingInvoices },
      { count: totalClients },
      { count: todayReceipts },
      { count: monthReceipts },
    ] = await Promise.all([
      supabase.from('invoices').select('*', { count: 'exact', head: true }).gte('created_at', todayStart.toISOString()),
      supabase.from('invoices').select('*', { count: 'exact', head: true }).gte('created_at', monthStart.toISOString()),
      supabase.from('invoices').select('*', { count: 'exact', head: true }).not('status', 'in', '(PAID,CANCELLED)'),
      supabase.from('clients').select('*', { count: 'exact', head: true }),
      supabase.from('receipts').select('*', { count: 'exact', head: true }).gte('created_at', todayStart.toISOString()),
      supabase.from('receipts').select('*', { count: 'exact', head: true }).gte('created_at', monthStart.toISOString()),
    ])

    const { data: inventory } = await supabase
      .from('inventory')
      .select('*, item:menu_items(name)')
      .limit(100)

    const lowStock = (inventory || []).filter((i: any) => Number(i.stock) <= Number(i.minimum_stock || 0)).slice(0, 10)

    const { data: todayRevenue } = await supabase
      .from('receipts')
      .select('amount')
      .gte('created_at', todayStart.toISOString())

    const { data: monthRevenue } = await supabase
      .from('receipts')
      .select('amount')
      .gte('created_at', monthStart.toISOString())

    return NextResponse.json({
      data: {
        todaySales: todaySales || 0,
        monthSales: monthSales || 0,
        pendingInvoices: pendingInvoices || 0,
        totalClients: totalClients || 0,
        lowStock: lowStock || [],
        todayReceipts: todayReceipts || 0,
        monthReceipts: monthReceipts || 0,
        todayRevenue: (todayRevenue || []).reduce((s, r) => s + Number(r.amount), 0),
        monthRevenue: (monthRevenue || []).reduce((s, r) => s + Number(r.amount), 0),
      },
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
