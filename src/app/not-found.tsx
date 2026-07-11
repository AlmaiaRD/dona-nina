import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FCFAF7]">
      <div className="text-center space-y-4">
        <div className="text-8xl font-bold text-[#7C1D2E]">404</div>
        <h1 className="text-2xl font-bold text-[#3D2B1F]">Página no encontrada</h1>
        <p className="text-[#9C8A82]">La página que buscas no existe.</p>
        <Link
          href="/dashboard"
          className="inline-block px-6 py-3 bg-[#7C1D2E] text-white rounded-lg hover:bg-[#5C1420] transition-colors"
        >
          Ir al Dashboard
        </Link>
      </div>
    </div>
  )
}
