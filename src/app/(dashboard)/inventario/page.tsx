'use client'

import { useState, useEffect } from 'react'
import { ColumnDef } from '@tanstack/react-table'
import { Plus, Package, Save, X } from 'lucide-react'
import { IconPencil, IconTrash2, IconAlertTriangle } from '@/components/ui/Icons'
import toast from 'react-hot-toast'
import { getInventory, updateInventory, getLowStockItems, deleteInventory, getItemMovements, createMovement } from '@/services/inventory'
import { getActiveMenuItems } from '@/services/menu'
import { createPurchase, getSuppliers, createSupplier } from '@/services/purchases'
import type { Inventory, InventoryMovement, MenuItem } from '@/types/database'
import { PageContainer } from '@/components/layout/PageContainer'
import { DataTable } from '@/components/ui/DataTable'
import { Modal } from '@/components/ui/Modal'
import { Badge } from '@/components/ui/Badge'
import { PrintActions } from '@/components/ui/PrintActions'
import { formatCurrency, formatDateShort, getLocalDateString, cn } from '@/lib/utils'

type InventoryRow = Inventory & { item?: { name: string } }

interface EditForm {
  stock: number
  minimum_stock: number
  unit: string
  average_cost: number
}

export default function InventarioPage() {
  const [inventory, setInventory] = useState<InventoryRow[]>([])
  const [lowStockCount, setLowStockCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<InventoryRow | null>(null)
  const [form, setForm] = useState<EditForm>({ stock: 0, minimum_stock: 0, unit: '', average_cost: 0 })
  const [saving, setSaving] = useState(false)
  const [detailOpen, setDetailOpen] = useState(false)
  const [detailItem, setDetailItem] = useState<InventoryRow | null>(null)
  const [addModalOpen, setAddModalOpen] = useState(false)
  const [addSaving, setAddSaving] = useState(false)
  const [purchaseModalOpen, setPurchaseModalOpen] = useState(false)
  const [purchaseItem, setPurchaseItem] = useState<InventoryRow | null>(null)
  const [purchaseQty, setPurchaseQty] = useState(0)
  const [purchaseCost, setPurchaseCost] = useState(0)
  const [purchaseSaving, setPurchaseSaving] = useState(false)
  const [movements, setMovements] = useState<InventoryMovement[]>([])
  const [movementsLoading, setMovementsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'info' | 'movements'>('info')
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [suppliers, setSuppliers] = useState<any[]>([])
  const [purchaseSupplier, setPurchaseSupplier] = useState('')
  const [purchaseDate, setPurchaseDate] = useState(getLocalDateString())
  const [purchaseNotes, setPurchaseNotes] = useState('')
  const [purchaseItems, setPurchaseItems] = useState<{ menu_item_id: string; name: string; quantity: number; unit_cost: number; itbis: boolean }[]>([])

  const fetchData = async () => {
    try {
      const [data, lowStock] = await Promise.all([
        getInventory(),
        getLowStockItems(),
      ])
      setInventory(data)
      setLowStockCount(lowStock.length)
    } catch (err: any) {
      const msg = err.message || 'Error al cargar inventario'
      setError(msg)
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    queueMicrotask(() => fetchData())
  }, [])

  const handleEdit = (item: InventoryRow) => {
    setEditingItem(item)
    setForm({
      stock: item.stock,
      minimum_stock: item.minimum_stock,
      unit: item.unit,
      average_cost: item.average_cost,
    })
    setEditModalOpen(true)
  }

  const handleClose = () => {
    setEditModalOpen(false)
    setEditingItem(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingItem) return
    setSaving(true)
    try {
      const stockDiff = Number(form.stock) - Number(editingItem.stock)

      await updateInventory(editingItem.id, form)

      if (stockDiff !== 0) {
        await createMovement({
          item_id: editingItem.item_id,
          ingredient_name: editingItem.ingredient_name,
          movement_type: 'ADJUSTMENT',
          quantity: Math.abs(stockDiff),
          notes: `Ajuste manual: stock ${stockDiff > 0 ? 'incrementado' : 'reducido'} en ${Math.abs(stockDiff)}`,
        })
      }

      toast.success('Inventario actualizado correctamente')
      handleClose()
      fetchData()
    } catch (err: any) {
      toast.error(err.message || 'Error al actualizar inventario')
    } finally {
      setSaving(false)
    }
  }

  const handleViewDetail = async (item: InventoryRow) => {
    setDetailItem(item)
    setDetailOpen(true)
    setMovementsLoading(true)
    try {
      const data = await getItemMovements(item.item_id ?? undefined, item.ingredient_name ?? undefined)
      setMovements(data)
    } catch (err) {
      console.error('Error loading movements:', err)
      setMovements([])
    } finally {
      setMovementsLoading(false)
    }
  }

  const handleDeleteItem = async (item: InventoryRow) => {
    if (!window.confirm(`¿Estás seguro de eliminar "${item.item?.name || item.ingredient_name}" del inventario?`)) return
    try {
      await deleteInventory(item.id)
      toast.success('Producto eliminado del inventario')
      fetchData()
    } catch (err: any) {
      toast.error(err.message || 'Error al eliminar producto')
    }
  }

  const handleOpenPurchase = (item: InventoryRow) => {
    setPurchaseItem(item)
    setPurchaseQty(0)
    setPurchaseCost(item.average_cost)
    setPurchaseModalOpen(true)
  }

  const handlePurchaseSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!purchaseItem || purchaseQty <= 0) return
    setPurchaseSaving(true)
    try {
      const newStock = Number(purchaseItem.stock) + Number(purchaseQty)
      await updateInventory(purchaseItem.id, { stock: newStock, average_cost: purchaseCost })

      await createMovement({
        item_id: purchaseItem.item_id,
        ingredient_name: purchaseItem.ingredient_name,
        movement_type: 'PURCHASE',
        quantity: purchaseQty,
        notes: `Compra registrada manualmente`,
      })

      toast.success('Compra registrada correctamente')
      setPurchaseModalOpen(false)
      fetchData()
    } catch (err: any) {
      toast.error(err.message || 'Error al registrar compra')
    } finally {
      setPurchaseSaving(false)
    }
  }

  if (loading) {
    return (
      <PageContainer title="Inventario" subtitle="Control de existencias">
        <div className="flex items-center justify-center min-h-[40vh]">
          <p className="text-gray-500 text-lg">Cargando...</p>
        </div>
      </PageContainer>
    )
  }

  if (error) {
    return (
      <PageContainer title="Inventario" subtitle="Control de existencias">
        <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4">
          <p className="text-red-600 text-lg">{error}</p>
          <button
            onClick={fetchData}
            className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
          >
            Reintentar
          </button>
        </div>
      </PageContainer>
    )
  }

  const columns: ColumnDef<InventoryRow>[] = [
    {
      id: 'name',
      header: 'Producto',
      cell: ({ row }) => (
        <button
          onClick={() => handleViewDetail(row.original)}
          className="text-blue-600 hover:text-blue-800 hover:underline font-medium transition-colors"
        >
          {row.original.item?.name || row.original.ingredient_name || '—'}
        </button>
      ),
    },
    {
      accessorKey: 'stock',
      header: 'Stock',
      cell: ({ row }) => {
        const isLow = Number(row.original.stock) <= Number(row.original.minimum_stock)
        return (
          <span className={cn(isLow && 'text-red-600 font-semibold')}>
            {row.original.stock}
            {isLow && <IconAlertTriangle className="inline-block h-3.5 w-3.5 ml-1 text-red-500" />}
          </span>
        )
      },
    },
    {
      accessorKey: 'minimum_stock',
      header: 'Stock Mínimo',
    },
    {
      accessorKey: 'unit',
      header: 'Unidad',
    },
    {
      accessorKey: 'average_cost',
      header: 'Costo Promedio',
      cell: ({ row }) => formatCurrency(row.original.average_cost),
    },
    {
      id: 'acciones',
      header: 'Acciones',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleEdit(row.original)}
            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="Editar"
          >
            <IconPencil className="h-4 w-4" />
          </button>
          <button
            onClick={() => handleDeleteItem(row.original)}
            className="p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors"
            aria-label="Eliminar"
          >
            <IconTrash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ]

  return (
    <>
      <PageContainer
        title="Inventario"
        subtitle="Control de existencias"
        action={
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                getActiveMenuItems().then(setMenuItems).catch(() => {})
                getSuppliers().then(setSuppliers).catch(() => {})
                setAddModalOpen(true)
              }}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Registrar Compra
            </button>
          </div>
        }
      >
        {lowStockCount > 0 && (
          <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-amber-100">
              <Package className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-amber-800">
                {lowStockCount} {lowStockCount === 1 ? 'producto tiene' : 'productos tienen'} stock bajo
              </p>
              <p className="text-xs text-amber-600">
                Se recomienda realizar pedidos para reabastecer el inventario.
              </p>
            </div>
          </div>
        )}

        <DataTable columns={columns} data={inventory} searchable />
      </PageContainer>

      <Modal
        isOpen={editModalOpen}
        onClose={handleClose}
        title={`Editar: ${editingItem?.item?.name || editingItem?.ingredient_name || 'Producto'}`}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Stock <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={form.stock}
                onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })}
                min={0}
                step="0.01"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Stock Mínimo <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={form.minimum_stock}
                onChange={(e) => setForm({ ...form, minimum_stock: Number(e.target.value) })}
                min={0}
                step="0.01"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Unidad <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.unit}
                onChange={(e) => setForm({ ...form, unit: e.target.value })}
                placeholder="Ej: unidades, kg, litros"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Costo Promedio <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={form.average_cost}
                onChange={(e) => setForm({ ...form, average_cost: Number(e.target.value) })}
                min={0}
                step="0.01"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
            >
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={detailOpen}
        onClose={() => { setDetailOpen(false); setDetailItem(null); setMovements([]) }}
        title={detailItem?.item?.name || detailItem?.ingredient_name || 'Detalle de Inventario'}
        size="lg"
      >
        {detailItem && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleOpenPurchase(detailItem)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Registrar Compra
                </button>
              </div>
              <PrintActions elementId="inventory-detail" filename={`inventario-${detailItem.item?.name || detailItem.ingredient_name}`} />
            </div>

            <div className="border-b border-gray-200 mb-4">
              <nav className="flex gap-6">
                <button
                  onClick={() => setActiveTab('info')}
                  className={`pb-2 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'info'
                      ? 'border-red-600 text-red-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Información
                </button>
                <button
                  onClick={() => setActiveTab('movements')}
                  className={`pb-2 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'movements'
                      ? 'border-red-600 text-red-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Movimientos
                </button>
              </nav>
            </div>

            {activeTab === 'info' && (
              <div id="inventory-detail" className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Producto</label>
                    <p className="text-gray-900">{detailItem.item?.name || detailItem.ingredient_name || '—'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Stock</label>
                    <p className="text-gray-900">{detailItem.stock}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Stock Mínimo</label>
                    <p className="text-gray-900">{detailItem.minimum_stock}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Unidad</label>
                    <p className="text-gray-900">{detailItem.unit}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Costo Promedio</label>
                    <p className="text-gray-900">{formatCurrency(detailItem.average_cost)}</p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'movements' && (
              <div>
                {movementsLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="h-6 w-6 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : movements.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-8">Sin movimientos registrados</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Fecha</th>
                          <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Tipo</th>
                          <th className="px-3 py-2 text-right text-xs font-semibold text-gray-500 uppercase">Cantidad</th>
                          <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Notas</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {movements.map((m) => (
                          <tr key={m.id} className="hover:bg-gray-50">
                            <td className="px-3 py-2 text-sm text-gray-700">{formatDateShort(m.created_at)}</td>
                            <td className="px-3 py-2">
                              <Badge status={m.movement_type === 'PURCHASE' ? 'AVAILABLE' : m.movement_type === 'SALE' ? 'CANCELLED' : m.movement_type === 'ADJUSTMENT' ? 'PARTIAL' : 'RETURN'} />
                            </td>
                            <td className={`px-3 py-2 text-sm text-right font-medium ${
                              m.movement_type === 'PURCHASE' || m.movement_type === 'RETURN'
                                ? 'text-green-600'
                                : 'text-red-600'
                            }`}>
                              {m.movement_type === 'PURCHASE' || m.movement_type === 'RETURN' ? '+' : '-'}{m.quantity}
                            </td>
                            <td className="px-3 py-2 text-sm text-gray-500">{m.notes || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </Modal>

      <Modal
        isOpen={addModalOpen}
        onClose={() => { setAddModalOpen(false); setPurchaseItems([]); setPurchaseSupplier(''); setPurchaseNotes(''); setPurchaseDate(getLocalDateString()) }}
        title="Registrar Compra"
        size="lg"
      >
        <form onSubmit={async (e) => { e.preventDefault(); setAddSaving(true); try { await createPurchase({ supplier_name: purchaseSupplier || undefined, purchase_date: purchaseDate, notes: purchaseNotes || undefined }, purchaseItems); toast.success('Compra registrada correctamente'); setAddModalOpen(false); setPurchaseItems([]); setPurchaseSupplier(''); setPurchaseNotes(''); fetchData(); } catch (err: any) { toast.error(err.message || 'Error al registrar compra'); } finally { setAddSaving(false); } }} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Proveedor</label>
              <div className="flex gap-2">
                <input type="text" value={purchaseSupplier} onChange={(e) => setPurchaseSupplier(e.target.value)} placeholder="Nombre del proveedor" list="supplier-list" className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent" />
                <datalist id="supplier-list">
                  {suppliers.map((s: any) => <option key={s.id} value={s.name} />)}
                </datalist>
                <button type="button" onClick={() => { const n = prompt('Nombre del nuevo proveedor:'); if (n) { createSupplier({ name: n }).then(() => getSuppliers().then(setSuppliers)).catch(() => {}); setPurchaseSupplier(n); } }} className="px-3 py-2 text-sm text-red-600 bg-red-50 rounded-lg hover:bg-red-100">+</button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
              <input type="date" value={purchaseDate} onChange={(e) => setPurchaseDate(e.target.value)} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Productos <span className="text-red-500">*</span></label>
            <div className="space-y-2">
              {purchaseItems.map((pi, idx) => (
                <div key={idx} className="flex gap-2 items-center">
                  <select value={pi.menu_item_id} onChange={(e) => { const items = [...purchaseItems]; items[idx].menu_item_id = e.target.value; const mi = menuItems.find(m => m.id === e.target.value); items[idx].name = mi?.name || ''; setPurchaseItems(items); }} className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm">
                    <option value="">Seleccionar...</option>
                    {menuItems.map((mi) => <option key={mi.id} value={mi.id}>{mi.name}</option>)}
                  </select>
                  <input type="number" value={pi.quantity || ''} onChange={(e) => { const items = [...purchaseItems]; items[idx].quantity = Number(e.target.value); setPurchaseItems(items); }} placeholder="Cant." min={1} className="w-20 rounded-lg border border-gray-200 px-3 py-2 text-sm" />
                  <input type="number" value={pi.unit_cost || ''} onChange={(e) => { const items = [...purchaseItems]; items[idx].unit_cost = Number(e.target.value); setPurchaseItems(items); }} placeholder="Costo" min={0} step="0.01" className="w-24 rounded-lg border border-gray-200 px-3 py-2 text-sm" />
                  <button type="button" onClick={() => { if (window.confirm('Eliminar este producto?')) { setPurchaseItems(purchaseItems.filter((_, i) => i !== idx)); } }} className="p-2 text-gray-400 hover:text-red-500"><X size={16} /></button>
                </div>
              ))}
              <button type="button" onClick={() => setPurchaseItems([...purchaseItems, { menu_item_id: '', name: '', quantity: 1, unit_cost: 0, itbis: true }])} className="text-sm text-red-600 hover:text-red-700 font-medium">+ Agregar producto</button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notas</label>
            <textarea value={purchaseNotes} onChange={(e) => setPurchaseNotes(e.target.value)} rows={2} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent" />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => { setAddModalOpen(false); setPurchaseItems([]); setPurchaseSupplier(''); setPurchaseNotes(''); }} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">Cancelar</button>
            <button type="submit" disabled={addSaving || purchaseItems.length === 0 || !purchaseItems.some(i => i.menu_item_id && i.quantity > 0)} className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"><Save size={16} /> {addSaving ? 'Guardando...' : 'Registrar Compra'}</button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={purchaseModalOpen}
        onClose={() => { setPurchaseModalOpen(false); setPurchaseItem(null) }}
        title={`Registrar Compra: ${purchaseItem?.item?.name || purchaseItem?.ingredient_name || ''}`}
        size="sm"
      >
        <form onSubmit={handlePurchaseSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Stock Actual
            </label>
            <p className="text-lg font-semibold text-gray-900">{purchaseItem?.stock}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cantidad a Comprar <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              value={purchaseQty}
              onChange={(e) => setPurchaseQty(Number(e.target.value))}
              min={0}
              step="0.01"
              required
              autoFocus
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nuevo Costo Promedio
            </label>
            <input
              type="number"
              value={purchaseCost}
              onChange={(e) => setPurchaseCost(Number(e.target.value))}
              min={0}
              step="0.01"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-400 mt-1">Stock nuevo: {Number(purchaseItem?.stock || 0) + Number(purchaseQty)}</p>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => { setPurchaseModalOpen(false); setPurchaseItem(null) }}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={purchaseSaving || purchaseQty <= 0}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
            >
              {purchaseSaving ? 'Guardando...' : 'Registrar Compra'}
            </button>
          </div>
        </form>
      </Modal>
    </>
  )
}
