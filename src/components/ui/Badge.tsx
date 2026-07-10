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
  success: "bg-[#86C7A3]/15 text-[#86C7A3]",
  warning: "bg-[#E8C87A]/15 text-[#E8C87A]",
  danger: "bg-[#D4A0A0]/15 text-[#D4A0A0]",
  neutral: "bg-[#E8E0D8]/50 text-[#9C8A82]",
  info: "bg-[#B8837E]/10 text-[#B8837E]",
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
