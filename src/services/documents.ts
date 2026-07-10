import { supabase } from '@/lib/supabase'

// Simple document generation tracking
export async function createDocument(data: {
  type: string
  reference_id: string
  title: string
}) {
  const { error } = await supabase
    .from('audit_logs')
    .insert({
      action: 'DOCUMENT_GENERATED',
      entity: data.type,
      entity_id: data.reference_id,
      description: `Documento generado: ${data.title}`,
    })
  if (error) throw error
}
