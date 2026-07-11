import { supabase } from '@/lib/supabase'
import type { CreditBalance } from '@/types/database'

export async function getClientCredits(clientId: string) {
  const { data, error } = await supabase
    .from('credit_balances')
    .select('*')
    .eq('client_id', clientId)
    .eq('status', 'AVAILABLE')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data as CreditBalance[]
}

export async function getAllCredits(page = 1, pageSize = 500) {
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1
  const { data, error } = await supabase
    .from('credit_balances')
    .select('*, client:clients(*)')
    .order('created_at', { ascending: false })
    .range(from, to)
  if (error) throw error
  return data as (CreditBalance & { client: { full_name: string } })[]
}

export async function applyCredit(creditId: string, amount: number) {
  const { data, error } = await supabase.rpc('use_credit_balance', {
    p_credit_id: creditId,
    p_amount: amount,
  })
  if (error) throw error
  return data
}
