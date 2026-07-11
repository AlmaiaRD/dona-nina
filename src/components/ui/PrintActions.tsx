'use client'

import { FileDown, Image, Printer } from 'lucide-react'
import { printAsPDF, printAsJPG, printDirect } from '@/lib/print'

interface PrintActionsProps {
  elementId: string
  filename: string
}

export function PrintActions({ elementId, filename }: PrintActionsProps) {
  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => printAsPDF(elementId, filename)}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#3D2B1F] bg-white border border-gray-300 rounded-lg hover:bg-[#FDF8F3] transition-colors"
        title="Descargar PDF"
      >
        <FileDown className="h-3.5 w-3.5" />
        PDF
      </button>
      <button
        onClick={() => printAsJPG(elementId, filename)}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#3D2B1F] bg-white border border-gray-300 rounded-lg hover:bg-[#FDF8F3] transition-colors"
        title="Descargar JPG"
      >
        {/* eslint-disable-next-line jsx-a11y/alt-text */}
        <Image className="h-3.5 w-3.5" aria-hidden="true" />
        JPG
      </button>
      <button
        onClick={() => printDirect(elementId)}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#3D2B1F] bg-white border border-gray-300 rounded-lg hover:bg-[#FDF8F3] transition-colors"
        title="Imprimir"
      >
        <Printer className="h-3.5 w-3.5" />
        Imprimir
      </button>
    </div>
  )
}
