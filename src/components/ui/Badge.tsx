"use client";

import { cn } from "@/lib/utils";

type BadgeVariant = "success" | "warning" | "danger" | "neutral" | "info";

interface BadgeProps {
  children?: React.ReactNode;
  variant?: BadgeVariant;
  status?: string;
  className?: string;
}

const variantMap: Record<BadgeVariant, string> = {
  success: "bg-[#5B9E6B]/15 text-[#5B9E6B]",
  warning: "bg-[#D4A017]/15 text-[#D4A017]",
  danger: "bg-[#E07A3A]/15 text-[#E07A3A]",
  neutral: "bg-[#E8E0D8]/50 text-[#9C8A82]",
  info: "bg-[#7C1D2E]/10 text-[#7C1D2E]",
};

const statusMap: Record<string, BadgeVariant> = {
  PENDING: "warning",
  IN_PROGRESS: "info",
  DELIVERED: "success",
  CANCELLED: "danger",
};

const statusLabel: Record<string, string> = {
  PENDING: "Pendiente",
  IN_PROGRESS: "En progreso",
  DELIVERED: "Entregado",
  CANCELLED: "Cancelado",
};

function getVariant(status?: string): BadgeVariant {
  if (!status) return "neutral";
  return statusMap[status] || "neutral";
}

export default function Badge({ children, variant, status, className }: BadgeProps) {
  const resolvedVariant = variant || (status ? getVariant(status) : "neutral");
  const label = status ? (statusLabel[status] || status) : children;
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
        variantMap[resolvedVariant],
        className
      )}
    >
      {label}
    </span>
  );
}
