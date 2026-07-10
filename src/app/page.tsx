'use client'

import { ArrowRight, FileText, Receipt, Users, Package, BarChart3, Truck, UtensilsCrossed } from 'lucide-react'
import Link from 'next/link'

const features = [
  { icon: UtensilsCrossed, label: 'Menú', desc: 'Gestiona tu menú de arepas, empanadas y bebidas' },
  { icon: FileText, label: 'Facturación', desc: 'Crea y gestiona facturas con descuentos e ITBIS' },
  { icon: Receipt, label: 'Recibos', desc: 'Registra pagos en efectivo, transferencia o tarjeta' },
  { icon: Users, label: 'Clientes', desc: 'Directorio completo con crédito y seguimiento' },
  { icon: Package, label: 'Inventario', desc: 'Control de ingredientes y alertas de stock' },
  { icon: Truck, label: 'Entregas', desc: 'Gestiona pedidos y entregas a domicilio' },
  { icon: BarChart3, label: 'Reportes', desc: 'Informes de ventas, ingresos y rentabilidad' },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#FFFBF7] flex flex-col">
      <header className="px-6 py-4 border-b border-gray-200 bg-white">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center">
              <UtensilsCrossed size={20} className="text-red-600" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-900 leading-tight">Donde Doña Nina</h1>
              <p className="text-[10px] text-gray-500 tracking-widest uppercase leading-tight">Sabor Dominicano</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="h-10 px-5 border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 transition-all flex items-center"
            >
              Iniciar Sesión
            </Link>
            <Link
              href="/login"
              className="h-10 px-5 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700 transition-all shadow-sm flex items-center gap-2"
            >
              Comenzar <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="max-w-6xl mx-auto px-6 pt-20 pb-16 text-center">
          <div className="inline-flex items-center gap-2 bg-red-50 text-red-600 px-4 py-1.5 rounded-full text-sm font-medium mb-6">
            <UtensilsCrossed size={14} /> Sistema de Gestión de Restaurante
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight mb-4">
            Tus arepas,{' '}
            <span className="text-red-600">organizadas</span>
          </h1>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto mb-8">
            Administra facturación, inventario, clientes y entregas en un solo lugar.
            Hecho con el amor de mamá para Doña Nina.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link
              href="/login"
              className="h-12 px-8 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700 transition-all shadow-sm flex items-center gap-2"
            >
              Acceder al Sistema <ArrowRight size={18} />
            </Link>
          </div>
        </section>

        <section className="max-w-6xl mx-auto px-6 pb-20">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((f) => {
              const Icon = f.icon
              return (
                <div
                  key={f.label}
                  className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all"
                >
                  <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center mb-4">
                    <Icon size={20} className="text-red-600" />
                  </div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-1">{f.label}</h3>
                  <p className="text-sm text-gray-500">{f.desc}</p>
                </div>
              )
            })}
          </div>
        </section>

        <section className="bg-white border-t border-gray-100 py-12">
          <div className="max-w-6xl mx-auto px-6 text-center">
            <h2 className="text-xl font-bold text-gray-900 mb-8">¿Necesitas ayuda?</h2>
            <div className="flex items-center justify-center gap-8 text-sm text-gray-500">
              <span>Documentación</span>
              <span>Soporte Técnico</span>
              <span>Contacto</span>
            </div>
          </div>
        </section>
      </main>

      <footer className="px-6 py-4 border-t border-gray-100 bg-white">
        <div className="max-w-6xl mx-auto flex items-center justify-between text-xs text-gray-400">
          <span>&copy; {new Date().getFullYear()} Donde Doña Nina — Hecho con el amor de mamá</span>
          <span>Versión 1.0.0</span>
        </div>
      </footer>
    </div>
  )
}
