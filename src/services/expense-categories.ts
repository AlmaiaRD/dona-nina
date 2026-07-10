import { supabase } from '@/lib/supabase'
import type { ExpenseCategory } from '@/types/database'

export async function getExpenseCategories() {
  const { data, error } = await supabase
    .from('expense_categories')
    .select('*')
    .order('sort_order')
  if (error) throw error
  return data as ExpenseCategory[]
}

export async function getExpenseCategoryTree(): Promise<ExpenseCategory[]> {
  const categories = await getExpenseCategories()

  const map = new Map<string, ExpenseCategory & { children: ExpenseCategory[] }>()
  const roots: (ExpenseCategory & { children: ExpenseCategory[] })[] = []

  categories.forEach((cat) => {
    map.set(cat.id, { ...cat, children: [] })
  })

  categories.forEach((cat) => {
    const node = map.get(cat.id)!
    if (cat.parent_id && map.has(cat.parent_id)) {
      map.get(cat.parent_id)!.children.push(node)
    } else {
      roots.push(node)
    }
  })

  return roots
}

export async function createExpenseCategory(cat: Partial<ExpenseCategory>) {
  const { data, error } = await supabase
    .from('expense_categories')
    .insert(cat)
    .select()
    .single()
  if (error) throw error
  return data as ExpenseCategory
}

export async function updateExpenseCategory(id: string, cat: Partial<ExpenseCategory>) {
  const { data, error } = await supabase
    .from('expense_categories')
    .update(cat)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data as ExpenseCategory
}

export async function deleteExpenseCategory(id: string) {
  const { error } = await supabase
    .from('expense_categories')
    .delete()
    .eq('id', id)
  if (error) throw error
}
