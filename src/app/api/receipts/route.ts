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
  const invoiceId = searchParams.get('invoice_id') || ''

  let query = supabase
    .from('receipts')
    .select('*, client:clients(full_name, phone, email), invoice:invoices(id, invoice_number, total, amount_paid, balance_due, status, client_id, client:clients(full_name)), bank_account:bank_accounts(bank_name, account_number)', { count: 'exact' })

  if (search) {
    query = query.or(
      `receipt_number.ilike.%${search}%`
    )
  }
  if (invoiceId) query = query.eq('invoice_id', invoiceId)

  const { data, error, count } = await query
    .order('created_at', { ascending: false })
    .range(from, to)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data, count, page, pageSize })
}
