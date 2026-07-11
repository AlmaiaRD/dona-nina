import { supabase } from '@/lib/supabase'
import type { Client } from '@/types/database'

export async function getClients(page = 1, pageSize = 500) {
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .order('full_name')
    .range(from, to)
  if (error) throw error
  return data as Client[]
}

export async function getClient(id: string) {
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('id', id)
    .single()
  if (error) throw error
  return data as Client
}

export async function createClient(client: Partial<Client>) {
  const { data, error } = await supabase
    .from('clients')
    .insert({
      ...client,
      credit_balance: 0,
      stage: 'Prospecto',
    })
    .select()
    .single()
  if (error) throw error
  return data as Client
}

export async function updateClient(id: string, client: Partial<Client>) {
  const { data, error } = await supabase
    .from('clients')
    .update(client)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data as Client
}

export async function deleteClient(id: string) {
  const { error } = await supabase
    .from('clients')
    .delete()
    .eq('id', id)
  if (error) throw error
}

export async function searchClients(query: string) {
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .or(`full_name.ilike.%${query}%,phone.ilike.%${query}%,email.ilike.%${query}%`)
    .order('full_name')
    .limit(20)
  if (error) throw error
  return data as Client[]
}

export async function getClientStats(id: string) {
  const { data: invoices, error: invError } = await supabase
    .from('invoices')
    .select('*')
    .eq('client_id', id)
    .neq('status', 'CANCELLED')
  if (invError) throw invError

  const { data: receipts, error: recError } = await supabase
    .from('receipts')
    .select('*')
    .eq('client_id', id)
  if (recError) throw recError

  const { data: followups, error: folError } = await supabase
    .from('followups')
    .select('*')
    .eq('client_id', id)
    .eq('status', 'PENDING')
  if (folError) throw folError

  return {
    total_invoices: invoices?.length || 0,
    total_spent: invoices?.reduce((sum, inv) => sum + Number(inv.total), 0) || 0,
    total_paid: receipts?.reduce((sum, rec) => sum + Number(rec.amount), 0) || 0,
    pending_followups: followups?.length || 0,
  }
}
