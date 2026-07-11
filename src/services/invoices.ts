import { supabase } from '@/lib/supabase'
import type { Invoice, InvoiceItem } from '@/types/database'
import { getSettings } from './settings'
import { getLocalDateString } from '@/lib/utils'
import { getUserIdFromCookie } from '@/lib/getUserId'
import { logAudit } from '@/lib/audit'

export async function getInvoices(page = 1, pageSize = 1000) {
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1
  const { data, error } = await supabase
    .from('invoices')
    .select('*, client:clients(full_name, phone, email)')
    .order('created_at', { ascending: false })
    .range(from, to)
  if (error) throw error
  return data
}

export async function getClientInvoices(clientId: string) {
  const { data, error } = await supabase
    .from('invoices')
    .select('*')
    .eq('client_id', clientId)
    .order('invoice_date', { ascending: false })
  if (error) throw error
  return data as Invoice[]
}

export async function getInvoice(id: string) {
  const { data, error } = await supabase
    .from('invoices')
    .select('*, client:clients(*), items:invoice_items(*, menu_item:menu_items(*, category:menu_categories(name))), bank_account:bank_accounts(*)')
    .eq('id', id)
    .single()
  if (error) throw error
  return data
}

export async function createInvoice(invoice: Partial<Invoice>, items: Partial<InvoiceItem>[], userId?: string) {
  const subtotal = items.reduce((s, i) => s + (i.quantity || 0) * Number(i.unit_price || 0), 0)
  const discount = Number(invoice.discount_amount || 0)

  if (!userId) {
    const { data: sessData } = await supabase.auth.getSession()
    userId = (sessData as any)?.session?.user?.id
  }
  if (!userId) {
    const cookieId = getUserIdFromCookie()
    if (cookieId) userId = cookieId
  }

  const settings = await getSettings().catch(() => null)
  const prefix = settings?.invoice_prefix || 'FAC-'

  const { data: invs } = await supabase
    .from('invoices')
    .select('invoice_number')
    .ilike('invoice_number', `${prefix}%`)
    .order('invoice_number', { ascending: false })
    .limit(1)
  let nextNum = 1
  if (invs?.[0]?.invoice_number) {
    const numPart = parseInt(invs[0].invoice_number.replace(prefix, ''), 10)
    if (!isNaN(numPart)) nextNum = numPart + 1
  }

  // Fetch menu item costs, PV and ITBIS rate
  const menuItemIds = items.map(i => i.menu_item_id).filter(Boolean) as string[]
  const { data: costData } = await supabase
    .from('menu_items')
    .select('id, cost, pv, itbis_enabled, itbis_rate')
    .in('id', menuItemIds)
  const costMap: Record<string, { cost: number; pv: number; itbis_enabled: boolean; itbis_rate: number }> = {}
  ;(costData || []).forEach((p: any) => {
    costMap[p.id] = { cost: Number(p.cost || 0), pv: Number(p.pv || 0), itbis_enabled: p.itbis_enabled !== false, itbis_rate: Number(p.itbis_rate || 18) }
  })

  const itemsWithInvoiceId = items.map((item) => {
    const lineTotal = (item.quantity || 0) * Number(item.unit_price || 0)
    const itbis = item.itbis ?? (item.menu_item_id ? costMap[item.menu_item_id]?.itbis_enabled : false)
    const menuItem = item.menu_item_id ? costMap[item.menu_item_id] : null
    const unitCost = menuItem?.cost || 0
    const itbisRate = menuItem?.itbis_rate || 18
    return {
      menu_item_id: item.menu_item_id || null,
      invoice_id: '' as string,
      quantity: item.quantity,
      unit_price: item.unit_price,
      unit_cost: unitCost,
      line_total: lineTotal,
      pv: (menuItem?.pv || 0) * (item.quantity || 0),
      itbis,
      itbis_amount: itbis ? lineTotal * itbisRate / 100 : 0,
      custom_name: item.custom_name || null,
    }
  })

  const itbisTotal = itemsWithInvoiceId.reduce((s, i) => s + i.itbis_amount, 0)
  const pvTotal = itemsWithInvoiceId.reduce((s, i) => s + i.pv, 0)
  const totalCost = itemsWithInvoiceId.reduce((s, i) => s + (i.unit_cost * (i.quantity || 0)), 0)
  const total = subtotal + itbisTotal - discount
  const margin = total > 0 ? Math.round((total - totalCost) / total * 100) : 0

  let invData: any
  for (let attempt = 0; attempt < 5; attempt++) {
    const num = attempt > 0 ? ++nextNum : nextNum
    const { data, error: invError } = await supabase
      .from('invoices')
      .insert({
        invoice_number: `${prefix}${String(num).padStart(6, '0')}`,
        client_id: invoice.client_id,
        invoice_date: invoice.invoice_date || getLocalDateString(),
        status: invoice.status || 'PENDING',
        subtotal,
        discount_amount: discount,
        itbis_total: itbisTotal,
        total,
        pv_total: pvTotal,
        amount_paid: 0,
        balance_due: total,
        notes: invoice.notes || null,
        delivery_address: invoice.delivery_address || null,
        delivery_instructions: invoice.delivery_instructions || null,
        bank_account_id: invoice.bank_account_id || null,
        margin,
        created_by: userId,
      })
      .select()
      .single()
    if (data) { invData = data; break }
    if (invError?.code !== '23505') throw invError
  }
  if (!invData) throw new Error('No se pudo generar un número de factura único')

  // Set invoice_id on items
  const { error: itemsError } = await supabase.from('invoice_items').insert(itemsWithInvoiceId)
  if (itemsError) throw itemsError

  // Subtract inventory
  for (const item of items) {
    if (item.menu_item_id) {
      await supabase.rpc('decrement_inventory', {
        p_item_id: item.menu_item_id,
        p_quantity: item.quantity || 0,
      })
    }
  }

  // Auto-create delivery record
  if (invoice.delivery_address) {
    await supabase.from('deliveries').insert({
      invoice_id: invData.id,
      client_id: invoice.client_id,
      delivery_address: invoice.delivery_address,
      status: 'PENDING',
    })
  }

  return invData
}

export async function updateInvoice(id: string, invoice: Partial<Invoice>, items: Partial<InvoiceItem>[], userId?: string) {
  const subtotal = items.reduce((s, i) => s + (i.quantity || 0) * Number(i.unit_price || 0), 0)
  const discount = Number(invoice.discount_amount || 0)

  if (!userId) {
    const { data: sessData } = await supabase.auth.getSession()
    userId = (sessData as any)?.session?.user?.id
  }
  if (!userId) {
    const cookieId = getUserIdFromCookie()
    if (cookieId) userId = cookieId
  }

  // Fetch menu item costs, PV and ITBIS rate
  const menuItemIds = items.map(i => i.menu_item_id).filter(Boolean) as string[]
  const { data: costData } = await supabase
    .from('menu_items')
    .select('id, cost, pv, itbis_enabled, itbis_rate')
    .in('id', menuItemIds)
  const costMap: Record<string, { cost: number; pv: number; itbis_enabled: boolean; itbis_rate: number }> = {}
  ;(costData || []).forEach((p: any) => {
    costMap[p.id] = { cost: Number(p.cost || 0), pv: Number(p.pv || 0), itbis_enabled: p.itbis_enabled !== false, itbis_rate: Number(p.itbis_rate || 18) }
  })

  const itemsWithTotals = items.map((item) => {
    const lineTotal = (item.quantity || 0) * Number(item.unit_price || 0)
    const itbis = item.itbis ?? (item.menu_item_id ? costMap[item.menu_item_id]?.itbis_enabled : false)
    const menuItem = item.menu_item_id ? costMap[item.menu_item_id] : null
    const itbisRate = menuItem?.itbis_rate || 18
    return { ...item, lineTotal, itbis, itbisRate, menuItem }
  })

  const itbisTotal = itemsWithTotals.reduce((s, i) => s + (i.itbis ? i.lineTotal * i.itbisRate / 100 : 0), 0)
  const pvTotal = itemsWithTotals.reduce((s, i) => s + ((i.menuItem?.pv || 0) * (i.quantity || 0)), 0)
  const totalCost = itemsWithTotals.reduce((s, i) => s + ((i.menuItem?.cost || 0) * (i.quantity || 0)), 0)
  const total = subtotal + itbisTotal - discount
  const margin = total > 0 ? Math.round((total - totalCost) / total * 100) : 0

  const { error: invError } = await supabase
    .from('invoices')
    .update({
      invoice_date: invoice.invoice_date || getLocalDateString(),
      subtotal,
      discount_amount: discount,
      itbis_total: itbisTotal,
      total,
      pv_total: pvTotal,
      amount_paid: invoice.amount_paid || 0,
      balance_due: total - (invoice.amount_paid || 0),
      notes: invoice.notes || null,
      delivery_address: invoice.delivery_address || null,
      delivery_instructions: invoice.delivery_instructions || null,
      bank_account_id: invoice.bank_account_id || null,
      margin,
      updated_by: userId,
    })
    .eq('id', id)
  if (invError) throw invError

  // Restore inventory from old items
  const { data: oldItems } = await supabase
    .from('invoice_items')
    .select('*')
    .eq('invoice_id', id)
  if (oldItems) {
    for (const old of oldItems) {
      if (old.menu_item_id) {
        await supabase.rpc('increment_inventory', {
          p_item_id: old.menu_item_id,
          p_quantity: old.quantity,
        })
      }
    }
  }

  const { error: delError } = await supabase.from('invoice_items').delete().eq('invoice_id', id)
  if (delError) throw delError

  if (items.length > 0) {
    const itemsWithInvoiceId = itemsWithTotals.map((item) => ({
      menu_item_id: item.menu_item_id || null,
      invoice_id: id,
      quantity: item.quantity,
      unit_price: item.unit_price,
      unit_cost: item.menuItem?.cost || 0,
      line_total: item.lineTotal,
      pv: (item.menuItem?.pv || 0) * (item.quantity || 0),
      itbis: item.itbis,
      itbis_amount: item.itbis ? item.lineTotal * item.itbisRate / 100 : 0,
      custom_name: item.custom_name || null,
    }))
    const { error: itemsError } = await supabase.from('invoice_items').insert(itemsWithInvoiceId)
    if (itemsError) throw itemsError

    for (const item of items) {
      if (item.menu_item_id) {
        await supabase.rpc('decrement_inventory', {
          p_item_id: item.menu_item_id,
          p_quantity: item.quantity || 0,
        })
      }
    }
  }
}

export async function updateInvoiceStatus(id: string, status: string) {
  if (status === 'CANCELLED') {
    const { data: oldInvoice } = await supabase
      .from('invoices')
      .select('status')
      .eq('id', id)
      .single()
    if (oldInvoice && oldInvoice.status !== 'CANCELLED') {
      const { data: items } = await supabase
        .from('invoice_items')
        .select('menu_item_id, quantity')
        .eq('invoice_id', id)
      if (items) {
        for (const item of items) {
          if (item.menu_item_id) {
            await supabase.rpc('increment_inventory', {
              p_item_id: item.menu_item_id,
              p_quantity: item.quantity,
            })
          }
        }
      }
    }
  }
  const { error } = await supabase.from('invoices').update({ status }).eq('id', id)
  if (error) throw error
}

export async function cancelInvoice(id: string) {
  const { data: oldInvoice } = await supabase
    .from('invoices')
    .select('status')
    .eq('id', id)
    .single()
  if (oldInvoice && oldInvoice.status !== 'CANCELLED') {
    const { data: items } = await supabase
      .from('invoice_items')
      .select('menu_item_id, quantity')
      .eq('invoice_id', id)
    if (items) {
      for (const item of items) {
        if (item.menu_item_id) {
          await supabase.rpc('increment_inventory', {
            p_item_id: item.menu_item_id,
            p_quantity: item.quantity,
          })
        }
      }
    }
  }
  const { data, error } = await supabase
    .from('invoices')
    .update({ status: 'CANCELLED' })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data as Invoice
}

export async function deleteInvoice(id: string) {
  const { count } = await supabase.from('receipts').select('*', { count: 'exact', head: true }).eq('invoice_id', id)
  if (count && count > 0) {
    throw new Error('No se puede eliminar una factura que tiene pagos registrados. Anula la factura en su lugar.')
  }
  await supabase.from('invoice_items').delete().eq('invoice_id', id)
  await supabase.from('deliveries').delete().eq('invoice_id', id)
  const { error } = await supabase.from('invoices').delete().eq('id', id)
  if (error) throw error
  logAudit({ action: 'delete', entity: 'invoice', entityId: id, userId: getUserIdFromCookie() })
}

export async function searchInvoices(query: string) {
  const { data: byNumber, error: err1 } = await supabase
    .from('invoices')
    .select('*, client:clients(full_name, phone, email)')
    .ilike('invoice_number', `%${query}%`)
    .order('created_at', { ascending: false })
    .limit(50)
  if (err1) throw err1

  const { data: byClient, error: err2 } = await supabase
    .from('invoices')
    .select('*, client:clients!inner(full_name, phone, email)')
    .ilike('clients.full_name', `%${query}%`)
    .order('created_at', { ascending: false })
    .limit(50)
  if (err2) throw err2

  const merged = [...(byNumber || []), ...(byClient || [])]
  const seen = new Set<string>()
  return merged.filter((item) => {
    if (seen.has(item.id)) return false
    seen.add(item.id)
    return true
  })
}

export async function getBankAccounts() {
  const { data, error } = await supabase.from('bank_accounts').select('*').order('is_default', { ascending: false })
  if (error) throw error
  return data
}
