"use client";

import { Download, FileText } from "lucide-react";

interface PrintActionsProps {
  onPrintPdf: () => void;
  onPrintJpg: () => void;
  variant?: "inline" | "dropdown";
  isOpen?: boolean;
  onToggle?: () => void;
  onClose?: () => void;
}

export default function PrintActions({
  onPrintPdf,
  onPrintJpg,
  variant = "inline",
  isOpen,
  onToggle,
  onClose,
}: PrintActionsProps) {
  if (variant === "inline") {
    return (
      <div className="flex items-center gap-1">
        <button
          onClick={onPrintPdf}
          className="p-2 text-[#9C8A82] hover:text-[#5C3E35] hover:bg-[#FAF6F0] rounded-lg transition-all"
          title="Descargar PDF"
        >
          <FileText size={15} />
        </button>
        <button
          onClick={onPrintJpg}
          className="p-2 text-[#9C8A82] hover:text-[#5C3E35] hover:bg-[#FAF6F0] rounded-lg transition-all"
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
        className="p-2 text-[#9C8A82] hover:text-[#5C3E35] hover:bg-[#FAF6F0] rounded-lg transition-all"
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
                onPrintPdf();
                onClose?.();
              }}
              className="w-full text-left px-4 py-2 text-sm text-[#5C3E35] hover:bg-[#FAF6F0] flex items-center gap-2"
            >
              <FileText size={14} /> PDF
            </button>
            <button
              onClick={() => {
                onPrintJpg();
                onClose?.();
              }}
              className="w-full text-left px-4 py-2 text-sm text-[#5C3E35] hover:bg-[#FAF6F0] flex items-center gap-2"
            >
              <Download size={14} /> JPG
            </button>
          </div>
        </>
      )}
    </div>
  );
}
