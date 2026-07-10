import { supabase } from '@/lib/supabase'
import type { Setting } from '@/types/database'

export async function getSettings() {
  const { data, error } = await supabase.from('settings').select('*').limit(1).maybeSingle()
  if (error) throw error
  if (data) return data as Setting

  const { data: created, error: createError } = await supabase
    .from('settings')
    .insert({
      business_name: 'Doña Nina',
      default_margin: 30,
      invoice_prefix: 'FAC-',
      receipt_prefix: 'REC-',
    })
    .select()
    .single()

  if (createError) throw createError
  return created as Setting
}

export async function updateSettings(settings: Partial<Setting>) {
  if (!settings.id) throw new Error('Settings ID is required')
  const { data, error } = await supabase
    .from('settings')
    .update(settings)
    .eq('id', settings.id)
    .select()
    .single()
  if (error) throw error
  return data as Setting
}

export async function getBankAccounts() {
  const { data, error } = await supabase.from('bank_accounts').select('*').order('is_default', { ascending: false })
  if (error) throw error
  return data || []
}

export async function createBankAccount(account: any) {
  const { data, error } = await supabase.from('bank_accounts').insert(account).select().single()
  if (error) throw error
  return data
}

export async function updateBankAccount(id: string, account: any) {
  const { data, error } = await supabase.from('bank_accounts').update(account).eq('id', id).select().single()
  if (error) throw error
  return data
}

export async function deleteBankAccount(id: string) {
  const { error } = await supabase.from('bank_accounts').delete().eq('id', id)
  if (error) throw error
}
