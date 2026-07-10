import { supabase } from '@/lib/supabase'
import type { MenuItem, MenuCategory } from '@/types/database'

// --- Categories ---
export async function getMenuCategories() {
  const { data, error } = await supabase
    .from('menu_categories')
    .select('*')
    .order('sort_order')
  if (error) throw error
  return data as MenuCategory[]
}

export async function createCategory(cat: Partial<MenuCategory>) {
  const { data, error } = await supabase
    .from('menu_categories')
    .insert(cat)
    .select()
    .single()
  if (error) throw error
  return data as MenuCategory
}

export async function updateCategory(id: string, cat: Partial<MenuCategory>) {
  const { data, error } = await supabase
    .from('menu_categories')
    .update(cat)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data as MenuCategory
}

export async function deleteCategory(id: string) {
  const { error } = await supabase
    .from('menu_categories')
    .delete()
    .eq('id', id)
  if (error) throw error
}

// --- Menu Items ---
export async function getMenuItems() {
  const { data, error } = await supabase
    .from('menu_items')
    .select('*, category:menu_categories(*)')
    .order('category_id')
    .order('name')
  if (error) throw error
  return data as (MenuItem & { category: MenuCategory })[]
}

export async function getActiveMenuItems() {
  const { data, error } = await supabase
    .from('menu_items')
    .select('*, category:menu_categories(*)')
    .eq('active', true)
    .eq('available', true)
    .order('category_id')
    .order('name')
  if (error) throw error
  return data as (MenuItem & { category: MenuCategory })[]
}

export async function getMenuItem(id: string) {
  const { data, error } = await supabase
    .from('menu_items')
    .select('*, category:menu_categories(*)')
    .eq('id', id)
    .single()
  if (error) throw error
  return data as MenuItem & { category: MenuCategory }
}

export async function createMenuItem(item: Partial<MenuItem>) {
  const { data, error } = await supabase
    .from('menu_items')
    .insert(item)
    .select()
    .single()
  if (error) throw error
  return data as MenuItem
}

export async function updateMenuItem(id: string, item: Partial<MenuItem>) {
  const { data, error } = await supabase
    .from('menu_items')
    .update(item)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data as MenuItem
}

export async function deleteMenuItem(id: string) {
  const { error } = await supabase
    .from('menu_items')
    .delete()
    .eq('id', id)
  if (error) throw error
}

export async function searchMenuItems(query: string) {
  const { data, error } = await supabase
    .from('menu_items')
    .select('*, category:menu_categories(*)')
    .or(`name.ilike.%${query}%,code.ilike.%${query}%`)
    .eq('active', true)
    .limit(20)
  if (error) throw error
  return data as (MenuItem & { category: MenuCategory })[]
}
