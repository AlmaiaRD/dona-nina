import { supabase } from '@/lib/supabase'

export interface DashboardData {
  todaySales: number
  monthlySales: number
  monthlyPurchases: number
  totalClients: number
  pendingDeliveries: number
  lowStock: number
  accountsReceivable: number
  grossProfit: number
  pendingInvoices: any[]
  dailySales: { date: string; total: number }[]
  monthlySalesByMonth: { month: string; total: number }[]
  topItems: { name: string; total: number }[]
}

export async function getDashboardData(): Promise<DashboardData> {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)
  const fifteenDaysAgo = new Date(today)
  fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 14)
  const sixMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 5, 1)

  const [
    { data: todayInvoices },
    { data: monthInvoices },
    { data: monthPurchases },
    { count: totalClients },
    { count: pendingDeliveries },
    { data: inventory },
    { data: receivable },
    { data: pendingInvoices },
    { data: dailyData },
    { data: monthlyData },
    { data: items },
  ] = await Promise.all([
    supabase.from('invoices').select('total').gte('created_at', today.toISOString()).neq('status', 'CANCELLED'),
    supabase.from('invoices').select('total').gte('created_at', monthStart.toISOString()).neq('status', 'CANCELLED'),
    supabase.from('purchases').select('total').gte('created_at', monthStart.toISOString()).neq('status', 'CANCELLED'),
    supabase.from('clients').select('*', { count: 'exact', head: true }),
    supabase.from('deliveries').select('*', { count: 'exact', head: true }).in('status', ['PENDING', 'IN_PROGRESS']),
    supabase.from('inventory').select('*'),
    supabase.from('invoices').select('balance_due').in('status', ['PENDING', 'PARTIAL']),
    supabase.from('invoices').select('*, client:clients(full_name)').in('status', ['PENDING', 'PARTIAL']).order('created_at', { ascending: false }).limit(5),
    supabase.from('invoices').select('total, created_at').gte('created_at', fifteenDaysAgo.toISOString()).neq('status', 'CANCELLED'),
    supabase.from('invoices').select('total, created_at').gte('created_at', sixMonthsAgo.toISOString()).neq('status', 'CANCELLED'),
    supabase.from('invoice_items').select('menu_item:menu_items(name), quantity').not('menu_item_id', 'is', null).limit(100),
  ])

  const lowStock = (inventory || []).filter(
    (i: any) => Number(i.stock) <= Number(i.minimum_stock)
  ).length

  const accountsReceivable = (receivable || []).reduce(
    (sum, inv: any) => sum + Number(inv.balance_due), 0
  )

  const dailySales = (dailyData || []).reduce((acc: any[], inv: any) => {
    const date = new Date(inv.created_at).toLocaleDateString('es-DO')
    const existing = acc.find(d => d.date === date)
    if (existing) existing.total += Number(inv.total)
    else acc.push({ date, total: Number(inv.total) })
    return acc
  }, [] as { date: string; total: number }[])

  const monthlySalesByMonth = (monthlyData || []).reduce((acc: any[], inv: any) => {
    const month = new Date(inv.created_at).toLocaleDateString('es-DO', { month: 'short', year: '2-digit' })
    const existing = acc.find(d => d.month === month)
    if (existing) existing.total += Number(inv.total)
    else acc.push({ month, total: Number(inv.total) })
    return acc
  }, [] as { month: string; total: number }[])

  const topItems = (items || []).reduce((acc: any[], item: any) => {
    const name = item.menu_item?.name || 'Producto'
    const existing = acc.find(d => d.name === name)
    if (existing) existing.total += item.quantity
    else acc.push({ name, total: item.quantity })
    return acc
  }, [] as { name: string; total: number }[])
    .sort((a, b) => b.total - a.total)
    .slice(0, 10)

  const todaySales = (todayInvoices || []).reduce((s, i: any) => s + Number(i.total), 0)
  const monthSales = (monthInvoices || []).reduce((s, i: any) => s + Number(i.total), 0)
  const monthPurchasesTotal = (monthPurchases || []).reduce((s, i: any) => s + Number(i.total), 0)
  const grossProfit = monthSales - monthPurchasesTotal

  return {
    todaySales,
    monthlySales: monthSales,
    monthlyPurchases: monthPurchasesTotal,
    totalClients: totalClients || 0,
    pendingDeliveries: pendingDeliveries || 0,
    lowStock,
    accountsReceivable,
    grossProfit,
    pendingInvoices: pendingInvoices || [],
    dailySales,
    monthlySalesByMonth,
    topItems,
  }
}
