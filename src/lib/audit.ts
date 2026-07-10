import { supabase } from '@/lib/supabase'

export async function logAudit(opts: {
  userId?: string | null
  action: string
  entity: string
  entityId?: string
  description?: string
}) {
  try {
    await supabase.from('audit_logs').insert({
      user_id: opts.userId || null,
      action: opts.action,
      entity: opts.entity,
      entity_id: opts.entityId || null,
      description: opts.description || null,
    })
  } catch (err) {
    console.error('[audit] Error logging:', err)
  }
}
