'use client'

import { Search } from 'lucide-react'
import type { Client } from '@/types/database'

interface InvoiceFiltersProps {
  searchQuery: string
  filterMonth: string
  filterYear: string
  filterStatus: string
  filterClient: string
  clients: Client[]
  onSearchChange: (val: string) => void
  onFilterMonthChange: (val: string) => void
  onFilterYearChange: (val: string) => void
  onFilterStatusChange: (val: string) => void
  onFilterClientChange: (val: string) => void
  onClearFilters: () => void
}

const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

export function InvoiceFilters({
  searchQuery,
  filterMonth,
  filterYear,
  filterStatus,
  filterClient,
  clients,
  onSearchChange,
  onFilterMonthChange,
  onFilterYearChange,
  onFilterStatusChange,
  onFilterClientChange,
  onClearFilters,
}: InvoiceFiltersProps) {
  const hasFilters = filterMonth || filterYear || filterStatus || filterClient

  return (
    <>
      <div className="relative mb-6">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Buscar factura por número o cliente..."
          className="w-full h-12 pl-12 pr-4 rounded-xl border border-gray-200 bg-white text-gray-900 placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-200 transition-all"
        />
      </div>

      <div className="flex gap-3 mb-6 flex-wrap">
        <select value={filterMonth} onChange={(e) => onFilterMonthChange(e.target.value)}
          className="h-10 px-3 rounded-xl border border-gray-200 bg-white text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30">
          <option value="">Todos los meses</option>
          {MONTHS.map((m, i) => (
            <option key={i} value={String(i + 1).padStart(2, '0')}>{m}</option>
          ))}
        </select>
        <select value={filterYear} onChange={(e) => onFilterYearChange(e.target.value)}
          className="h-10 px-3 rounded-xl border border-gray-200 bg-white text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30">
          <option value="">Todos los años</option>
          {[2024, 2025, 2026, 2027].map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
        <select value={filterStatus} onChange={(e) => onFilterStatusChange(e.target.value)}
          className="h-10 px-3 rounded-xl border border-gray-200 bg-white text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30">
          <option value="">Todos los estados</option>
          <option value="PENDING">Pendiente</option>
          <option value="PAID">Pagada</option>
          <option value="CANCELLED">Cancelada</option>
        </select>
        <select value={filterClient} onChange={(e) => onFilterClientChange(e.target.value)}
          className="h-10 px-3 rounded-xl border border-gray-200 bg-white text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30">
          <option value="">Todos los clientes</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>{c.full_name}</option>
          ))}
        </select>
        {hasFilters && (
          <button onClick={onClearFilters} className="text-xs text-gray-500 hover:text-gray-900 px-3">
            Limpiar filtros
          </button>
        )}
      </div>
    </>
  )
}
