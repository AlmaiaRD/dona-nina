import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#fff8f0]">
      <div className="text-center space-y-4">
        <div className="text-8xl font-bold text-red-600">404</div>
        <h1 className="text-2xl font-bold text-gray-900">Página no encontrada</h1>
        <p className="text-gray-500">La página que buscas no existe.</p>
        <Link
          href="/dashboard"
          className="inline-block px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          Ir al Dashboard
        </Link>
      </div>
    </div>
  )
}
