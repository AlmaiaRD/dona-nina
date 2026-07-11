'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  Search, Plus, MessageSquare, Users, MoreVertical, Trash2, Edit3, Eye,
  ChevronLeft, ChevronRight, Phone, MapPin, BookOpen, CalendarCheck,
  ShoppingCart, PartyPopper, AlertTriangle, Package, GraduationCap,
  Clock, Wallet, MessageCircle, ArrowLeft,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { normalizeText } from '@/lib/search'
import { getLocalDateString, formatDate } from '@/lib/utils'
import { PageContainer } from '@/components/layout/PageContainer'
import { Modal } from '@/components/ui/Modal'
import { PrintActions } from '@/components/ui/PrintActions'
import { getAllFollowups, createFollowup, updateFollowup, updateFollowupStatus, deleteFollowup } from '@/services/followups'
import { getClients } from '@/services/clients'

type FollowupWithClient = Awaited<ReturnType<typeof getAllFollowups>>[number]
type FilterStatus = 'ALL' | 'PENDING' | 'COMPLETED' | 'OVERDUE'

const ACTIVITY_TYPES = [
  'Llamada de seguimiento',
  'Visita presencial',
  'Envío de catálogo',
  'Reunión de negocio',
  'Seguimiento post-venta',
  'Invitación a evento',
  'Reclamación o queja',
  'Entrega de producto',
  'Capacitación',
  'Recordatorio de pago',
]

const ACTIVITY_TYPE_ICONS: Record<string, typeof Phone> = {
  'Llamada de seguimiento': Phone,
  'Visita presencial': MapPin,
  'Envío de catálogo': BookOpen,
  'Reunión de negocio': Users,
  'Seguimiento post-venta': ShoppingCart,
  'Invitación a evento': PartyPopper,
  'Reclamación o queja': AlertTriangle,
  'Entrega de producto': Package,
  'Capacitación': GraduationCap,
  'Recordatorio de pago': Clock,
}

const ACTIVITY_COLORS: Record<string, string> = {
  'Llamada de seguimiento': 'bg-blue-100 text-blue-600',
  'Visita presencial': 'bg-green-100 text-green-600',
  'Envío de catálogo': 'bg-purple-100 text-purple-600',
  'Reunión de negocio': 'bg-indigo-100 text-indigo-600',
  'Seguimiento post-venta': 'bg-orange-100 text-orange-600',
  'Invitación a evento': 'bg-pink-100 text-pink-600',
  'Reclamación o queja': 'bg-red-100 text-[#7C1D2E]',
  'Entrega de producto': 'bg-teal-100 text-teal-600',
  'Capacitación': 'bg-cyan-100 text-cyan-600',
  'Recordatorio de pago': 'bg-amber-100 text-amber-600',
}

const WEEK_DAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']

function getActivityType(comments?: string): string {
  if (!comments) return ''
  const match = comments.match(/^\[(.+?)\]/)
  return match ? match[1] : ''
}

function getCommentsText(comments?: string): string {
  if (!comments) return ''
  const match = comments.match(/^\[.+?\]\s*(.*)/)
  return match ? match[1] : comments
}

function getActivityIcon(comments?: string) {
  const type = getActivityType(comments)
  return ACTIVITY_TYPE_ICONS[type] || MessageSquare
}

function getActivityColor(comments?: string): string {
  const type = getActivityType(comments)
  return ACTIVITY_COLORS[type] || 'bg-[#FDF8F3] text-gray-600'
}

function getCalendarDays(year: number, month: number): (number | null)[] {
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const days: (number | null)[] = []
  for (let i = 0; i < firstDay; i++) days.push(null)
  for (let i = 1; i <= daysInMonth; i++) days.push(i)
  return days
}

function formatDateKey(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

const inputClass = 'w-full px-3 py-2 border border-[#E8E0D8] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#7C1D2E]/30 focus:border-transparent'
const labelClass = 'block text-sm font-medium text-[#3D2B1F] mb-1'
const statusBadgeClass = (status: string) => {
  const map: Record<string, string> = {
    PENDING: 'bg-yellow-100 text-yellow-800',
    COMPLETED: 'bg-green-100 text-green-800',
    OVERDUE: 'bg-red-100 text-red-800',
  }
  return map[status] || 'bg-[#FDF8F3] text-[#3D2B1F]'
}

export default function CrmPage() {
  const router = useRouter()
  const [followups, setFollowups] = useState<FollowupWithClient[]>([])
  const [clients, setClients] = useState<{ id: string; full_name: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('ALL')
  const [calYear, setCalYear] = useState(new Date().getFullYear())
  const [calMonth, setCalMonth] = useState(new Date().getMonth())
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [showEdit, setShowEdit] = useState<FollowupWithClient | null>(null)
  const [showDelete, setShowDelete] = useState<FollowupWithClient | null>(null)
  const [saving, setSaving] = useState(false)
  const [menuOpen, setMenuOpen] = useState<string | null>(null)
  const [detailActivity, setDetailActivity] = useState<FollowupWithClient | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [createForm, setCreateForm] = useState({
    client_id: '',
    contact_date: getLocalDateString(),
    next_followup: '',
    activity_type: '',
    comments: '',
    status: 'PENDING' as 'PENDING' | 'COMPLETED',
  })
  const [editForm, setEditForm] = useState({
    contact_date: '',
    next_followup: '',
    activity_type: '',
    comments: '',
    status: 'PENDING' as 'PENDING' | 'COMPLETED',
  })

  const today = getLocalDateString()

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const [followupsData, clientsData] = await Promise.all([
          getAllFollowups(),
          getClients(),
        ])
        setFollowups(followupsData)
        setClients(clientsData)
      } catch (err: any) {
        toast.error(err?.message || 'Error al cargar datos')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const activityMap = useMemo(() => {
    const map: Record<string, FollowupWithClient[]> = {}
    followups.forEach(f => {
      const date = f.contact_date
      if (!map[date]) map[date] = []
      map[date].push(f)
    })
    return map
  }, [followups])

  const stats = useMemo(() => ({
    total: followups.length,
    pending: followups.filter(f => f.status === 'PENDING').length,
    completed: followups.filter(f => f.status === 'COMPLETED').length,
    overdue: followups.filter(f => f.status === 'OVERDUE').length,
  }), [followups])

  const selectedDateActivities = useMemo(() => {
    if (!selectedDate) return []
    return followups.filter(f => f.contact_date === selectedDate)
  }, [followups, selectedDate])

  const filteredFollowups = useMemo(() => {
    let result = followups
    if (searchQuery) {
      const q = normalizeText(searchQuery)
      result = result.filter(f => {
        const name = f.clients?.full_name || ''
        const comments = f.comments || ''
        return normalizeText(name).includes(q) || normalizeText(comments).includes(q)
      })
    }
    if (filterStatus !== 'ALL') {
      result = result.filter(f => f.status === filterStatus)
    }
    return result
  }, [followups, searchQuery, filterStatus])

  const handlePrevMonth = () => {
    if (calMonth === 0) {
      setCalYear(calYear - 1)
      setCalMonth(11)
    } else {
      setCalMonth(calMonth - 1)
    }
  }

  const handleNextMonth = () => {
    if (calMonth === 11) {
      setCalYear(calYear + 1)
      setCalMonth(0)
    } else {
      setCalMonth(calMonth + 1)
    }
  }

  const goToToday = () => {
    const now = new Date()
    setCalYear(now.getFullYear())
    setCalMonth(now.getMonth())
    setSelectedDate(getLocalDateString())
  }

  const handleCreate = async () => {
    if (!createForm.client_id) {
      toast.error('Seleccione un cliente')
      return
    }
    if (!createForm.contact_date) {
      toast.error('La fecha de contacto es requerida')
      return
    }
    setSaving(true)
    try {
      const fullComments = createForm.activity_type
        ? `[${createForm.activity_type}] ${createForm.comments}`
        : createForm.comments
      await createFollowup({
        client_id: createForm.client_id,
        contact_date: createForm.contact_date,
        next_followup: createForm.next_followup || undefined,
        comments: fullComments,
        status: createForm.status,
      })
      toast.success('Actividad creada correctamente')
      setShowCreate(false)
      setCreateForm({
        client_id: '',
        contact_date: getLocalDateString(),
        next_followup: '',
        activity_type: '',
        comments: '',
        status: 'PENDING',
      })
      const [followupsData] = await Promise.all([
        getAllFollowups(),
      ])
      setFollowups(followupsData)
    } catch (err: any) {
      toast.error(err?.message || 'Error al crear la actividad')
    } finally {
      setSaving(false)
    }
  }

  const openEdit = (followup: FollowupWithClient) => {
    setShowEdit(followup)
    setEditForm({
      contact_date: followup.contact_date,
      next_followup: followup.next_followup || '',
      activity_type: getActivityType(followup.comments),
      comments: getCommentsText(followup.comments),
      status: followup.status === 'COMPLETED' ? 'COMPLETED' : 'PENDING',
    })
    setMenuOpen(null)
  }

  const handleEdit = async () => {
    if (!showEdit) return
    setSaving(true)
    try {
      const fullComments = editForm.activity_type
        ? `[${editForm.activity_type}] ${editForm.comments}`
        : editForm.comments
      await updateFollowup(showEdit.id, {
        contact_date: editForm.contact_date,
        next_followup: editForm.next_followup || undefined,
        comments: fullComments,
        status: editForm.status,
      })
      toast.success('Actividad actualizada correctamente')
      setShowEdit(null)
      const [followupsData] = await Promise.all([getAllFollowups()])
      setFollowups(followupsData)
    } catch (err: any) {
      toast.error(err?.message || 'Error al actualizar la actividad')
    } finally {
      setSaving(false)
    }
  }

  const handleToggleStatus = async (followup: FollowupWithClient) => {
    try {
      const newStatus = followup.status === 'COMPLETED' ? 'PENDING' : 'COMPLETED'
      await updateFollowupStatus(followup.id, newStatus)
      toast.success(`Actividad marcada como ${newStatus === 'COMPLETED' ? 'completada' : 'pendiente'}`)
      setMenuOpen(null)
      const [followupsData] = await Promise.all([getAllFollowups()])
      setFollowups(followupsData)
    } catch (err: any) {
      toast.error(err?.message || 'Error al actualizar estado')
    }
  }

  const handleDelete = async () => {
    if (!showDelete) return
    setSaving(true)
    try {
      await deleteFollowup(showDelete.id)
      toast.success('Actividad eliminada correctamente')
      setShowDelete(null)
      setMenuOpen(null)
      const [followupsData] = await Promise.all([getAllFollowups()])
      setFollowups(followupsData)
      if (selectedDate) {
        const stillExists = followupsData.some(f => f.contact_date === selectedDate)
        if (!stillExists) setSelectedDate(null)
      }
    } catch (err: any) {
      toast.error(err?.message || 'Error al eliminar la actividad')
    } finally {
      setSaving(false)
    }
  }

  const handleViewDetail = (followup: FollowupWithClient) => {
    setDetailActivity(followup)
    setDetailOpen(true)
  }

  useEffect(() => {
    const handleClickOutside = () => setMenuOpen(null)
    if (menuOpen) {
      document.addEventListener('click', handleClickOutside)
    }
    return () => document.removeEventListener('click', handleClickOutside)
  }, [menuOpen])

  const calendarDays = getCalendarDays(calYear, calMonth)
  const todayMatch = today

  return (
    <PageContainer
      title="CRM y Seguimiento"
      subtitle="Gestión de actividades y seguimiento a clientes"
      action={
        <button
          onClick={() => setShowCreate(true)}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#800020] rounded-lg hover:bg-[#600018] transition-colors"
        >
          <Plus className="h-4 w-4" />
          Nueva Actividad
        </button>
      }
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <button
          onClick={() => router.push('/creditos')}
          className="flex items-center gap-4 p-4 bg-white rounded-xl shadow-sm border border-[#E8E0D8] hover:border-cyan-200 hover:shadow-md transition-all text-left"
        >
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-cyan-50 text-cyan-600 shrink-0">
            <Wallet className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-semibold text-[#3D2B1F]">Créditos</p>
            <p className="text-xs text-[#9C8A82]">Gestionar saldos a favor</p>
          </div>
        </button>
        <div className="flex items-center gap-4 p-4 bg-white rounded-xl shadow-sm border border-[#E8E0D8] opacity-60 cursor-not-allowed">
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-[#5B9E6B]/10 text-green-600 shrink-0">
            <MessageCircle className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-[#3D2B1F]">WhatsApp Business</p>
            <p className="text-xs text-[#9C8A82]">Próximamente</p>
          </div>
          <span className="text-[10px] font-medium text-yellow-600 bg-[#D4A017]/10 px-2 py-0.5 rounded-full">Pronto</span>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-[#E8E0D8]">
          <p className="text-xs font-medium text-[#9C8A82] uppercase tracking-wider">Total</p>
          <p className="text-2xl font-bold text-[#3D2B1F] mt-1">{stats.total}</p>
          <p className="text-xs text-[#9C8A82] mt-0.5">Actividades</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-[#E8E0D8]">
          <p className="text-xs font-medium text-[#9C8A82] uppercase tracking-wider">Pendientes</p>
          <p className="text-2xl font-bold text-yellow-600 mt-1">{stats.pending}</p>
          <p className="text-xs text-[#9C8A82] mt-0.5">Por realizar</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-[#E8E0D8]">
          <p className="text-xs font-medium text-[#9C8A82] uppercase tracking-wider">Completadas</p>
          <p className="text-2xl font-bold text-green-600 mt-1">{stats.completed}</p>
          <p className="text-xs text-[#9C8A82] mt-0.5">Realizadas</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-[#E8E0D8]">
          <p className="text-xs font-medium text-[#9C8A82] uppercase tracking-wider">Vencidas</p>
          <p className="text-2xl font-bold text-[#7C1D2E] mt-1">{stats.overdue}</p>
          <p className="text-xs text-[#9C8A82] mt-0.5">Atrasadas</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 bg-white rounded-xl shadow-sm border border-[#E8E0D8] p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrevMonth}
                className="p-1.5 rounded-lg hover:bg-[#FDF8F3] transition-colors text-[#9C8A82]"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-sm font-semibold text-[#3D2B1F] min-w-[140px] text-center">
                {MONTHS[calMonth]} {calYear}
              </span>
              <button
                onClick={handleNextMonth}
                className="p-1.5 rounded-lg hover:bg-[#FDF8F3] transition-colors text-[#9C8A82]"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
            <button
              onClick={goToToday}
              className="text-xs font-medium px-3 py-1.5 rounded-lg border border-[#E8E0D8] text-gray-600 hover:bg-[#FDF8F3] transition-colors"
            >
              Hoy
            </button>
          </div>

          <div className="grid grid-cols-7 mb-1">
            {WEEK_DAYS.map(d => (
              <div key={d} className="text-center text-[11px] font-medium text-[#9C8A82] py-1.5">
                {d}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7">
            {calendarDays.map((day, idx) => {
              if (day === null) return <div key={`empty-${idx}`} />
              const dateKey = formatDateKey(calYear, calMonth, day)
              const activities = activityMap[dateKey] || []
              const isToday = dateKey === todayMatch
              const isSelected = dateKey === selectedDate

              return (
                <button
                  key={dateKey}
                  onClick={() => setSelectedDate(dateKey === selectedDate ? null : dateKey)}
                  className={`flex flex-col items-center justify-start p-1.5 min-h-[56px] rounded-lg transition-colors text-xs relative ${
                    isSelected
                      ? 'bg-[#800020] text-white'
                      : isToday
                        ? 'bg-[#800020]/10 text-[#3D2B1F]'
                        : 'hover:bg-[#FDF8F3] text-[#3D2B1F]'
                  }`}
                >
                  <span className={`text-xs font-medium ${isSelected ? 'text-white' : isToday ? 'text-[#800020]' : ''}`}>
                    {day}
                  </span>
                  {activities.length > 0 && (
                    <div className="flex gap-0.5 mt-0.5 flex-wrap justify-center">
                      {activities.slice(0, 3).map((_, i) => (
                        <span
                          key={i}
                          className={`h-1.5 w-1.5 rounded-full ${isSelected ? 'bg-white/80' : 'bg-[#800020]'}`}
                        />
                      ))}
                      {activities.length > 3 && (
                        <span className={`text-[9px] font-medium ${isSelected ? 'text-white/80' : 'text-[#9C8A82]'}`}>
                          +{activities.length - 3}
                        </span>
                      )}
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        <div className="lg:col-span-2 space-y-4">
          {selectedDate ? (
            <div className="bg-white rounded-xl shadow-sm border border-[#E8E0D8] p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-sm font-semibold text-[#3D2B1F]">
                    Actividades del {formatDate(selectedDate)}
                  </h3>
                  <p className="text-xs text-[#9C8A82]">{selectedDateActivities.length} actividad(es)</p>
                </div>
                <button
                  onClick={() => setSelectedDate(null)}
                  className="p-1.5 rounded-lg hover:bg-[#FDF8F3] transition-colors text-[#9C8A82]"
                >
                  <ArrowLeft className="h-4 w-4" />
                </button>
              </div>
              {selectedDateActivities.length === 0 ? (
                <p className="text-sm text-[#9C8A82] py-4 text-center">No hay actividades para esta fecha</p>
              ) : (
                <div className="space-y-2 max-h-[320px] overflow-y-auto">
                  {selectedDateActivities.map(f => {
                    const Icon = getActivityIcon(f.comments)
                    const colorClass = getActivityColor(f.comments)
                    return (
                      <div key={f.id} className="flex items-start gap-3 p-3 rounded-lg bg-[#FDF8F3]">
                        <div className={`flex items-center justify-center w-8 h-8 rounded-full shrink-0 ${colorClass}`}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-[#3D2B1F] truncate">
                            {f.clients?.full_name || 'Cliente'}
                          </p>
                          <p className="text-xs text-[#9C8A82] truncate">{getCommentsText(f.comments) || getActivityType(f.comments) || 'Sin comentarios'}</p>
                          {f.next_followup && (
                            <p className="text-[11px] text-[#9C8A82] mt-0.5">
                              Próximo: {formatDate(f.next_followup)}
                            </p>
                          )}
                        </div>
                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${statusBadgeClass(f.status)}`}>
                          {f.status === 'PENDING' ? 'Pendiente' : f.status === 'COMPLETED' ? 'Completada' : 'Vencida'}
                        </span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-[#E8E0D8] p-4 flex items-center justify-center min-h-[120px]">
              <p className="text-sm text-[#9C8A82]">Seleccione una fecha en el calendario</p>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-[#E8E0D8] p-4">
        <h3 className="text-sm font-semibold text-[#3D2B1F] mb-4">Todas las Actividades</h3>
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9C8A82]" />
            <input
              type="text"
              placeholder="Buscar por cliente o comentario..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-[#E8E0D8] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#800020] focus:border-transparent"
            />
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {(['ALL', 'PENDING', 'COMPLETED', 'OVERDUE'] as FilterStatus[]).map(status => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                  filterStatus === status
                    ? 'bg-[#800020] text-white'
                    : 'bg-[#FDF8F3] text-gray-600 hover:bg-gray-200'
                }`}
              >
                {status === 'ALL' ? 'Todas' : status === 'PENDING' ? 'Pendientes' : status === 'COMPLETED' ? 'Completadas' : 'Vencidas'}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <p className="text-[#9C8A82] text-sm">Cargando...</p>
          </div>
        ) : filteredFollowups.length === 0 ? (
          <div className="text-center py-12">
            <MessageSquare className="h-8 w-8 text-[#9C8A82] mx-auto mb-2" />
            <p className="text-sm text-[#9C8A82]">No hay actividades registradas</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredFollowups.map(f => {
              const Icon = getActivityIcon(f.comments)
              const colorClass = getActivityColor(f.comments)
              const isMenuOpen = menuOpen === f.id
              return (
                <div
                  key={f.id}
                  className="flex items-start gap-3 p-3 rounded-lg hover:bg-[#FDF8F3] transition-colors border border-transparent hover:border-[#E8E0D8] relative"
                >
                  <div className={`flex items-center justify-center w-9 h-9 rounded-full shrink-0 ${colorClass}`}>
                    <Icon className="h-4.5 w-4.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium text-[#3D2B1F]">
                        {f.clients?.full_name || 'Cliente'}
                      </p>
                      <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${statusBadgeClass(f.status)}`}>
                        {f.status === 'PENDING' ? 'Pendiente' : f.status === 'COMPLETED' ? 'Completada' : 'Vencida'}
                      </span>
                    </div>
                    <p className="text-xs text-[#9C8A82] mt-0.5 line-clamp-1">
                      {f.comments ? (f.comments.length > 80 ? f.comments.slice(0, 80) + '...' : f.comments) : 'Sin comentarios'}
                    </p>
                    <div className="flex items-center gap-3 mt-1 text-[11px] text-[#9C8A82]">
                      <span>Contacto: {formatDate(f.contact_date)}</span>
                      {f.next_followup && <span>Próximo: {formatDate(f.next_followup)}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleViewDetail(f)}
                      className="p-1.5 rounded-lg hover:bg-[#FDF8F3] transition-colors text-[#9C8A82]"
                      title="Ver detalle"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    {f.status !== 'COMPLETED' && (
                      <button
                        onClick={() => handleToggleStatus(f)}
                        className="p-1.5 rounded-lg hover:bg-[#5B9E6B]/10 transition-colors text-[#9C8A82] hover:text-green-600"
                        title="Marcar Completada"
                      >
                        <CalendarCheck className="h-4 w-4" />
                      </button>
                    )}
                    <div className="relative">
                      <button
                        onClick={e => { e.stopPropagation(); setMenuOpen(isMenuOpen ? null : f.id) }}
                        className="p-1.5 rounded-lg hover:bg-[#FDF8F3] transition-colors text-[#9C8A82]"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </button>
                      {isMenuOpen && (
                      <div className="absolute right-0 top-full mt-1 w-44 bg-white rounded-lg shadow-lg border border-[#E8E0D8] py-1 z-10" onClick={e => e.stopPropagation()}>
                        <button
                          onClick={() => openEdit(f)}
                          className="flex items-center gap-2 w-full px-3 py-2 text-xs text-[#3D2B1F] hover:bg-[#FDF8F3] transition-colors"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                          Editar
                        </button>
                        <button
                          onClick={() => handleToggleStatus(f)}
                          className="flex items-center gap-2 w-full px-3 py-2 text-xs text-[#3D2B1F] hover:bg-[#FDF8F3] transition-colors"
                        >
                          <CalendarCheck className="h-3.5 w-3.5" />
                          {f.status === 'COMPLETED' ? 'Marcar Pendiente' : 'Marcar Completada'}
                        </button>
                        <button
                          onClick={() => { setShowDelete(f); setMenuOpen(null) }}
                          className="flex items-center gap-2 w-full px-3 py-2 text-xs text-[#7C1D2E] hover:bg-[#7C1D2E]/10 transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Eliminar
                        </button>
                      </div>
                    )}
                  </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Nueva Actividad" subtitle="Registre una nueva actividad de seguimiento" size="lg">
        <div className="space-y-4">
          <div>
            <label className={labelClass}>Cliente <span className="text-[#E07A3A]">*</span></label>
            <select
              value={createForm.client_id}
              onChange={e => setCreateForm({ ...createForm, client_id: e.target.value })}
              className={inputClass}
            >
              <option value="">Seleccionar cliente...</option>
              {clients.map(c => (
                <option key={c.id} value={c.id}>{c.full_name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Fecha de Contacto <span className="text-[#E07A3A]">*</span></label>
              <input
                type="date"
                value={createForm.contact_date}
                onChange={e => setCreateForm({ ...createForm, contact_date: e.target.value })}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Próximo Seguimiento</label>
              <input
                type="date"
                value={createForm.next_followup}
                onChange={e => setCreateForm({ ...createForm, next_followup: e.target.value })}
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label className={labelClass}>Tipo de Actividad</label>
            <select
              value={createForm.activity_type}
              onChange={e => setCreateForm({ ...createForm, activity_type: e.target.value })}
              className={inputClass}
            >
              <option value="">Seleccionar tipo...</option>
              {ACTIVITY_TYPES.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelClass}>Comentarios</label>
            <textarea
              value={createForm.comments}
              onChange={e => setCreateForm({ ...createForm, comments: e.target.value })}
              rows={3}
              className={inputClass}
              placeholder="Notas sobre la actividad (opcional)"
            />
          </div>

          <div>
            <label className={labelClass}>Estado</label>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setCreateForm({ ...createForm, status: 'PENDING' })}
                className={`px-4 py-2 text-xs font-medium rounded-lg transition-colors ${
                  createForm.status === 'PENDING'
                    ? 'bg-yellow-100 text-yellow-800 ring-2 ring-yellow-300'
                    : 'bg-[#FDF8F3] text-[#9C8A82] hover:bg-[#FDF8F3]'
                }`}
              >
                Pendiente
              </button>
              <button
                onClick={() => setCreateForm({ ...createForm, status: 'COMPLETED' })}
                className={`px-4 py-2 text-xs font-medium rounded-lg transition-colors ${
                  createForm.status === 'COMPLETED'
                    ? 'bg-green-100 text-green-800 ring-2 ring-green-300'
                    : 'bg-[#FDF8F3] text-[#9C8A82] hover:bg-[#FDF8F3]'
                }`}
              >
                Completada
              </button>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-[#E8E0D8]">
            <button
              onClick={() => setShowCreate(false)}
              className="px-4 py-2 text-sm font-medium text-[#3D2B1F] bg-[#FDF8F3] rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleCreate}
              disabled={saving}
              className="px-4 py-2 text-sm font-medium text-white bg-[#800020] rounded-lg hover:bg-[#600018] disabled:opacity-50 transition-colors"
            >
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={!!showEdit} onClose={() => setShowEdit(null)} title="Editar Actividad" subtitle="Modifique los datos de la actividad" size="lg">
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Fecha de Contacto <span className="text-[#E07A3A]">*</span></label>
              <input
                type="date"
                value={editForm.contact_date}
                onChange={e => setEditForm({ ...editForm, contact_date: e.target.value })}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Próximo Seguimiento</label>
              <input
                type="date"
                value={editForm.next_followup}
                onChange={e => setEditForm({ ...editForm, next_followup: e.target.value })}
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label className={labelClass}>Tipo de Actividad</label>
            <select
              value={editForm.activity_type}
              onChange={e => setEditForm({ ...editForm, activity_type: e.target.value })}
              className={inputClass}
            >
              <option value="">Seleccionar tipo...</option>
              {ACTIVITY_TYPES.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelClass}>Comentarios</label>
            <textarea
              value={editForm.comments}
              onChange={e => setEditForm({ ...editForm, comments: e.target.value })}
              rows={3}
              className={inputClass}
              placeholder="Notas sobre la actividad"
            />
          </div>

          <div>
            <label className={labelClass}>Estado</label>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setEditForm({ ...editForm, status: 'PENDING' })}
                className={`px-4 py-2 text-xs font-medium rounded-lg transition-colors ${
                  editForm.status === 'PENDING'
                    ? 'bg-yellow-100 text-yellow-800 ring-2 ring-yellow-300'
                    : 'bg-[#FDF8F3] text-[#9C8A82] hover:bg-[#FDF8F3]'
                }`}
              >
                Pendiente
              </button>
              <button
                onClick={() => setEditForm({ ...editForm, status: 'COMPLETED' })}
                className={`px-4 py-2 text-xs font-medium rounded-lg transition-colors ${
                  editForm.status === 'COMPLETED'
                    ? 'bg-green-100 text-green-800 ring-2 ring-green-300'
                    : 'bg-[#FDF8F3] text-[#9C8A82] hover:bg-[#FDF8F3]'
                }`}
              >
                Completada
              </button>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-[#E8E0D8]">
            <button
              onClick={() => setShowEdit(null)}
              className="px-4 py-2 text-sm font-medium text-[#3D2B1F] bg-[#FDF8F3] rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleEdit}
              disabled={saving}
              className="px-4 py-2 text-sm font-medium text-white bg-[#800020] rounded-lg hover:bg-[#600018] disabled:opacity-50 transition-colors"
            >
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={!!showDelete} onClose={() => setShowDelete(null)} title="Eliminar Actividad" subtitle="Esta acción no se puede deshacer" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            ¿Está seguro de eliminar la actividad de{' '}
            <span className="font-semibold text-[#3D2B1F]">{showDelete?.clients?.full_name || 'este cliente'}</span>?
          </p>
          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={() => setShowDelete(null)}
              className="px-4 py-2 text-sm font-medium text-[#3D2B1F] bg-[#FDF8F3] rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleDelete}
              disabled={saving}
              className="px-4 py-2 text-sm font-medium text-white bg-[#7C1D2E] rounded-lg hover:bg-[#5C1420] disabled:opacity-50 transition-colors"
            >
              {saving ? 'Eliminando...' : 'Eliminar'}
            </button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={detailOpen} onClose={() => setDetailOpen(false)} title="Detalle de Actividad" subtitle="Información completa de la actividad" size="xl">
        <div id="activity-detail" className="space-y-4">
          <PrintActions elementId="activity-detail" filename={`actividad-${detailActivity?.id || 'detalle'}`} />
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-[#9C8A82] font-medium">Cliente</p>
              <p className="text-sm font-semibold text-[#3D2B1F]">{detailActivity?.clients?.full_name || '-'}</p>
            </div>
            <div>
              <p className="text-xs text-[#9C8A82] font-medium">Tipo de Actividad</p>
              <p className="text-sm font-semibold text-[#3D2B1F]">{getActivityType(detailActivity?.comments) || '-'}</p>
            </div>
            <div>
              <p className="text-xs text-[#9C8A82] font-medium">Fecha de Contacto</p>
              <p className="text-sm font-semibold text-[#3D2B1F]">{detailActivity ? formatDate(detailActivity.contact_date) : '-'}</p>
            </div>
            <div>
              <p className="text-xs text-[#9C8A82] font-medium">Próximo Seguimiento</p>
              <p className="text-sm font-semibold text-[#3D2B1F]">{detailActivity?.next_followup ? formatDate(detailActivity.next_followup) : '-'}</p>
            </div>
            <div>
              <p className="text-xs text-[#9C8A82] font-medium">Estado</p>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-1 ${detailActivity ? statusBadgeClass(detailActivity.status) : ''}`}>
                {detailActivity?.status === 'PENDING' ? 'Pendiente' : detailActivity?.status === 'COMPLETED' ? 'Completada' : detailActivity?.status === 'OVERDUE' ? 'Vencida' : '-'}
              </span>
            </div>
          </div>
          <div>
            <p className="text-xs text-[#9C8A82] font-medium mb-1">Comentarios</p>
            <p className="text-sm text-[#3D2B1F] bg-[#FDF8F3] rounded-lg p-3">{getCommentsText(detailActivity?.comments) || 'Sin comentarios'}</p>
          </div>
        </div>
      </Modal>
    </PageContainer>
  )
}
