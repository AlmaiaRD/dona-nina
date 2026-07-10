import type { UserProfile } from '@/types/database'

export async function getUsers(): Promise<UserProfile[]> {
  const res = await fetch('/api/auth/users')
  if (!res.ok) throw new Error('Error al obtener usuarios')
  return res.json()
}

export async function createUser(data: { name: string; email: string; password: string; role: string; permissions?: string[] }) {
  const res = await fetch('/api/auth/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error || 'Error al crear usuario')
  }
  return res.json()
}

export async function updateUser(id: string, data: { name?: string; email?: string; role?: string; password?: string; permissions?: string[] }) {
  const res = await fetch(`/api/auth/users/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error || 'Error al actualizar usuario')
  }
  return res.json()
}

export async function deleteUser(id: string) {
  const res = await fetch(`/api/auth/users/${id}`, { method: 'DELETE' })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error || 'Error al eliminar usuario')
  }
}
