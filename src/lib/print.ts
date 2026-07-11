import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

export async function printAsPDF(elementId: string, filename: string) {
  const el = document.getElementById(elementId)
  if (!el) return

  const canvas = await html2canvas(el, {
    scale: 2,
    useCORS: true,
    backgroundColor: '#ffffff',
  })

  const imgData = canvas.toDataURL('image/png')
  const pdf = new jsPDF('p', 'mm', 'a4')
  const pdfWidth = pdf.internal.pageSize.getWidth()
  const pdfHeight = pdf.internal.pageSize.getHeight()
  const imgWidth = canvas.width
  const imgHeight = canvas.height
  const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight)
  const imgX = (pdfWidth - imgWidth * ratio) / 2
  const imgY = 0

  pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio)
  pdf.save(`${filename}.pdf`)
}

export async function printAsJPG(elementId: string, filename: string) {
  const el = document.getElementById(elementId)
  if (!el) return

  const canvas = await html2canvas(el, {
    scale: 2,
    useCORS: true,
    backgroundColor: '#ffffff',
  })

  const link = document.createElement('a')
  link.download = `${filename}.jpg`
  link.href = canvas.toDataURL('image/jpeg', 0.95)
  link.click()
}

export async function printDirect(elementId: string) {
  const el = document.getElementById(elementId)
  if (!el) return

  const clone = el.cloneNode(true) as HTMLElement
  const printWindow = window.open('', '_blank')
  if (!printWindow) return

  printWindow.document.write(`
    <html>
      <head>
        <title>Imprimir</title>
        <style>
          body { font-family: 'Inter', system-ui, sans-serif; padding: 20px; }
          @media print { body { padding: 0; } }
        </style>
      </head>
      <body>${clone.outerHTML}</body>
    </html>
  `)
  printWindow.document.close()
  printWindow.print()
}
