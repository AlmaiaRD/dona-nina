"use client";

import { cn } from "@/lib/utils";

interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export default function PageContainer({ children, className, title, subtitle, action }: PageContainerProps) {
  return (
    <main className={cn("flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-4 sm:py-6", className)}>
      {(title || subtitle || action) && (
        <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            {title && (
              <h1 className="text-2xl sm:text-3xl font-bold text-[#1a1a1a]">{title}</h1>
            )}
            {subtitle && (
              <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
            )}
          </div>
          {action && <div className="flex items-center gap-3">{action}</div>}
        </div>
      )}
      {children}
    </main>
  );
}
