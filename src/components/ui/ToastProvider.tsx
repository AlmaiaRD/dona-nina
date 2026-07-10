"use client";

import { Toaster } from "react-hot-toast";

export default function ToastProvider() {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 3000,
        style: {
          background: "#fff",
          color: "#3D2B1F",
          borderRadius: "12px",
          padding: "12px 16px",
          fontSize: "14px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
          border: "1px solid #E8E0D8",
        },
        success: {
          iconTheme: { primary: "#5B9E6B", secondary: "#fff" },
        },
        error: {
          iconTheme: { primary: "#E07A3A", secondary: "#fff" },
        },
      }}
    />
  );
}
