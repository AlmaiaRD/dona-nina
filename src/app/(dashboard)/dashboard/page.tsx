'use client'

import { useState, useEffect } from 'react'
import {
  DollarSign, TrendingUp, Users, Truck, Package, CreditCard,
  CakeSlice, ShoppingCart, ArrowUpRight,
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line,
} from 'recharts'
import toast from 'react-hot-toast'
import { useAuth } from '@/hooks/useAuth'
import { getDashboardData, type DashboardData } from '@/services/dashboard'
import { PageContainer } from '@/components/layout/PageContainer'
import { KpiCard } from '@/components/ui/KpiCard'
import { Badge } from '@/components/ui/Badge'
import { formatCurrency } from '@/lib/utils'

export default function DashboardPage() {
  const { user } = useAuth()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const result = await getDashboardData()
        if (!cancelled) setData(result)
      } catch (err: any) {
        const msg = err.message || 'Error al cargar datos del dashboard'
        if (!cancelled) {
          setError(msg)
          toast.error(msg)
        }
      }
      finally { if (!cancelled) setLoading(false) }
    })()
    return () => { cancelled = true }
  }, [])

  async function fetchData() {
    try {
      const result = await getDashboardData()
      setData(result)
    } catch (err: any) {
      const msg = err.message || 'Error al cargar datos del dashboard'
      setError(msg)
      toast.error(msg)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-gray-500 text-lg">Cargando...</p>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <p className="text-red-600 text-lg">{error || 'Error al cargar datos'}</p>
        <button
          onClick={fetchData}
          className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
        >
          Reintentar
        </button>
      </div>
    )
  }

  return (
    <PageContainer>
      <div>
        <h1 className="text-xl font-bold text-gray-900">
          Bienvenido, {user?.name || 'Usuario'}
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Resumen de operaciones del día
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Ventas Hoy"
          value={formatCurrency(data.todaySales)}
          icon={DollarSign}
        />
        <KpiCard
          title="Ventas del Mes"
          value={formatCurrency(data.monthlySales)}
          icon={TrendingUp}
        />
        <KpiCard
          title="Compras del Mes"
          value={formatCurrency(data.monthlyPurchases)}
          icon={ShoppingCart}
        />
        <KpiCard
          title="Total Clientes"
          value={data.totalClients.toLocaleString()}
          icon={Users}
        />
        <KpiCard
          title="Entregas Pendientes"
          value={data.pendingDeliveries.toLocaleString()}
          icon={Truck}
        />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <KpiCard
          title="Stock Bajo"
          value={data.lowStock.toLocaleString()}
          icon={Package}
        />
        <KpiCard
          title="Cuentas por Cobrar"
          value={formatCurrency(data.accountsReceivable)}
          icon={CreditCard}
        />
        <KpiCard
          title="Ganancia Bruta"
          value={formatCurrency(data.grossProfit)}
          icon={CakeSlice}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">
            Ventas Diarias (Últimos 15 días)
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.dailySales}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip formatter={(value: any) => formatCurrency(value)} />
              <Bar dataKey="total" fill="#800020" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">
            Ventas Mensuales (Últimos 6 meses)
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data.monthlySalesByMonth}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip formatter={(value: any) => formatCurrency(value)} />
              <Line
                type="monotone"
                dataKey="total"
                stroke="#d97706"
                strokeWidth={2}
                dot={{ fill: '#d97706', r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {data.pendingInvoices.length > 0 && (
        <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">
            Facturas Pendientes
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-3 px-2 font-medium text-gray-500">#</th>
                  <th className="text-left py-3 px-2 font-medium text-gray-500">Cliente</th>
                  <th className="text-right py-3 px-2 font-medium text-gray-500">Total</th>
                  <th className="text-left py-3 px-2 font-medium text-gray-500">Balance</th>
                  <th className="text-left py-3 px-2 font-medium text-gray-500">Estado</th>
                </tr>
              </thead>
              <tbody>
                {data.pendingInvoices.map((inv: any) => (
                  <tr key={inv.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-3 px-2 text-gray-900 font-mono">
                      {inv.invoice_number || inv.id.slice(0, 8)}
                    </td>
                    <td className="py-3 px-2 text-gray-700">
                      {inv.client?.full_name || 'Cliente'}
                    </td>
                    <td className="py-3 px-2 text-right text-gray-900 font-medium">
                      {formatCurrency(inv.total)}
                    </td>
                    <td className="py-3 px-2 text-right text-red-600 font-medium">
                      {formatCurrency(inv.balance_due)}
                    </td>
                    <td className="py-3 px-2">
                      <Badge status={inv.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {data.topItems.length > 0 && (
        <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">
            Productos Más Vendidos
          </h3>
          <div className="space-y-3">
            {data.topItems.map((item: { name: string; total: number }, idx: number) => (
              <div
                key={item.name}
                className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xs font-medium text-gray-400 w-5">
                    {idx + 1}
                  </span>
                  <span className="text-sm text-gray-700">{item.name}</span>
                </div>
                <div className="flex items-center gap-1.5 text-sm text-gray-900 font-medium">
                  <ArrowUpRight className="h-3.5 w-3.5 text-green-500" />
                  {item.total}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </PageContainer>
  )
}
