'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'
import { IconEye, IconPencil, IconTrash2 } from '@/components/ui/Icons'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import type { ColumnDef } from '@tanstack/react-table'
import type { Expense } from '@/types/database'
import { getExpenses, createExpense, updateExpense, deleteExpense } from '@/services/expenses'
import { getExpenseCategoryTree } from '@/services/expense-categories'
import type { ExpenseCategory } from '@/types/database'
import { PageContainer } from '@/components/layout/PageContainer'
import { DataTable } from '@/components/ui/DataTable'
import { Modal } from '@/components/ui/Modal'
import { Badge } from '@/components/ui/Badge'
import { formatCurrency, formatDateShort } from '@/lib/utils'
import { PrintActions } from '@/components/ui/PrintActions'

const expenseSchema = z.object({
  expense_date: z.string().min(1, 'La fecha es requerida'),
  category: z.string().min(1, 'Seleccione una categoría'),
  concept: z.string().min(1, 'El concepto es requerido'),
  amount: z.number().positive('Debe ser mayor a 0'),
  payment_method: z.string().min(1, 'Seleccione un método de pago'),
  beneficiary: z.string().optional(),
  receipt_number: z.string().optional(),
  notes: z.string().optional(),
})

type ExpenseFormData = z.infer<typeof expenseSchema>

const PAYMENT_METHODS = ['EFECTIVO', 'TRANSFERENCIA', 'TARJETA']

const defaultFormValues: ExpenseFormData = {
  expense_date: new Date().toISOString().split('T')[0],
  category: '',
  concept: '',
  amount: 0,
  payment_method: '',
  beneficiary: '',
  receipt_number: '',
  notes: '',
}

const inputClass = 'w-full px-3 py-2 border border-[#E8E0D8] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#7C1D2E]/30 focus:border-transparent'
const labelClass = 'block text-sm font-medium text-[#3D2B1F] mb-1'
const errorClass = 'text-xs text-[#7C1D2E] mt-0.5'

function FormInput({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className={labelClass}>{label}</label>
      {children}
      {error && <p className={errorClass}>{error}</p>}
    </div>
  )
}

export default function GastosPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null)
  const [detailExpense, setDetailExpense] = useState<Expense | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [categoryTree, setCategoryTree] = useState<ExpenseCategory[]>([])

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ExpenseFormData>({
    resolver: zodResolver(expenseSchema),
    defaultValues: defaultFormValues,
  })

  function flattenCategories(nodes: ExpenseCategory[], depth = 0): { name: string; depth: number }[] {
    const result: { name: string; depth: number }[] = []
    for (const node of nodes) {
      result.push({ name: node.name, depth })
      if ((node as any).children?.length) {
        result.push(...flattenCategories((node as any).children, depth + 1))
      }
    }
    return result
  }

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const [data, tree] = await Promise.all([
          getExpenses(),
          getExpenseCategoryTree(),
        ])
        if (!cancelled) {
          setExpenses(data)
          setCategoryTree(tree)
        }
      } catch (err: any) {
        const msg = err?.message || 'Error al cargar gastos'
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

  async function fetchExpenses() {
    try {
      const [data, tree] = await Promise.all([
        getExpenses(),
        getExpenseCategoryTree(),
      ])
      setExpenses(data)
      setCategoryTree(tree)
    } catch (err: any) {
      const msg = err?.message || 'Error al cargar gastos'
      setError(msg)
      toast.error(msg)
    }
  }

  useEffect(() => {
    if (searchParams.get('action') === 'new') {
      queueMicrotask(() => {
        setEditingExpense(null)
        setModalOpen(true)
      })
    }
  }, [searchParams])

  useEffect(() => {
    if (searchParams.get('action') === 'new') {
      reset(defaultFormValues)
    }
  }, [searchParams, reset])

  const openNewModal = () => {
    setEditingExpense(null)
    reset(defaultFormValues)
    setModalOpen(true)
  }

  const openEditModal = (expense: Expense) => {
    setEditingExpense(expense)
    reset({
      expense_date: expense.expense_date.split('T')[0],
      category: expense.category,
      concept: expense.concept,
      amount: expense.amount,
      payment_method: expense.payment_method,
      beneficiary: expense.beneficiary || '',
      receipt_number: expense.receipt_number || '',
      notes: expense.notes || '',
    })
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    setEditingExpense(null)
    router.push('/gastos')
  }

  const onSubmit = async (formData: ExpenseFormData) => {
    try {
      if (editingExpense) {
        await updateExpense(editingExpense.id, formData)
        toast.success('Gasto actualizado correctamente')
      } else {
        await createExpense(formData)
        toast.success('Gasto registrado correctamente')
      }
      closeModal()
      fetchExpenses()
    } catch (err: any) {
      toast.error(err?.message || 'Error al guardar el gasto')
    }
  }

  const handleViewDetail = (expense: Expense) => {
    setDetailExpense(expense)
    setDetailOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este gasto?')) return
    try {
      await deleteExpense(id)
      toast.success('Gasto eliminado correctamente')
      fetchExpenses()
    } catch (err: any) {
      toast.error(err?.message || 'Error al eliminar el gasto')
    }
  }

  const columns: ColumnDef<Expense>[] = [
    {
      header: 'Fecha',
      accessorKey: 'expense_date',
      cell: ({ getValue }) => formatDateShort(getValue() as string),
    },
    {
      header: 'Categoría',
      accessorKey: 'category',
      cell: ({ getValue }) => <Badge status={getValue() as string} />,
    },
    {
      header: 'Concepto',
      accessorKey: 'concept',
      cell: ({ getValue }) => {
        const text = getValue() as string
        return text.length > 40 ? text.slice(0, 40) + '...' : text
      },
    },
    {
      header: 'Monto',
      accessorKey: 'amount',
      cell: ({ getValue }) => formatCurrency(getValue() as number),
    },
    {
      header: 'Método',
      accessorKey: 'payment_method',
    },
    {
      header: 'Beneficiario',
      accessorKey: 'beneficiary',
      cell: ({ getValue }) => (getValue() as string) || '—',
    },
    {
      header: 'Acciones',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleViewDetail(row.original)}
            className="p-1.5 text-gray-600 hover:bg-[#FDF8F3] rounded-lg transition-colors"
            title="Ver detalle"
          >
            <IconEye className="h-4 w-4" />
          </button>
          <button
            onClick={() => openEditModal(row.original)}
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

  return (
    <PageContainer
      title="Gastos"
      subtitle="Registro de gastos operativos"
      action={
        <button
          onClick={() => { router.push('/gastos?action=new'); openNewModal() }}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#7C1D2E] rounded-lg hover:bg-[#5C1420] transition-colors"
        >
          <Plus className="h-4 w-4" />
          Nuevo Gasto
        </button>
      }
    >
      {loading ? (
        <div className="flex items-center justify-center min-h-[40vh]">
          <p className="text-[#9C8A82] text-lg">Cargando...</p>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4">
          <p className="text-[#7C1D2E] text-lg">{error}</p>
          <button
            onClick={fetchExpenses}
            className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-medium text-white bg-[#7C1D2E] rounded-lg hover:bg-[#5C1420] transition-colors"
          >
            Reintentar
          </button>
        </div>
      ) : (
        <DataTable columns={columns} data={expenses} searchable pageSize={15} />
      )}

      <Modal isOpen={detailOpen} onClose={() => setDetailOpen(false)} title="Detalle del Gasto" size="xl">
        {detailExpense && (
          <div className="space-y-4">
            <div className="flex justify-end">
              <PrintActions elementId="expense-detail" filename={`gasto-${detailExpense.id}`} />
            </div>
            <div id="expense-detail" className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-medium text-[#9C8A82] uppercase tracking-wider">Fecha</p>
                  <p className="text-sm text-[#3D2B1F] mt-0.5">{formatDateShort(detailExpense.expense_date)}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-[#9C8A82] uppercase tracking-wider">Categoría</p>
                  <p className="text-sm text-[#3D2B1F] mt-0.5">{detailExpense.category}</p>
                </div>
                <div className="sm:col-span-2">
                  <p className="text-xs font-medium text-[#9C8A82] uppercase tracking-wider">Concepto</p>
                  <p className="text-sm text-[#3D2B1F] mt-0.5">{detailExpense.concept}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-[#9C8A82] uppercase tracking-wider">Monto</p>
                  <p className="text-sm text-[#3D2B1F] mt-0.5">{formatCurrency(detailExpense.amount)}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-[#9C8A82] uppercase tracking-wider">Método de Pago</p>
                  <p className="text-sm text-[#3D2B1F] mt-0.5">{detailExpense.payment_method}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-[#9C8A82] uppercase tracking-wider">Beneficiario</p>
                  <p className="text-sm text-[#3D2B1F] mt-0.5">{detailExpense.beneficiary || '—'}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-[#9C8A82] uppercase tracking-wider">N° Recibo</p>
                  <p className="text-sm text-[#3D2B1F] mt-0.5">{detailExpense.receipt_number || '—'}</p>
                </div>
                {detailExpense.notes && (
                  <div className="sm:col-span-2">
                    <p className="text-xs font-medium text-[#9C8A82] uppercase tracking-wider">Notas</p>
                    <p className="text-sm text-[#3D2B1F] mt-0.5">{detailExpense.notes}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>

      <Modal isOpen={modalOpen} onClose={closeModal} title={editingExpense ? 'Editar Gasto' : 'Nuevo Gasto'} size="lg">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormInput label="Fecha" error={errors.expense_date?.message}>
              <input type="date" {...register('expense_date')} className={inputClass} />
            </FormInput>

            <FormInput label="Categoría" error={errors.category?.message}>
              <select {...register('category')} className={inputClass}>
                <option value="">Seleccionar...</option>
                {flattenCategories(categoryTree).map((cat, i) => (
                  <option key={i} value={cat.name} style={{ paddingLeft: `${cat.depth * 16 + 8}px` }}>
                    {cat.depth > 0 && '— '}{cat.name}
                  </option>
                ))}
              </select>
            </FormInput>

            <FormInput label="Monto (RD$)" error={errors.amount?.message}>
              <input type="number" step="0.01" min="0" {...register('amount', { valueAsNumber: true })} className={inputClass} placeholder="0.00" />
            </FormInput>

            <FormInput label="Método de Pago" error={errors.payment_method?.message}>
              <select {...register('payment_method')} className={inputClass}>
                <option value="">Seleccionar...</option>
                {PAYMENT_METHODS.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </FormInput>

            <FormInput label="Beneficiario">
              <input type="text" {...register('beneficiary')} className={inputClass} placeholder="Nombre del beneficiario" />
            </FormInput>

            <FormInput label="N° Recibo">
              <input type="text" {...register('receipt_number')} className={inputClass} placeholder="Número de recibo" />
            </FormInput>
          </div>

          <FormInput label="Concepto" error={errors.concept?.message}>
            <textarea {...register('concept')} rows={2} className={inputClass} placeholder="Descripción del gasto" />
          </FormInput>

          <FormInput label="Notas">
            <textarea {...register('notes')} rows={2} className={inputClass} placeholder="Notas adicionales (opcional)" />
          </FormInput>

          <div className="flex justify-end gap-3 pt-2 border-t border-[#E8E0D8]">
            <button
              type="button"
              onClick={closeModal}
              className="px-4 py-2 text-sm font-medium text-[#3D2B1F] bg-[#FDF8F3] rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-white bg-[#7C1D2E] rounded-lg hover:bg-[#5C1420] disabled:opacity-50 transition-colors"
            >
              {isSubmitting ? 'Guardando...' : editingExpense ? 'Actualizar' : 'Guardar'}
            </button>
          </div>
        </form>
      </Modal>
    </PageContainer>
  )
}
