'use client'

import { ArrowRight, FileText, Receipt, Users, Package, BarChart3, Truck, UtensilsCrossed } from 'lucide-react'
import Link from 'next/link'
import LogoDonaNina from '@/components/ui/LogoDonaNina'

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
    <div className="min-h-screen bg-[#FCFAF7] flex flex-col">
      <header className="px-6 py-4 border-b border-[#E8E0D8] bg-white">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <LogoDonaNina size={52} />
            <div>
              <h1 className="text-lg font-semibold text-[#3D2B1F] leading-tight">Donde Doña Nina</h1>
              <p className="text-[10px] text-[#9C8A82] tracking-widest uppercase leading-tight">Sabor Dominicano</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="h-10 px-5 border border-[#E8E0D8] text-[#3D2B1F] rounded-xl text-sm font-medium hover:bg-[#FDF8F3] transition-all flex items-center"
            >
              Iniciar Sesión
            </Link>
            <Link
              href="/login"
              className="h-10 px-5 bg-[#7C1D2E] text-white rounded-xl text-sm font-medium hover:bg-[#5C1420] transition-all shadow-sm flex items-center gap-2"
            >
              Comenzar <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="max-w-6xl mx-auto px-6 pt-20 pb-16 text-center">
          <div className="inline-flex items-center gap-2 bg-[#7C1D2E]/10 text-[#7C1D2E] px-4 py-1.5 rounded-full text-sm font-medium mb-6">
            <UtensilsCrossed size={14} /> Sistema de Gestión de Restaurante
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-[#3D2B1F] leading-tight mb-4">
            Tus arepas,{' '}
            <span className="text-[#7C1D2E]">organizadas</span>
          </h1>
          <p className="text-lg text-[#9C8A82] max-w-2xl mx-auto mb-8">
            Administra facturación, inventario, clientes y entregas en un solo lugar.
            Hecho con el amor de mamá para Doña Nina.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link
              href="/login"
              className="h-12 px-8 bg-[#7C1D2E] text-white rounded-xl text-sm font-medium hover:bg-[#5C1420] transition-all shadow-sm flex items-center gap-2"
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
                  className="bg-white rounded-2xl p-6 shadow-sm border border-[#E8E0D8] hover:shadow-md transition-all"
                >
                  <div className="w-10 h-10 rounded-xl bg-[#7C1D2E]/10 flex items-center justify-center mb-4">
                    <Icon size={20} className="text-[#7C1D2E]" />
                  </div>
                  <h3 className="text-sm font-semibold text-[#3D2B1F] mb-1">{f.label}</h3>
                  <p className="text-sm text-[#9C8A82]">{f.desc}</p>
                </div>
              )
            })}
          </div>
        </section>

        <section className="bg-white border-t border-[#E8E0D8] py-12">
          <div className="max-w-6xl mx-auto px-6 text-center">
            <h2 className="text-xl font-bold text-[#3D2B1F] mb-8">¿Necesitas ayuda?</h2>
            <div className="flex items-center justify-center gap-8 text-sm text-[#9C8A82]">
              <span>Documentación</span>
              <span>Soporte Técnico</span>
              <span>Contacto</span>
            </div>
          </div>
        </section>
      </main>

      <footer className="px-6 py-4 border-t border-[#E8E0D8] bg-white">
        <div className="max-w-6xl mx-auto flex items-center justify-between text-xs text-[#9C8A82]">
          <span>&copy; {new Date().getFullYear()} Donde Doña Nina — Hecho con el amor de mamá</span>
          <span>Versión 1.0.0</span>
        </div>
      </footer>
    </div>
  )
}
