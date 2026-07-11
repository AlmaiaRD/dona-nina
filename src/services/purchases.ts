import { supabase } from '@/lib/supabase'
import type { Purchase, PurchaseItem } from '@/types/database'
import { getLocalDateString } from '@/lib/utils'
import { getUserIdFromCookie } from '@/lib/getUserId'

export async function getPurchases(page = 1, pageSize = 500) {
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1
  const { data, error } = await supabase
    .from('purchases')
    .select('*, purchase_items(*, menu_item:menu_items(name))')
    .order('created_at', { ascending: false })
    .range(from, to)
  if (error) throw error
  return data
}

export async function getPurchase(id: string) {
  const { data, error } = await supabase
    .from('purchases')
    .select('*, purchase_items(*, menu_item:menu_items(name)), supplier:suppliers(*)')
    .eq('id', id)
    .single()
  if (error) throw error
  return data
}

export async function createPurchase(purchase: Partial<Purchase>, items: Partial<PurchaseItem>[], userId?: string) {
  const subtotal = items.reduce((s, i) => s + (i.quantity || 0) * Number(i.unit_cost || 0), 0)
  const discount = Number(purchase.discount_amount || 0)
  const itbis = items.reduce((s, i) => s + ((i.itbis !== false ? 1 : 0) * (i.quantity || 0) * Number(i.unit_cost || 0) * 0.18), 0)
  const total = subtotal + itbis - discount

  if (!userId) {
    const { data: sessData } = await supabase.auth.getSession()
    userId = (sessData as any)?.session?.user?.id
  }
  if (!userId) {
    const cookieId = getUserIdFromCookie()
    if (cookieId) userId = cookieId
  }

  const { data: settings } = await supabase.from('settings').select('purchase_prefix').limit(1).single()
  const prefix = (settings as any)?.purchase_prefix || 'COM-'

  const { data: last } = await supabase
    .from('purchases')
    .select('purchase_number')
    .order('created_at', { ascending: false })
    .limit(1)
  let nextNum = 1
  if (last?.[0]?.purchase_number) {
    const num = parseInt(last[0].purchase_number.replace(prefix, ''), 10)
    if (!isNaN(num)) nextNum = num + 1
  }

  const { data: purchaseData, error: pError } = await supabase
    .from('purchases')
    .insert({
      purchase_number: `${prefix}${String(nextNum).padStart(6, '0')}`,
      supplier_id: purchase.supplier_id || null,
      supplier_name: purchase.supplier_name || null,
      purchase_date: purchase.purchase_date || getLocalDateString(),
      subtotal,
      itbis,
      discount_amount: discount,
      total,
      notes: purchase.notes || null,
      payment_method: purchase.payment_method || 'CASH',
      bank_account_id: purchase.bank_account_id || null,
      status: 'COMPLETED',
      created_by: userId,
    })
    .select()
    .single()
  if (pError) throw pError

  const itemsToInsert = items.map(i => ({
    purchase_id: purchaseData.id,
    menu_item_id: i.menu_item_id || null,
    ingredient_name: i.ingredient_name || null,
    quantity: i.quantity || 0,
    unit_cost: i.unit_cost || 0,
    line_total: (i.quantity || 0) * Number(i.unit_cost || 0),
    itbis: i.itbis !== false,
  }))

  const { error: iError } = await supabase.from('purchase_items').insert(itemsToInsert)
  if (iError) throw iError

  // Update inventory
  for (const item of itemsToInsert) {
    if (item.menu_item_id) {
      await supabase.rpc('add_inventory_stock', {
        p_item_id: item.menu_item_id,
        p_quantity: item.quantity,
        p_unit_cost: item.unit_cost,
        p_line_total: item.line_total,
      })
    }
  }

  return purchaseData
}

export async function getSuppliers() {
  const { data, error } = await supabase.from('suppliers').select('*').order('name')
  if (error) throw error
  return data
}

export async function createSupplier(supplier: Partial<{ name: string; phone: string; email: string }>) {
  const { data, error } = await supabase.from('suppliers').insert(supplier).select().single()
  if (error) throw error
  return data
}
