import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireAdmin } from '@/lib/auth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const TABLES: { name: string; select?: string }[] = [
  { name: 'users', select: 'id, email, name, role, permissions, avatar_url, active, created_at, updated_at' },
  { name: 'clients' },
  { name: 'menu_categories' },
  { name: 'menu_items' },
  { name: 'inventory' },
  { name: 'inventory_movements' },
  { name: 'invoices' },
  { name: 'invoice_items' },
  { name: 'receipts' },
  { name: 'receipt_items' },
  { name: 'credit_balances' },
  { name: 'deliveries' },
  { name: 'followups' },
  { name: 'expenses' },
  { name: 'learning_notes' },
  { name: 'settings' },
  { name: 'audit_logs' },
  { name: 'communications' },
  { name: 'suppliers' },
  { name: 'purchases' },
  { name: 'purchase_items' },
  { name: 'bank_accounts' },
  { name: 'expense_categories' },
]

export async function POST(request: Request) {
  const auth = requireAdmin(request)
  if (!auth) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const backup: Record<string, any> = {
      exported_at: new Date().toISOString(),
      version: '1.0',
      data: {},
    }

    for (const { name: table, select } of TABLES) {
      const query = supabase.from(table).select(select || '*')
      const { data, error } = await query
      if (error && error.code !== '42P01') {
        console.warn(`Error exporting ${table}:`, error.message)
        continue
      }
      backup.data[table] = data || []
    }

    return NextResponse.json(backup)
  } catch {
    return NextResponse.json({ error: 'Error al exportar datos' }, { status: 500 })
  }
}
