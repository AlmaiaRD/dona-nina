"use client";

import { useCallback } from "react";
import { Download, FileText } from "lucide-react";

interface PrintActionsProps {
  elementId?: string;
  filename?: string;
  onPrintPdf?: () => void;
  onPrintJpg?: () => void;
  variant?: "inline" | "dropdown";
  isOpen?: boolean;
  onToggle?: () => void;
  onClose?: () => void;
}

async function captureElement(elementId: string, format: "pdf" | "jpg", filename: string) {
  const html2canvas = (await import("html2canvas")).default;
  const jsPDF = (await import("jspdf")).default;

  const element = document.getElementById(elementId);
  if (!element) return;

  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    logging: false,
  });

  if (format === "jpg") {
    const link = document.createElement("a");
    link.download = `${filename}.jpg`;
    link.href = canvas.toDataURL("image/jpeg", 0.95);
    link.click();
  } else {
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "mm", "a4");
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
    pdf.save(`${filename}.pdf`);
  }
}

export default function PrintActions({
  elementId,
  filename = "documento",
  onPrintPdf,
  onPrintJpg,
  variant = "inline",
  isOpen,
  onToggle,
  onClose,
}: PrintActionsProps) {
  const handlePdf = useCallback(() => {
    if (onPrintPdf) {
      onPrintPdf();
    } else if (elementId) {
      captureElement(elementId, "pdf", filename);
    }
  }, [onPrintPdf, elementId, filename]);

  const handleJpg = useCallback(() => {
    if (onPrintJpg) {
      onPrintJpg();
    } else if (elementId) {
      captureElement(elementId, "jpg", filename);
    }
  }, [onPrintJpg, elementId, filename]);

  if (variant === "inline") {
    return (
      <div className="flex items-center gap-1">
        <button
          onClick={handlePdf}
          className="p-2 text-[#9C8A82] hover:text-[#3D2B1F] hover:bg-[#FDF8F3] rounded-lg transition-all"
          title="Descargar PDF"
        >
          <FileText size={15} />
        </button>
        <button
          onClick={handleJpg}
          className="p-2 text-[#9C8A82] hover:text-[#3D2B1F] hover:bg-[#FDF8F3] rounded-lg transition-all"
          title="Descargar JPG"
        >
          <Download size={15} />
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={onToggle}
        className="p-2 text-[#9C8A82] hover:text-[#3D2B1F] hover:bg-[#FDF8F3] rounded-lg transition-all"
        title="Descargar"
      >
        <Download size={15} />
      </button>
      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={onClose} />
          <div className="absolute right-0 top-full mt-1 z-20 bg-white rounded-xl shadow-lg border border-[#E8E0D8] py-1 min-w-[130px]">
            <button
              onClick={() => {
                handlePdf();
                onClose?.();
              }}
              className="w-full text-left px-4 py-2 text-sm text-[#3D2B1F] hover:bg-[#FDF8F3] flex items-center gap-2"
            >
              <FileText size={14} /> PDF
            </button>
            <button
              onClick={() => {
                handleJpg();
                onClose?.();
              }}
              className="w-full text-left px-4 py-2 text-sm text-[#3D2B1F] hover:bg-[#FDF8F3] flex items-center gap-2"
            >
              <Download size={14} /> JPG
            </button>
          </div>
        </>
      )}
    </div>
  );
}
