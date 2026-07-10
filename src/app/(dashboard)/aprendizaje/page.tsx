'use client'

import { useState } from 'react'
import { PageContainer } from '@/components/layout/PageContainer'
import { Modal } from '@/components/ui/Modal'
import { Plus, Search, Trash2, Edit3, Lightbulb, Tag } from 'lucide-react'
import toast from 'react-hot-toast'

interface Note {
  id: string
  title: string
  content: string
  tags: string
  created_at: string
  updated_at: string
}

interface NoteForm {
  title: string
  content: string
  tags: string
}

function loadNotes(): Note[] {
  try {
    return JSON.parse(localStorage.getItem('donanina_learning_notes') || '[]')
  } catch (err) { console.error('[AprendizajePage] Error:', err); return [] }
}

function saveNotes(notes: Note[]): void {
  localStorage.setItem('donanina_learning_notes', JSON.stringify(notes))
}

function generateId(): string {
  return crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`
}

const emptyForm: NoteForm = { title: '', content: '', tags: '' }

export default function AprendizajePage() {
  const [notes, setNotes] = useState<Note[]>(() => loadNotes())
  const [searchQuery, setSearchQuery] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingNote, setEditingNote] = useState<Note | null>(null)
  const [form, setForm] = useState<NoteForm>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [filterTag, setFilterTag] = useState('')

  const allTags = Array.from(
    new Set(
      notes.flatMap((n) =>
        n.tags
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean)
      )
    )
  ).sort()

  const filtered = notes
    .filter((n) => {
      const q = searchQuery.toLowerCase()
      if (q && !n.title.toLowerCase().includes(q) && !n.content.toLowerCase().includes(q)) {
        return false
      }
      if (filterTag) {
        const noteTags = n.tags.split(',').map((t) => t.trim())
        if (!noteTags.includes(filterTag)) return false
      }
      return true
    })
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())

  function openCreate() {
    setEditingNote(null)
    setForm(emptyForm)
    setShowModal(true)
  }

  function openEdit(note: Note) {
    setEditingNote(note)
    setForm({ title: note.title, content: note.content, tags: note.tags })
    setShowModal(true)
  }

  function handleSave() {
    if (!form.title.trim()) {
      toast.error('El título es obligatorio')
      return
    }
    if (!form.content.trim()) {
      toast.error('El contenido es obligatorio')
      return
    }
    setSaving(true)
    const now = new Date().toISOString()
    let updated: Note[]

    if (editingNote) {
      updated = notes.map((n) =>
        n.id === editingNote.id
          ? { ...n, title: form.title.trim(), content: form.content.trim(), tags: form.tags.trim(), updated_at: now }
          : n
      )
      toast.success('Nota actualizada')
    } else {
      const note: Note = {
        id: generateId(),
        title: form.title.trim(),
        content: form.content.trim(),
        tags: form.tags.trim(),
        created_at: now,
        updated_at: now,
      }
      updated = [note, ...notes]
      toast.success('Nota creada')
    }

    saveNotes(updated)
    setNotes(updated)
    setSaving(false)
    setShowModal(false)
  }

  function handleDelete(id: string) {
    if (!window.confirm('¿Eliminar esta nota definitivamente?')) return
    const updated = notes.filter((n) => n.id !== id)
    saveNotes(updated)
    setNotes(updated)
    toast.success('Nota eliminada')
  }

  function formatDate(iso: string) {
    return new Intl.DateTimeFormat('es-DO', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(iso))
  }

  return (
    <PageContainer
      title="Notas de Aprendizaje"
      subtitle="Lecciones aprendidas, errores que no repetir, ideas"
      action={
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white rounded-lg transition-colors"
          style={{ backgroundColor: '#800020' }}
        >
          <Plus className="h-4 w-4" />
          Nueva Nota
        </button>
      }
    >
      <div className="space-y-5">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar notas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#800020]/20 focus:border-[#800020] transition-colors"
            />
          </div>
        </div>

        {allTags.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <Tag className="h-4 w-4 text-gray-400" />
            {allTags.map((tag) => (
              <button
                key={tag}
                onClick={() => setFilterTag(filterTag === tag ? '' : tag)}
                className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                  filterTag === tag
                    ? 'text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
                style={filterTag === tag ? { backgroundColor: '#800020' } : undefined}
              >
                {tag}
              </button>
            ))}
            {filterTag && (
              <button
                onClick={() => setFilterTag('')}
                className="text-xs text-gray-400 hover:text-gray-600 underline"
              >
                Limpiar filtro
              </button>
            )}
          </div>
        )}

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[40vh] gap-3 text-gray-400">
            <Lightbulb className="h-12 w-12" />
            <p className="text-lg font-medium">No hay notas aún</p>
            <p className="text-sm">Crea tu primera nota de aprendizaje</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((note) => (
              <div
                key={note.id}
                className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex flex-col"
              >
                {note.tags.trim() && (
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {note.tags.split(',').map((t) => {
                      const tag = t.trim()
                      if (!tag) return null
                      return (
                        <span
                          key={tag}
                          className="px-2 py-0.5 text-[11px] font-medium rounded-full"
                          style={{ backgroundColor: '#fff8f0', color: '#d97706' }}
                        >
                          {tag}
                        </span>
                      )
                    })}
                  </div>
                )}
                <h3 className="font-semibold text-gray-900 mb-1.5">{note.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed line-clamp-3 flex-1">
                  {note.content}
                </p>
                <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-50">
                  <span className="text-[11px] text-gray-400">{formatDate(note.updated_at)}</span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEdit(note)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-[#d97706] hover:bg-[#fff8f0] transition-colors"
                      title="Editar"
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(note.id)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                      title="Eliminar"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal
        isOpen={showModal}
        onClose={() => !saving && setShowModal(false)}
        title={editingNote ? 'Editar Nota' : 'Nueva Nota'}
        subtitle={editingNote ? 'Actualiza los campos que desees' : 'Registra una lección o idea'}
        size="lg"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Título</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Ej: Error con tipos en TypeScript"
              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#800020]/20 focus:border-[#800020] transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contenido</label>
            <textarea
              rows={6}
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              placeholder="Describe lo que aprendiste..."
              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#800020]/20 focus:border-[#800020] transition-colors resize-y"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Etiquetas <span className="text-gray-400 font-normal">(opcional)</span>
            </label>
            <input
              type="text"
              value={form.tags}
              onChange={(e) => setForm({ ...form, tags: e.target.value })}
              placeholder="separados por comas — Ej: typescript, debugging, css"
              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#800020]/20 focus:border-[#800020] transition-colors"
            />
          </div>
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              onClick={() => setShowModal(false)}
              disabled={saving}
              className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white rounded-lg transition-colors disabled:opacity-50"
              style={{ backgroundColor: '#800020' }}
            >
              {saving ? 'Guardando...' : editingNote ? 'Guardar Cambios' : 'Crear Nota'}
            </button>
          </div>
        </div>
      </Modal>
    </PageContainer>
  )
}
