import { supabase } from '@/lib/supabase'
import type { Expense } from '@/types/database'

export async function getExpenses(page = 1, pageSize = 500) {
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1
  const { data, error } = await supabase
    .from('expenses')
    .select('*')
    .order('expense_date', { ascending: false })
    .range(from, to)
  if (error) throw error
  return data as Expense[]
}

export async function createExpense(expense: Partial<Expense>) {
  const { data, error } = await supabase
    .from('expenses')
    .insert(expense)
    .select()
    .single()
  if (error) throw error
  return data as Expense
}

export async function updateExpense(id: string, expense: Partial<Expense>) {
  const { data, error } = await supabase
    .from('expenses')
    .update(expense)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data as Expense
}

export async function deleteExpense(id: string) {
  const { error } = await supabase
    .from('expenses')
    .delete()
    .eq('id', id)
  if (error) throw error
}

export async function getExpenseCategories(): Promise<string[]> {
  const { data, error } = await supabase
    .from('expense_categories')
    .select('name')
    .order('sort_order')
  if (error) throw error
  return (data || []).map((c: any) => c.name).filter(Boolean)
}
