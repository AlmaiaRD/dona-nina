'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, Pencil, Trash2, Star, Download, Upload, Database, Users as UsersIcon } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { PageContainer } from '@/components/layout/PageContainer'
import { Modal } from '@/components/ui/Modal'
import { cn } from '@/lib/utils'
import {
  getSettings,
  updateSettings,
  getBankAccounts,
  createBankAccount,
  updateBankAccount,
  deleteBankAccount,
} from '@/services/settings'
import { getUsers, createUser, updateUser, deleteUser } from '@/services/users'
import type { BankAccount, UserProfile } from '@/types/database'
import { MODULES } from '@/types/database'

const settingsSchema = z.object({
  business_name: z.string().optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  address: z.string().optional().or(z.literal('')),
  invoice_prefix: z.string().optional().or(z.literal('')),
  receipt_prefix: z.string().optional().or(z.literal('')),
  default_margin: z.number().optional(),
  ai_client_prompt: z.string().optional().or(z.literal('')),
  ai_learning_prompt: z.string().optional().or(z.literal('')),
})

type SettingsFormData = z.infer<typeof settingsSchema>

const bankSchema = z.object({
  bank_name: z.string().min(1, 'El nombre del banco es requerido'),
  account_type: z.enum(['Ahorros', 'Corriente']),
  account_number: z.string().min(1, 'El número de cuenta es requerido'),
  holder_name: z.string().min(1, 'El titular es requerido'),
  id_number: z.string().optional().or(z.literal('')),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  is_default: z.boolean().optional(),
})

type BankFormData = z.infer<typeof bankSchema>

export default function ConfigPage() {
  const [activeTab, setActiveTab] = useState<'general' | 'bancos' | 'ai' | 'backup' | 'usuarios'>('general')
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([])
  const [users, setUsers] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [bankModalOpen, setBankModalOpen] = useState(false)
  const [editingBank, setEditingBank] = useState<BankAccount | null>(null)
  const [userModalOpen, setUserModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null)
  const [userForm, setUserForm] = useState({ name: '', email: '', password: '', role: 'seller', permissions: [] as string[] })
  const [userSaving, setUserSaving] = useState(false)
  const [backingUp, setBackingUp] = useState(false)

  const settingsForm = useForm<SettingsFormData>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      business_name: '',
      phone: '',
      email: '',
      address: '',
      invoice_prefix: '',
      receipt_prefix: '',
      default_margin: undefined,
      ai_client_prompt: '',
      ai_learning_prompt: '',
    },
  })

  const bankForm = useForm<BankFormData>({
    resolver: zodResolver(bankSchema),
    defaultValues: {
      bank_name: '',
      account_type: 'Ahorros',
      account_number: '',
      holder_name: '',
      id_number: '',
      email: '',
      is_default: false,
    },
  })

  const fetchSettings = useCallback(async () => {
    try {
      const data = await getSettings()
      if (data) {
        settingsForm.reset({
          business_name: data.business_name ?? '',
          phone: data.phone ?? '',
          email: data.email ?? '',
          address: data.address ?? '',
          invoice_prefix: data.invoice_prefix ?? '',
          receipt_prefix: data.receipt_prefix ?? '',
          default_margin: data.default_margin ?? undefined,
          ai_client_prompt: data.ai_client_prompt ?? '',
          ai_learning_prompt: data.ai_learning_prompt ?? '',
        })
      }
    } catch (err) { console.error('[ConfigPage] Error:', err); toast.error('Error al cargar la configuración') }
  }, [settingsForm])

  const fetchBankAccounts = useCallback(async () => {
    try {
      const data = await getBankAccounts()
      setBankAccounts(data)
    } catch (err) { console.error('[ConfigPage] Error:', err); toast.error('Error al cargar las cuentas bancarias') }
  }, [])

  const fetchUsers = useCallback(async () => {
    try {
      const data = await getUsers()
      setUsers(data)
    } catch (err) { console.error('[ConfigPage] Error:', err); toast.error('Error al cargar los usuarios') }
  }, [])

  useEffect(() => {
    async function load() {
      setLoading(true)
      await Promise.all([fetchSettings(), fetchBankAccounts(), fetchUsers()])
      setLoading(false)
    }
    load()
  }, [fetchSettings, fetchBankAccounts, fetchUsers])

  async function handleSettingsSubmit(data: SettingsFormData) {
    setSaving(true)
    try {
      await updateSettings(data)
      toast.success('Configuración guardada correctamente')
      await fetchSettings()
    } catch (err) { console.error('[ConfigPage] Error:', err); toast.error('Error al guardar la configuración') }
    finally {
      setSaving(false)
    }
  }

  function handleOpenBankCreate() {
    setEditingBank(null)
    bankForm.reset({
      bank_name: '',
      account_type: 'Ahorros',
      account_number: '',
      holder_name: '',
      id_number: '',
      email: '',
      is_default: false,
    })
    setBankModalOpen(true)
  }

  function handleOpenBankEdit(account: BankAccount) {
    setEditingBank(account)
    bankForm.reset({
      bank_name: account.bank_name,
      account_type: account.account_type as 'Ahorros' | 'Corriente',
      account_number: account.account_number,
      holder_name: account.holder_name,
      id_number: account.id_number ?? '',
      email: account.email ?? '',
      is_default: account.is_default,
    })
    setBankModalOpen(true)
  }

  async function handleBankSubmit(raw: BankFormData) {
    try {
      const data = { ...raw, email: raw.email || '', id_number: raw.id_number || '', is_default: raw.is_default ?? false }
      if (editingBank) {
        await updateBankAccount(editingBank.id, data)
        toast.success('Cuenta bancaria actualizada correctamente')
      } else {
        await createBankAccount(data)
        toast.success('Cuenta bancaria creada correctamente')
      }
      setBankModalOpen(false)
      await fetchBankAccounts()
    } catch (err) { console.error('[ConfigPage] Error:', err); toast.error('Error al guardar la cuenta bancaria') }
  }

  async function handleBankDelete(account: BankAccount) {
    if (!window.confirm(`¿Estás seguro de eliminar la cuenta de ${account.bank_name}?`)) return
    try {
      await deleteBankAccount(account.id)
      toast.success('Cuenta bancaria eliminada correctamente')
      await fetchBankAccounts()
    } catch (err) { console.error('[ConfigPage] Error:', err); toast.error('Error al eliminar la cuenta bancaria') }
  }

  async function handleExportBackup() {
    setBackingUp(true)
    try {
      const res = await fetch('/api/backup', { method: 'POST' })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Error al exportar backup')
      }
      const backup = await res.json()
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `donde-dona-nina-backup-${new Date().toISOString().split('T')[0]}.json`
      a.click()
      URL.revokeObjectURL(url)
      toast.success('Backup exportado exitosamente')
    } catch (err: any) {
      toast.error(err.message || 'Error al exportar backup')
    } finally {
      setBackingUp(false)
    }
  }

  function maskAccountNumber(number: string): string {
    if (number.length <= 4) return number
    return '****' + number.slice(-4)
  }

  function openUserCreate() {
    setEditingUser(null)
    setUserForm({ name: '', email: '', password: '', role: 'seller', permissions: [] })
    setUserModalOpen(true)
  }

  function openUserEdit(user: UserProfile) {
    setEditingUser(user)
    setUserForm({ name: user.name, email: user.email, password: '', role: user.role, permissions: user.permissions || [] })
    setUserModalOpen(true)
  }

  async function handleUserSubmit() {
    if (!userForm.name || !userForm.email) { toast.error('Nombre y email requeridos'); return }
    if (!editingUser && !userForm.password) { toast.error('Contraseña requerida'); return }
    setUserSaving(true)
    try {
      if (editingUser) {
        await updateUser(editingUser.id, {
          name: userForm.name,
          email: userForm.email,
          role: userForm.role,
          permissions: userForm.permissions,
          ...(userForm.password ? { password: userForm.password } : {}),
        })
        toast.success('Usuario actualizado')
      } else {
        await createUser({ ...userForm, permissions: userForm.permissions })
        toast.success('Usuario creado')
      }
      setUserModalOpen(false)
      await fetchUsers()
    } catch (err: any) {
      toast.error(err?.message || 'Error al guardar usuario')
    } finally {
      setUserSaving(false)
    }
  }

  async function handleUserDelete(user: UserProfile) {
    if (!window.confirm(`¿Estás seguro de eliminar a ${user.name}?`)) return
    try {
      await deleteUser(user.id)
      toast.success('Usuario eliminado')
      await fetchUsers()
    } catch (err: any) {
      toast.error(err?.message || 'Error al eliminar usuario')
    }
  }

  if (loading) {
    return (
      <PageContainer title="Configuración" subtitle="Ajustes del sistema">
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
        </div>
      </PageContainer>
    )
  }

  return (
    <PageContainer title="Configuración" subtitle="Ajustes del sistema">
      <div className="inline-flex gap-2 p-1 bg-gray-100 rounded-lg">
        <button
          onClick={() => setActiveTab('general')}
          className={cn(
            'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
            activeTab === 'general'
              ? 'bg-red-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          )}
        >
          General
        </button>
        <button
          onClick={() => setActiveTab('bancos')}
          className={cn(
            'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
            activeTab === 'bancos'
              ? 'bg-red-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          )}
        >
          Bancos
        </button>
        <button
          onClick={() => setActiveTab('ai')}
          className={cn(
            'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
            activeTab === 'ai'
              ? 'bg-red-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          )}
        >
          Prompts IA
        </button>
        <button
          onClick={() => setActiveTab('backup')}
          className={cn(
            'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
            activeTab === 'backup'
              ? 'bg-red-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          )}
        >
          Backup
        </button>
        <button
          onClick={() => setActiveTab('usuarios')}
          className={cn(
            'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
            activeTab === 'usuarios'
              ? 'bg-red-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          )}
        >
          Usuarios
        </button>
      </div>

      {activeTab === 'general' && (
        <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100">
          <form id="settings-form" onSubmit={settingsForm.handleSubmit(handleSettingsSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del Negocio</label>
                <input
                  {...settingsForm.register('business_name')}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                <input
                  {...settingsForm.register('phone')}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  {...settingsForm.register('email')}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
                {settingsForm.formState.errors.email && (
                  <p className="text-red-500 text-xs mt-1">{settingsForm.formState.errors.email.message}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Margen por Defecto (%)</label>
                <input
                  type="number"
                  step="0.01"
                  {...settingsForm.register('default_margin', { valueAsNumber: true })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Dirección</label>
              <textarea
                {...settingsForm.register('address')}
                rows={3}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Prefijo de Factura</label>
                <input
                  {...settingsForm.register('invoice_prefix')}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Prefijo de Recibo</label>
                <input
                  {...settingsForm.register('receipt_prefix')}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {saving ? 'Guardando...' : 'Guardar Cambios'}
              </button>
            </div>
          </form>
        </div>
      )}

      {activeTab === 'ai' && (
        <div className="max-w-2xl space-y-6">
          <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100 space-y-6">
            <h3 className="text-sm font-semibold text-gray-900">Prompts de Inteligencia Artificial</h3>
            <p className="text-xs text-gray-500">
              Personaliza los prompts que usa la IA para generar resúmenes de clientes y analizar notas de aprendizaje.
              Usa variables entre llaves dobles: <code className="text-red-600 bg-red-50 px-1.5 py-0.5 rounded text-[10px]">{'{{clientName}}'}</code>, <code className="text-red-600 bg-red-50 px-1.5 py-0.5 rounded text-[10px]">{'{{totalSpent}}'}</code>, etc.
            </p>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">Prompt para Resumen de Cliente</label>
              <p className="text-[10px] text-gray-500 mb-2">Se usa al generar resúmenes en Pipeline y reportes.</p>
              <textarea
                {...settingsForm.register('ai_client_prompt')}
                rows={10}
                className="w-full resize-y px-4 py-3 rounded-lg border border-gray-200 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent font-mono text-[11px]"
              />
            </div>

            <div className="border-t border-gray-100 pt-6">
              <label className="block text-xs font-medium text-gray-700 mb-2">Prompt para Notas de Aprendizaje</label>
              <p className="text-[10px] text-gray-500 mb-2">Se usa al analizar notas en el módulo de Aprendizaje.</p>
              <textarea
                {...settingsForm.register('ai_learning_prompt')}
                rows={8}
                className="w-full resize-y px-4 py-3 rounded-lg border border-gray-200 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent font-mono text-[11px]"
              />
            </div>

            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <h4 className="text-xs font-semibold text-gray-900 mb-2">Variables disponibles</h4>
              <div className="grid grid-cols-2 gap-1 text-[10px] text-gray-500 font-mono">
                <span>{'{{clientName}}'}</span><span>{'{{stage}}'}</span>
                <span>{'{{totalSpent}}'}</span><span>{'{{totalPaid}}'}</span>
                <span>{'{{pendingCount}}'}</span><span>{'{{avgTicket}}'}</span>
                <span>{'{{numPurchases}}'}</span><span>{'{{topProducts}}'}</span>
                <span>{'{{title}}'}</span><span>{'{{content}}'}</span>
                <span>{'{{tags}}'}</span><span>{'{{senderName}}'}</span>
                <span>{'{{businessName}}'}</span><span>{'{{documentNumber}}'}</span>
                <span>{'{{total}}'}</span><span>{'{{label}}'}</span>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              form="settings-form"
              disabled={saving}
              className="px-6 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
            >
              {saving ? 'Guardando...' : 'Guardar Configuración'}
            </button>
          </div>
        </div>
      )}

      {activeTab === 'backup' && (
        <div className="max-w-2xl space-y-6">
          <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                <Database size={20} className="text-blue-600" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900">Exportar Backup</h3>
                <p className="text-xs text-gray-500">Descarga todos los datos del sistema en formato JSON</p>
              </div>
            </div>
            <button onClick={handleExportBackup} disabled={backingUp}
              className="flex items-center gap-2 bg-red-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-red-700 transition-colors shadow-sm disabled:opacity-50">
              {backingUp ? (
                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Download size={18} />
              )}
              {backingUp ? 'Exportando...' : 'Descargar Backup'}
            </button>
          </div>

          <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
                <Upload size={20} className="text-green-600" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900">Importar Backup</h3>
                <p className="text-xs text-gray-500">Restaura datos desde un archivo JSON de backup</p>
              </div>
            </div>
            <input type="file" accept=".json" onChange={async (e) => {
              const file = e.target.files?.[0]
              if (!file) return
              try {
                const text = await file.text()
                const backup = JSON.parse(text)
                if (!backup.data) { toast.error('Archivo de backup inválido'); return }
                toast.success('Backup importado (funcionalidad en desarrollo)')
              } catch {
                toast.error('Error al leer el archivo')
              }
            }}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200" />
          </div>
        </div>
      )}

      {activeTab === 'bancos' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={handleOpenBankCreate}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Agregar Cuenta
            </button>
          </div>

          <div className="rounded-xl bg-white shadow-sm border border-gray-100 overflow-hidden">
            {bankAccounts.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-sm text-gray-500">No hay cuentas bancarias configuradas</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50">
                      <th className="text-left py-3 px-4 font-medium text-gray-500">Banco</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-500">Tipo</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-500">Número</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-500">Titular</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-500"></th>
                      <th className="text-right py-3 px-4 font-medium text-gray-500">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bankAccounts.map((account) => (
                      <tr key={account.id} className="border-b border-gray-50 hover:bg-gray-50">
                        <td className="py-3 px-4 text-gray-900 font-medium">
                          {account.bank_name}
                          {account.is_default && (
                            <Star className="inline-block h-3.5 w-3.5 text-yellow-500 ml-1.5 -mt-0.5" />
                          )}
                        </td>
                        <td className="py-3 px-4 text-gray-700">{account.account_type}</td>
                        <td className="py-3 px-4 text-gray-500 font-mono">{maskAccountNumber(account.account_number)}</td>
                        <td className="py-3 px-4 text-gray-700">{account.holder_name}</td>
                        <td className="py-3 px-4">
                          {account.is_default && (
                            <span className="inline-flex items-center rounded-full bg-yellow-100 text-yellow-800 px-2.5 py-0.5 text-xs font-medium">
                              Default
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleOpenBankEdit(account)}
                              className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                              aria-label="Editar"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleBankDelete(account)}
                              className="p-1.5 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                              aria-label="Eliminar"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <Modal
            isOpen={bankModalOpen}
            onClose={() => setBankModalOpen(false)}
            title={editingBank ? 'Editar Cuenta Bancaria' : 'Agregar Cuenta Bancaria'}
            size="md"
          >
            <form onSubmit={bankForm.handleSubmit(handleBankSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Banco <span className="text-red-500">*</span>
                </label>
                <input
                  {...bankForm.register('bank_name')}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
                {bankForm.formState.errors.bank_name && (
                  <p className="text-red-500 text-xs mt-1">{bankForm.formState.errors.bank_name.message}</p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tipo <span className="text-red-500">*</span>
                  </label>
                  <select
                    {...bankForm.register('account_type')}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  >
                    <option value="Ahorros">Ahorros</option>
                    <option value="Corriente">Corriente</option>
                  </select>
                  {bankForm.formState.errors.account_type && (
                    <p className="text-red-500 text-xs mt-1">{bankForm.formState.errors.account_type.message}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Número de Cuenta <span className="text-red-500">*</span>
                  </label>
                  <input
                    {...bankForm.register('account_number')}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                  {bankForm.formState.errors.account_number && (
                    <p className="text-red-500 text-xs mt-1">{bankForm.formState.errors.account_number.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Titular <span className="text-red-500">*</span>
                  </label>
                  <input
                    {...bankForm.register('holder_name')}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                  {bankForm.formState.errors.holder_name && (
                    <p className="text-red-500 text-xs mt-1">{bankForm.formState.errors.holder_name.message}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cédula / RNC</label>
                  <input
                    {...bankForm.register('id_number')}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  {...bankForm.register('email')}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
                {bankForm.formState.errors.email && (
                  <p className="text-red-500 text-xs mt-1">{bankForm.formState.errors.email.message}</p>
                )}
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  {...bankForm.register('is_default')}
                  className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                />
                <span className="text-sm text-gray-700">Cuenta predeterminada</span>
              </label>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setBankModalOpen(false)}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
                >
                  {editingBank ? 'Guardar Cambios' : 'Agregar Cuenta'}
                </button>
              </div>
            </form>
          </Modal>
        </div>
      )}

      {activeTab === 'usuarios' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={openUserCreate}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
            >
              <UsersIcon className="h-4 w-4" />
              Nuevo Usuario
            </button>
          </div>

          <div className="rounded-xl bg-white shadow-sm border border-gray-100 overflow-hidden">
            {users.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-sm text-gray-500">No hay usuarios registrados</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50">
                      <th className="text-left py-3 px-4 font-medium text-gray-500">Nombre</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-500">Email</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-500">Rol</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-500">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user.id} className="border-b border-gray-50 hover:bg-gray-50">
                        <td className="py-3 px-4 text-gray-900 font-medium">{user.name}</td>
                        <td className="py-3 px-4 text-gray-700">{user.email}</td>
                        <td className="py-3 px-4">
                          <span className={cn(
                            'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
                            user.role === 'admin' ? 'bg-red-100 text-red-800' :
                            user.role === 'seller' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                          )}>
                            {user.role === 'admin' ? 'Admin' : user.role === 'seller' ? 'Vendedor' : 'Asistente'}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => openUserEdit(user)}
                              className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                              aria-label="Editar"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleUserDelete(user)}
                              className="p-1.5 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                              aria-label="Eliminar"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <Modal
            isOpen={userModalOpen}
            onClose={() => setUserModalOpen(false)}
            title={editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}
            size="md"
          >
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre <span className="text-red-500">*</span>
                </label>
                <input
                  value={userForm.name}
                  onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={userForm.email}
                  onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contraseña {!editingUser && <span className="text-red-500">*</span>}
                  {editingUser && <span className="text-gray-400 text-xs ml-1">(dejar vacío para mantener)</span>}
                </label>
                <input
                  type="password"
                  value={userForm.password}
                  onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rol</label>
                <select
                  value={userForm.role}
                  onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                >
                  <option value="seller">Vendedor</option>
                  <option value="assistant">Asistente</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              {userForm.role !== 'admin' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Acceso a Módulos</label>
                  <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto border border-gray-100 rounded-lg p-3">
                    {MODULES.map((mod) => (
                      <label key={mod.key} className="flex items-center gap-2 cursor-pointer text-sm">
                        <input
                          type="checkbox"
                          checked={userForm.permissions.includes(mod.key)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setUserForm({ ...userForm, permissions: [...userForm.permissions, mod.key] })
                            } else {
                              setUserForm({ ...userForm, permissions: userForm.permissions.filter(p => p !== mod.key) })
                            }
                          }}
                          className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                        />
                        {mod.label}
                      </label>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setUserModalOpen(false)}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleUserSubmit}
                  disabled={userSaving}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  {userSaving ? 'Guardando...' : editingUser ? 'Guardar Cambios' : 'Crear Usuario'}
                </button>
              </div>
            </div>
          </Modal>
        </div>
      )}
    </PageContainer>
  )
}
