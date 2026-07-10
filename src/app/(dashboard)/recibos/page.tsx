"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { PageContainer } from "@/components/layout/PageContainer";
import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import { getReceipt, createReceipt, deleteReceipt, updateReceiptWithInvoice } from "@/services/receipts";
import { getBankAccounts } from "@/services/invoices";
import { getSettings } from "@/services/settings";
import { getLocalDateString, formatCurrency, formatDate, sanitizeHtml } from "@/lib/utils";
import { FileText, Plus, Search, Eye, Printer, Trash2, Save, Download, Edit2, Mail, MessageCircle } from "lucide-react";
import Image from "next/image";
import type { BankAccount, Setting } from "@/types/database";
import toast from "react-hot-toast";
import { normalize } from "@/lib/search";
import CommunicationDraftModal from "@/components/communications/CommunicationDraftModal";

const methodLabel: Record<string, string> = {
  CASH: "Efectivo",
  TRANSFER: "Transferencia",
  CARD: "Tarjeta",
};

const methodColors: Record<string, string> = {
  CASH: "bg-green-100 text-green-800",
  TRANSFER: "bg-blue-100 text-blue-800",
  CARD: "bg-yellow-100 text-yellow-800",
};

export default function RecibosPage() {
  const searchParams = useSearchParams();
  const [receipts, setReceipts] = useState<any[]>([]);
  const [pendingInvoices, setPendingInvoices] = useState<any[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [settings, setSettings] = useState<Setting | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterMonth, setFilterMonth] = useState("");
  const [filterYear, setFilterYear] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "paid" | "pending">("all");
  const [showModal, setShowModal] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [, setOpenPrintId] = useState<string | null>(null);

  const [selectedInvoice, setSelectedInvoice] = useState("");
  const [draftModal, setDraftModal] = useState<{ type: "email" | "whatsapp" } | null>(null);
  const [receiptDate, setReceiptDate] = useState(getLocalDateString());
  const [amount, setAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "TRANSFER" | "CARD">("CASH");
  const [bankAccountId, setBankAccountId] = useState("");
  const [notes, setNotes] = useState("");

  const [editForm, setEditForm] = useState({ amount: 0, payment_method: "CASH" as "CASH" | "TRANSFER" | "CARD", bank_account_id: "", concept: "", receipt_date: "" });

  const load = useCallback(async () => {
    try {
      const [recRes, invRes, ba, st] = await Promise.all([
        fetch('/api/receipts').then(r => r.json()),
        fetch('/api/invoices').then(r => r.json()),
        getBankAccounts(),
        getSettings().catch(() => null),
      ]);
      setReceipts(recRes.data || []);
      setPendingInvoices((invRes.data || []).filter((i: any) => i.status !== "PAID" && i.status !== "CANCELLED"));
      setBankAccounts(ba);
      setSettings(st);
    } catch { toast.error("Error al cargar recibos"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { queueMicrotask(() => load()); }, [load]);

  useEffect(() => {
    if (searchParams.get("nuevo") === "true") {
      queueMicrotask(() => {
        resetForm();
        const invId = searchParams.get("invoice_id");
        if (invId) setSelectedInvoice(invId);
        setShowModal(true);
      });
    }
  }, [searchParams]);

  function resetForm() {
    setSelectedInvoice("");
    setReceiptDate(getLocalDateString());
    setAmount(0);
    setPaymentMethod("CASH");
    setBankAccountId("");
    setNotes("");
  }

  const selectedInvoiceData = pendingInvoices.find((i: any) => i.id === selectedInvoice);
  const balanceDue = selectedInvoiceData ? Number(selectedInvoiceData.total) - Number(selectedInvoiceData.amount_paid || 0) : 0;

  const receiptSearchFiltered = receipts.filter((r: any) => {
    if (filterStatus !== "all") {
      const invoiceStatus = r.invoices?.status;
      if (filterStatus === "paid" && invoiceStatus !== "PAID") return false;
      if (filterStatus === "pending" && invoiceStatus === "PAID") return false;
    }

    if (searchQuery) {
      const q = normalize(searchQuery);
      const matchesSearch =
        normalize(r.receipt_number ?? "").includes(q) ||
        normalize(r.invoices?.invoice_number ?? "").includes(q) ||
        normalize(r.client?.full_name ?? "").includes(q) ||
        normalize(r.invoices?.clients?.full_name ?? "").includes(q);
      if (!matchesSearch) return false;
    }

    if (filterMonth || filterYear) {
      const d = new Date(r.created_at);
      if (filterMonth && String(d.getMonth() + 1).padStart(2, "0") !== filterMonth) return false;
      if (filterYear && String(d.getFullYear()) !== filterYear) return false;
    }

    return true;
  });

  async function buildReceiptPreviewEl(data: any, settings: any) {
    const el = document.createElement("div");
    const sh = sanitizeHtml;
    el.style.cssText = "position:fixed;top:0;left:0;z-index:9999;background:#fff;width:750px;padding:32px;font-family:Inter,system-ui,sans-serif;font-size:16px;line-height:1.5;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale;overflow-wrap:normal; word-break:normal; hyphens:none; white-space:nowrap; text-wrap:stable; text-align:justify;";
    el.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:24px;">
        <div style="display:flex;align-items:flex-start;gap:8px;flex-shrink:0;">
          <div style="font-size:28px;margin-top:2px;flex-shrink:0;">🍰</div>
          <div style="white-space:nowrap;">
            <h2 style="font-size:26px;font-weight:800;color:#111827;margin:0;line-height:1.1;letter-spacing:-0.02em;">Donde Doña Nina</h2>
            <p style="font-size:11px;letter-spacing:0.08em;color:#DC2626;text-transform:uppercase;margin:2px 0 0;line-height:1.4;font-weight:600;">Hechas con el amor de mamá</p>
            <p style="font-size:10px;color:#6B7280;margin:2px 0 0;line-height:1.4;font-weight:500;">Sabor Dominicano</p>
          </div>
        </div>
        <div style="text-align:right;white-space:nowrap;">
          <span style="display:inline-block;background:#D1FAE5;color:#047857;font-size:12px;font-weight:700;padding:8px 16px;border-radius:999px;">RECIBO DE PAGO</span>
          <p style="font-size:18px;font-weight:700;color:#111827;margin:12px 0 0;line-height:1.2;white-space:nowrap;">${sh(data.receipt_number)}</p>
          <p style="font-size:12px;color:#6B7280;margin:2px 0 0;line-height:1.4;">Fecha: ${formatDate(data.receipt_date || data.created_at)}</p>
        </div>
      </div>
      <div style="border-top:1px solid #E5E7EB;margin-bottom:20px;"></div>
      <div style="border:1px solid #E5E7EB;background:#F9FAFB;border-radius:12px;padding:16px;margin-bottom:20px;">
        <p style="font-size:11px;font-weight:700;color:#059669;margin:0 0 12px;">INFORMACIÓN DEL PAGO</p>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:4px 16px;font-size:13px;">
          <p style="color:#111827;margin:0;"><span style="color:#6B7280;">Cliente:</span> ${sh(data.client?.full_name || data.invoice?.client?.full_name) || "—"}</p>
          <p style="color:#111827;margin:0;"><span style="color:#6B7280;">Factura:</span> ${sh(data.invoice?.invoice_number) || "—"}</p>
          <p style="color:#111827;margin:0;grid-column:1/-1;"><span style="color:#6B7280;">Método de pago:</span> ${methodLabel[data.payment_method] || data.payment_method}${data.bank_account ? ` &mdash; ${sh(data.bank_account.bank_name)}` : ""}</p>
        </div>
      </div>

      ${(data.invoice?.invoice_items || []).length > 0 ? `
        <table style="width:100%;font-size:13px;margin-bottom:20px;border-collapse:collapse;">
          <thead>
            <tr style="background:#F9FAFB;">
              <th style="padding:10px 12px;text-align:left;font-size:11px;color:#111827;font-weight:700;">Producto</th>
              <th style="padding:10px 12px;text-align:right;font-size:11px;color:#111827;font-weight:700;">Cant.</th>
              <th style="padding:10px 12px;text-align:right;font-size:11px;color:#111827;font-weight:700;">Precio Unit.</th>
              <th style="padding:10px 12px;text-align:right;font-size:11px;color:#111827;font-weight:700;">Total</th>
            </tr>
          </thead>
          <tbody>
              ${data.invoice.invoice_items.map((item: any) => `
              <tr style="border-bottom:1px solid #F9FAFB;">
                <td style="padding:10px 12px;font-size:13px;color:#111827;">${sh(item.menu_item?.name || item.custom_name) || "Producto"}</td>
                <td style="padding:10px 12px;text-align:right;font-size:13px;color:#111827;">${item.quantity}</td>
                <td style="padding:10px 12px;text-align:right;font-size:13px;color:#111827;">${formatCurrency(Number(item.unit_price))}</td>
                <td style="padding:10px 12px;text-align:right;font-size:13px;font-weight:500;color:#111827;">${formatCurrency(Number(item.line_total))}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      ` : ""}
      <div style="border-top:1px solid #E5E7EB;padding-top:16px;margin-bottom:20px;">
        <div style="display:flex;justify-content:flex-end;align-items:baseline;gap:16px;">
          <span style="font-size:14px;color:#6B7280;">Monto pagado</span>
          <span style="font-size:24px;font-weight:700;color:#059669;">${formatCurrency(Number(data.amount))}</span>
        </div>
        ${data.amount_in_words ? `<p style="font-size:11px;color:#6B7280;font-style:italic;text-align:right;margin:4px 0 0;">Son: ${sh(data.amount_in_words)}</p>` : ""}
      </div>
      ${data.concept ? `
        <div style="border-top:1px solid #E5E7EB;padding-top:16px;margin-bottom:16px;">
          <p style="font-size:11px;color:#6B7280;margin:0 0 4px;">Notas:</p>
          <p style="font-size:13px;color:#111827;margin:0;">${sh(data.concept)}</p>
        </div>
      ` : ""}
<div style="border-top:1px solid #E5E7EB;padding-top:16px;display:flex;justify-content:space-between;align-items:flex-end;">
        <div>
          <p style="font-size:11px;font-style:italic;color:#DC2626;margin:0;line-height:1.4;white-space:nowrap;">¡Gracias por tu pago! Hecho con el amor de mamá.</p>
        </div>
        <div style="text-align:right;white-space:nowrap;">
          ${settings?.signature_url
            ? `<img src="${sh(settings.signature_url)}" alt="Firma" style="height:96px;margin-left:auto;" />`
            : `<img src="/firma-yrahisa-mateo.png" alt="Firma" style="height:96px;margin-left:auto;" />`}
          <p style="font-size:9px;color:#6B7280;margin:2px 0 0;">FIRMA AUTORIZADA</p>
        </div>
      </div>
    `;
    return el;
  }

  async function captureReceipt(rec: any) {
    const full = await getReceipt(rec.id);
    const el = await buildReceiptPreviewEl(full, settings);
    document.body.appendChild(el);
    await new Promise(r => setTimeout(r, 500));
    const domtoimage = await import("dom-to-image-more");
    const canvas = await domtoimage.toCanvas(el, { scale: 2, width: 750, ignoreCSSRuleErrors: true, disableEmbedFonts: true });
    document.body.removeChild(el);
    return { canvas, data: full, receipt_number: rec.receipt_number };
  }

  async function handlePrintPdf(rec: any) {
    try {
      const { canvas, receipt_number } = await captureReceipt(rec);
      const imgData = canvas.toDataURL("image/jpeg", 0.95);
      const jspdfModule = await import("jspdf");
      const pdf = new jspdfModule.default({ unit: "px", format: [canvas.width, canvas.height] });
      pdf.addImage(imgData, "JPEG", 0, 0, canvas.width, canvas.height);
      const clientName = rec.invoices?.clients?.full_name?.replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s]/g, '').replace(/\s+/g, '-') || 'cliente';
      pdf.save(`recibo-${receipt_number}-${clientName}.pdf`);
      toast.success("PDF descargado");
    } catch (e) {
      console.error("[handlePrintPdf]", e);
      toast.error("Error al generar PDF");
    }
    setOpenPrintId(null);
  }

  async function handlePrintJpg(rec: any) {
    try {
      const { canvas, receipt_number } = await captureReceipt(rec);
      const link = document.createElement("a");
      const clientName = rec.invoices?.clients?.full_name?.replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s]/g, '').replace(/\s+/g, '-') || 'cliente';
      link.download = `recibo-${receipt_number}-${clientName}.jpg`;
      link.href = canvas.toDataURL("image/jpeg", 0.95);
      link.click();
      toast.success("JPG descargado");
    } catch (e) {
      console.error("[handlePrintJpg]", e);
      toast.error("Error al generar JPG");
    }
    setOpenPrintId(null);
  }

  async function handleSave() {
    if (!selectedInvoice) { toast.error("Selecciona una factura"); return; }
    if (amount <= 0) { toast.error("El monto debe ser mayor a 0"); return; }
    if (paymentMethod === "TRANSFER" && !bankAccountId) { toast.error("Selecciona una cuenta bancaria"); return; }
    if (amount > balanceDue) {
      const ok = window.confirm(
        `El monto (${formatCurrency(amount)}) excede el saldo pendiente (${formatCurrency(balanceDue)}). \u00bfDeseas registrar un excedente como abono a favor?`
      );
      if (!ok) return;
    }
    setSaving(true);
    try {
      const clientId = selectedInvoiceData?.client_id;
      await createReceipt({
        invoice_id: selectedInvoice,
        client_id: clientId,
        receipt_date: receiptDate,
        amount,
        payment_method: paymentMethod,
        bank_account_id: paymentMethod === "TRANSFER" ? bankAccountId : undefined,
        concept: notes || undefined,
      });
      toast.success(amount > balanceDue ? "Pago registrado con excedente como abono a favor" : "Recibo creado exitosamente");
      setShowModal(false);
      resetForm();
      load();
    } catch (e) {
      toast.error(`Error: ${(e as any)?.message || "Error al crear recibo"}`);
    } finally {
      setSaving(false);
    }
  }

  async function handleEditSave() {
    if (!selectedReceipt) return;
    setSaving(true);
    try {
      await updateReceiptWithInvoice(selectedReceipt.id, {
        amount: editForm.amount,
        receipt_date: editForm.receipt_date,
        payment_method: editForm.payment_method,
        bank_account_id: editForm.payment_method === "TRANSFER" ? editForm.bank_account_id : undefined,
        concept: editForm.concept || undefined,
        invoice_id: selectedReceipt.invoice_id,
        _old_amount: Number(selectedReceipt.amount),
      });
      toast.success("Recibo actualizado");
      setShowEditModal(false);
      setSelectedReceipt(null);
      load();
    } catch (e) {
      toast.error(`Error: ${(e as any)?.message || "Error al actualizar recibo"}`);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm("\u00bfEst\u00e1s segura de eliminar este recibo?")) return;
    try {
      await deleteReceipt(id);
      toast.success("Recibo eliminado");
      load();
    } catch { toast.error("Error al eliminar recibo"); }
  }

  function openEdit(rec: any) {
    setSelectedReceipt(rec);
    setEditForm({
      amount: Number(rec.amount),
      payment_method: rec.payment_method,
      bank_account_id: rec.bank_account_id || "",
      concept: rec.concept || "",
      receipt_date: rec.receipt_date || getLocalDateString(),
    });
    setShowEditModal(true);
  }

  return (
    <PageContainer
      title="Recibos"
      subtitle="Comprobantes de pago emitidos a clientes"
      action={
        <button
          onClick={() => { resetForm(); setShowModal(true); }}
          className="flex items-center gap-2 bg-red-600 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-red-700 transition-all shadow-sm"
        >
          <Plus size={18} />
          Registrar Pago
        </button>
      }
    >
      <div className="relative mb-6">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
        <input
          type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Buscar recibo por n\u00famero, factura o cliente..."
          className="w-full h-12 pl-12 pr-4 rounded-xl border border-gray-200 bg-white text-gray-900 placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30 transition-all"
        />
      </div>

      <div className="flex gap-3 mb-6 flex-wrap">
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as any)}
          className="h-10 px-3 rounded-xl border border-gray-200 bg-white text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30">
          <option value="all">Todos los estados</option>
          <option value="paid">Pagados</option>
          <option value="pending">Pendientes</option>
        </select>
        <select value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)}
          className="h-10 px-3 rounded-xl border border-gray-200 bg-white text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30">
          <option value="">Todos los meses</option>
          {["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"].map((m, i) => (
            <option key={i} value={String(i + 1).padStart(2, "0")}>{m}</option>
          ))}
        </select>
        <select value={filterYear} onChange={(e) => setFilterYear(e.target.value)}
          className="h-10 px-3 rounded-xl border border-gray-200 bg-white text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30">
          <option value="">Todos los a\u00f1os</option>
          {[2024, 2025, 2026, 2027].map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
        {(filterMonth || filterYear || filterStatus !== "all") && (
          <button onClick={() => { setFilterMonth(""); setFilterYear(""); setFilterStatus("all"); }} className="text-xs text-gray-500 hover:text-gray-900 px-3">Limpiar filtros</button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><div className="w-8 h-8 border-2 border-red-600 border-t-transparent rounded-full animate-spin" /></div>
      ) : receiptSearchFiltered.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <FileText size={40} className="mx-auto mb-3 opacity-40" />
          <p className="text-sm">No hay recibos registrados</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-separate border-spacing-y-2">
            <thead>
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">No. Recibo</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Fecha</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Cliente</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Factura</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Monto</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">M\u00e9todo</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Estado</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {receiptSearchFiltered.map((rec: any) => {
                return (
                  <tr key={rec.id} className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                    <td className="px-4 py-3.5 text-sm font-medium text-gray-900">{rec.receipt_number}</td>
                    <td className="px-4 py-3.5 text-sm text-gray-500">{formatDate(rec.receipt_date || rec.created_at)}</td>
                    <td className="px-4 py-3.5 text-sm text-gray-900">{rec.client?.full_name || rec.invoices?.clients?.full_name || "\u2014"}</td>
                    <td className="px-4 py-3.5 text-sm text-gray-900">{rec.invoices?.invoice_number || "\u2014"}</td>
                    <td className="px-4 py-3.5 text-sm text-gray-900 text-right font-medium">{formatCurrency(rec.amount)}</td>
                    <td className="px-4 py-3.5 text-center">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${methodColors[rec.payment_method] || "bg-gray-100 text-gray-800"}`}>
                        {methodLabel[rec.payment_method]}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <Badge status={rec.invoices?.status === "PAID" ? "PAID" : "PENDING"} />
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => { setSelectedReceipt(rec); setShowDetail(true); }} className="p-2 text-gray-500 hover:bg-gray-50 rounded-lg" title="Ver"><Eye size={15} /></button>
                        <button onClick={() => openEdit(rec)} className="p-2 text-gray-500 hover:bg-gray-50 rounded-lg" title="Editar"><Edit2 size={15} /></button>
                        <button onClick={() => handlePrintPdf(rec)} className="p-2 text-gray-500 hover:bg-gray-50 rounded-lg" title="PDF"><Printer size={15} /></button>
                        <button onClick={() => handlePrintJpg(rec)} className="p-2 text-gray-500 hover:bg-gray-50 rounded-lg" title="JPG"><Download size={15} /></button>
                        <button onClick={() => handleDelete(rec.id)} className="p-2 text-red-400 hover:bg-red-50 rounded-lg" title="Eliminar"><Trash2 size={15} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Detail modal */}
      <Modal isOpen={showDetail} onClose={() => { setShowDetail(false); setSelectedReceipt(null); }} title={selectedReceipt?.receipt_number || "Detalle"} size="xl">
        {selectedReceipt && (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Cliente</p>
                <p className="text-sm font-medium text-gray-900">{selectedReceipt.clients?.full_name || selectedReceipt.invoices?.clients?.full_name || "\u2014"}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500">Fecha</p>
                <p className="text-sm text-gray-900">{formatDate(selectedReceipt.receipt_date || selectedReceipt.created_at)}</p>
              </div>
            </div>

            <div className="bg-green-50 rounded-xl p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-green-600">Factura asociada</span>
                <span className="text-gray-900 font-medium">{selectedReceipt.invoices?.invoice_number || "\u2014"}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-green-600">M\u00e9todo de pago</span>
                <span className="text-gray-900">{methodLabel[selectedReceipt.payment_method] || selectedReceipt.payment_method}{selectedReceipt.bank_accounts ? ` \u2014 ${selectedReceipt.bank_accounts.bank_name}` : ""}</span>
              </div>
              <div className="flex justify-between text-lg font-bold pt-2 border-t border-green-500/30">
                <span>Monto pagado</span>
                <span className="text-green-600">{formatCurrency(selectedReceipt.amount)}</span>
              </div>
            </div>

            {(selectedReceipt.invoices?.invoice_items || []).length > 0 && (
              <div>
                <table className="w-full text-sm mb-5">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="py-2.5 px-3 text-left text-xs text-gray-900 font-bold">Producto</th>
                      <th className="py-2.5 px-3 text-right text-xs text-gray-900 font-bold">Cant.</th>
                      <th className="py-2.5 px-3 text-right text-xs text-gray-900 font-bold">Precio Unit.</th>
                      <th className="py-2.5 px-3 text-right text-xs text-gray-900 font-bold">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(selectedReceipt.invoices?.invoice_items || []).map((item: any, i: number) => (
                      <tr key={i} className="border-b border-gray-100">
                        <td className="py-2.5 px-3 text-sm text-gray-900">{item.menu_item?.name || item.custom_name || "Producto"}</td>
                        <td className="py-2.5 px-3 text-right text-sm text-gray-900">{item.quantity}</td>
                        <td className="py-2.5 px-3 text-right text-sm text-gray-900">{formatCurrency(Number(item.unit_price))}</td>
                        <td className="py-2.5 px-3 text-right text-sm font-medium text-gray-900">{formatCurrency(Number(item.line_total))}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {selectedReceipt.amount_in_words && (
              <p className="text-sm text-gray-500 italic">Son: {selectedReceipt.amount_in_words}</p>
            )}

            {selectedReceipt.concept && (
              <div>
                <p className="text-xs text-gray-500 mb-1">Notas</p>
                <p className="text-sm text-gray-900 bg-gray-50 rounded-xl p-3">{selectedReceipt.concept}</p>
              </div>
            )}

            <div className="border-t border-gray-200 pt-4 flex justify-between items-end">
              <div>
                <p className="text-xs italic text-red-600 whitespace-nowrap">¡Gracias por tu pago! Hecho con el amor de mamá.</p>
              </div>
              <div className="text-right">
                {settings?.signature_url ? (
                  <Image src={settings.signature_url} alt="Firma" width={96} height={96} className="h-24 w-auto ml-auto" unoptimized />
                ) : (
                  <Image src="/firma-yrahisa-mateo.png" alt="Firma" width={96} height={96} className="h-24 w-auto ml-auto" />
                )}
                <p className="text-[9px] text-gray-500 mt-0.5">FIRMA AUTORIZADA</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <button onClick={() => handlePrintPdf(selectedReceipt)} className="flex-1 min-w-[120px] h-12 border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 transition-all flex items-center justify-center gap-2">
                <Printer size={18} /> PDF
              </button>
              <button onClick={() => { setShowDetail(false); handlePrintJpg(selectedReceipt); }} className="flex-1 min-w-[120px] h-12 border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 transition-all flex items-center justify-center gap-2">
                <Download size={18} /> JPG
              </button>
              {(selectedReceipt.clients?.email || selectedReceipt.invoices?.clients?.email) && (
                <button
                  onClick={() => setDraftModal({ type: "email" })}
                  className="flex-1 min-w-[120px] h-12 border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
                >
                  <Mail size={18} /> Email
                </button>
              )}
              {(selectedReceipt.clients?.phone || selectedReceipt.invoices?.clients?.phone) && (
                <button
                  onClick={() => setDraftModal({ type: "whatsapp" })}
                  className="flex-1 min-w-[120px] h-12 border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
                >
                  <MessageCircle size={18} /> WhatsApp
                </button>
              )}
            </div>
          </div>
        )}
      </Modal>

      {draftModal && selectedReceipt && (
        <CommunicationDraftModal
          isOpen={true}
          onClose={() => setDraftModal(null)}
          type={draftModal.type}
          client={{
            id: selectedReceipt.client_id,
            full_name: selectedReceipt.clients?.full_name || selectedReceipt.invoices?.clients?.full_name || "",
            email: selectedReceipt.clients?.email || selectedReceipt.invoices?.clients?.email,
            phone: selectedReceipt.clients?.phone || selectedReceipt.invoices?.clients?.phone,
          }}
          documentType="receipt"
          documentNumber={selectedReceipt.receipt_number}
          documentId={selectedReceipt.id}
          total={formatCurrency(selectedReceipt.amount)}
          businessName={settings?.business_name || "Do\u00f1a Nina"}
          senderEmail={settings?.email || undefined}
          senderName={settings?.sender_name || undefined}
          emailTemplate={(settings as any)?.email_template || undefined}
          whatsappTemplate={(settings as any)?.whatsapp_template || undefined}
          getAttachment={async () => {
            const { canvas, receipt_number } = await captureReceipt(selectedReceipt);
            const jspdfModule = await import("jspdf");
            const pdf = new jspdfModule.default({ unit: "px", format: [canvas.width, canvas.height] });
            pdf.addImage(canvas.toDataURL("image/jpeg", 0.95), "JPEG", 0, 0, canvas.width, canvas.height);
            const base64 = pdf.output("datauristring").split(",")[1];
            const clientName = selectedReceipt?.invoices?.clients?.full_name?.replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s]/g, '').replace(/\s+/g, '-') || 'cliente';
            return { filename: `recibo-${receipt_number}-${clientName}.pdf`, base64 };
          }}
        />
      )}

      {/* Edit modal */}
      <Modal isOpen={showEditModal} onClose={() => { setShowEditModal(false); setSelectedReceipt(null); }} title="Editar Recibo" subtitle={selectedReceipt?.receipt_number || ""} size="xl">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Monto</label>
              <input
                type="number" step="0.01" value={editForm.amount}
                onChange={(e) => setEditForm({ ...editForm, amount: Number(e.target.value) })}
                className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">M\u00e9todo de pago</label>
              <select
                value={editForm.payment_method}
                onChange={(e) => setEditForm({ ...editForm, payment_method: e.target.value as any, bank_account_id: "" })}
                className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30 transition-all"
              >
                <option value="CASH">Efectivo</option>
                <option value="TRANSFER">Transferencia</option>
                <option value="CARD">Tarjeta</option>
              </select>
            </div>
          </div>
          {editForm.payment_method === "TRANSFER" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Cuenta bancaria destino</label>
              <select
                value={editForm.bank_account_id}
                onChange={(e) => setEditForm({ ...editForm, bank_account_id: e.target.value })}
                className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30 transition-all"
              >
                <option value="">Seleccionar banco...</option>
                {bankAccounts.map((b) => (
                  <option key={b.id} value={b.id}>{b.bank_name} \u2014 {b.account_type} \u2014 No. {b.account_number}</option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Notas</label>
            <textarea
              value={editForm.concept} onChange={(e) => setEditForm({ ...editForm, concept: e.target.value })}
              rows={3}
              placeholder="Notas del recibo..."
              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30 transition-all resize-none"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={() => { setShowEditModal(false); setSelectedReceipt(null); }} className="flex-1 h-12 border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 transition-all">Cancelar</button>
            <button onClick={handleEditSave} disabled={saving} className="flex-1 h-12 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700 transition-all shadow-sm disabled:opacity-50 flex items-center justify-center gap-2">
              <Save size={18} /> {saving ? "Guardando..." : "Guardar Cambios"}
            </button>
          </div>
        </div>
      </Modal>

      {/* Payment form modal */}
      <Modal isOpen={showModal} onClose={() => { setShowModal(false); resetForm(); }} title="Registrar Pago" subtitle={selectedInvoiceData?.client?.full_name ? `Cliente: ${selectedInvoiceData.client.full_name}` : undefined} size="xl">
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Factura</label>
            <select
              value={selectedInvoice}
              onChange={(e) => { setSelectedInvoice(e.target.value); setAmount(0); }}
              className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30 transition-all"
            >
              <option value="">Seleccionar factura...</option>
              {pendingInvoices.map((inv: any) => {
                const due = Number(inv.total) - Number(inv.amount_paid || 0);
                return (
                  <option key={inv.id} value={inv.id}>
                    {inv.invoice_number} \u2014 {inv.client?.full_name} \u2014 Pend. {formatCurrency(due)}
                  </option>
                );
              })}
            </select>
          </div>

          {selectedInvoiceData && (
            <div className="bg-green-50 rounded-xl p-4 text-sm space-y-1">
              <div className="flex justify-between"><span className="text-green-600">Total factura</span><span>{formatCurrency(selectedInvoiceData.total)}</span></div>
              <div className="flex justify-between"><span className="text-green-600">Pagado</span><span>{formatCurrency(selectedInvoiceData.amount_paid || 0)}</span></div>
              <div className="flex justify-between font-bold text-gray-900 pt-1 border-t border-green-500/30">
                <span>Saldo pendiente</span><span>{formatCurrency(balanceDue)}</span>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Fecha del recibo</label>
            <input
              type="date" value={receiptDate}
              onChange={(e) => setReceiptDate(e.target.value)}
              className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30 transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Monto</label>
              <input
                type="number" step="0.01" value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">M\u00e9todo de pago</label>
              <select
                value={paymentMethod}
                onChange={(e) => { setPaymentMethod(e.target.value as any); setBankAccountId(""); }}
                className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30 transition-all"
              >
                <option value="CASH">Efectivo</option>
                <option value="TRANSFER">Transferencia</option>
                <option value="CARD">Tarjeta</option>
              </select>
            </div>
          </div>

          {paymentMethod === "TRANSFER" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Cuenta bancaria destino</label>
              <select
                value={bankAccountId}
                onChange={(e) => setBankAccountId(e.target.value)}
                className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30 transition-all"
              >
                <option value="">Seleccionar banco...</option>
                {bankAccounts.map((b) => (
                  <option key={b.id} value={b.id}>{b.bank_name} \u2014 {b.account_type} \u2014 No. {b.account_number}</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Notas (opcional)</label>
            <textarea
              value={notes} onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30 transition-all resize-none"
            />
          </div>

          <div className="flex gap-3">
            <button onClick={() => { setShowModal(false); resetForm(); }} className="flex-1 h-12 border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 transition-all">Cancelar</button>
            <button onClick={handleSave} disabled={saving} className="flex-1 h-12 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700 transition-all shadow-sm disabled:opacity-50 flex items-center justify-center gap-2">
              <Save size={18} /> {saving ? "Guardando..." : "Registrar Pago"}
            </button>
          </div>
        </div>
      </Modal>
    </PageContainer>
  );
}
