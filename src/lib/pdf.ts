import jsPDF from 'jspdf'
import { formatCurrency, formatDate, numberToWords } from './utils'
import type { Invoice, InvoiceItem, Receipt, Setting } from '@/types/database'

function addHeader(doc: jsPDF, businessInfo: Setting) {
  const pageWidth = doc.internal.pageSize.getWidth()

  doc.setFillColor(255, 248, 240)
  doc.rect(0, 0, pageWidth, 60, 'F')

  if (businessInfo.logo_url) {
    try {
      doc.addImage(businessInfo.logo_url, 'PNG', 14, 8, 40, 40)
    } catch (err) { console.error('[pdf] Error:', err) }
  }

  doc.setFontSize(22)
  doc.setTextColor(128, 0, 32)
  doc.setFont('helvetica', 'bold')
  doc.text(businessInfo.business_name || 'DONDE DOÑA NINA', pageWidth - 14, 20, { align: 'right' })

  doc.setFontSize(9)
  doc.setTextColor(100, 100, 100)
  doc.setFont('helvetica', 'normal')

  const infoLines: string[] = []
  if (businessInfo.address) infoLines.push(businessInfo.address)
  if (businessInfo.phone) infoLines.push(`Tel: ${businessInfo.phone}`)
  if (businessInfo.email) infoLines.push(`Email: ${businessInfo.email}`)

  infoLines.forEach((line, i) => {
    doc.text(line, pageWidth - 14, 32 + i * 5, { align: 'right' })
  })

  doc.setDrawColor(128, 0, 32)
  doc.setLineWidth(0.8)
  doc.line(14, 56, pageWidth - 14, 56)
}

function addFooter(doc: jsPDF, businessInfo: Setting, pageCount: number) {
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()

  doc.setDrawColor(128, 0, 32)
  doc.setLineWidth(0.5)
  doc.line(14, pageHeight - 30, pageWidth - 14, pageHeight - 30)

  doc.setFontSize(8)
  doc.setTextColor(120, 120, 120)
  doc.setFont('helvetica', 'normal')

  const businessName = businessInfo.business_name || 'Donde Doña Nina'
  doc.text(`${businessName} · RNC: 000-00000-0`, pageWidth / 2, pageHeight - 20, { align: 'center' })
  doc.text(`Página ${pageCount}`, pageWidth / 2, pageHeight - 12, { align: 'center' })
}

export function generateInvoicePDF(
  invoice: Invoice,
  businessInfo: Setting,
  items: InvoiceItem[]
): jsPDF {
  const doc = new jsPDF('p', 'mm', 'a4')
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageCount = 1

  addHeader(doc, businessInfo)
  addFooter(doc, businessInfo, pageCount)

  // Title
  doc.setFontSize(16)
  doc.setTextColor(217, 119, 6)
  doc.setFont('helvetica', 'bold')
  doc.text('FACTURA', pageWidth / 2, 72, { align: 'center' })
  doc.setFontSize(10)
  doc.setTextColor(100, 100, 100)
  doc.setFont('helvetica', 'normal')
  doc.text(`No. ${invoice.invoice_number}`, pageWidth / 2, 79, { align: 'center' })

  // Client info
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(50, 50, 50)
  doc.text('FACTURAR A:', 14, 92)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(80, 80, 80)
  doc.text(invoice.client?.full_name || 'Cliente', 14, 99)
  if (invoice.client?.phone) doc.text(`Tel: ${invoice.client.phone}`, 14, 106)
  if (invoice.client?.email) doc.text(`Email: ${invoice.client.email}`, 14, 113)

  // Invoice details - right side
  const rightX = pageWidth - 14
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(50, 50, 50)
  doc.text('FECHA:', rightX, 92, { align: 'right' })
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(80, 80, 80)
  doc.text(formatDate(invoice.invoice_date), rightX, 99, { align: 'right' })
  doc.setFont('helvetica', 'bold')
  doc.text('VENCIMIENTO:', rightX, 106, { align: 'right' })
  doc.setFont('helvetica', 'normal')
  doc.text(formatDate(invoice.invoice_date), rightX, 113, { align: 'right' })

  // Items table (manual)
  const tableStartY = 122
  const colWidths = [12, 80, 20, 35, 35]
  const colStarts: number[] = []
  let cx = 14
  colWidths.forEach(w => { colStarts.push(cx); cx += w })
  const tableWidth = colWidths.reduce((a, b) => a + b, 0)
  const rightEdge = 14 + tableWidth
  const rowHeight = 7

  // Draw header
  doc.setFillColor(128, 0, 32)
  doc.rect(14, tableStartY, tableWidth, rowHeight, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(8)
  doc.setFont('helvetica', 'bold')

  const headers = ['#', 'PRODUCTO', 'CANT.', 'P. UNIT.', 'TOTAL']
  headers.forEach((h, i) => {
    const x = colStarts[i] + (i === 1 ? 4 : colWidths[i] / 2)
    doc.text(h, x, tableStartY + 5, { align: i >= 2 ? 'center' : 'left' })
  })

  // Draw rows
  let currentY = tableStartY + rowHeight
  const visibleItems = items.slice(0, 15) // limit rows
  visibleItems.forEach((item, i) => {
    if (currentY > 250) return // page limit
    doc.setFillColor(i % 2 === 0 ? 255 : 248, i % 2 === 0 ? 255 : 248, 255)
    doc.rect(14, currentY, tableWidth, rowHeight, 'F')
    doc.setTextColor(50, 50, 50)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)

    const rowData = [
      String(i + 1),
      item.menu_item?.name || item.custom_name || '',
      String(item.quantity),
      formatCurrency(item.unit_price),
      formatCurrency(item.line_total),
    ]

    rowData.forEach((val, j) => {
      const x = colStarts[j] + (j === 1 ? 4 : j >= 2 ? colWidths[j] / 2 : colWidths[j] / 2)
      doc.text(val, x, currentY + 5, { align: j >= 2 ? 'center' : j === 1 ? 'left' : 'center' })
    })

    // grid lines
    doc.setDrawColor(220, 220, 220)
    doc.setLineWidth(0.1)
    doc.line(14, currentY, rightEdge, currentY)
    doc.line(14, currentY + rowHeight, rightEdge, currentY + rowHeight)
    currentY += rowHeight
  })

  const finalY = currentY + 5

  // Totals
  const totalX = pageWidth - 80
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(80, 80, 80)
  doc.text('Subtotal:', totalX, finalY + 10)
  doc.text(formatCurrency(invoice.subtotal), pageWidth - 14, finalY + 10, { align: 'right' })

  if (invoice.discount_amount > 0) {
    doc.text('Descuento:', totalX, finalY + 18)
    doc.text(`-${formatCurrency(invoice.discount_amount)}`, pageWidth - 14, finalY + 18, { align: 'right' })
  }

  doc.setDrawColor(128, 0, 32)
  doc.setLineWidth(0.5)
  doc.line(totalX, finalY + 23, pageWidth - 14, finalY + 23)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.setTextColor(128, 0, 32)
  doc.text('TOTAL:', totalX, finalY + 32)
  doc.text(formatCurrency(invoice.total), pageWidth - 14, finalY + 32, { align: 'right' })

  // Amount in words
  doc.setFontSize(9)
  doc.setFont('helvetica', 'italic')
  doc.setTextColor(100, 100, 100)
  doc.text(`Son: ${numberToWords(invoice.total)}`, 14, finalY + 32)

  // Payment info
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(217, 119, 6)
  doc.text('DATOS DE PAGO', 14, finalY + 48)

  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(80, 80, 80)
  const paymentLines = [
    'Banco: Banco de Reservas',
    'Cuenta Corriente: 123-456-789-0',
    'RNC: 000-00000-0',
  ]
  paymentLines.forEach((line, i) => {
    doc.text(line, 14, finalY + 56 + i * 5)
  })

  // Notes
  if (invoice.notes) {
    const notesY = finalY + 56 + paymentLines.length * 5 + 8
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(50, 50, 50)
    doc.setFontSize(9)
    doc.text('NOTAS:', 14, notesY)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(80, 80, 80)
    doc.text(invoice.notes, 14, notesY + 6)
  }

  // Signature line
  const sigY = Math.max(finalY + 56 + paymentLines.length * 5 + 30, finalY + 100)
  if (businessInfo.signature_url) {
    try {
      doc.addImage(businessInfo.signature_url, 'PNG', pageWidth - 70, sigY - 8, 80, 35)
    } catch (err) { console.error('[pdf] Error:', err) }
  }
  doc.setDrawColor(180, 180, 180)
  doc.setLineWidth(0.3)
  doc.line(pageWidth - 70, sigY, pageWidth - 14, sigY)
  doc.setFontSize(8)
  doc.setTextColor(120, 120, 120)
  doc.setFont('helvetica', 'normal')
  doc.text('Firma Autorizada', pageWidth - 42, sigY + 4, { align: 'center' })

  doc.save(`Factura-${invoice.invoice_number}.pdf`)
  return doc
}

export function generateReceiptPDF(
  receipt: Receipt,
  businessInfo: Setting
): jsPDF {
  const doc = new jsPDF('p', 'mm', 'a4')
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageCount = 1

  addHeader(doc, businessInfo)
  addFooter(doc, businessInfo, pageCount)

  // Title
  doc.setFontSize(16)
  doc.setTextColor(217, 119, 6)
  doc.setFont('helvetica', 'bold')
  doc.text('RECIBO DE PAGO', pageWidth / 2, 72, { align: 'center' })
  doc.setFontSize(10)
  doc.setTextColor(100, 100, 100)
  doc.setFont('helvetica', 'normal')
  doc.text(`No. ${receipt.receipt_number}`, pageWidth / 2, 79, { align: 'center' })

  // Receipt details
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(50, 50, 50)
  doc.text('RECIBIMOS DE:', 14, 94)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(80, 80, 80)
  doc.text(receipt.client?.full_name || 'Cliente', 14, 101)
  if (receipt.client?.phone) doc.text(`Tel: ${receipt.client.phone}`, 14, 108)
  if (receipt.client?.email) doc.text(`Email: ${receipt.client.email}`, 14, 115)

  // Right side
  const rightX = pageWidth - 14
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(50, 50, 50)
  doc.text('FECHA:', rightX, 94, { align: 'right' })
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(80, 80, 80)
  doc.text(formatDate(receipt.receipt_date), rightX, 101, { align: 'right' })
  doc.setFont('helvetica', 'bold')
  doc.text('FACTURA:', rightX, 108, { align: 'right' })
  doc.setFont('helvetica', 'normal')
  doc.text(receipt.invoice?.invoice_number || 'N/A', rightX, 115, { align: 'right' })

  // Payment details box
  const boxY = 130
  doc.setFillColor(255, 248, 240)
  doc.setDrawColor(128, 0, 32)
  doc.setLineWidth(0.5)
  doc.roundedRect(14, boxY, pageWidth - 28, 50, 3, 3, 'FD')

  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(128, 0, 32)
  doc.text('DETALLE DEL PAGO', pageWidth / 2, boxY + 12, { align: 'center' })

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(80, 80, 80)

  const paymentMethodText: Record<string, string> = {
    CASH: 'EFECTIVO',
    TRANSFER: 'TRANSFERENCIA',
    CARD: 'TARJETA',
  }

  const details = [
    { label: 'Método de Pago:', value: paymentMethodText[receipt.payment_method] || receipt.payment_method },
    { label: 'Concepto:', value: receipt.concept || 'Pago de factura' },
  ]

  details.forEach((detail, i) => {
    const y = boxY + 24 + i * 8
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(50, 50, 50)
    doc.text(detail.label, 24, y)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(80, 80, 80)
    doc.text(detail.value, 70, y)
  })

  // Amount
  const amountY = boxY + 50
  doc.setDrawColor(128, 0, 32)
  doc.setLineWidth(0.5)
  doc.line(14, amountY + 4, pageWidth - 14, amountY + 4)

  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(128, 0, 32)
  doc.text('MONTO RECIBIDO:', 14, amountY + 16)
  doc.text(formatCurrency(receipt.amount), pageWidth - 14, amountY + 16, { align: 'right' })

  // Amount in words
  doc.setFontSize(9)
  doc.setFont('helvetica', 'italic')
  doc.setTextColor(100, 100, 100)
  doc.text(`Son: ${receipt.amount_in_words || numberToWords(receipt.amount)}`, 14, amountY + 28)

  // Signature
  const sigY = Math.max(amountY + 40, 240)
  if (businessInfo.signature_url) {
    try {
      doc.addImage(businessInfo.signature_url, 'PNG', pageWidth - 70, sigY - 8, 80, 35)
    } catch (err) { console.error('[pdf] Error:', err) }
  }
  doc.setDrawColor(180, 180, 180)
  doc.setLineWidth(0.3)
  doc.line(pageWidth - 70, sigY, pageWidth - 14, sigY)
  doc.setFontSize(8)
  doc.setTextColor(120, 120, 120)
  doc.setFont('helvetica', 'normal')
  doc.text('Firma Autorizada', pageWidth - 42, sigY + 4, { align: 'center' })

  doc.save(`Recibo-${receipt.receipt_number}.pdf`)
  return doc
}
