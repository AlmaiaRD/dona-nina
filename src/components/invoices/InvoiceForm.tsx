'use client'

import { useState } from 'react'
import { Plus, X, Save, Search } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { normalize } from '@/lib/search'
import { formatCurrency } from '@/lib/utils'
import type { Client, BankAccount } from '@/types/database'

interface InvoiceFormItem {
  menu_item_id: string
  name: string
  quantity: number
  unit_price: number
  pv: number
  itbis: boolean
}

interface InvoiceFormProps {
  isOpen: boolean
  editingId: string | null
  selectedClient: string
  clients: Client[]
  invoiceDate: string
  items: InvoiceFormItem[]
  discountPercent: number
  discountAmount: number
  notes: string
  bankAccountId: string
  bankAccounts: BankAccount[]
  menuItems: any[]
  saving: boolean
  subtotal: number
  itbisTotal: number
  discountValue: number
  total: number
  onClientChange: (val: string) => void
  onInvoiceDateChange: (val: string) => void
  onDiscountPercentChange: (val: number) => void
  onDiscountAmountChange: (val: number) => void
  onNotesChange: (val: string) => void
  onBankAccountChange: (val: string) => void
  onItemsChange: (items: InvoiceFormItem[]) => void
  onSave: () => void
  onClose: () => void
  onNewClient: () => void
}

export function InvoiceForm({
  isOpen,
  editingId,
  selectedClient,
  clients,
  invoiceDate,
  items,
  discountPercent,
  discountAmount,
  notes,
  bankAccountId,
  bankAccounts,
  menuItems,
  saving,
  subtotal,
  itbisTotal,
  discountValue,
  total,
  onClientChange,
  onInvoiceDateChange,
  onDiscountPercentChange,
  onDiscountAmountChange,
  onNotesChange,
  onBankAccountChange,
  onItemsChange,
  onSave,
  onClose,
  onNewClient,
}: InvoiceFormProps) {
  const [showMenuItems, setShowMenuItems] = useState(false)
  const [menuItemSearch, setMenuItemSearch] = useState('')
  const [showManualProduct, setShowManualProduct] = useState(false)
  const [manualProduct, setManualProduct] = useState({ name: '', quantity: 1, unit_price: 0, itbis: false })

  const menuItemsFiltered = menuItems.filter((item: any) =>
    !menuItemSearch || normalize(item.name).includes(normalize(menuItemSearch))
  )

  function addMenuItem(item: any) {
    const exists = items.find(i => i.menu_item_id === item.id)
    if (exists) {
      onItemsChange(items.map(i =>
        i.menu_item_id === item.id ? { ...i, quantity: i.quantity + 1 } : i
      ))
    } else {
      onItemsChange([...items, {
        menu_item_id: item.id,
        name: item.name,
        quantity: 1,
        unit_price: Number(item.price),
        pv: Number(item.pv || 0),
        itbis: item.itbis_enabled !== false,
      }])
    }
  }

  function addManualProduct() {
    if (!manualProduct.name.trim() || manualProduct.unit_price <= 0) return
    onItemsChange([...items, {
      menu_item_id: '',
      name: manualProduct.name,
      quantity: manualProduct.quantity,
      unit_price: manualProduct.unit_price,
      pv: 0,
      itbis: manualProduct.itbis,
    }])
    setManualProduct({ name: '', quantity: 1, unit_price: 0, itbis: false })
    setShowManualProduct(false)
  }

  function removeItem(index: number) {
    onItemsChange(items.filter((_, i) => i !== index))
  }

  function updateItem(index: number, updates: Partial<InvoiceFormItem>) {
    onItemsChange(items.map((item, i) => i === index ? { ...item, ...updates } : item))
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingId ? 'Editar Factura' : 'Nueva Factura'}
      size="xl"
    >
      <div className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-1.5">Cliente</label>
          <div className="flex gap-2">
            <select
              value={selectedClient}
              onChange={(e) => onClientChange(e.target.value)}
              className="flex-1 h-12 px-4 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-200 transition-all"
            >
              <option value="">Seleccionar cliente...</option>
              {clients.map((c) => <option key={c.id} value={c.id}>{c.full_name}</option>)}
            </select>
            <button
              onClick={onNewClient}
              className="h-12 px-4 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700 transition-all flex items-center gap-1.5"
            >
              <Plus size={16} /> Cliente
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-900 mb-1.5">Fecha de factura</label>
          <input
            type="date" value={invoiceDate}
            onChange={(e) => onInvoiceDateChange(e.target.value)}
            className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-200 transition-all"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-medium text-gray-900">Productos</label>
            <div className="flex gap-2">
              <button
                onClick={() => { setShowMenuItems(!showMenuItems); setShowManualProduct(false); }}
                className="text-xs text-red-600 hover:underline"
              >
                {showMenuItems ? 'Ocultar catálogo' : 'Catálogo'}
              </button>
              <button
                onClick={() => { setShowManualProduct(!showManualProduct); setShowMenuItems(false); }}
                className="text-xs text-red-600 hover:underline"
              >
                {showManualProduct ? 'Cancelar' : 'Manual'}
              </button>
            </div>
          </div>

          {showMenuItems && (
            <div className="mb-4 bg-gray-50 rounded-xl overflow-hidden">
              <div className="p-2">
                <div className="relative">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input
                    type="text"
                    placeholder="Buscar producto..."
                    onChange={(e) => setMenuItemSearch(e.target.value)}
                    className="w-full h-10 pl-9 pr-3 rounded-lg border border-gray-200 bg-white text-sm text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-200 transition-all"
                    autoFocus
                  />
                </div>
              </div>
              <div className="max-h-48 overflow-y-auto px-2 pb-2 space-y-0.5">
                {menuItemsFiltered.length === 0 ? (
                  <p className="text-sm text-gray-500 py-3 text-center">Sin resultados</p>
                ) : menuItemsFiltered.map((item: any) => (
                  <button
                    key={item.id}
                    onClick={() => { addMenuItem(item); setShowMenuItems(false); setMenuItemSearch(''); }}
                    className="w-full text-left px-3 py-2 text-sm text-gray-900 hover:bg-white rounded-lg transition-colors flex justify-between"
                  >
                    <span>{item.name}</span>
                    <span className="text-gray-500 text-xs">
                      {item.category?.name} — {formatCurrency(item.price)}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {showManualProduct && (
            <div className="mb-4 bg-gray-50 rounded-xl p-4 space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-900 mb-1">Nombre del producto / costo</label>
                <input
                  type="text"
                  value={manualProduct.name}
                  onChange={(e) => setManualProduct({ ...manualProduct, name: e.target.value })}
                  placeholder="Ej: Envío, flete, cargo adicional..."
                  className="w-full h-10 px-3 rounded-lg border border-gray-200 bg-white text-sm text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-200 transition-all"
                  autoFocus
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-900 mb-1">Cantidad</label>
                  <input
                    type="number" min={1} value={manualProduct.quantity}
                    onChange={(e) => setManualProduct({ ...manualProduct, quantity: Number(e.target.value) })}
                    className="w-full h-10 px-3 rounded-lg border border-gray-200 bg-white text-sm text-center focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-200 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-900 mb-1">Precio Unit.</label>
                  <input
                    type="number" step="0.01" min={0} value={manualProduct.unit_price}
                    onChange={(e) => setManualProduct({ ...manualProduct, unit_price: Number(e.target.value) })}
                    placeholder="0.00"
                    className="w-full h-10 px-3 rounded-lg border border-gray-200 bg-white text-sm text-center focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-200 transition-all"
                  />
                </div>
                <div className="flex items-end pb-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <span className="text-xs font-medium text-gray-900">ITBIS</span>
                    <button
                      type="button"
                      onClick={() => setManualProduct({ ...manualProduct, itbis: !manualProduct.itbis })}
                      className={`relative w-10 h-5 rounded-full transition-colors ${manualProduct.itbis ? 'bg-red-600' : 'bg-gray-300'}`}
                    >
                      <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${manualProduct.itbis ? 'translate-x-5' : 'translate-x-0.5'}`} />
                    </button>
                  </label>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => { setShowManualProduct(false); setManualProduct({ name: '', quantity: 1, unit_price: 0, itbis: false }); }}
                  className="flex-1 h-9 border border-gray-200 text-gray-900 rounded-lg text-xs font-medium hover:bg-white transition-all"
                >
                  Cancelar
                </button>
                <button
                  onClick={addManualProduct}
                  className="flex-1 h-9 bg-red-600 text-white rounded-lg text-xs font-medium hover:bg-red-700 transition-all"
                >
                  Agregar a factura
                </button>
              </div>
            </div>
          )}

          {items.length === 0 ? (
            <p className="text-sm text-gray-500 py-3">No hay productos agregados</p>
          ) : (
            <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
              {items.map((item, i) => (
                <div key={i} className="flex items-center gap-3 bg-gray-50 rounded-xl p-3 flex-wrap sm:flex-nowrap">
                  <div className="flex-1 text-sm text-gray-900 min-w-[120px] sm:min-w-0">{item.name}</div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number" min={1} value={item.quantity}
                      onChange={(e) => updateItem(i, { quantity: Number(e.target.value) })}
                      className="w-14 sm:w-16 h-9 px-2 rounded-lg border border-gray-200 text-center text-sm"
                    />
                    <input
                      type="number" step="0.01" value={item.unit_price}
                      onChange={(e) => updateItem(i, { unit_price: Number(e.target.value) })}
                      className="w-20 sm:w-24 h-9 px-2 rounded-lg border border-gray-200 text-center text-sm"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => updateItem(i, { itbis: !item.itbis })}
                      className={`relative w-10 sm:w-12 h-5 sm:h-6 rounded-full transition-colors flex-shrink-0 ${item.itbis ? 'bg-red-600' : 'bg-gray-300'}`}
                    >
                      <div className={`absolute top-0.5 w-4 sm:w-5 h-4 sm:h-5 bg-white rounded-full shadow-sm transition-transform ${item.itbis ? 'translate-x-[18px] sm:translate-x-6' : 'translate-x-0.5'}`} />
                    </button>
                    <span className={`text-sm font-medium w-16 sm:w-20 text-right ${item.itbis ? 'text-gray-900' : 'text-gray-500'}`}>
                      {formatCurrency(item.quantity * item.unit_price)}
                    </span>
                    <button onClick={() => removeItem(i)} className="p-1 text-red-400 hover:bg-white rounded-lg">
                      <X size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1.5">Descuento %</label>
            <input
              type="number" value={discountPercent}
              onChange={(e) => { onDiscountPercentChange(Number(e.target.value)); onDiscountAmountChange(0); }}
              className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-200 transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1.5">Descuento RD$</label>
            <input
              type="number" value={discountAmount}
              onChange={(e) => { onDiscountAmountChange(Number(e.target.value)); onDiscountPercentChange(0); }}
              className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-200 transition-all"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-900 mb-1.5">Notas (opcional)</label>
          <textarea
            value={notes}
            onChange={(e) => onNotesChange(e.target.value)}
            rows={3}
            placeholder="Notas adicionales para la factura..."
            className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-200 transition-all resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-900 mb-1.5">Banco para transferencia</label>
          <select
            value={bankAccountId}
            onChange={(e) => onBankAccountChange(e.target.value)}
            className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-200 transition-all"
          >
            <option value="">Seleccionar banco...</option>
            {bankAccounts.map((b) => (
              <option key={b.id} value={b.id}>{b.bank_name} — {b.account_type} — No. {b.account_number}</option>
            ))}
          </select>
          {(() => {
            const selected = bankAccounts.find(b => b.id === bankAccountId);
            if (!selected) return null;
            return (
              <div className="mt-2 bg-gray-50 rounded-lg p-3 text-sm space-y-1">
                <p className="text-gray-900"><span className="text-gray-500">Beneficiario:</span> {selected.holder_name}</p>
                {selected.id_number && <p className="text-gray-900"><span className="text-gray-500">Cédula/RNC:</span> {selected.id_number}</p>}
                <p className="text-gray-900"><span className="text-gray-500">Banco:</span> {selected.bank_name}</p>
                <p className="text-gray-900"><span className="text-gray-500">Tipo:</span> {selected.account_type}</p>
                <p className="text-gray-900"><span className="text-gray-500">No. Cuenta:</span> {selected.account_number}</p>
                {selected.email && <p className="text-gray-900"><span className="text-gray-500">Correo:</span> {selected.email}</p>}
              </div>
            );
          })()}
        </div>

        <div className="bg-gray-50 rounded-xl p-4 space-y-1 text-sm">
          <div className="flex justify-between"><span className="text-gray-500">Subtotal</span><span>{formatCurrency(subtotal)}</span></div>
          {itbisTotal > 0 && (
            <div className="flex justify-between"><span className="text-gray-500">ITBIS (18%)</span><span>{formatCurrency(itbisTotal)}</span></div>
          )}
          <div className="flex justify-between"><span className="text-gray-500">Descuento</span><span className="text-red-400">-{formatCurrency(discountValue)}</span></div>
          <div className="flex justify-between text-base font-bold pt-1 border-t border-gray-200"><span>Total</span><span>{formatCurrency(total)}</span></div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 h-12 border border-gray-200 text-gray-900 rounded-xl text-sm font-medium hover:bg-gray-50 transition-all"
          >
            Cancelar
          </button>
          <button
            onClick={onSave}
            disabled={saving}
            className="flex-1 h-12 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700 transition-all shadow-sm disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Save size={18} />
            {saving ? 'Guardando...' : (editingId ? 'Actualizar Factura' : 'Guardar Factura')}
          </button>
        </div>
      </div>
    </Modal>
  )
}
