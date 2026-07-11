'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { MessageSquare } from 'lucide-react'
import { IconEye, IconPencil, IconTrash2 } from '@/components/ui/Icons'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import type { ColumnDef } from '@tanstack/react-table'
import { PageContainer } from '@/components/layout/PageContainer'
import { DataTable } from '@/components/ui/DataTable'
import { Modal } from '@/components/ui/Modal'
import { Badge } from '@/components/ui/Badge'
import { formatDateShort } from '@/lib/utils'
import { getCommunications, createCommunication, updateCommunication, deleteCommunication } from '@/services/communications'
import { PrintActions } from '@/components/ui/PrintActions'
import { getClients } from '@/services/clients'
import type { Communication, Client } from '@/types/database'

type CommunicationRow = Communication & { client: Client }

const commSchema = z.object({
  client_id: z.string().min(1, 'El cliente es requerido'),
  type: z.enum(['email', 'whatsapp']),
  direction: z.enum(['outgoing', 'incoming']),
  subject: z.string().optional().or(z.literal('')),
  body: z.string().optional().or(z.literal('')),
  status: z.enum(['draft', 'sent', 'failed']),
})

type CommFormData = z.infer<typeof commSchema>

export default function CommunicationsPage() {
  const [communications, setCommunications] = useState<CommunicationRow[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [detailOpen, setDetailOpen] = useState(false)
  const [detailComm, setDetailComm] = useState<CommunicationRow | null>(null)
  const [editingComm, setEditingComm] = useState<CommunicationRow | null>(null)
  const [editModalOpen, setEditModalOpen] = useState(false)

  const searchParams = useSearchParams()
  const router = useRouter()

  const form = useForm<CommFormData>({
    resolver: zodResolver(commSchema),
    defaultValues: {
      client_id: '',
      type: 'email',
      direction: 'outgoing',
      subject: '',
      body: '',
      status: 'draft',
    },
  })

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const [comms, clts] = await Promise.all([
          getCommunications(),
          getClients(),
        ])
        if (!cancelled) {
          setCommunications(comms as unknown as CommunicationRow[])
          setClients(clts)
        }
      } catch (err) { console.error('[CommunicationsPage] Error:', err); if (!cancelled) setError('Error al cargar los datos') }
      finally { if (!cancelled) setLoading(false) }
    })()
    return () => { cancelled = true }
  }, [])

  async function fetchData() {
    try {
      const [comms, clts] = await Promise.all([
        getCommunications(),
        getClients(),
      ])
      setCommunications(comms as unknown as CommunicationRow[])
      setClients(clts)
    } catch (err) { console.error('[CommunicationsPage] Error:', err); setError('Error al cargar los datos') }
    finally { setLoading(false) }
  }

  useEffect(() => {
    if (searchParams.get('action') === 'new') {
      router.replace('/comunicaciones')
    }
  }, [searchParams, router])

  useEffect(() => {
    queueMicrotask(() => {
      setEditingComm(null)
      setEditModalOpen(false)
      setModalOpen(true)
    })
  }, [searchParams])

  async function handleSubmit(data: CommFormData) {
    try {
      await createCommunication(data)
      toast.success('Comunicación creada correctamente')
      setModalOpen(false)
      form.reset()
      await fetchData()
    } catch (err) { console.error('[CommunicationsPage] Error:', err); toast.error('Error al crear la comunicación') }
  }

  const handleViewDetail = (comm: CommunicationRow) => {
    setDetailComm(comm)
    setDetailOpen(true)
  }

  const handleEdit = (comm: CommunicationRow) => {
    setEditingComm(comm)
    form.reset({
      client_id: comm.client_id,
      type: comm.type as 'email' | 'whatsapp',
      direction: comm.direction as 'outgoing' | 'incoming',
      subject: comm.subject || '',
      body: comm.body || '',
      status: comm.status as 'draft' | 'sent' | 'failed',
    })
    setEditModalOpen(true)
  }

  const handleUpdate = async (data: CommFormData) => {
    if (!editingComm) return
    try {
      await updateCommunication(editingComm.id, data)
      toast.success('Comunicación actualizada correctamente')
      setEditModalOpen(false)
      setEditingComm(null)
      form.reset()
      await fetchData()
    } catch (err) { console.error('[CommunicationsPage] Error:', err); toast.error('Error al actualizar la comunicación') }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar esta comunicación?')) return
    try {
      await deleteCommunication(id)
      toast.success('Comunicación eliminada correctamente')
      await fetchData()
    } catch (err) { console.error('[CommunicationsPage] Error:', err); toast.error('Error al eliminar la comunicación') }
  }

  const columns: ColumnDef<CommunicationRow>[] = [
    {
      id: 'cliente',
      header: 'Cliente',
      cell: ({ row }) => row.original.client?.full_name || '-',
    },
    {
      accessorKey: 'type',
      header: 'Tipo',
      cell: ({ row }) => (
        <Badge
          status={row.original.type}
          className={
            row.original.type === 'email'
              ? 'bg-blue-100 text-blue-800'
              : 'bg-green-100 text-green-800'
          }
        />
      ),
    },
    {
      accessorKey: 'direction',
      header: 'Dirección',
      cell: ({ row }) => (
        <Badge
          status={row.original.direction}
          className={
            row.original.direction === 'outgoing'
              ? 'bg-blue-100 text-blue-800'
              : 'bg-yellow-100 text-yellow-800'
          }
        />
      ),
    },
    {
      accessorKey: 'subject',
      header: 'Asunto',
      cell: ({ row }) => {
        const subject = row.original.subject
        return subject && subject.length > 50
          ? subject.slice(0, 50) + '...'
          : subject || '-'
      },
    },
    {
      accessorKey: 'status',
      header: 'Estado',
      cell: ({ row }) => <Badge status={row.original.status} />,
    },
    {
      accessorKey: 'created_at',
      header: 'Fecha',
      cell: ({ row }) => formatDateShort(row.original.created_at),
    },
    {
      id: 'acciones',
      header: 'Acciones',
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <button
            onClick={() => handleViewDetail(row.original)}
            className="p-1.5 text-gray-600 hover:bg-[#FDF8F3] rounded-lg transition-colors"
            title="Ver detalle"
          >
            <IconEye className="h-4 w-4" />
          </button>
          <button
            onClick={() => handleEdit(row.original)}
            className="p-1.5 text-blue-600 hover:bg-[#2C4A6E]/10 rounded-lg transition-colors"
            title="Editar"
          >
            <IconPencil className="h-4 w-4" />
          </button>
          <button
            onClick={() => handleDelete(row.original.id)}
            className="p-1.5 text-[#7C1D2E] hover:bg-[#7C1D2E]/10 rounded-lg transition-colors"
            title="Eliminar"
          >
            <IconTrash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ]

  if (loading) {
    return (
      <PageContainer title="Comunicaciones" subtitle="Historial de comunicaciones">
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
        </div>
      </PageContainer>
    )
  }

  if (error) {
    return (
      <PageContainer title="Comunicaciones" subtitle="Historial de comunicaciones">
        <div className="text-center py-20">
          <p className="text-[#9C8A82] mb-4">{error}</p>
          <button
            onClick={fetchData}
            className="px-4 py-2 bg-[#7C1D2E] text-white rounded-lg text-sm hover:bg-[#5C1420] transition-colors"
          >
            Reintentar
          </button>
        </div>
      </PageContainer>
    )
  }

  return (
    <PageContainer
      title="Comunicaciones"
      subtitle="Historial de comunicaciones"
      action={
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#7C1D2E] text-white rounded-lg text-sm font-medium hover:bg-[#5C1420] transition-colors"
        >
          <MessageSquare className="h-4 w-4" />
          Nueva Comunicación
        </button>
      }
    >
      <DataTable columns={columns} data={communications} searchable pageSize={20} />

      <Modal isOpen={detailOpen} onClose={() => setDetailOpen(false)} title="Detalle de Comunicación" size="xl">
        {detailComm && (
          <div className="space-y-4">
            <div className="flex justify-end">
              <PrintActions elementId="communication-detail" filename={`comunicacion-${detailComm.id}`} />
            </div>
            <div id="communication-detail" className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-medium text-[#9C8A82] uppercase tracking-wider">Cliente</p>
                  <p className="text-sm text-[#3D2B1F] mt-0.5">{detailComm.client?.full_name || '—'}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-[#9C8A82] uppercase tracking-wider">Tipo</p>
                  <p className="text-sm text-[#3D2B1F] mt-0.5 capitalize">{detailComm.type}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-[#9C8A82] uppercase tracking-wider">Dirección</p>
                  <p className="text-sm text-[#3D2B1F] mt-0.5 capitalize">{detailComm.direction === 'outgoing' ? 'Saliente' : 'Entrante'}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-[#9C8A82] uppercase tracking-wider">Estado</p>
                  <p className="text-sm text-[#3D2B1F] mt-0.5 capitalize">{detailComm.status}</p>
                </div>
                <div className="sm:col-span-2">
                  <p className="text-xs font-medium text-[#9C8A82] uppercase tracking-wider">Asunto</p>
                  <p className="text-sm text-[#3D2B1F] mt-0.5">{detailComm.subject || '—'}</p>
                </div>
                {detailComm.body && (
                  <div className="sm:col-span-2">
                    <p className="text-xs font-medium text-[#9C8A82] uppercase tracking-wider">Cuerpo</p>
                    <p className="text-sm text-[#3D2B1F] mt-0.5 whitespace-pre-wrap">{detailComm.body}</p>
                  </div>
                )}
                <div className="sm:col-span-2">
                  <p className="text-xs font-medium text-[#9C8A82] uppercase tracking-wider">Fecha de Creación</p>
                  <p className="text-sm text-[#3D2B1F] mt-0.5">{formatDateShort(detailComm.created_at)}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>

      <Modal isOpen={editModalOpen} onClose={() => { setEditModalOpen(false); setEditingComm(null) }} title="Editar Comunicación" size="lg">
        <form onSubmit={form.handleSubmit(handleUpdate)} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#3D2B1F] mb-1">
                Tipo <span className="text-[#E07A3A]">*</span>
              </label>
              <select
                {...form.register('type')}
                className="w-full px-3 py-2 border border-[#E8E0D8] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#7C1D2E]/30 focus:border-transparent"
              >
                <option value="email">Email</option>
                <option value="whatsapp">WhatsApp</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#3D2B1F] mb-1">
                Dirección <span className="text-[#E07A3A]">*</span>
              </label>
              <select
                {...form.register('direction')}
                className="w-full px-3 py-2 border border-[#E8E0D8] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#7C1D2E]/30 focus:border-transparent"
              >
                <option value="outgoing">Saliente</option>
                <option value="incoming">Entrante</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#3D2B1F] mb-1">
              Cliente <span className="text-[#E07A3A]">*</span>
            </label>
            <select
              {...form.register('client_id')}
              className="w-full px-3 py-2 border border-[#E8E0D8] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#7C1D2E]/30 focus:border-transparent"
            >
              <option value="">Seleccionar cliente...</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>{c.full_name}</option>
              ))}
            </select>
            {form.formState.errors.client_id && (
              <p className="text-[#E07A3A] text-xs mt-1">{form.formState.errors.client_id.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-[#3D2B1F] mb-1">Asunto</label>
            <input
              {...form.register('subject')}
              className="w-full px-3 py-2 border border-[#E8E0D8] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#7C1D2E]/30 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#3D2B1F] mb-1">Cuerpo</label>
            <textarea
              {...form.register('body')}
              rows={4}
              className="w-full px-3 py-2 border border-[#E8E0D8] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#7C1D2E]/30 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#3D2B1F] mb-1">
              Estado <span className="text-[#E07A3A]">*</span>
            </label>
            <select
              {...form.register('status')}
              className="w-full px-3 py-2 border border-[#E8E0D8] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#7C1D2E]/30 focus:border-transparent"
            >
              <option value="draft">Borrador</option>
              <option value="sent">Enviado</option>
              <option value="failed">Falló</option>
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => { setEditModalOpen(false); setEditingComm(null) }}
              className="px-4 py-2 text-sm text-gray-600 hover:text-[#3D2B1F] transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-[#7C1D2E] text-white rounded-lg text-sm font-medium hover:bg-[#5C1420] transition-colors"
            >
              Actualizar Comunicación
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Nueva Comunicación"
        size="lg"
      >
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#3D2B1F] mb-1">
                Tipo <span className="text-[#E07A3A]">*</span>
              </label>
              <select
                {...form.register('type')}
                className="w-full px-3 py-2 border border-[#E8E0D8] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#7C1D2E]/30 focus:border-transparent"
              >
                <option value="email">Email</option>
                <option value="whatsapp">WhatsApp</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#3D2B1F] mb-1">
                Dirección <span className="text-[#E07A3A]">*</span>
              </label>
              <select
                {...form.register('direction')}
                className="w-full px-3 py-2 border border-[#E8E0D8] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#7C1D2E]/30 focus:border-transparent"
              >
                <option value="outgoing">Saliente</option>
                <option value="incoming">Entrante</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#3D2B1F] mb-1">
              Cliente <span className="text-[#E07A3A]">*</span>
            </label>
            <select
              {...form.register('client_id')}
              className="w-full px-3 py-2 border border-[#E8E0D8] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#7C1D2E]/30 focus:border-transparent"
            >
              <option value="">Seleccionar cliente...</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>{c.full_name}</option>
              ))}
            </select>
            {form.formState.errors.client_id && (
              <p className="text-[#E07A3A] text-xs mt-1">{form.formState.errors.client_id.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-[#3D2B1F] mb-1">Asunto</label>
            <input
              {...form.register('subject')}
              className="w-full px-3 py-2 border border-[#E8E0D8] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#7C1D2E]/30 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#3D2B1F] mb-1">Cuerpo</label>
            <textarea
              {...form.register('body')}
              rows={4}
              className="w-full px-3 py-2 border border-[#E8E0D8] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#7C1D2E]/30 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#3D2B1F] mb-1">
              Estado <span className="text-[#E07A3A]">*</span>
            </label>
            <select
              {...form.register('status')}
              className="w-full px-3 py-2 border border-[#E8E0D8] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#7C1D2E]/30 focus:border-transparent"
            >
              <option value="draft">Borrador</option>
              <option value="sent">Enviado</option>
              <option value="failed">Falló</option>
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 text-sm text-gray-600 hover:text-[#3D2B1F] transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-[#7C1D2E] text-white rounded-lg text-sm font-medium hover:bg-[#5C1420] transition-colors"
            >
              Crear Comunicación
            </button>
          </div>
        </form>
      </Modal>
    </PageContainer>
  )
}
