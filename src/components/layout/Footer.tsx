'use client'

export function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-white px-4 py-3">
      <div className="flex items-center justify-between text-xs text-gray-400">
        <span>&copy; {new Date().getFullYear()} Donde Do&ntilde;a Nina. Todos los derechos reservados.</span>
        <span>v1.0.0</span>
      </div>
    </footer>
  )
}
