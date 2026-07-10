'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { Plus, Pencil, Trash2, FolderPlus } from 'lucide-react'
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
import { formatCurrency } from '@/lib/utils'
import { getMenuItems, getMenuCategories, createMenuItem, updateMenuItem, deleteMenuItem, createCategory, updateCategory, deleteCategory } from '@/services/menu'
import type { MenuItem, MenuCategory } from '@/types/database'

const categorySchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  description: z.string().optional().or(z.literal('')),
  sort_order: z.number().int().min(0),
})

type CategoryFormData = z.infer<typeof categorySchema>

const itemSchema = z.object({
  code: z.string().min(1, 'El código es requerido'),
  name: z.string().min(1, 'El nombre es requerido'),
  description: z.string().optional().or(z.literal('')),
  ingredients: z.string().optional().or(z.literal('')),
  category_id: z.string().min(1, 'La categoría es requerida'),
  price: z.number().min(0, 'El precio debe ser mayor a 0'),
  cost: z.number().min(0, 'El costo debe ser mayor a 0').optional(),
  active: z.boolean(),
  available: z.boolean(),
  itbis_enabled: z.boolean(),
  itbis_rate: z.number().min(0).max(100),
})

type ItemFormData = z.infer<typeof itemSchema>

interface MenuItemWithCategory extends MenuItem {
  category: MenuCategory
}

export default function MenuPage() {
  const [items, setItems] = useState<MenuItemWithCategory[]>([])
  const [categories, setCategories] = useState<MenuCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [itemModalOpen, setItemModalOpen] = useState(false)
  const [categoryModalOpen, setCategoryModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null)
  const [editingCategory, setEditingCategory] = useState<MenuCategory | null>(null)
  const [detailItem, setDetailItem] = useState<MenuItemWithCategory | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)

  const searchParams = useSearchParams()

  const categoryForm = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
    defaultValues: { name: '', description: '', sort_order: 0 },
  })

  const itemForm = useForm<ItemFormData>({
    resolver: zodResolver(itemSchema),
    defaultValues: {
      code: '',
      name: '',
      description: '',
      ingredients: '',
      category_id: '',
      price: 0,
      cost: 0,
      active: true,
      available: true,
      itbis_enabled: false,
      itbis_rate: 18,
    },
  })

  const watchPrice = itemForm.watch('price')
  const watchCost = itemForm.watch('cost')
  const watchItbisEnabled = itemForm.watch('itbis_enabled')
  const profit = (watchPrice || 0) - (watchCost || 0)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [itemsData, categoriesData] = await Promise.all([
        getMenuItems(),
        getMenuCategories(),
      ])
      setItems(itemsData as MenuItemWithCategory[])
      setCategories(categoriesData)
    } catch (err) { console.error('[MenuPage] Error:', err); setError('Error al cargar el menú') }
    finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleOpenItemCreate = useCallback(() => {
    setEditingItem(null)
    itemForm.reset({
      code: '',
      name: '',
      description: '',
      ingredients: '',
      category_id: categories[0]?.id ?? '',
      price: 0,
      cost: 0,
      active: true,
      available: true,
      itbis_enabled: false,
      itbis_rate: 18,
    })
    setItemModalOpen(true)
  }, [itemForm, categories])

  useEffect(() => {
    if (searchParams.get('action') === 'new') {
      handleOpenItemCreate()
    }
  }, [searchParams, handleOpenItemCreate])

  function handleOpenCategoryCreate() {
    setEditingCategory(null)
    categoryForm.reset({ name: '', description: '', sort_order: 0 })
    setCategoryModalOpen(true)
  }

  function handleOpenCategoryEdit(cat: MenuCategory) {
    setEditingCategory(cat)
    categoryForm.reset({
      name: cat.name,
      description: cat.description ?? '',
      sort_order: cat.sort_order,
    })
    setCategoryModalOpen(true)
  }

  async function handleCategorySubmit(data: CategoryFormData) {
    try {
      if (editingCategory) {
        await updateCategory(editingCategory.id, data)
        toast.success('Categoría actualizada correctamente')
      } else {
        await createCategory(data)
        toast.success('Categoría creada correctamente')
      }
      setCategoryModalOpen(false)
      await fetchData()
    } catch (err) { console.error('[MenuPage] Error:', err); toast.error('Error al guardar la categoría') }
  }

  async function handleCategoryDelete(cat: MenuCategory) {
    if (!window.confirm(`¿Estás seguro de eliminar la categoría "${cat.name}"?`)) return
    try {
      await deleteCategory(cat.id)
      toast.success('Categoría eliminada correctamente')
      await fetchData()
    } catch (err) { console.error('[MenuPage] Error:', err); toast.error('Error al eliminar la categoría') }
  }

  function handleOpenItemEdit(item: MenuItemWithCategory) {
    setEditingItem(item)
    itemForm.reset({
      code: item.code,
      name: item.name,
      description: item.description ?? '',
      ingredients: item.ingredients ?? '',
      category_id: item.category_id,
      price: item.price,
      cost: item.cost,
      active: item.active,
      available: item.available,
      itbis_enabled: item.itbis_enabled ?? false,
      itbis_rate: item.itbis_rate ?? 18,
    })
    setItemModalOpen(true)
  }

  async function handleItemSubmit(data: ItemFormData) {
    try {
      if (editingItem) {
        await updateMenuItem(editingItem.id, data)
        toast.success('Producto actualizado correctamente')
      } else {
        await createMenuItem(data)
        toast.success('Producto creado correctamente')
      }
      setItemModalOpen(false)
      await fetchData()
    } catch (err) { console.error('[MenuPage] Error:', err); toast.error('Error al guardar el producto') }
  }

  function handleViewDetail(item: MenuItemWithCategory) {
    setDetailItem(item)
    setDetailOpen(true)
  }

  async function handleItemDelete(item: MenuItemWithCategory) {
    if (!window.confirm(`¿Estás seguro de eliminar "${item.name}"?`)) return
    try {
      await deleteMenuItem(item.id)
      toast.success('Producto eliminado correctamente')
      await fetchData()
    } catch (err) { console.error('[MenuPage] Error:', err); toast.error('Error al eliminar el producto') }
  }

  const columns: ColumnDef<MenuItemWithCategory>[] = [
    {
      accessorKey: 'code',
      header: 'Código',
    },
    {
      accessorKey: 'name',
      header: 'Nombre',
      cell: ({ row }) => (
        <button
          onClick={() => handleViewDetail(row.original)}
          className="text-blue-600 hover:text-blue-800 hover:underline font-medium transition-colors"
        >
          {row.original.name}
        </button>
      ),
    },
    {
      accessorKey: 'category.name',
      header: 'Categoría',
      cell: ({ row }) => row.original.category?.name ?? '-',
    },
    {
      accessorKey: 'price',
      header: 'Precio',
      cell: ({ row }) => formatCurrency(row.original.price),
    },
    {
      accessorKey: 'cost',
      header: 'Costo',
      cell: ({ row }) => row.original.cost ? formatCurrency(row.original.cost) : '—',
    },
    {
      id: 'profit',
      header: 'Ganancia',
      cell: ({ row }) => {
        const p = (row.original.price || 0) - (row.original.cost || 0)
        return (
          <span className={p >= 0 ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
            {formatCurrency(p)}
          </span>
        )
      },
    },
    {
      accessorKey: 'active',
      header: 'Estado',
      cell: ({ row }) => (
        <Badge status={row.original.active ? 'AVAILABLE' : 'CANCELLED'} />
      ),
    },
    {
      accessorKey: 'available',
      header: 'Disponible',
      cell: ({ row }) => (
        <span className={row.original.available ? 'text-green-600' : 'text-red-600'}>
          {row.original.available ? 'Sí' : 'No'}
        </span>
      ),
    },
    {
      id: 'acciones',
      header: '',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleOpenItemEdit(row.original)}
            className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
            aria-label="Editar"
          >
            <IconPencil className="h-4 w-4" />
          </button>
          <button
            onClick={() => handleItemDelete(row.original)}
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
      <PageContainer title="Menú" subtitle="Catálogo de productos">
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
        </div>
      </PageContainer>
    )
  }

  if (error) {
    return (
      <PageContainer title="Menú" subtitle="Catálogo de productos">
        <div className="text-center py-20">
          <p className="text-gray-500 mb-4">{error}</p>
          <button
            onClick={fetchData}
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
      title="Menú"
      subtitle="Catálogo de productos"
      action={
        <div className="flex items-center gap-2">
          <button
            onClick={handleOpenCategoryCreate}
            className="flex items-center gap-2 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            <FolderPlus className="h-4 w-4" />
            Nueva Categoría
          </button>
          <button
            onClick={handleOpenItemCreate}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Nuevo Producto
          </button>
        </div>
      }
    >
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Categorías</h2>
        <div className="flex flex-wrap gap-2 mb-6">
          {categories.map((cat) => (
            <div
              key={cat.id}
              className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm"
            >
              <span className="text-gray-700">{cat.name}</span>
              <span className="text-xs text-gray-400">({cat.sort_order})</span>
              <button
                onClick={() => handleOpenCategoryEdit(cat)}
                className="p-0.5 text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Editar categoría"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => handleCategoryDelete(cat)}
                className="p-0.5 text-gray-400 hover:text-red-600 transition-colors"
                aria-label="Eliminar categoría"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
          {categories.length === 0 && (
            <p className="text-sm text-gray-500">No hay categorías creadas</p>
          )}
        </div>
      </div>

      <DataTable columns={columns} data={items} searchable searchPlaceholder="Buscar producto..." pageSize={20} />

      <Modal
        isOpen={categoryModalOpen}
        onClose={() => setCategoryModalOpen(false)}
        title={editingCategory ? 'Editar Categoría' : 'Nueva Categoría'}
      >
        <form onSubmit={categoryForm.handleSubmit(handleCategorySubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre <span className="text-red-500">*</span>
            </label>
            <input
              {...categoryForm.register('name')}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
            {categoryForm.formState.errors.name && (
              <p className="text-red-500 text-xs mt-1">{categoryForm.formState.errors.name.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
            <textarea
              {...categoryForm.register('description')}
              rows={3}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Orden</label>
            <input
              type="number"
              {...categoryForm.register('sort_order', { valueAsNumber: true })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setCategoryModalOpen(false)}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
            >
              {editingCategory ? 'Guardar Cambios' : 'Crear Categoría'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={itemModalOpen}
        onClose={() => setItemModalOpen(false)}
        title={editingItem ? 'Editar Producto' : 'Nuevo Producto'}
        size="lg"
      >
        <form onSubmit={itemForm.handleSubmit(handleItemSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Código <span className="text-red-500">*</span>
              </label>
              <input
                {...itemForm.register('code')}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
              {itemForm.formState.errors.code && (
                <p className="text-red-500 text-xs mt-1">{itemForm.formState.errors.code.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre <span className="text-red-500">*</span>
              </label>
              <input
                {...itemForm.register('name')}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
              {itemForm.formState.errors.name && (
                <p className="text-red-500 text-xs mt-1">{itemForm.formState.errors.name.message}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
            <textarea
              {...itemForm.register('description')}
              rows={2}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ingredientes</label>
            <textarea
              {...itemForm.register('ingredients')}
              rows={2}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Categoría <span className="text-red-500">*</span>
            </label>
            <select
              {...itemForm.register('category_id')}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
            >
              <option value="">Seleccionar...</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
            {itemForm.formState.errors.category_id && (
              <p className="text-red-500 text-xs mt-1">{itemForm.formState.errors.category_id.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Precio <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                {...itemForm.register('price', { valueAsNumber: true })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
              {itemForm.formState.errors.price && (
                <p className="text-red-500 text-xs mt-1">{itemForm.formState.errors.price.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Costo</label>
              <input
                type="number"
                step="0.01"
                {...itemForm.register('cost', { valueAsNumber: true })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-sm text-gray-500 mb-1">Ganancia por unidad</div>
            <div className={`text-xl font-bold ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(profit)}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                {...itemForm.register('itbis_enabled')}
                className="w-4 h-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
              />
              <span className="text-sm text-gray-700">Aplica ITBIS</span>
            </label>
            {watchItbisEnabled && (
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-700">Tasa:</label>
                <input
                  type="number"
                  step="0.01"
                  {...itemForm.register('itbis_rate', { valueAsNumber: true })}
                  className="w-20 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
                <span className="text-sm text-gray-500">%</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                {...itemForm.register('active')}
                className="w-4 h-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
              />
              <span className="text-sm text-gray-700">Activo</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                {...itemForm.register('available')}
                className="w-4 h-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
              />
              <span className="text-sm text-gray-700">Disponible</span>
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setItemModalOpen(false)}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
            >
              {editingItem ? 'Guardar Cambios' : 'Crear Producto'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={detailOpen}
        onClose={() => { setDetailOpen(false); setDetailItem(null) }}
        title={detailItem?.name ?? 'Detalle del Producto'}
        size="lg"
      >
        {detailItem && (
          <div>
            <div className="flex justify-end mb-4">
              <PrintActions elementId="menu-item-detail" filename={`producto-${detailItem.name}`} />
            </div>
            <div id="menu-item-detail" className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500">Código</label>
                  <p className="text-gray-900">{detailItem.code}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Nombre</label>
                  <p className="text-gray-900">{detailItem.name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Categoría</label>
                  <p className="text-gray-900">{detailItem.category?.name || '—'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Precio</label>
                  <p className="text-gray-900">{formatCurrency(detailItem.price)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Costo</label>
                  <p className="text-gray-900">{detailItem.cost ? formatCurrency(detailItem.cost) : '—'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Ganancia</label>
                  <p className="text-gray-900 font-medium">{(detailItem.price - (detailItem.cost || 0)) >= 0 ? '' : '-'}{formatCurrency(Math.abs(detailItem.price - (detailItem.cost || 0)))}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">ITBIS</label>
                  <p className="text-gray-900">
                    {detailItem.itbis_enabled ? `Sí (${detailItem.itbis_rate}%)` : 'No'}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Estado</label>
                  <p className="text-gray-900">
                    <Badge status={detailItem.active ? 'AVAILABLE' : 'CANCELLED'} />
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Disponible</label>
                  <p className="text-gray-900">
                    <span className={detailItem.available ? 'text-green-600' : 'text-red-600'}>
                      {detailItem.available ? 'Sí' : 'No'}
                    </span>
                  </p>
                </div>
              </div>
              {detailItem.description && (
                <div>
                  <label className="block text-sm font-medium text-gray-500">Descripción</label>
                  <p className="text-gray-900">{detailItem.description}</p>
                </div>
              )}
              {detailItem.ingredients && (
                <div>
                  <label className="block text-sm font-medium text-gray-500">Ingredientes</label>
                  <p className="text-gray-900">{detailItem.ingredients}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </PageContainer>
  )
}
