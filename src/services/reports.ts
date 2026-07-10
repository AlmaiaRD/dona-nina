import { supabase } from '@/lib/supabase'

export interface SalesReport {
  total_sales: number
  total_invoices: number
  average_ticket: number
  by_payment_method: { method: string; total: number }[]
  by_day: { date: string; total: number; count: number }[]
}

export async function getSalesReport(from: string, to: string): Promise<SalesReport> {
  const { data: invoices } = await supabase
    .from('invoices')
    .select('total, created_at')
    .gte('created_at', from)
    .lte('created_at', to + 'T23:59:59')
    .neq('status', 'CANCELLED')

  const total_sales = (invoices || []).reduce((s, i: any) => s + Number(i.total), 0)
  const total_invoices = invoices?.length || 0
  const average_ticket = total_invoices > 0 ? total_sales / total_invoices : 0

  const { data: receipts } = await supabase
    .from('receipts')
    .select('payment_method, amount')
    .gte('created_at', from)
    .lte('created_at', to + 'T23:59:59')

  const by_payment_method = (receipts || []).reduce((acc: any[], r: any) => {
    const existing = acc.find(a => a.method === r.payment_method)
    if (existing) existing.total += Number(r.amount)
    else acc.push({ method: r.payment_method, total: Number(r.amount) })
    return acc
  }, [])

  const by_day = (invoices || []).reduce((acc: any[], i: any) => {
    const date = new Date(i.created_at).toLocaleDateString('es-DO')
    const existing = acc.find(a => a.date === date)
    if (existing) {
      existing.total += Number(i.total)
      existing.count++
    } else acc.push({ date, total: Number(i.total), count: 1 })
    return acc
  }, [] as { date: string; total: number; count: number }[])

  return { total_sales, total_invoices, average_ticket, by_payment_method, by_day }
}
