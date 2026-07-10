'use client'

import { useState, useEffect } from 'react'
import { ColumnDef } from '@tanstack/react-table'
import { Plus } from 'lucide-react'
import { IconPencil, IconTrash2, IconCheckCircle } from '@/components/ui/Icons'
import toast from 'react-hot-toast'
import {
  getDeliveries,
  getDelivery,
  createDelivery,
  updateDelivery,
  markDelivered,
  deleteDelivery,
} from '@/services/deliveries'
import { getClients } from '@/services/clients'
import type { Delivery, Client } from '@/types/database'
import PageContainer from '@/components/layout/PageContainer'
import DataTable from '@/components/ui/DataTable'
import Modal from '@/components/ui/Modal'
import Badge from '@/components/ui/Badge'
import PrintActions from '@/components/ui/PrintActions'
import { formatDateShort } from '@/lib/utils'

interface DeliveryForm {
  client_id: string
  delivery_address: string
  delivery_person: string
  estimated_time: string
  notes: string
  status: Delivery['status']
}

const defaultForm: DeliveryForm = {
  client_id: '',
  delivery_address: '',
  delivery_person: '',
  estimated_time: '',
  notes: '',
  status: 'PENDING',
}

export default function EntregasPage() {
  const [deliveries, setDeliveries] = useState<Delivery[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingDelivery, setEditingDelivery] = useState<Delivery | null>(null)
  const [detailDelivery, setDetailDelivery] = useState<Delivery | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [form, setForm] = useState<DeliveryForm>(defaultForm)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const [deliveriesData, clientsData] = await Promise.all([
          getDeliveries(),
          getClients(),
        ])
        if (!cancelled) {
          setDeliveries(deliveriesData)
          setClients(clientsData)
        }
      } catch (err: any) {
        const msg = err.message || 'Error al cargar datos'
        if (!cancelled) {
          setError(msg)
          toast.error(msg)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [])

  async function fetchData() {
    try {
      const [deliveriesData, clientsData] = await Promise.all([
        getDeliveries(),
        getClients(),
      ])
      setDeliveries(deliveriesData)
      setClients(clientsData)
    } catch (err: any) {
      const msg = err.message || 'Error al cargar datos'
      setError(msg)
      toast.error(msg)
    }
  }

  useEffect(() => {
    if (window.location.search.includes('action=new')) {
      queueMicrotask(() => {
        setEditingDelivery(null)
        setForm(defaultForm)
        setModalOpen(true)
      })
    }
  }, [])

  const handleClose = () => {
    setModalOpen(false)
    setEditingDelivery(null)
    setForm(defaultForm)
    window.history.replaceState({}, '', window.location.pathname)
  }

  const handleEdit = (delivery: Delivery) => {
    setEditingDelivery(delivery)
    setForm({
      client_id: delivery.client_id,
      delivery_address: delivery.delivery_address,
      delivery_person: delivery.delivery_person || '',
      estimated_time: delivery.estimated_time || '',
      notes: delivery.notes || '',
      status: delivery.status,
    })
    setModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.client_id) {
      toast.error('Seleccione un cliente')
      return
    }
    if (!form.delivery_address.trim()) {
      toast.error('La dirección de entrega es requerida')
      return
    }
    setSaving(true)
    try {
      const payload: Partial<Delivery> = {
        client_id: form.client_id,
        delivery_address: form.delivery_address,
        delivery_person: form.delivery_person || undefined,
        estimated_time: form.estimated_time || undefined,
        notes: form.notes || undefined,
        status: form.status,
      }
      if (editingDelivery) {
        await updateDelivery(editingDelivery.id, payload)
        toast.success('Entrega actualizada correctamente')
      } else {
        await createDelivery(payload)
        toast.success('Entrega creada correctamente')
      }
      handleClose()
      fetchData()
    } catch (err: any) {
      toast.error(err.message || 'Error al guardar la entrega')
    } finally {
      setSaving(false)
    }
  }

  const handleMarkDelivered = async (delivery: Delivery) => {
    if (!window.confirm('¿Marcar esta entrega como entregada?')) return
    try {
      await markDelivered(delivery.id)
      toast.success('Entrega marcada como entregada')
      fetchData()
    } catch (err: any) {
      toast.error(err.message || 'Error al marcar la entrega')
    }
  }

  const handleDelete = async (delivery: Delivery) => {
    if (!window.confirm('¿Eliminar esta entrega? Esta acción no se puede deshacer.')) return
    try {
      await deleteDelivery(delivery.id)
      toast.success('Entrega eliminada correctamente')
      fetchData()
    } catch (err: any) {
      toast.error(err.message || 'Error al eliminar la entrega')
    }
  }

  const handleViewDetail = async (delivery: Delivery) => {
    try {
      const full = await getDelivery(delivery.id)
      setDetailDelivery(full)
      setDetailOpen(true)
    } catch (err: any) {
      toast.error(err.message || 'Error al cargar el detalle')
    }
  }

  if (loading) {
    return (
      <PageContainer
        title="Entregas"
        subtitle="Control de entregas"
        action={
          <button
            onClick={() => {
              setEditingDelivery(null)
              setForm(defaultForm)
              setModalOpen(true)
            }}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Nueva Entrega
          </button>
        }
      >
        <div className="flex items-center justify-center min-h-[40vh]">
          <p className="text-gray-500 text-lg">Cargando...</p>
        </div>
      </PageContainer>
    )
  }

  if (error) {
    return (
      <PageContainer
        title="Entregas"
        subtitle="Control de entregas"
        action={
          <button
            onClick={() => {
              setEditingDelivery(null)
              setForm(defaultForm)
              setModalOpen(true)
            }}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Nueva Entrega
          </button>
        }
      >
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

  const columns: ColumnDef<Delivery>[] = [
    {
      accessorKey: 'invoice.invoice_number',
      header: 'Factura',
      cell: ({ row }) => (
        <button
          onClick={() => handleViewDetail(row.original)}
          className="text-red-600 hover:text-red-700 font-medium hover:underline"
        >
          {row.original.invoice?.invoice_number || '—'}
        </button>
      ),
    },
    {
      accessorKey: 'client.full_name',
      header: 'Cliente',
    },
    {
      accessorKey: 'delivery_address',
      header: 'Dirección',
      cell: ({ row }) => (
        <span className="block max-w-[200px] truncate" title={row.original.delivery_address}>
          {row.original.delivery_address}
        </span>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Estado',
      cell: ({ row }) => <Badge status={row.original.status} />,
    },
    {
      accessorKey: 'delivery_person',
      header: 'Repartidor',
      cell: ({ row }) => row.original.delivery_person || '—',
    },
    {
      id: 'acciones',
      header: 'Acciones',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          {row.original.status !== 'DELIVERED' && row.original.status !== 'CANCELLED' && (
            <button
              onClick={() => handleMarkDelivered(row.original)}
              className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
              title="Marcar como entregado"
            >
              <IconCheckCircle className="h-4 w-4" />
            </button>
          )}
          <button
            onClick={() => handleEdit(row.original)}
            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="Editar"
          >
            <IconPencil className="h-4 w-4" />
          </button>
          <button
            onClick={() => handleDelete(row.original)}
            className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Eliminar"
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
        title="Entregas"
        subtitle="Control de entregas"
        action={
          <button
            onClick={() => {
              setEditingDelivery(null)
              setForm(defaultForm)
              setModalOpen(true)
            }}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Nueva Entrega
          </button>
        }
      >
        <DataTable columns={columns} data={deliveries} searchable />
      </PageContainer>

      <Modal
        isOpen={modalOpen}
        onClose={handleClose}
        title={editingDelivery ? 'Editar Entrega' : 'Nueva Entrega'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cliente <span className="text-red-500">*</span>
            </label>
            <select
              value={form.client_id}
              onChange={(e) => setForm({ ...form, client_id: e.target.value })}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
            >
              <option value="">Seleccione un cliente</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.full_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Dirección de Entrega <span className="text-red-500">*</span>
            </label>
            <textarea
              value={form.delivery_address}
              onChange={(e) => setForm({ ...form, delivery_address: e.target.value })}
              rows={3}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Repartidor
              </label>
              <input
                type="text"
                value={form.delivery_person}
                onChange={(e) => setForm({ ...form, delivery_person: e.target.value })}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tiempo Estimado
              </label>
              <input
                type="text"
                value={form.estimated_time}
                onChange={(e) => setForm({ ...form, estimated_time: e.target.value })}
                placeholder="Ej: 30 min, 1 hora"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Estado
            </label>
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value as Delivery['status'] })}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
            >
              <option value="PENDING">PENDIENTE</option>
              <option value="IN_PROGRESS">EN PROCESO</option>
              <option value="DELIVERED">ENTREGADO</option>
              <option value="CANCELLED">ANULADO</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notas
            </label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={2}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
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
              {saving ? 'Guardando...' : editingDelivery ? 'Actualizar' : 'Crear'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={detailOpen}
        onClose={() => { setDetailOpen(false); setDetailDelivery(null) }}
        title={`Entrega ${detailDelivery?.invoice?.invoice_number ? `#${detailDelivery.invoice.invoice_number}` : ''}`}
        size="xl"
      >
        {detailDelivery && (
          <div className="space-y-6">
            <div className="flex justify-end">
              <PrintActions elementId="delivery-detail" filename={`Entrega-${detailDelivery.id.slice(0, 8)}`} />
            </div>
            <div id="delivery-detail" className="space-y-6">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Cliente</p>
                  <p className="font-medium">{detailDelivery.client?.full_name}</p>
                </div>
                <div>
                  <p className="text-gray-500">Estado</p>
                  <Badge status={detailDelivery.status} />
                </div>
                <div>
                  <p className="text-gray-500">Dirección</p>
                  <p className="font-medium">{detailDelivery.delivery_address}</p>
                </div>
                <div>
                  <p className="text-gray-500">Repartidor</p>
                  <p className="font-medium">{detailDelivery.delivery_person || '—'}</p>
                </div>
                <div>
                  <p className="text-gray-500">Tiempo Estimado</p>
                  <p className="font-medium">{detailDelivery.estimated_time || '—'}</p>
                </div>
                <div>
                  <p className="text-gray-500">Factura</p>
                  <p className="font-medium">{detailDelivery.invoice?.invoice_number || '—'}</p>
                </div>
              </div>
              {detailDelivery.notes && (
                <div className="text-sm">
                  <p className="text-gray-500">Notas</p>
                  <p className="font-medium">{detailDelivery.notes}</p>
                </div>
              )}
              <div className="text-sm text-gray-400">
                <p>Creada: {formatDateShort(detailDelivery.created_at)}</p>
                {detailDelivery.delivered_at && <p>Entregada: {formatDateShort(detailDelivery.delivered_at)}</p>}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </>
  )
}
