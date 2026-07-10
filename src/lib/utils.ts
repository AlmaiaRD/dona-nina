import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-DO', {
    style: 'currency',
    currency: 'DOP',
    minimumFractionDigits: 2,
  }).format(amount)
}

export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('es-DO', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export function formatDateShort(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('es-DO', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
}

export function formatTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleTimeString('es-DO', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

const UNITS = ['', 'UN', 'DOS', 'TRES', 'CUATRO', 'CINCO', 'SEIS', 'SIETE', 'OCHO', 'NUEVE']
const TENS = ['', 'DIEZ', 'VEINTE', 'TREINTA', 'CUARENTA', 'CINCUENTA', 'SESENTA', 'SETENTA', 'OCHENTA', 'NOVENTA']
const SPECIAL_TENS = ['ONCE', 'DOCE', 'TRECE', 'CATORCE', 'QUINCE', 'DIECISÉIS', 'DIECISIETE', 'DIECIOCHO', 'DIECINUEVE']
const HUNDREDS = ['', 'CIENTO', 'DOSCIENTOS', 'TRESCIENTOS', 'CUATROCIENTOS', 'QUINIENTOS', 'SEISCIENTOS', 'SETECIENTOS', 'OCHOCIENTOS', 'NOVECIENTOS']
const TEENS_WITH_Y = ['', 'ÚN', 'DÓS', 'TRÉS', 'CUATRO', 'CINCO', 'SEIS', 'SIETE', 'OCHO', 'NUEVE']

export function numberToWords(n: number): string {
  const entero = Math.floor(n)
  const decimal = Math.round((n - entero) * 100)

  const convert = (num: number): string => {
    if (num === 0) return ''
    if (num >= 1000000) {
      const millions = Math.floor(num / 1000000)
      const remainder = num % 1000000
      const prefix = millions === 1 ? 'UN MILLÓN' : convert(millions) + ' MILLONES'
      return remainder === 0 ? prefix : prefix + ' ' + convert(remainder)
    }
    if (num >= 1000) {
      const thousands = Math.floor(num / 1000)
      const remainder = num % 1000
      const prefix = thousands === 1 ? 'MIL' : convert(thousands) + ' MIL'
      return remainder === 0 ? prefix : prefix + ' ' + convert(remainder)
    }
    if (num >= 100) {
      const h = Math.floor(num / 100)
      const remainder = num % 100
      const prefix = h === 1 && remainder === 0 ? 'CIEN' : HUNDREDS[h]
      return remainder === 0 ? prefix : prefix + ' ' + convert(remainder)
    }
    if (num >= 30) {
      const t = Math.floor(num / 10)
      const remainder = num % 10
      const prefix = TENS[t]
      return remainder === 0 ? prefix : prefix + ' Y ' + UNITS[remainder]
    }
    if (num >= 20) {
      const remainder = num % 10
      return remainder === 0 ? 'VEINTE' : 'VEINTI' + TEENS_WITH_Y[remainder]
    }
    if (num >= 10) {
      if (num === 10) return 'DIEZ'
      if (num <= 19) return SPECIAL_TENS[num - 11]
      return TENS[Math.floor(num / 10)]
    }
    return UNITS[num]
  }

  const words = convert(entero) || 'CERO'
  const decimalStr = decimal > 0 ? `CON ${decimal.toString().padStart(2, '0')}/100` : 'CON 00/100'

  return `${words} PESOS DOMINICANOS ${decimalStr}`
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    PENDING: 'bg-yellow-100 text-yellow-800',
    PARTIAL: 'bg-blue-100 text-blue-800',
    PAID: 'bg-green-100 text-green-800',
    CANCELLED: 'bg-red-100 text-red-800',
    COMPLETED: 'bg-green-100 text-green-800',
    OVERDUE: 'bg-red-100 text-red-800',
    IN_PROGRESS: 'bg-blue-100 text-blue-800',
    DELIVERED: 'bg-green-100 text-green-800',
    AVAILABLE: 'bg-green-100 text-green-800',
    USED: 'bg-gray-100 text-gray-800',
    EXPIRED: 'bg-red-100 text-red-800',
    DRAFT: 'bg-gray-100 text-gray-800',
    SENT: 'bg-blue-100 text-blue-800',
    FAILED: 'bg-red-100 text-red-800',
  }
  return colors[status] || 'bg-gray-100 text-gray-800'
}

export function getLocalDateString(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function sanitizeHtml(str: string | null | undefined): string {
  if (!str) return ''
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
}

export function getStatusText(status: string): string {
  const texts: Record<string, string> = {
    PENDING: 'PENDIENTE',
    PARTIAL: 'PARCIAL',
    PAID: 'PAGADO',
    CANCELLED: 'ANULADO',
    COMPLETED: 'COMPLETADO',
    OVERDUE: 'VENCIDO',
    IN_PROGRESS: 'EN PROCESO',
    DELIVERED: 'ENTREGADO',
    AVAILABLE: 'DISPONIBLE',
    USED: 'USADO',
    EXPIRED: 'EXPIRADO',
    DRAFT: 'BORRADOR',
    SENT: 'ENVIADO',
    FAILED: 'FALLÓ',
  }
  return texts[status] || status
}
