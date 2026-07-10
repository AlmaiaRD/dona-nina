import { NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'

export async function POST(request: Request) {
  try {
    const auth = getAuthUser(request)
    if (!auth) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { message } = await request.json()

    if (!message) {
      return NextResponse.json({ error: 'Mensaje requerido' }, { status: 400 })
    }

    const lower = message.toLowerCase()

    let response = ''

    if (lower.includes('arepa') || lower.includes('menu') || lower.includes('producto')) {
      response = 'Puedes consultar nuestro menú completo en la sección "Menú" del sistema. Tenemos arepas tradicionales, especiales, empanadas, bebidas y postres.'
    } else if (lower.includes('cliente') || lower.includes('cliente')) {
      response = 'Los clientes se gestionan desde la sección "Clientes". Puedes ver su historial de compras, seguimientos y créditos disponibles.'
    } else if (lower.includes('factura') || lower.includes('facturacion')) {
      response = 'Las facturas se crean desde la sección "Facturación". Recuerda seleccionar el cliente y los productos del menú.'
    } else if (lower.includes('entrega') || lower.includes('delivery') || lower.includes('domicilio')) {
      response = 'El control de entregas está en la sección "Entregas". Puedes ver las pendientes, asignar repartidores y marcar como entregadas.'
    } else if (lower.includes('inventario') || lower.includes('stock')) {
      response = 'El inventario se gestiona desde la sección "Inventario". Allí puedes ver el stock actual y registrar movimientos.'
    } else if (lower.includes('reporte') || lower.includes('report') || lower.includes('ventas')) {
      response = 'Los reportes de ventas están en la sección "Reportes". Puedes filtrar por rango de fechas y ver el desglose.'
    } else {
      response = 'Hola, soy el asistente de Donde Doña Nina. Puedo ayudarte con información sobre el sistema. Pregúntame sobre facturación, clientes, menú, entregas, inventario o reportes.'
    }

    return NextResponse.json({ response })
  } catch (error: any) {
    console.error('AI Chat error:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
