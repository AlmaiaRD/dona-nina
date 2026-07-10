'use client'

import { useState } from 'react'
import { FileDown, Search } from 'lucide-react'
import toast from 'react-hot-toast'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from 'recharts'
import * as XLSX from 'xlsx'
import { getSalesReport, type SalesReport } from '@/services/reports'
import { PageContainer } from '@/components/layout/PageContainer'
import { KpiCard } from '@/components/ui/KpiCard'
import { DollarSign, Receipt, TrendingUp } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

function getDefaultRange() {
  const today = new Date()
  const from = new Date(today)
  from.setDate(from.getDate() - 30)
  return {
    from: from.toISOString().split('T')[0],
    to: today.toISOString().split('T')[0],
  }
}

export default function ReportesPage() {
  const defaultRange = getDefaultRange()
  const [from, setFrom] = useState(defaultRange.from)
  const [to, setTo] = useState(defaultRange.to)
  const [reportData, setReportData] = useState<SalesReport | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const generateReport = async () => {
    if (!from || !to) {
      toast.error('Seleccione el rango de fechas')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const data = await getSalesReport(from, to)
      setReportData(data)
    } catch (err: any) {
      const msg = err?.message || 'Error al generar el reporte'
      setError(msg)
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  const handleExport = () => {
    if (!reportData) {
      toast.error('No hay datos para exportar')
      return
    }
    try {
      const wb = XLSX.utils.book_new()

      const dailySheet = XLSX.utils.json_to_sheet(
        reportData.by_day.map((d) => ({
          Fecha: d.date,
          Total: d.total,
          Cantidad: d.count,
        }))
      )
      XLSX.utils.book_append_sheet(wb, dailySheet, 'Ventas Diarias')

      const pmSheet = XLSX.utils.json_to_sheet(
        reportData.by_payment_method.map((p) => ({
          Método: p.method,
          Total: p.total,
        }))
      )
      XLSX.utils.book_append_sheet(wb, pmSheet, 'Métodos de Pago')

      const summarySheet = XLSX.utils.json_to_sheet([
        { Indicador: 'Total Ventas', Valor: reportData.total_sales },
        { Indicador: 'Total Facturas', Valor: reportData.total_invoices },
        { Indicador: 'Ticket Promedio', Valor: reportData.average_ticket },
      ])
      XLSX.utils.book_append_sheet(wb, summarySheet, 'Resumen')

      XLSX.writeFile(wb, `reporte-ventas-${from}-${to}.xlsx`)
      toast.success('Reporte exportado correctamente')
    } catch (err) { console.error('[ReportesPage] Error:', err); toast.error('Error al exportar el reporte') }
  }

  const inputClass =
    'px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent'

  return (
    <PageContainer
      title="Reportes"
      subtitle="Reportes de ventas"
    >
      <div className="flex flex-wrap items-end gap-3 p-4 bg-white rounded-xl border border-gray-100 shadow-sm">
        <div className="space-y-1">
          <label className="block text-xs font-medium text-gray-500">Desde</label>
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className={inputClass}
          />
        </div>
        <div className="space-y-1">
          <label className="block text-xs font-medium text-gray-500">Hasta</label>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className={inputClass}
          />
        </div>
        <button
          onClick={generateReport}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
        >
          <Search className="h-4 w-4" />
          Generar Reporte
        </button>
      </div>

      {loading && (
        <div className="flex items-center justify-center min-h-[30vh]">
          <p className="text-gray-500 text-lg">Generando reporte...</p>
        </div>
      )}

      {error && !loading && (
        <div className="flex flex-col items-center justify-center min-h-[30vh] gap-4">
          <p className="text-red-600 text-lg">{error}</p>
          <button
            onClick={generateReport}
            className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
          >
            Reintentar
          </button>
        </div>
      )}

      {reportData && !loading && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <KpiCard
              title="Total Ventas"
              value={formatCurrency(reportData.total_sales)}
              icon={DollarSign}
            />
            <KpiCard
              title="Total Facturas"
              value={reportData.total_invoices.toLocaleString()}
              icon={Receipt}
            />
            <KpiCard
              title="Ticket Promedio"
              value={formatCurrency(reportData.average_ticket)}
              icon={TrendingUp}
            />
          </div>

          {reportData.by_day.length > 0 && (
            <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Ventas Diarias</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={reportData.by_day}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(value: any) => formatCurrency(value)} />
                  <Bar dataKey="total" fill="#800020" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Métodos de Pago</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left py-3 px-2 font-medium text-gray-500">Método</th>
                      <th className="text-right py-3 px-2 font-medium text-gray-500">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.by_payment_method.length === 0 ? (
                      <tr>
                        <td colSpan={2} className="py-6 text-center text-gray-400">
                          Sin datos
                        </td>
                      </tr>
                    ) : (
                      reportData.by_payment_method.map((pm) => (
                        <tr key={pm.method} className="border-b border-gray-50 hover:bg-gray-50">
                          <td className="py-3 px-2 text-gray-700">{pm.method}</td>
                          <td className="py-3 px-2 text-right text-gray-900 font-medium">
                            {formatCurrency(pm.total)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Ventas por Día</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left py-3 px-2 font-medium text-gray-500">Fecha</th>
                      <th className="text-right py-3 px-2 font-medium text-gray-500">Total</th>
                      <th className="text-right py-3 px-2 font-medium text-gray-500">Facturas</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.by_day.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="py-6 text-center text-gray-400">
                          Sin datos
                        </td>
                      </tr>
                    ) : (
                      reportData.by_day.map((d) => (
                        <tr key={d.date} className="border-b border-gray-50 hover:bg-gray-50">
                          <td className="py-3 px-2 text-gray-700">{d.date}</td>
                          <td className="py-3 px-2 text-right text-gray-900 font-medium">
                            {formatCurrency(d.total)}
                          </td>
                          <td className="py-3 px-2 text-right text-gray-700">{d.count}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleExport}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
            >
              <FileDown className="h-4 w-4" />
              Exportar a Excel
            </button>
          </div>
        </>
      )}

      {!reportData && !loading && !error && (
        <div className="flex flex-col items-center justify-center min-h-[30vh] gap-2 text-gray-400">
          <Search className="h-12 w-12" />
          <p className="text-lg">Seleccione un rango de fechas y genere un reporte</p>
        </div>
      )}
    </PageContainer>
  )
}
