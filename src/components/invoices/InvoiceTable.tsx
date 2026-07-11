'use client'

import { FileText, Eye, Edit2, Trash2, Download } from 'lucide-react'
import Badge from '@/components/ui/Badge'
import { formatCurrency, formatDate } from '@/lib/utils'

interface InvoiceTableProps {
  invoices: any[]
  loading: boolean
  openPrintId: string | null
  onViewDetail: (inv: any) => void
  onEdit: (inv: any) => void
  onDelete: (id: string) => void
  onPrintPdf: (inv: any) => void
  onPrintJpg: (inv: any) => void
  onTogglePrint: (id: string) => void
}

export function InvoiceTable({
  invoices,
  loading,
  openPrintId,
  onViewDetail,
  onEdit,
  onDelete,
  onPrintPdf,
  onPrintJpg,
  onTogglePrint,
}: InvoiceTableProps) {
  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="w-8 h-8 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (invoices.length === 0) {
    return (
      <div className="text-center py-16 text-[#9C8A82]">
        <FileText size={40} className="mx-auto mb-3 opacity-40" />
        <p className="text-sm">No hay facturas registradas</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-separate border-spacing-y-2">
        <thead>
          <tr>
            <th className="px-4 py-3 text-left text-xs font-semibold text-[#9C8A82] uppercase">No. Factura</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-[#9C8A82] uppercase">Fecha</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-[#9C8A82] uppercase">Cliente</th>
            <th className="px-4 py-3 text-right text-xs font-semibold text-[#9C8A82] uppercase">Total</th>
            <th className="px-4 py-3 text-center text-xs font-semibold text-[#9C8A82] uppercase">Estado</th>
            <th className="px-4 py-3 text-center text-xs font-semibold text-[#9C8A82] uppercase">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {invoices.map((inv: any) => (
            <tr key={inv.id} className="bg-white rounded-xl shadow-sm border border-[#E8E0D8] hover:shadow-md transition-shadow">
              <td className="px-4 py-3.5 text-sm font-medium text-[#3D2B1F]">{inv.invoice_number}</td>
              <td className="px-4 py-3.5 text-sm text-[#9C8A82]">{formatDate(inv.invoice_date)}</td>
              <td className="px-4 py-3.5 text-sm text-[#3D2B1F]">{inv.client?.full_name || '\u2014'}</td>
              <td className="px-4 py-3.5 text-sm text-[#3D2B1F] text-right font-medium">{formatCurrency(inv.total)}</td>
              <td className="px-4 py-3.5 text-center"><Badge status={inv.status} /></td>
              <td className="px-4 py-3.5">
                <div className="flex items-center justify-center gap-1 relative">
                  <button onClick={() => onViewDetail(inv)} className="p-2 text-[#9C8A82] hover:bg-[#FDF8F3] rounded-lg" title="Ver"><Eye size={15} /></button>
                  <div className="relative">
                    <button
                      onClick={() => onTogglePrint(inv.id)}
                      className="p-2 text-[#9C8A82] hover:bg-[#FDF8F3] rounded-lg"
                      title="Descargar"
                    >
                      <Download size={15} />
                    </button>
                    {openPrintId === inv.id && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={() => onTogglePrint('')} />
                        <div className="absolute right-0 top-full mt-1 z-20 bg-white rounded-xl shadow-lg border border-[#E8E0D8] py-1 min-w-[130px]">
                          <button onClick={() => onPrintPdf(inv)} className="w-full text-left px-4 py-2 text-sm text-[#3D2B1F] hover:bg-[#FDF8F3] flex items-center gap-2">
                            <FileText size={14} /> PDF
                          </button>
                          <button onClick={() => onPrintJpg(inv)} className="w-full text-left px-4 py-2 text-sm text-[#3D2B1F] hover:bg-[#FDF8F3] flex items-center gap-2">
                            <Download size={14} /> JPG
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                  <button onClick={() => onEdit(inv)} className="p-2 text-[#9C8A82] hover:bg-[#FDF8F3] rounded-lg" title="Editar"><Edit2 size={15} /></button>
                  <button onClick={() => onDelete(inv.id)} className="p-2 text-[#E07A3A] hover:bg-red-400/10 rounded-lg" title="Eliminar"><Trash2 size={15} /></button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
