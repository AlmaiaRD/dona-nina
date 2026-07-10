import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireAdmin } from '@/lib/auth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const TABLES = [
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
    const backup: Record<string, any[]> = {}
    
    for (const { name: table } of TABLES) {
      const { data } = await supabase.from(table).select('*')
      backup[table] = data || []
    }

    // Store backup in a backup record or return the data
    return NextResponse.json({
      exported_at: new Date().toISOString(),
      tables: Object.keys(backup).length,
      size: JSON.stringify(backup).length,
    })
  } catch {
    return NextResponse.json({ error: 'Error al exportar datos' }, { status: 500 })
  }
}
