'use client'

import { useState, useEffect } from 'react'
import { normalizeText } from '@/lib/search'
import { PageContainer } from '@/components/layout/PageContainer'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Modal } from '@/components/ui/Modal'
import { PrintActions } from '@/components/ui/PrintActions'
import { Wallet, Search, ArrowRight, ArrowLeft, Eye } from 'lucide-react'
import toast from 'react-hot-toast'
import { useRouter } from 'next/navigation'
import { getAllCredits, applyCredit } from '@/services/credits'
import type { CreditBalance } from '@/types/database'

type CreditRow = CreditBalance & { client: { full_name: string; phone?: string } }

export default function CreditosPage() {
  const router = useRouter()
  const [credits, setCredits] = useState<CreditRow[]>([])
  const [totalAvailable, setTotalAvailable] = useState(0)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [applyAmount, setApplyAmount] = useState(0)
  const [saving, setSaving] = useState(false)
  const [detailCredit, setDetailCredit] = useState<CreditRow | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const data = await getAllCredits()
        if (!cancelled) {
          setCredits(data)
          setTotalAvailable(
            data
              .filter((c) => c.status === 'AVAILABLE')
              .reduce((sum, c) => sum + c.balance, 0)
          )
        }
      } catch (err) { console.error('[CreditosPage] Error:', err); if (!cancelled) toast.error('Error al cargar los créditos') }
      finally { if (!cancelled) setLoading(false) }
    })()
    return () => { cancelled = true }
  }, [])

  async function fetchCredits() {
    try {
      const data = await getAllCredits()
      setCredits(data)
      setTotalAvailable(
        data
          .filter((c) => c.status === 'AVAILABLE')
          .reduce((sum, c) => sum + c.balance, 0)
      )
    } catch (err) { console.error('[CreditosPage] Error:', err); toast.error('Error al cargar los créditos') }
  }

  const filtered = credits.filter((c) => {
    if (!searchQuery) return true
    const q = normalizeText(searchQuery)
    return (
      normalizeText(c.client?.full_name ?? '').includes(q) ||
      normalizeText(c.id).includes(q)
    )
  })

  const handleApply = async (credit: CreditRow) => {
    if (!applyAmount || applyAmount <= 0) {
      toast.error('Ingrese un monto válido')
      return
    }
    if (applyAmount > credit.balance) {
      toast.error('El monto no puede exceder el balance disponible')
      return
    }
    setSaving(true)
    try {
      await applyCredit(credit.id, applyAmount)
      toast.success('Crédito aplicado correctamente')
      setSelectedId(null)
      setApplyAmount(0)
      fetchCredits()
    } catch (err) { console.error('[CreditosPage] Error:', err); toast.error('Error al aplicar el crédito') }
    finally {
      setSaving(false)
    }
  }

  const handleViewDetail = (credit: CreditRow) => {
    setDetailCredit(credit)
    setDetailOpen(true)
  }

  return (
    <PageContainer
      title="Saldos a Favor"
      subtitle="Abonos y créditos disponibles de clientes"
      action={
        <button
          onClick={() => router.push('/crm')}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a CRM
        </button>
      }
    >
      {/* Total Available Card */}
      <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
        <p className="text-sm text-gray-500 font-medium">Total Disponible</p>
        <p className="text-3xl font-bold text-green-600 mt-1">
          {formatCurrency(totalAvailable)}
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder="Buscar por cliente o recibo..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
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
        <div className="flex flex-col items-center justify-center min-h-[40vh] gap-3 text-gray-400">
          <Wallet className="h-12 w-12" />
          <p className="text-sm">No hay saldos a favor registrados</p>
        </div>
      )}

      {/* Credit Cards */}
      {!loading && filtered.length > 0 && (
        <div className="space-y-3">
          {filtered.map((credit) => (
            <div
              key={credit.id}
              className="bg-white rounded-xl p-4 shadow-sm border border-gray-100"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-gray-900 truncate">
                      {credit.client?.full_name ?? 'Cliente'}
                    </p>
                    <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-green-100 text-green-800">
                      Disponible
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Recibo: {credit.receipt_id} &middot;{' '}
                    {formatDate(credit.created_at)}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-lg font-bold text-gray-900">
                    {formatCurrency(credit.balance)}
                  </p>
                  <p className="text-xs text-gray-400">
                    Original: {formatCurrency(credit.amount)}
                  </p>
                </div>
              </div>

              {selectedId === credit.id ? (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="flex items-end gap-3">
                    <div className="flex-1">
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Monto a aplicar
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max={credit.balance}
                        value={applyAmount}
                        onChange={(e) =>
                          setApplyAmount(Number(e.target.value))
                        }
                        placeholder={`Máx: ${formatCurrency(credit.balance)}`}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      />
                    </div>
                    <button
                      onClick={() => handleApply(credit)}
                      disabled={saving}
                      className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
                    >
                      {saving ? 'Aplicando...' : 'Aplicar a Factura'}
                      <ArrowRight className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => {
                        setSelectedId(null)
                        setApplyAmount(0)
                      }}
                      disabled={saving}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mt-3 pt-3 border-t border-gray-50">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleViewDetail(credit)}
                      className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
                    >
                      <Eye className="h-4 w-4" />
                      Ver detalle
                    </button>
                    {credit.status === 'AVAILABLE' && (
                      <button
                        onClick={() => {
                          setSelectedId(credit.id)
                          setApplyAmount(credit.balance)
                        }}
                        className="inline-flex items-center gap-1.5 text-sm font-medium text-red-600 hover:text-red-700 transition-colors"
                      >
                        Aplicar
                        <ArrowRight className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      <Modal isOpen={detailOpen} onClose={() => setDetailOpen(false)} title="Detalle de Crédito" subtitle="Información completa del saldo a favor" size="xl">
        <div id="credit-detail" className="space-y-4">
          <PrintActions elementId="credit-detail" filename={`credito-${detailCredit?.id || 'detalle'}`} />
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-500 font-medium">Cliente</p>
              <p className="text-sm font-semibold text-gray-900">{detailCredit?.client?.full_name || '-'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">Monto Original</p>
              <p className="text-sm font-semibold text-gray-900">{detailCredit ? formatCurrency(detailCredit.amount) : '-'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">Balance Disponible</p>
              <p className="text-sm font-semibold text-gray-900">{detailCredit ? formatCurrency(detailCredit.balance) : '-'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">Recibo</p>
              <p className="text-sm font-semibold text-gray-900">{detailCredit?.receipt_id || '-'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">Fecha de Creación</p>
              <p className="text-sm font-semibold text-gray-900">{detailCredit ? formatDate(detailCredit.created_at) : '-'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">Estado</p>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-1 bg-green-100 text-green-800">
                {detailCredit?.status === 'AVAILABLE' ? 'Disponible' : detailCredit?.status === 'USED' ? 'Usado' : detailCredit?.status === 'EXPIRED' ? 'Vencido' : '-'}
              </span>
            </div>
          </div>
        </div>
      </Modal>
    </PageContainer>
  )
}
