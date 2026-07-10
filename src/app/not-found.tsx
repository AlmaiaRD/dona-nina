import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import CakeIcon from "@/components/ui/CakeIcon";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#FCFAF7] flex flex-col items-center justify-center px-4">
      <div className="w-16 h-16 rounded-full bg-[#7C1D2E]/60 flex items-center justify-center mb-6">
        <CakeIcon size={32} className="text-white" />
      </div>
      <h1 className="text-4xl font-bold text-[#3D2B1F] mb-2">404</h1>
      <p className="text-lg text-[#9C8A82] mb-8 text-center max-w-sm">
        La página que buscas no existe o fue movida.
      </p>
      <Link
        href="/login"
        className="inline-flex items-center gap-2 h-12 px-6 bg-[#7C1D2E] text-white rounded-xl text-sm font-medium hover:bg-[#5C1420] transition-all shadow-sm"
      >
        <ArrowLeft size={18} /> Ir al inicio
      </Link>
    </div>
  );
}
