'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { Plus } from 'lucide-react'
import { IconPencil, IconTrash2 } from '@/components/ui/Icons'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import type { ColumnDef } from '@tanstack/react-table'
import { PageContainer } from '@/components/layout/PageContainer'
import { DataTable } from '@/components/ui/DataTable'
import { Modal } from '@/components/ui/Modal'
import { Badge } from '@/components/ui/Badge'
import { PrintActions } from '@/components/ui/PrintActions'
import { formatCurrency, formatDate, formatDateShort } from '@/lib/utils'
import { createClient, updateClient, deleteClient } from '@/services/clients'
import { getClientInvoices } from '@/services/invoices'
import { getClientReceipts } from '@/services/receipts'
import { getClientFollowups } from '@/services/followups'
import type { Client, Invoice, Receipt, Followup } from '@/types/database'

const clientSchema = z.object({
  full_name: z.string().min(1, 'El nombre es requerido'),
  phone: z.string().optional().or(z.literal('')),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  address: z.string().optional().or(z.literal('')),
  notes: z.string().optional().or(z.literal('')),
  birthday: z.string().optional().or(z.literal('')),
  lead_source: z.string().optional().or(z.literal('')),
  stage: z.string().optional().or(z.literal('')),
  interest: z.string().optional().or(z.literal('')),
  first_contact_date: z.string().optional().or(z.literal('')),
  next_followup_date: z.string().optional().or(z.literal('')),
})

type ClientFormData = z.infer<typeof clientSchema>

const stages = ['Prospecto', 'Activo', 'Inactivo', 'VIP']

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingClient, setEditingClient] = useState<Client | null>(null)
  const [detailClient, setDetailClient] = useState<Client | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'info' | 'invoices' | 'receipts' | 'history'>('info')
  const [clientInvoices, setClientInvoices] = useState<Invoice[]>([])
  const [clientReceipts, setClientReceipts] = useState<Receipt[]>([])
  const [clientFollowups, setClientFollowups] = useState<Followup[]>([])
  const [clientDataLoading, setClientDataLoading] = useState(false)

  const searchParams = useSearchParams()

  const form = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      full_name: '',
      phone: '',
      email: '',
      address: '',
      notes: '',
      birthday: '',
      lead_source: '',
      stage: '',
      interest: '',
      first_contact_date: '',
      next_followup_date: '',
    },
  })

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch('/api/clients')
        const { data } = await res.json()
        if (!cancelled) setClients(data || [])
      } catch (err) { console.error('[ClientesPage] Error:', err); if (!cancelled) setError('Error al cargar los clientes') }
      finally { if (!cancelled) setLoading(false) }
    })()
    return () => { cancelled = true }
  }, [])

  async function fetchClients() {
    try {
      const res = await fetch('/api/clients')
      const { data } = await res.json()
      setClients(data || [])
    } catch (err) { console.error('[ClientesPage] Error:', err); setError('Error al cargar los clientes') }
  }

  const handleOpenCreate = useCallback(() => {
    setEditingClient(null)
    form.reset({
      full_name: '',
      phone: '',
      email: '',
      address: '',
      notes: '',
      birthday: '',
      lead_source: '',
      stage: '',
      interest: '',
      first_contact_date: new Date().toISOString().split('T')[0],
      next_followup_date: '',
    })
    setModalOpen(true)
  }, [form])

  useEffect(() => {
    if (searchParams.get('action') === 'new') {
      queueMicrotask(() => handleOpenCreate())
    }
  }, [searchParams, handleOpenCreate])

  function handleOpenEdit(client: Client) {
    setEditingClient(client)
    form.reset({
      full_name: client.full_name,
      phone: client.phone ?? '',
      email: client.email ?? '',
      address: client.address ?? '',
      notes: client.notes ?? '',
      birthday: client.birthday ?? '',
      lead_source: client.lead_source ?? '',
      stage: client.stage ?? '',
      interest: client.interest ?? '',
      first_contact_date: client.first_contact_date ?? '',
      next_followup_date: client.next_followup_date ?? '',
    })
    setModalOpen(true)
  }

  async function handleSubmit(data: ClientFormData) {
    try {
      if (editingClient) {
        await updateClient(editingClient.id, data)
        toast.success('Cliente actualizado correctamente')
      } else {
        await createClient(data)
        toast.success('Cliente creado correctamente')
      }
      setModalOpen(false)
      await fetchClients()
    } catch (err) { console.error('[ClientesPage] Error:', err); toast.error('Error al guardar el cliente') }
  }

  async function handleViewDetail(client: Client) {
    setDetailClient(client)
    setActiveTab('info')
    setDetailOpen(true)
    setClientDataLoading(true)
    try {
      const [invoices, receipts, followups] = await Promise.all([
        getClientInvoices(client.id),
        getClientReceipts(client.id),
        getClientFollowups(client.id),
      ])
      setClientInvoices(invoices)
      setClientReceipts(receipts)
      setClientFollowups(followups)
    } catch (err) {
      console.error('Error loading client data:', err)
    } finally {
      setClientDataLoading(false)
    }
  }

  async function handleDelete(client: Client) {
    if (!window.confirm(`¿Estás seguro de eliminar a ${client.full_name}?`)) return
    try {
      await deleteClient(client.id)
      toast.success('Cliente eliminado correctamente')
      await fetchClients()
    } catch (err) { console.error('[ClientesPage] Error:', err); toast.error('Error al eliminar el cliente') }
  }

  const columns: ColumnDef<Client>[] = [
    {
      accessorKey: 'full_name',
      header: 'Nombre',
      cell: ({ row }) => (
        <button
          onClick={() => handleViewDetail(row.original)}
          className="text-blue-600 hover:text-blue-800 hover:underline font-medium transition-colors"
        >
          {row.original.full_name}
        </button>
      ),
    },
    {
      accessorKey: 'phone',
      header: 'Teléfono',
    },
    {
      accessorKey: 'email',
      header: 'Email',
    },
    {
      accessorKey: 'credit_balance',
      header: 'Balance',
      cell: ({ row }) => formatCurrency(row.original.credit_balance),
    },
    {
      accessorKey: 'stage',
      header: 'Estado',
      cell: ({ row }) => <Badge status={row.original.stage} />,
    },
    {
      id: 'acciones',
      header: '',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleOpenEdit(row.original)}
            className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
            aria-label="Editar"
          >
            <IconPencil className="h-4 w-4" />
          </button>
          <button
            onClick={() => handleDelete(row.original)}
            className="p-1.5 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors"
            aria-label="Eliminar"
          >
            <IconTrash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ]

  if (loading) {
    return (
      <PageContainer title="Clientes" subtitle="Gestión de clientes">
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
        </div>
      </PageContainer>
    )
  }

  if (error) {
    return (
      <PageContainer title="Clientes" subtitle="Gestión de clientes">
        <div className="text-center py-20">
          <p className="text-gray-500 mb-4">{error}</p>
          <button
            onClick={fetchClients}
            className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition-colors"
          >
            Reintentar
          </button>
        </div>
      </PageContainer>
    )
  }

  return (
    <PageContainer
      title="Clientes"
      subtitle="Gestión de clientes"
      action={
        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Nuevo Cliente
        </button>
      }
    >
      <DataTable columns={columns} data={clients} searchable pageSize={20} />

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingClient ? 'Editar Cliente' : 'Nuevo Cliente'}
        size="lg"
      >
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre <span className="text-red-500">*</span>
            </label>
            <input
              {...form.register('full_name')}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
            {form.formState.errors.full_name && (
              <p className="text-red-500 text-xs mt-1">{form.formState.errors.full_name.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
              <input
                {...form.register('phone')}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                {...form.register('email')}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
              {form.formState.errors.email && (
                <p className="text-red-500 text-xs mt-1">{form.formState.errors.email.message}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Dirección</label>
            <input
              {...form.register('address')}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notas</label>
            <textarea
              {...form.register('notes')}
              rows={3}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cumpleaños</label>
              <input
                type="date"
                {...form.register('birthday')}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Etapa</label>
              <select
                {...form.register('stage')}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              >
                <option value="">Seleccionar...</option>
                {stages.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fuente</label>
              <input
                {...form.register('lead_source')}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="Ej: Referido, Redes, Whatsapp"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Interés</label>
              <input
                {...form.register('interest')}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="Ej: Pasteles, Postres, Salados"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha 1er Contacto</label>
              <input
                type="date"
                {...form.register('first_contact_date')}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Próximo Seguimiento</label>
              <input
                type="date"
                {...form.register('next_followup_date')}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
            >
              {editingClient ? 'Guardar Cambios' : 'Crear Cliente'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={detailOpen}
        onClose={() => { setDetailOpen(false); setDetailClient(null) }}
        title={detailClient?.full_name ?? 'Detalle del Cliente'}
        size="lg"
      >
        {detailClient && (
          <div>
            <div className="flex justify-end mb-4">
              <PrintActions elementId="client-detail" filename={`cliente-${detailClient.full_name}`} />
            </div>

            <div className="border-b border-gray-200 mb-4">
              <nav className="flex gap-6">
                {(['info', 'invoices', 'receipts', 'history'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`pb-2 text-sm font-medium border-b-2 transition-colors ${
                      activeTab === tab
                        ? 'border-red-600 text-red-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {tab === 'info' ? 'Información' : tab === 'invoices' ? 'Facturas' : tab === 'receipts' ? 'Recibos' : 'Historial'}
                  </button>
                ))}
              </nav>
            </div>

            {activeTab === 'info' && (
              <div id="client-detail" className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Nombre</label>
                    <p className="text-gray-900">{detailClient.full_name}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Teléfono</label>
                    <p className="text-gray-900">{detailClient.phone || '—'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Email</label>
                    <p className="text-gray-900">{detailClient.email || '—'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Dirección</label>
                    <p className="text-gray-900">{detailClient.address || '—'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Cumpleaños</label>
                    <p className="text-gray-900">{detailClient.birthday ? formatDateShort(detailClient.birthday) : '—'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Fuente</label>
                    <p className="text-gray-900">{detailClient.lead_source || '—'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Etapa</label>
                    <p className="text-gray-900">
                      {detailClient.stage ? <Badge status={detailClient.stage} /> : '—'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Interés</label>
                    <p className="text-gray-900">{detailClient.interest || '—'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Fecha 1er Contacto</label>
                    <p className="text-gray-900">{detailClient.first_contact_date ? formatDateShort(detailClient.first_contact_date) : '—'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Próximo Seguimiento</label>
                    <p className="text-gray-900">{detailClient.next_followup_date ? formatDateShort(detailClient.next_followup_date) : '—'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Último Contacto</label>
                    <p className="text-gray-900">{detailClient.last_contact_date ? formatDateShort(detailClient.last_contact_date) : '—'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Balance de Crédito</label>
                    <p className="text-gray-900">{formatCurrency(detailClient.credit_balance)}</p>
                  </div>
                </div>
                {detailClient.notes && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Notas</label>
                    <p className="text-gray-900 whitespace-pre-wrap">{detailClient.notes}</p>
                  </div>
                )}
                {detailClient.created_at && (
                  <p className="text-xs text-gray-400">Creado: {formatDate(detailClient.created_at)}</p>
                )}
              </div>
            )}

            {activeTab === 'invoices' && (
              <div>
                {clientDataLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="h-6 w-6 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : clientInvoices.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-8">Sin facturas registradas</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase">No.</th>
                          <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Fecha</th>
                          <th className="px-3 py-2 text-right text-xs font-semibold text-gray-500 uppercase">Total</th>
                          <th className="px-3 py-2 text-right text-xs font-semibold text-gray-500 uppercase">Pagado</th>
                          <th className="px-3 py-2 text-center text-xs font-semibold text-gray-500 uppercase">Estado</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {clientInvoices.map((inv) => (
                          <tr key={inv.id} className="hover:bg-gray-50">
                            <td className="px-3 py-2 text-sm text-gray-700">{inv.invoice_number}</td>
                            <td className="px-3 py-2 text-sm text-gray-700">{formatDateShort(inv.invoice_date)}</td>
                            <td className="px-3 py-2 text-sm text-gray-700 text-right">{formatCurrency(inv.total)}</td>
                            <td className="px-3 py-2 text-sm text-gray-700 text-right">{formatCurrency(inv.amount_paid)}</td>
                            <td className="px-3 py-2 text-center"><Badge status={inv.status} /></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'receipts' && (
              <div>
                {clientDataLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="h-6 w-6 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : clientReceipts.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-8">Sin recibos registrados</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase">No.</th>
                          <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Fecha</th>
                          <th className="px-3 py-2 text-right text-xs font-semibold text-gray-500 uppercase">Monto</th>
                          <th className="px-3 py-2 text-center text-xs font-semibold text-gray-500 uppercase">Método</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {clientReceipts.map((rec) => (
                          <tr key={rec.id} className="hover:bg-gray-50">
                            <td className="px-3 py-2 text-sm text-gray-700">{rec.receipt_number}</td>
                            <td className="px-3 py-2 text-sm text-gray-700">{formatDateShort(rec.receipt_date)}</td>
                            <td className="px-3 py-2 text-sm text-gray-700 text-right">{formatCurrency(rec.amount)}</td>
                            <td className="px-3 py-2 text-center text-sm text-gray-700">{rec.payment_method}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'history' && (
              <div>
                {clientDataLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="h-6 w-6 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : clientFollowups.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-8">Sin seguimientos registrados</p>
                ) : (
                  <div className="space-y-3">
                    {clientFollowups.map((f) => (
                      <div key={f.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-900">
                              {formatDateShort(f.contact_date)}
                            </span>
                            <Badge status={f.status} />
                          </div>
                          {f.comments && (
                            <p className="text-sm text-gray-600 mt-1">{f.comments}</p>
                          )}
                          {f.next_followup && (
                            <p className="text-xs text-gray-400 mt-1">
                              Próximo: {formatDateShort(f.next_followup)}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </Modal>
    </PageContainer>
  )
}
