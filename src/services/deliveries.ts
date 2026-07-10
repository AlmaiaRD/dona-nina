import { supabase } from '@/lib/supabase'
import type { Delivery } from '@/types/database'

export async function getDeliveries(page = 1, pageSize = 500) {
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1
  const { data, error } = await supabase
    .from('deliveries')
    .select('*, client:clients(*), invoice:invoices(*)')
    .order('created_at', { ascending: false })
    .range(from, to)
  if (error) throw error
  return data as Delivery[]
}

export async function getPendingDeliveries(page = 1, pageSize = 500) {
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1
  const { data, error } = await supabase
    .from('deliveries')
    .select('*, client:clients(*), invoice:invoices(*)')
    .in('status', ['PENDING', 'IN_PROGRESS'])
    .order('created_at', { ascending: true })
    .range(from, to)
  if (error) throw error
  return data as Delivery[]
}

export async function getDelivery(id: string) {
  const { data, error } = await supabase
    .from('deliveries')
    .select('*, client:clients(*), invoice:invoices(*)')
    .eq('id', id)
    .single()
  if (error) throw error
  return data as Delivery
}

export async function createDelivery(delivery: Partial<Delivery>) {
  const { data, error } = await supabase
    .from('deliveries')
    .insert(delivery)
    .select()
    .single()
  if (error) throw error
  return data as Delivery
}

export async function updateDelivery(id: string, delivery: Partial<Delivery>) {
  const { data, error } = await supabase
    .from('deliveries')
    .update(delivery)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data as Delivery
}

export async function markDelivered(id: string) {
  const { data, error } = await supabase
    .from('deliveries')
    .update({
      status: 'DELIVERED',
      delivered_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data as Delivery
}

export async function deleteDelivery(id: string) {
  const { error } = await supabase
    .from('deliveries')
    .delete()
    .eq('id', id)
  if (error) throw error
}
