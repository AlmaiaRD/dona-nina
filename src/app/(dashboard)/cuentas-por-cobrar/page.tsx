'use client'

import { useState, useEffect } from 'react'
import { PageContainer } from '@/components/layout/PageContainer'
import { Badge } from '@/components/ui/Badge'
import { normalizeText } from '@/lib/search'
import { getInvoices } from '@/services/invoices'
import { formatCurrency, formatDateShort } from '@/lib/utils'
import { Modal } from '@/components/ui/Modal'
import { PrintActions } from '@/components/ui/PrintActions'
import { DollarSign, Search, Phone, Wallet, ArrowUpRight } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function CuentasPorCobrarPage() {
  const router = useRouter()
  const [invoices, setInvoices] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [detailInvoice, setDetailInvoice] = useState<any | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const data = await getInvoices()
        if (!cancelled) setInvoices(data)
      } catch (err) { console.error('[CuentasPorCobrarPage] Error:', err); if (!cancelled) setInvoices([]) }
      finally { if (!cancelled) setLoading(false) }
    })()
    return () => { cancelled = true }
  }, [])

  const pending = invoices.filter(
    (inv) => inv.status !== 'PAID' && inv.status !== 'CANCELLED'
  )

  const totalPending = pending.reduce((sum, inv) => sum + inv.balance_due, 0)

  const handleViewDetail = (inv: any) => {
    setDetailInvoice(inv)
    setDetailOpen(true)
  }

  const filtered = pending.filter((inv) => {
    if (!searchQuery) return true
    const q = normalizeText(searchQuery)
    return (
      normalizeText(inv.invoice_number).includes(q) ||
      normalizeText(inv.client?.full_name ?? '').includes(q)
    )
  })

  return (
    <PageContainer
      title="Cuentas por Cobrar"
      subtitle="Saldos pendientes de clientes"
    >
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl p-5 shadow-sm border border-[#E8E0D8]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-[#7C1D2E]/10">
              <DollarSign className="h-5 w-5 text-[#7C1D2E]" />
            </div>
            <div>
              <p className="text-xs text-[#9C8A82] font-medium">Total Pendiente</p>
              <p className="text-2xl font-bold text-[#3D2B1F]">
                {formatCurrency(totalPending)}
              </p>
              <p className="text-xs text-[#9C8A82] mt-0.5">
                {pending.length} factura{pending.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => router.push('/creditos')}
          className="bg-white rounded-xl p-5 shadow-sm border border-[#E8E0D8] text-left hover:border-green-200 transition-colors group"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-[#5B9E6B]/10">
              <Wallet className="h-5 w-5 text-green-600" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-[#9C8A82] font-medium">Saldos a Favor</p>
              <p className="text-lg font-semibold text-green-600">
                Ver créditos disponibles
              </p>
            </div>
            <ArrowUpRight className="h-5 w-5 text-[#9C8A82] group-hover:text-green-500 transition-colors" />
          </div>
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9C8A82]" />
        <input
          type="text"
          placeholder="Buscar por factura o cliente..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#E8E0D8] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#7C1D2E]/30 focus:border-transparent"
        />
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center min-h-[40vh]">
          <div className="h-8 w-8 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Empty */}
      {!loading && filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center min-h-[40vh] gap-3 text-[#9C8A82]">
          <DollarSign className="h-12 w-12" />
          <p className="text-sm">No hay cuentas pendientes por cobrar</p>
        </div>
      )}

      {/* Invoice Cards */}
      {!loading && filtered.length > 0 && (
        <div className="space-y-3">
          {filtered.map((inv) => (
            <div
              key={inv.id}
              className="bg-white rounded-xl p-4 shadow-sm border border-[#E8E0D8]"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      onClick={() => handleViewDetail(inv)}
                      className="font-mono text-sm font-semibold text-[#3D2B1F] hover:text-[#7C1D2E] transition-colors"
                    >
                      #{inv.invoice_number}
                    </button>
                    <Badge status={inv.status} />
                  </div>
                  <p className="text-sm text-[#3D2B1F] font-medium mt-1 truncate">
                    {inv.client?.full_name ?? 'Cliente'}
                  </p>
                  {inv.client?.phone && (
                    <div className="flex items-center gap-1.5 mt-1 text-xs text-[#9C8A82]">
                      <Phone className="h-3 w-3" />
                      {inv.client.phone}
                    </div>
                  )}
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-xs text-[#9C8A82]">Total</p>
                  <p className="text-sm text-gray-600">
                    {formatCurrency(inv.total)}
                  </p>
                  <p className="text-xs text-[#9C8A82] mt-1">Balance</p>
                  <p className="text-base font-bold text-[#3D2B1F]">
                    {formatCurrency(inv.balance_due)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      <Modal isOpen={detailOpen} onClose={() => setDetailOpen(false)} title="Detalle de Factura" subtitle="Información completa de la factura" size="xl">
        <div id="cxc-detail" className="space-y-4">
          <PrintActions elementId="cxc-detail" filename={`factura-${detailInvoice?.invoice_number || 'detalle'}`} />
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-[#9C8A82] font-medium">Factura</p>
              <p className="text-sm font-semibold text-[#3D2B1F]">#{detailInvoice?.invoice_number || '-'}</p>
            </div>
            <div>
              <p className="text-xs text-[#9C8A82] font-medium">Cliente</p>
              <p className="text-sm font-semibold text-[#3D2B1F]">{detailInvoice?.client?.full_name || '-'}</p>
            </div>
            <div>
              <p className="text-xs text-[#9C8A82] font-medium">Teléfono</p>
              <p className="text-sm font-semibold text-[#3D2B1F]">{detailInvoice?.client?.phone || '-'}</p>
            </div>
            <div>
              <p className="text-xs text-[#9C8A82] font-medium">Estado</p>
              <span className="inline-flex items-center mt-1"><Badge status={detailInvoice?.status} /></span>
            </div>
            <div>
              <p className="text-xs text-[#9C8A82] font-medium">Total</p>
              <p className="text-sm font-semibold text-[#3D2B1F]">{detailInvoice ? formatCurrency(detailInvoice.total) : '-'}</p>
            </div>
            <div>
              <p className="text-xs text-[#9C8A82] font-medium">Balance Pendiente</p>
              <p className="text-sm font-semibold text-[#3D2B1F]">{detailInvoice ? formatCurrency(detailInvoice.balance_due) : '-'}</p>
            </div>
            <div>
              <p className="text-xs text-[#9C8A82] font-medium">Fecha de Factura</p>
              <p className="text-sm font-semibold text-[#3D2B1F]">{detailInvoice?.invoice_date ? formatDateShort(detailInvoice.invoice_date) : '-'}</p>
            </div>
          </div>
        </div>
      </Modal>
    </PageContainer>
  )
}
