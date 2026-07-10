'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { FileText, Receipt, BarChart3 } from 'lucide-react'
import { PageContainer } from '@/components/layout/PageContainer'
import { formatDateShort } from '@/lib/utils'
import { supabase } from '@/lib/supabase'

interface AuditDoc {
  id: string
  entity: string
  description?: string
  created_at: string
}

const docTypes = [
  { key: 'facturas', title: 'Facturas', description: 'Gestión de facturación', icon: FileText, href: '/facturacion' },
  { key: 'recibos', title: 'Recibos', description: 'Gestión de recibos', icon: Receipt, href: '/recibos' },
  { key: 'reportes', title: 'Reportes', description: 'Reportes del sistema', icon: BarChart3, href: '/reportes' },
]

export default function DocumentsPage() {
  const router = useRouter()
  const [auditDocs, setAuditDocs] = useState<AuditDoc[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchAuditLogs() {
      try {
        const { data } = await supabase
          .from('audit_logs')
          .select('id, entity, description, created_at')
          .eq('action', 'DOCUMENT_GENERATED')
          .order('created_at', { ascending: false })
          .limit(10)
        setAuditDocs(data || [])
      } catch (err) { console.error('[DocumentsPage] Error:', err) } finally {
        setLoading(false)
      }
    }
    fetchAuditLogs()
  }, [])

  return (
    <PageContainer title="Documentos" subtitle="Generación de documentos">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {docTypes.map((doc) => {
          const Icon = doc.icon
          return (
            <div
              key={doc.key}
              onClick={() => router.push(doc.href)}
              className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer"
            >
              <div className="rounded-lg bg-red-50 p-3 w-fit mb-4">
                <Icon className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">{doc.title}</h3>
              <p className="text-sm text-gray-500 mt-1">{doc.description}</p>
            </div>
          )
        })}
      </div>

      <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Documentos Generados</h3>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="h-6 w-6 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : auditDocs.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-8">No hay documentos generados recientemente</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-3 px-2 font-medium text-gray-500">Tipo</th>
                  <th className="text-left py-3 px-2 font-medium text-gray-500">Descripción</th>
                  <th className="text-left py-3 px-2 font-medium text-gray-500">Fecha</th>
                </tr>
              </thead>
              <tbody>
                {auditDocs.map((doc) => (
                  <tr key={doc.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-3 px-2 text-gray-900 font-medium">{doc.entity}</td>
                    <td className="py-3 px-2 text-gray-500">{doc.description || '-'}</td>
                    <td className="py-3 px-2 text-gray-500">{formatDateShort(doc.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </PageContainer>
  )
}
