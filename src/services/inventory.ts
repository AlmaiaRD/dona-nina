import { supabase } from '@/lib/supabase'
import type { Inventory, InventoryMovement } from '@/types/database'

export async function getInventory(page = 1, pageSize = 500) {
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1
  const { data, error } = await supabase
    .from('inventory')
    .select('*, item:menu_items(name)')
    .order('ingredient_name', { ascending: true, nullsFirst: false })
    .order('item_id', { ascending: true, nullsFirst: false })
    .range(from, to)
  if (error) throw error
  return data as (Inventory & { item?: { name: string } })[]
}

export async function updateInventory(id: string, inv: Partial<Inventory>) {
  const { data, error } = await supabase
    .from('inventory')
    .update(inv)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data as Inventory
}

export async function getInventoryMovements(limit = 50) {
  const { data, error } = await supabase
    .from('inventory_movements')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) throw error
  return data as InventoryMovement[]
}

export async function createMovement(movement: Partial<InventoryMovement>) {
  const { data, error } = await supabase
    .from('inventory_movements')
    .insert(movement)
    .select()
    .single()
  if (error) throw error
  return data as InventoryMovement
}

export async function createInventory(inv: Partial<Inventory>) {
  const { data, error } = await supabase
    .from('inventory')
    .insert(inv)
    .select()
    .single()
  if (error) throw error
  return data as Inventory
}

export async function deleteInventory(id: string) {
  const { error } = await supabase
    .from('inventory')
    .delete()
    .eq('id', id)
  if (error) throw error
}

export async function getItemMovements(itemId?: string, ingredientName?: string) {
  let query = supabase
    .from('inventory_movements')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100)

  if (itemId) {
    query = query.eq('item_id', itemId)
  } else if (ingredientName) {
    query = query.eq('ingredient_name', ingredientName)
  }

  const { data, error } = await query
  if (error) throw error
  return data as InventoryMovement[]
}

export async function getLowStockItems() {
  const { data: all, error: err } = await supabase
    .from('inventory')
    .select('*, item:menu_items(name)')
  if (err) throw err
  return (all as any[]).filter(i => Number(i.stock) <= Number(i.minimum_stock))
}
