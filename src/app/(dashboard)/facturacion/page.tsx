"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { PageContainer } from "@/components/layout/PageContainer";
import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import { InvoiceFilters } from "@/components/invoices/InvoiceFilters";
import { InvoiceTable } from "@/components/invoices/InvoiceTable";
import { InvoiceForm } from "@/components/invoices/InvoiceForm";
import { createInvoice, deleteInvoice, getInvoice, updateInvoice, getBankAccounts } from "@/services/invoices";
import { createClient } from "@/services/clients";
import CommunicationDraftModal from "@/components/communications/CommunicationDraftModal";
import { getActiveMenuItems } from "@/services/menu";
import { getSettings } from "@/services/settings";
import type { Client, BankAccount, Setting } from "@/types/database";
import { formatCurrency, formatDate, getLocalDateString, sanitizeHtml } from "@/lib/utils";
import { FileText, Plus, Save, DollarSign, Download, Mail, MessageCircle } from "lucide-react";
import Image from "next/image";
import LogoDonaNina from "@/components/ui/LogoDonaNina";
import toast from "react-hot-toast";



export default function FacturacionPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [invoices, setInvoices] = useState<any[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [settings, setSettings] = useState<Setting | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterMonth, setFilterMonth] = useState("");
  const [filterYear, setFilterYear] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterClient, setFilterClient] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedClient, setSelectedClient] = useState("");
  const [invoiceDate, setInvoiceDate] = useState(getLocalDateString());
  const [items, setItems] = useState<Array<{ menu_item_id: string; name: string; quantity: number; unit_price: number; pv: number; itbis: boolean; itbis_rate?: number }>>([]);
  const [discountPercent, setDiscountPercent] = useState(0);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [notes, setNotes] = useState("");
  const [bankAccountId, setBankAccountId] = useState("");
  const [openPrintId, setOpenPrintId] = useState<string | null>(null);
  const [jpgData] = useState<any>(null);
  const [showNewClient, setShowNewClient] = useState(false);
  const [newClientForm, setNewClientForm] = useState({ full_name: "", phone: "", email: "", address: "", notes: "", birthday: "", stage: "Prospecto", lead_source: "", interest: "", first_contact_date: getLocalDateString(), next_followup_date: "" });
  const [draftModal, setDraftModal] = useState<{ type: "email" | "whatsapp" } | null>(null);
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);
  const jpgRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef("");

  const load = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      if (searchRef.current) params.set('search', searchRef.current)
      if (filterStatus) params.set('status', filterStatus)
      if (filterClient) params.set('client_id', filterClient)
      if (filterMonth) params.set('month', filterMonth)
      if (filterYear) params.set('year', filterYear)

      const [invRes, mi, ba, st] = await Promise.all([
        fetch(`/api/invoices?${params}`).then(r => r.json()),
        getActiveMenuItems().catch(() => []),
        getBankAccounts().catch(() => []),
        getSettings().catch(() => null),
      ]);
      setInvoices(invRes.data || []);
      setMenuItems(mi);
      setBankAccounts(ba);
      setSettings(st);
    } catch {
      toast.error("Error al cargar facturas");
    } finally {
      setLoading(false);
    }
  }, [filterStatus, filterClient, filterMonth, filterYear]);

  useEffect(() => { queueMicrotask(() => load()); }, [load]);

  useEffect(() => {
    if (searchParams.get("nueva") === "true") {
      queueMicrotask(() => {
        resetForm();
        setShowModal(true);
      });
    }
  }, [searchParams]);

  useEffect(() => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      load();
    }, 300);
    return () => { if (searchTimeout.current) clearTimeout(searchTimeout.current); };
  }, [searchQuery, load]);

  function handleSearch(val: string) {
    searchRef.current = val;
    setSearchQuery(val);
  }

  async function handleSaveNewClient() {
    if (!newClientForm.full_name.trim()) { toast.error("El nombre del cliente es requerido"); return; }
    setSaving(true);
    try {
      const created = await createClient(newClientForm);
      const fresh = await fetch('/api/clients').then(r => r.json());
      setClients(fresh.data || []);
      setSelectedClient(created.id);
      setShowNewClient(false);
      setNewClientForm({ full_name: "", phone: "", email: "", address: "", notes: "", birthday: "", stage: "Prospecto", lead_source: "", interest: "", first_contact_date: getLocalDateString(), next_followup_date: "" });
      toast.success("Cliente agregado");
    } catch (e) {
      console.error("Error creating client:", e);
      toast.error(`Error: ${(e as any)?.message || "Error al crear cliente"}`);
    } finally {
      setSaving(false);
    }
  }

  function resetForm() {
    setSelectedClient("");
    setItems([]);
    setDiscountPercent(0);
    setDiscountAmount(0);
    setInvoiceDate(getLocalDateString());
    setNotes("");
    setBankAccountId("");
    setEditingId(null);
  }



  const subtotal = items.reduce((s, i) => s + i.quantity * i.unit_price, 0);
  const itbisTotal = items.reduce((s, i) => s + (i.itbis ? i.quantity * i.unit_price * ((i as any).itbis_rate || 18) / 100 : 0), 0);
  const discountValue = discountAmount > 0 ? discountAmount : (subtotal * discountPercent / 100);
  const total = subtotal + itbisTotal - discountValue;

  async function buildPreviewEl(data: any, settings: any) {
    const el = document.createElement("div");
    const sh = sanitizeHtml;
    el.style.cssText = "position:fixed;top:0;left:0;z-index:9999;background:#fff;width:900px;padding:32px;font-family:Inter,system-ui,sans-serif;font-size:16px;line-height:1.5;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale;overflow-wrap:normal; word-break:normal; hyphens:none; white-space:nowrap; text-wrap:stable; text-align:justify;";
    el.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:24px;">
        <div style="display:flex;align-items:flex-start;gap:8px;flex-shrink:0;">
          <div style="width:56px;height:56px;flex-shrink:0;">
            <svg width="56" height="56" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="60" cy="60" r="58" fill="#F8F7F4"/>
              <circle cx="60" cy="60" r="58" stroke="#7C1D2E" stroke-width="3.5" fill="none" stroke-linecap="round"/>
              <circle cx="60" cy="60" r="55" stroke="#7C1D2E" stroke-width="1.2" fill="none" stroke-linecap="round"/>
              <g stroke="#7C1D2E" stroke-linecap="round" stroke-linejoin="round" fill="none">
                <g transform="translate(60,60) rotate(-24) translate(-60,-60)">
                  <path d="M57 65 C52 78 45 92 40 99" stroke-width="3.2"/>
                  <path d="M63 65 C68 78 75 92 80 99" stroke-width="3.2"/>
                  <path d="M40 99 C45 102 52 102 60 102 C68 102 75 102 80 99" stroke-width="2.8"/>
                  <path d="M46 58 C41 47 36 38 32 30" stroke-width="2.5"/>
                  <path d="M51 57 C47 47 43 38 40 29" stroke-width="2.5"/>
                  <path d="M56 56 C53 46 50 37 48 28" stroke-width="2.5"/>
                  <path d="M60 56 C58 46 56 37 55 28" stroke-width="2.5"/>
                  <path d="M46 58 C51 62 55 63 57 65" stroke-width="2.5"/>
                  <path d="M60 56 C62 60 63 62 63 65" stroke-width="2.5"/>
                </g>
                <g transform="translate(60,60) rotate(24) translate(-60,-60)">
                  <path d="M57 65 C52 78 47 92 44 99" stroke-width="3.2"/>
                  <path d="M63 65 C63 78 63 92 63 99" stroke-width="2.2"/>
                  <path d="M44 99 C48 102 55 102 60 102 C65 102 72 102 63 99" stroke-width="2.8"/>
                  <path d="M52 58 C47 48 44 38 46 30" stroke-width="2.2"/>
                  <path d="M64 58 C68 48 72 38 74 30" stroke-width="2.8"/>
                  <path d="M46 30 C52 27 64 27 74 30" stroke-width="2.2"/>
                  <path d="M52 58 C56 60 60 60 64 58" stroke-width="2.5"/>
                </g>
              </g>
              <path d="M60 47 C57 43 54 40 52 42 C48 46 52 50 60 56 C68 50 72 46 68 42 C66 40 63 43 60 47 Z" fill="#7C1D2E"/>
              <g stroke="#7C1D2E" stroke-width="1.8" stroke-linecap="round" fill="none">
                <line x1="30" y1="54" x2="30" y2="59"/>
                <line x1="30" y1="62" x2="30" y2="67"/>
                <line x1="90" y1="54" x2="90" y2="59"/>
                <line x1="90" y1="62" x2="90" y2="67"/>
              </g>
            </svg>
          </div>
          <div style="white-space:nowrap;">
            <h2 style="font-size:26px;font-weight:800;color:#111827;margin:0;line-height:1.1;letter-spacing:-0.02em;">Donde Doña Nina</h2>
            <p style="font-size:11px;letter-spacing:0.08em;color:#dc2626;text-transform:uppercase;margin:2px 0 0;line-height:1.4;font-weight:600;">Hechas con el amor de mamá</p>
            <p style="font-size:10px;color:#6b7280;margin:2px 0 0;line-height:1.4;font-weight:500;">Sabor Dominicano</p>
          </div>
        </div>
        <div style="text-align:right;white-space:nowrap;">
          <span style="display:inline-block;background:#f9fafb;color:#dc2626;font-size:12px;font-weight:700;padding:8px 16px;border-radius:999px;">FACTURA DE VENTA</span>
          <p style="font-size:18px;font-weight:700;color:#111827;margin:12px 0 0;line-height:1.2;white-space:nowrap;">${sh(data.invoice_number)}</p>
          <p style="font-size:12px;color:#6b7280;margin:2px 0 0;line-height:1.4;">Fecha: ${formatDate(data.invoice_date)}</p>
        </div>
      </div>
      <div style="border-top:1px solid #e5e7eb;margin-bottom:20px;"></div>
      <div style="border:1px solid #e5e7eb;background:#f9fafb;border-radius:12px;padding:16px;margin-bottom:20px;">
        <p style="font-size:11px;font-weight:700;color:#dc2626;margin:0 0 12px;">CLIENTE / ADQUIRIENTE</p>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:4px 16px;font-size:13px;">
          <p style="color:#111827;margin:0;"><span style="color:#6b7280;">Nombre:</span> ${sh(data.client?.full_name) || "—"}</p>
          <p style="color:#111827;margin:0;"><span style="color:#6b7280;">Teléfono:</span> ${sh(data.client?.phone) || "—"}</p>
          <p style="color:#111827;margin:0;"><span style="color:#6b7280;">Email:</span> ${sh(data.client?.email) || "N/D"}</p>
        </div>
      </div>
      <table style="width:100%;font-size:13px;margin-bottom:20px;border-collapse:collapse;">
        <thead>
          <tr style="background:#f9fafb;">
            <th style="padding:10px 12px;text-align:left;font-size:11px;color:#111827;font-weight:700;">Categoría</th>
            <th style="padding:10px 12px;text-align:left;font-size:11px;color:#111827;font-weight:700;">Descripción / Producto</th>
            <th style="padding:10px 12px;text-align:right;font-size:11px;color:#111827;font-weight:700;">Cant.</th>
            <th style="padding:10px 12px;text-align:right;font-size:11px;color:#111827;font-weight:700;">Precio Unit.</th>
            <th style="padding:10px 12px;text-align:right;font-size:11px;color:#111827;font-weight:700;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${(data.items || []).map((item: any) => `
            <tr style="border-bottom:1px solid #f9fafb;">
              <td style="padding:10px 12px;font-size:11px;color:#6b7280;">${sh(item.menu_item?.category?.name) || "—"}</td>
              <td style="padding:10px 12px;font-size:13px;color:#111827;">${sh(item.menu_item?.name || item.custom_name) || "Producto"}</td>
              <td style="padding:10px 12px;text-align:right;font-size:13px;color:#111827;">${item.quantity}</td>
              <td style="padding:10px 12px;text-align:right;font-size:13px;color:#111827;">${formatCurrency(Number(item.unit_price))}</td>
              <td style="padding:10px 12px;text-align:right;font-size:13px;font-weight:500;color:#111827;">${formatCurrency(Number(item.line_total))}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
      ${data.bank_account ? `
        <div style="border:1px solid #e5e7eb;background:#f9fafb;border-radius:12px;padding:16px;margin-bottom:20px;">
          <p style="font-size:11px;font-weight:700;color:#dc2626;margin:0 0 12px;">DATOS DE TRANSFERENCIA</p>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:4px 16px;font-size:13px;">
            <p style="color:#111827;margin:0;"><span style="color:#6b7280;">Beneficiario:</span> ${sh(data.bank_account.holder_name)}</p>
            ${data.bank_account.id_number ? `<p style="color:#111827;margin:0;"><span style="color:#6b7280;">Cédula/RNC:</span> ${sh(data.bank_account.id_number)}</p>` : ""}
            <p style="color:#111827;margin:0;"><span style="color:#6b7280;">Banco:</span> ${sh(data.bank_account.bank_name)}</p>
            <p style="color:#111827;margin:0;"><span style="color:#6b7280;">Tipo de Cuenta:</span> ${sh(data.bank_account.account_type)}</p>
            <p style="color:#111827;margin:0;"><span style="color:#6b7280;">No. de Cuenta:</span> ${sh(data.bank_account.account_number)}</p>
            ${data.bank_account.email ? `<p style="color:#111827;margin:0;"><span style="color:#6b7280;">Correo:</span> ${sh(data.bank_account.email)}</p>` : ""}
          </div>
        </div>
      ` : ""}
      <div style="border-top:1px solid #e5e7eb;padding-top:12px;margin-bottom:20px;">
        <div style="display:flex;justify-content:space-between;font-size:13px;color:#6b7280;margin-bottom:4px;">
          <span>Subtotal</span>
          <span>${formatCurrency(Number(data.subtotal))}</span>
        </div>
        ${Number(data.itbis_total) > 0 ? `
          <div style="display:flex;justify-content:space-between;font-size:13px;color:#6b7280;margin-bottom:4px;">
            <span>ITBIS (18%)</span>
            <span>${formatCurrency(Number(data.itbis_total))}</span>
          </div>
        ` : ""}
        ${Number(data.discount_amount) > 0 ? `
          <div style="display:flex;justify-content:space-between;font-size:13px;color:#f87171;margin-bottom:4px;">
            <span>Descuento</span>
            <span>-${formatCurrency(Number(data.discount_amount))}</span>
          </div>
        ` : ""}
        <div style="display:flex;justify-content:space-between;font-size:16px;font-weight:700;color:#111827;padding-top:4px;border-top:1px solid #e5e7eb;margin-bottom:4px;">
          <span>Total General</span>
          <span>${formatCurrency(Number(data.total))}</span>
        </div>
        ${Number(data.amount_paid) > 0 ? `
          <div style="display:flex;justify-content:space-between;font-size:13px;color:#22c55e;margin-bottom:4px;">
            <span>Monto Cobrado</span>
            <span>${formatCurrency(Number(data.amount_paid))}</span>
          </div>
        ` : ""}
        ${(Number(data.total) - Number(data.amount_paid || 0)) > 0 ? `
          <div style="display:flex;justify-content:space-between;font-size:13px;font-weight:700;color:#dc2626;">
            <span>Saldo Pendiente</span>
            <span>${formatCurrency(Number(data.total) - Number(data.amount_paid || 0))}</span>
          </div>
        ` : ""}
      </div>
      <div style="border-top:1px solid #e5e7eb;padding-top:16px;display:flex;justify-content:space-between;align-items:flex-end;">
        <div>
          <p style="font-size:11px;font-style:italic;color:#dc2626;margin:0;line-height:1.4;white-space:nowrap;">¡Gracias por tu compra! Hecho con el amor de mamá.</p>
          <p style="font-size:10px;color:#6b7280;margin:6px 0 0;line-height:1.4;white-space:nowrap;">Donde Doña Nina · Hechas con el amor de mamá · Sabor Dominicano</p>
        </div>
        <div style="text-align:right;white-space:nowrap;">
          ${settings?.signature_url
            ? `<img src="${sh(settings.signature_url)}" alt="Firma" style="height:96px;margin-left:auto;" />`
            : `<img src="/firma-yrahisa-mateo.png" alt="Firma" style="height:96px;margin-left:auto;" />`}
          <p style="font-size:9px;color:#6b7280;margin:2px 0 0;line-height:1.4;">FIRMA AUTORIZADA</p>
        </div>
      </div>
    `;
    return el;
  }

  async function captureInvoice(inv: any) {
    const full = await getInvoice(inv.id);
    const el = await buildPreviewEl(full, settings);
    document.body.appendChild(el);
    await new Promise(r => setTimeout(r, 500));
    const domtoimage = await import("dom-to-image-more");
    const canvas = await domtoimage.toCanvas(el, { scale: 2, width: 900, ignoreCSSRuleErrors: true, disableEmbedFonts: true });
    document.body.removeChild(el);
    return { canvas, data: full, invoice_number: inv.invoice_number };
  }

  async function handlePrintPdf(inv: any) {
    try {
      const { canvas, invoice_number } = await captureInvoice(inv);
      const imgData = canvas.toDataURL("image/jpeg", 0.95);
      const jspdfModule = await import("jspdf");
      const pdf = new jspdfModule.default({ unit: "px", format: [canvas.width, canvas.height] });
      pdf.addImage(imgData, "JPEG", 0, 0, canvas.width, canvas.height);
      const clientName = inv.client?.full_name?.replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s]/g, '').replace(/\s+/g, '-') || 'cliente';
      pdf.save(`factura-${invoice_number}-${clientName}.pdf`);
      toast.success("PDF descargado");
    } catch (e) {
      console.error("[handlePrintPdf]", e);
      toast.error("Error al generar PDF");
    }
  }

  async function handlePrintJpg(inv: any) {
    try {
      const { canvas, invoice_number } = await captureInvoice(inv);
      const link = document.createElement("a");
      const clientName = inv.client?.full_name?.replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s]/g, '').replace(/\s+/g, '-') || 'cliente';
      link.download = `factura-${invoice_number}-${clientName}.jpg`;
      link.href = canvas.toDataURL("image/jpeg", 0.95);
      link.click();
      toast.success("JPG descargado");
    } catch (e) {
      console.error("[handlePrintJpg]", e);
      toast.error("Error al generar JPG");
    }
    setOpenPrintId(null);
  }

  async function handleViewDetail(inv: any) {
    try {
      const full = await getInvoice(inv.id);
      setSelectedInvoice(full);
      setShowDetail(true);
    } catch {
      setSelectedInvoice(inv);
      setShowDetail(true);
    }
  }

  async function handleEdit(inv: any) {
    try {
      const full = await getInvoice(inv.id);
      setEditingId(full.id);
      setSelectedClient(full.client_id);
      setItems(full.items?.map((item: any) => ({
        menu_item_id: item.menu_item_id,
        name: item.menu_item?.name || item.custom_name || 'Producto',
        quantity: item.quantity,
        unit_price: Number(item.unit_price),
        pv: Number(item.pv || 0),
        itbis: item.itbis ?? false,
      })) || []);
      setDiscountPercent(0);
      setDiscountAmount(Number(full.discount_amount));
      setNotes(full.notes || "");
      setBankAccountId(full.bank_account_id || "");
      setInvoiceDate(full.invoice_date || getLocalDateString());
      setShowModal(true);
    } catch {
      toast.error("Error al cargar factura");
    }
  }

  async function handleSave() {
    if (!selectedClient) { toast.error("Selecciona un cliente"); return; }
    if (items.length === 0) { toast.error("Agrega al menos un producto"); return; }
    setSaving(true);
    try {
      const payload = {
        client_id: selectedClient,
        invoice_date: invoiceDate,
        discount_amount: discountValue,
        status: "PENDING" as const,
        notes: notes || undefined,
        bank_account_id: bankAccountId || undefined,
      };
      const invoiceItems = items.map((i) => ({
        menu_item_id: i.menu_item_id || undefined,
        quantity: i.quantity,
        unit_price: i.unit_price,
        line_total: i.quantity * i.unit_price,
        pv: i.pv * i.quantity,
        unit_cost: 0,
        itbis: i.itbis,
        custom_name: i.menu_item_id ? undefined : i.name,
      }));

      if (editingId) {
        await updateInvoice(editingId, payload, invoiceItems);
        toast.success("Factura actualizada");
      } else {
        await createInvoice(payload, invoiceItems);
        toast.success("Factura creada exitosamente");
      }
      setShowModal(false);
      resetForm();
      load();
    } catch (e: any) {
      toast.error(e?.message || "Error al guardar factura");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm("¿Estás segura de eliminar esta factura?")) return;
    try {
      await deleteInvoice(id);
      toast.success("Factura eliminada");
      load();
    } catch {
      toast.error("Error al eliminar factura");
    }
  }

  return (
    <PageContainer
      title="Facturación"
      subtitle="Gestión de facturas y ventas"
      action={
        <button
          onClick={() => { resetForm(); setShowModal(true); }}
          className="flex items-center gap-2 bg-[#7C1D2E] text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-[#5C1420] transition-all duration-200 shadow-sm"
        >
          <Plus size={18} />
          Nueva Factura
        </button>
      }
    >
      <InvoiceFilters
        searchQuery={searchQuery}
        filterMonth={filterMonth}
        filterYear={filterYear}
        filterStatus={filterStatus}
        filterClient={filterClient}
        clients={clients}
        onSearchChange={handleSearch}
        onFilterMonthChange={setFilterMonth}
        onFilterYearChange={setFilterYear}
        onFilterStatusChange={setFilterStatus}
        onFilterClientChange={setFilterClient}
        onClearFilters={() => { setFilterMonth(""); setFilterYear(""); setFilterStatus(""); setFilterClient(""); }}
      />

      <InvoiceTable
        invoices={invoices.filter((inv: any) => {
          if (filterMonth || filterYear) {
            const d = new Date(inv.invoice_date);
            if (filterMonth && String(d.getMonth() + 1).padStart(2, "0") !== filterMonth) return false;
            if (filterYear && String(d.getFullYear()) !== filterYear) return false;
          }
          if (filterStatus && inv.status !== filterStatus) return false;
          if (filterClient && inv.client_id !== filterClient) return false;
          return true;
        })}
        loading={loading}
        openPrintId={openPrintId}
        onViewDetail={handleViewDetail}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onPrintPdf={handlePrintPdf}
        onPrintJpg={handlePrintJpg}
        onTogglePrint={(id) => setOpenPrintId(openPrintId === id ? null : id)}
      />

      <Modal isOpen={showDetail} onClose={() => { setShowDetail(false); setSelectedInvoice(null); }} title={selectedInvoice?.invoice_number || "Detalle"} size="xl">
        {selectedInvoice && (
          <div className="space-y-5">
            <div id="invoice-preview" className="bg-white p-8 rounded-xl" style={{ fontFamily: "Inter, system-ui, sans-serif" }}>
              {/* A. HEADER */}
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-start gap-2">
                  <LogoDonaNina size={56} className="mt-1" />
                  <div>
                    <h2 className="text-xl font-extrabold text-[#3D2B1F]" style={{ letterSpacing: '-0.02em' }}>Donde Doña Nina</h2>
                    <p className="text-xs tracking-widest text-[#7C1D2E] uppercase mt-0.5 font-semibold">Hechas con el amor de mamá</p>
                    <p className="text-[10px] text-[#9C8A82] mt-0.5 font-medium">Sabor Dominicano</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="inline-block bg-[#FDF8F3] text-[#7C1D2E] text-xs font-bold px-4 py-2 rounded-full">FACTURA DE VENTA</span>
                  <p className="text-lg font-bold text-[#3D2B1F] mt-3">{selectedInvoice.invoice_number}</p>
                  <p className="text-xs text-[#9C8A82] mt-0.5">Fecha: {formatDate(selectedInvoice.invoice_date)}</p>
                  <div className="mt-2">
                    <Badge status={selectedInvoice.status} />
                  </div>
                </div>
              </div>

              <div className="border-t border-[#E8E0D8] mb-5" />

              {/* B. CLIENTE / ADQUIRIENTE */}
              <div className="border border-[#E8E0D8] bg-[#FDF8F3] rounded-xl p-4 mb-5">
                <p className="text-xs font-bold text-[#7C1D2E] mb-3">CLIENTE / ADQUIRIENTE</p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
                  <p className="text-[#3D2B1F]"><span className="text-[#9C8A82]">Nombre:</span> {selectedInvoice.client?.full_name}</p>
                  <p className="text-[#3D2B1F]"><span className="text-[#9C8A82]">Tel\u00e9fono:</span> {selectedInvoice.client?.phone || "\u2014"}</p>
                  <p className="text-[#3D2B1F]"><span className="text-[#9C8A82]">Email:</span> {selectedInvoice.client?.email || "N/D"}</p>
                  {selectedInvoice.client?.address && (
                    <p className="text-[#3D2B1F]"><span className="text-[#9C8A82]">Direcci\u00f3n:</span> {selectedInvoice.client.address}</p>
                  )}
                </div>
              </div>

              {/* C. PRODUCTS TABLE */}
              <table className="w-full text-sm mb-5">
                <thead>
                  <tr className="bg-[#FDF8F3]">
                    <th className="py-2.5 px-3 text-left text-xs text-[#3D2B1F] font-bold">Categor\u00eda</th>
                    <th className="py-2.5 px-3 text-left text-xs text-[#3D2B1F] font-bold">Descripci\u00f3n / Producto</th>
                    <th className="py-2.5 px-3 text-right text-xs text-[#3D2B1F] font-bold">Cant.</th>
                    <th className="py-2.5 px-3 text-right text-xs text-[#3D2B1F] font-bold">Precio Unit.</th>
                    <th className="py-2.5 px-3 text-right text-xs text-[#3D2B1F] font-bold">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {(selectedInvoice.items || []).map((item: any, i: number) => {
                    return (
                      <tr key={i} className="border-b border-[#E8E0D8]">
                        <td className="py-2.5 px-3 text-xs text-[#9C8A82]">{item.menu_item?.category?.name || "\u2014"}</td>
                        <td className="py-2.5 px-3 text-sm text-[#3D2B1F]">{item.menu_item?.name || item.custom_name || "Producto"}</td>
                        <td className="py-2.5 px-3 text-right text-sm text-[#3D2B1F]">{item.quantity}</td>
                        <td className="py-2.5 px-3 text-right text-sm text-[#3D2B1F]">{formatCurrency(Number(item.unit_price))}</td>
                        <td className="py-2.5 px-3 text-right text-sm font-medium text-[#3D2B1F]">{formatCurrency(Number(item.line_total))}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* D. PAYMENT DATA */}
              {selectedInvoice.bank_accounts && (
                <div className="border border-[#E8E0D8] bg-[#FDF8F3] rounded-xl p-4 mb-5">
                  <p className="text-xs font-bold text-[#7C1D2E] mb-3">DATOS DE TRANSFERENCIA</p>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
                    <p className="text-[#3D2B1F]"><span className="text-[#9C8A82]">Beneficiario:</span> {selectedInvoice.bank_accounts.holder_name}</p>
                    {selectedInvoice.bank_accounts.id_number && <p className="text-[#3D2B1F]"><span className="text-[#9C8A82]">C\u00e9dula/RNC:</span> {selectedInvoice.bank_accounts.id_number}</p>}
                    <p className="text-[#3D2B1F]"><span className="text-[#9C8A82]">Banco:</span> {selectedInvoice.bank_accounts.bank_name}</p>
                    <p className="text-[#3D2B1F]"><span className="text-[#9C8A82]">Tipo de Cuenta:</span> {selectedInvoice.bank_accounts.account_type}</p>
                    <p className="text-[#3D2B1F]"><span className="text-[#9C8A82]">No. de Cuenta:</span> {selectedInvoice.bank_accounts.account_number}</p>
                    {selectedInvoice.bank_accounts.email && <p className="text-[#3D2B1F]"><span className="text-[#9C8A82]">Correo:</span> {selectedInvoice.bank_accounts.email}</p>}
                  </div>
                </div>
              )}

              {/* E. SUMMARY */}
              <div className="border-t border-[#E8E0D8] pt-3 mb-5">
                <div className="flex justify-between text-sm text-[#9C8A82] mb-1">
                  <span>Subtotal</span>
                  <span>{formatCurrency(Number(selectedInvoice.subtotal))}</span>
                </div>
                {Number(selectedInvoice.itbis_total) > 0 && (
                  <div className="flex justify-between text-sm text-[#9C8A82] mb-1">
                    <span>ITBIS (18%)</span>
                    <span>{formatCurrency(Number(selectedInvoice.itbis_total))}</span>
                  </div>
                )}
                {Number(selectedInvoice.discount_amount) > 0 && (
                  <div className="flex justify-between text-sm text-[#E07A3A] mb-1">
                    <span>Descuento</span>
                    <span>-{formatCurrency(Number(selectedInvoice.discount_amount))}</span>
                  </div>
                )}
                <div className="flex justify-between text-base font-bold text-[#3D2B1F] pt-1 border-t border-[#E8E0D8] mb-1">
                  <span>Total General</span>
                  <span>{formatCurrency(Number(selectedInvoice.total))}</span>
                </div>
                {Number(selectedInvoice.amount_paid) > 0 && (
                  <div className="flex justify-between text-sm text-green-600 mb-1">
                    <span>Monto Cobrado</span>
                    <span>{formatCurrency(Number(selectedInvoice.amount_paid))}</span>
                  </div>
                )}
                {(Number(selectedInvoice.total) - Number(selectedInvoice.amount_paid || 0)) > 0 && (
                  <div className="flex justify-between text-sm font-bold text-[#7C1D2E]">
                    <span>Saldo Pendiente</span>
                    <span>{formatCurrency(Number(selectedInvoice.total) - Number(selectedInvoice.amount_paid || 0))}</span>
                  </div>
                )}
              </div>

              {/* Notes */}
              {selectedInvoice.notes && (
                <div className="bg-amber-50 border border-[#E8E0D8] rounded-xl p-3 mb-5">
                  <p className="text-xs text-[#9C8A82] mb-1">Notas:</p>
                  <p className="text-sm text-[#3D2B1F]">{selectedInvoice.notes}</p>
                </div>
              )}

              {/* F. FOOTER */}
              <div className="border-t border-[#E8E0D8] pt-4 flex justify-between items-end">
                <div>
                  <p className="text-xs italic text-[#7C1D2E] whitespace-nowrap">¡Gracias por tu compra! Hecho con el amor de mamá.</p>
                  <p className="text-[10px] text-[#9C8A82] mt-1.5 whitespace-nowrap">Donde Doña Nina · Hechas con el amor de mamá · Sabor Dominicano</p>
                </div>
                <div className="text-right">
                  {settings?.signature_url ? (
                    <Image src={settings.signature_url} alt="Firma" width={96} height={96} className="h-24 w-auto ml-auto" unoptimized />
                  ) : (
                    <Image src="/firma-yrahisa-mateo.png" alt="Firma" width={96} height={96} className="h-24 w-auto ml-auto" />
                  )}
                  <p className="text-[9px] text-[#9C8A82] mt-0.5">FIRMA AUTORIZADA</p>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <button onClick={() => handlePrintPdf(selectedInvoice)} className="flex-1 min-w-[120px] h-12 border border-[#E8E0D8] text-[#3D2B1F] rounded-xl text-sm font-medium hover:bg-[#FDF8F3] transition-all flex items-center justify-center gap-2">
                <FileText size={18} /> PDF
              </button>
              <button onClick={() => handlePrintJpg(selectedInvoice)} className="flex-1 min-w-[120px] h-12 border border-[#E8E0D8] text-[#3D2B1F] rounded-xl text-sm font-medium hover:bg-[#FDF8F3] transition-all flex items-center justify-center gap-2">
                <Download size={18} /> JPG
              </button>
              {selectedInvoice.client?.email && (
                <button
                  onClick={() => setDraftModal({ type: "email" })}
                  className="flex-1 min-w-[120px] h-12 border border-[#E8E0D8] text-[#3D2B1F] rounded-xl text-sm font-medium hover:bg-[#FDF8F3] transition-all flex items-center justify-center gap-2"
                >
                  <Mail size={18} /> Email
                </button>
              )}
              {selectedInvoice.client?.phone && (
                <button
                  onClick={() => setDraftModal({ type: "whatsapp" })}
                  className="flex-1 min-w-[120px] h-12 border border-[#E8E0D8] text-[#3D2B1F] rounded-xl text-sm font-medium hover:bg-[#FDF8F3] transition-all flex items-center justify-center gap-2"
                >
                  <MessageCircle size={18} /> WhatsApp
                </button>
              )}
              {(selectedInvoice.status === "PENDING" || selectedInvoice.status === "PARTIAL") && (
                <button onClick={() => { setShowDetail(false); setSelectedInvoice(null); router.push(`/recibos?nuevo=true&invoice_id=${selectedInvoice.id}`); }} className="flex-1 min-w-[120px] h-12 bg-green-600 text-white rounded-xl text-sm font-medium hover:bg-green-700 transition-all flex items-center justify-center gap-2">
                  <DollarSign size={18} /> Registrar Pago
                </button>
              )}
            </div>
          </div>
        )}
      </Modal>

      {draftModal && selectedInvoice && (
        <CommunicationDraftModal
          isOpen={true}
          onClose={() => setDraftModal(null)}
          type={draftModal.type}
          client={{
            id: selectedInvoice.client_id,
            full_name: selectedInvoice.client?.full_name || "",
            email: selectedInvoice.client?.email,
            phone: selectedInvoice.client?.phone,
          }}
          documentType="invoice"
          documentNumber={selectedInvoice.invoice_number}
          documentId={selectedInvoice.id}
          total={formatCurrency(selectedInvoice.total)}
          businessName={settings?.business_name || "Doña Nina"}
          senderEmail={settings?.email || undefined}
          senderName={settings?.sender_name || undefined}
          emailTemplate={(settings as any)?.email_template || undefined}
          whatsappTemplate={(settings as any)?.whatsapp_template || undefined}
          getAttachment={async () => {
            const { canvas, invoice_number } = await captureInvoice(selectedInvoice);
            const jspdfModule = await import("jspdf");
            const pdf = new jspdfModule.default({ unit: "px", format: [canvas.width, canvas.height] });
            pdf.addImage(canvas.toDataURL("image/jpeg", 0.95), "JPEG", 0, 0, canvas.width, canvas.height);
            const base64 = pdf.output("datauristring").split(",")[1];
            const clientName = selectedInvoice?.client?.full_name?.replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s]/g, '').replace(/\s+/g, '-') || 'cliente';
            return { filename: `factura-${invoice_number}-${clientName}.pdf`, base64 };
          }}
        />
      )}

      <InvoiceForm
        isOpen={showModal}
        editingId={editingId}
        selectedClient={selectedClient}
        clients={clients}
        invoiceDate={invoiceDate}
        items={items}
        discountPercent={discountPercent}
        discountAmount={discountAmount}
        notes={notes}
        bankAccountId={bankAccountId}
        bankAccounts={bankAccounts}
        menuItems={menuItems}
        saving={saving}
        subtotal={subtotal}
        itbisTotal={itbisTotal}
        discountValue={discountValue}
        total={total}
        onClientChange={setSelectedClient}
        onInvoiceDateChange={setInvoiceDate}
        onDiscountPercentChange={setDiscountPercent}
        onDiscountAmountChange={setDiscountAmount}
        onNotesChange={setNotes}
        onBankAccountChange={setBankAccountId}
        onItemsChange={setItems}
        onSave={handleSave}
        onClose={() => { setShowModal(false); resetForm(); }}
        onNewClient={() => setShowNewClient(true)}
      />

      {/* Quick-create client modal */}
      <Modal isOpen={showNewClient} onClose={() => { setShowNewClient(false); setNewClientForm({ full_name: "", phone: "", email: "", address: "", notes: "", birthday: "", stage: "Prospecto", lead_source: "", interest: "", first_contact_date: getLocalDateString(), next_followup_date: "" }); }} title="Nuevo Cliente" subtitle="Registra un nuevo cliente" size="lg">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-[#3D2B1F] mb-1.5">Nombre completo *</label>
              <input type="text" value={newClientForm.full_name} onChange={(e) => setNewClientForm({ ...newClientForm, full_name: e.target.value })} placeholder="Nombre y apellidos" className="w-full h-12 px-4 rounded-xl border border-[#E8E0D8] bg-[#FDF8F3] text-[#3D2B1F] placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-[#7C1D2E]/30/30 focus:border-[#7C1D2E]/20 transition-all" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#3D2B1F] mb-1.5">Teléfono</label>
              <input type="text" value={newClientForm.phone} onChange={(e) => setNewClientForm({ ...newClientForm, phone: e.target.value })} placeholder="809-000-0000" className="w-full h-12 px-4 rounded-xl border border-[#E8E0D8] bg-[#FDF8F3] text-[#3D2B1F] placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-[#7C1D2E]/30/30 focus:border-[#7C1D2E]/20 transition-all" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#3D2B1F] mb-1.5">Correo electrónico</label>
              <input type="email" value={newClientForm.email} onChange={(e) => setNewClientForm({ ...newClientForm, email: e.target.value })} placeholder="correo@ejemplo.com" className="w-full h-12 px-4 rounded-xl border border-[#E8E0D8] bg-[#FDF8F3] text-[#3D2B1F] placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-[#7C1D2E]/30/30 focus:border-[#7C1D2E]/20 transition-all" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#3D2B1F] mb-1.5">Dirección</label>
              <input type="text" value={newClientForm.address} onChange={(e) => setNewClientForm({ ...newClientForm, address: e.target.value })} placeholder="Dirección" className="w-full h-12 px-4 rounded-xl border border-[#E8E0D8] bg-[#FDF8F3] text-[#3D2B1F] placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-[#7C1D2E]/30/30 focus:border-[#7C1D2E]/20 transition-all" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#3D2B1F] mb-1.5">Notas</label>
              <input type="text" value={newClientForm.notes} onChange={(e) => setNewClientForm({ ...newClientForm, notes: e.target.value })} placeholder="Notas" className="w-full h-12 px-4 rounded-xl border border-[#E8E0D8] bg-[#FDF8F3] text-[#3D2B1F] placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-[#7C1D2E]/30/30 focus:border-[#7C1D2E]/20 transition-all" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#3D2B1F] mb-1.5">Cumpleaños</label>
              <input type="date" value={newClientForm.birthday} onChange={(e) => setNewClientForm({ ...newClientForm, birthday: e.target.value })} className="w-full h-12 px-4 rounded-xl border border-[#E8E0D8] bg-[#FDF8F3] text-[#3D2B1F] text-sm focus:outline-none focus:ring-2 focus:ring-[#7C1D2E]/30/30 focus:border-[#7C1D2E]/20 transition-all" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#3D2B1F] mb-1.5">Etapa</label>
              <select value={newClientForm.stage} onChange={(e) => setNewClientForm({ ...newClientForm, stage: e.target.value })} className="w-full h-12 px-4 rounded-xl border border-[#E8E0D8] bg-[#FDF8F3] text-[#3D2B1F] text-sm focus:outline-none focus:ring-2 focus:ring-[#7C1D2E]/30/30 focus:border-[#7C1D2E]/20 transition-all">
                <option value="Prospecto">Prospecto</option>
                <option value="Calificacion">Calificación</option>
                <option value="Contacto Inicial">Contacto Inicial</option>
                <option value="Propuesta">Propuesta</option>
                <option value="Negociacion">Negociación</option>
                <option value="Cierre">Cierre</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#3D2B1F] mb-1.5">Fuente</label>
              <input type="text" value={newClientForm.lead_source} onChange={(e) => setNewClientForm({ ...newClientForm, lead_source: e.target.value })} placeholder="Ej: Referido, Redes, Whatsapp" className="w-full h-12 px-4 rounded-xl border border-[#E8E0D8] bg-[#FDF8F3] text-[#3D2B1F] placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-[#7C1D2E]/30/30 focus:border-[#7C1D2E]/20 transition-all" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#3D2B1F] mb-1.5">Interés</label>
              <input type="text" value={newClientForm.interest} onChange={(e) => setNewClientForm({ ...newClientForm, interest: e.target.value })} placeholder="Ej: Pasteles, Postres, Salados" className="w-full h-12 px-4 rounded-xl border border-[#E8E0D8] bg-[#FDF8F3] text-[#3D2B1F] placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-[#7C1D2E]/30/30 focus:border-[#7C1D2E]/20 transition-all" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#3D2B1F] mb-1.5">Fecha 1er Contacto</label>
              <input type="date" value={newClientForm.first_contact_date} onChange={(e) => setNewClientForm({ ...newClientForm, first_contact_date: e.target.value })} className="w-full h-12 px-4 rounded-xl border border-[#E8E0D8] bg-[#FDF8F3] text-[#3D2B1F] text-sm focus:outline-none focus:ring-2 focus:ring-[#7C1D2E]/30/30 focus:border-[#7C1D2E]/20 transition-all" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#3D2B1F] mb-1.5">Próximo Seguimiento</label>
              <input type="date" value={newClientForm.next_followup_date} onChange={(e) => setNewClientForm({ ...newClientForm, next_followup_date: e.target.value })} className="w-full h-12 px-4 rounded-xl border border-[#E8E0D8] bg-[#FDF8F3] text-[#3D2B1F] text-sm focus:outline-none focus:ring-2 focus:ring-[#7C1D2E]/30/30 focus:border-[#7C1D2E]/20 transition-all" />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={() => { setShowNewClient(false); setNewClientForm({ full_name: "", phone: "", email: "", address: "", notes: "", birthday: "", stage: "Prospecto", lead_source: "", interest: "", first_contact_date: getLocalDateString(), next_followup_date: "" }); }} className="flex-1 h-12 border border-[#E8E0D8] text-[#3D2B1F] rounded-xl text-sm font-medium hover:bg-[#FDF8F3] transition-all">Cancelar</button>
            <button onClick={handleSaveNewClient} disabled={saving} className="flex-1 h-12 bg-[#7C1D2E] text-white rounded-xl text-sm font-medium hover:bg-[#5C1420] transition-all shadow-sm disabled:opacity-50 flex items-center justify-center gap-2">
              <Save size={18} /> {saving ? "Guardando..." : "Agregar Cliente"}
            </button>
          </div>
        </div>
      </Modal>

      {/* Hidden preview for JPG capture */}
       <div ref={jpgRef} style={{ display: jpgData ? "block" : "none", position: "fixed", top: 0, left: 0, zIndex: 9999, background: "#ffffff", width: "800px" }}>
        {jpgData && (
          <div id="invoice-preview" className="bg-white p-8" style={{ fontFamily: "Inter, system-ui, sans-serif" }}>
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-start gap-2">
                  <LogoDonaNina size={56} className="mt-1" />
                  <div>
                  <h2 className="text-xl font-extrabold text-[#3D2B1F]" style={{ letterSpacing: '-0.02em' }}>Donde Doña Nina</h2>
                  <p className="text-xs tracking-widest text-[#7C1D2E] uppercase mt-0.5 font-semibold">Hechas con el amor de mamá</p>
                  <p className="text-[10px] text-[#9C8A82] mt-0.5 font-medium">Sabor Dominicano</p>
                </div>
              </div>
              <div className="text-right">
                <span className="inline-block bg-[#FDF8F3] text-[#7C1D2E] text-xs font-bold px-4 py-2 rounded-full">FACTURA DE VENTA</span>
                <p className="text-lg font-bold text-[#3D2B1F] mt-3">{jpgData.invoice_number}</p>
                <p className="text-xs text-[#9C8A82] mt-0.5">Fecha: {formatDate(jpgData.invoice_date)}</p>
              </div>
            </div>
            <div className="border-t border-[#E8E0D8] mb-5" />
            <div className="border border-[#E8E0D8] bg-[#FDF8F3] rounded-xl p-4 mb-5">
              <p className="text-xs font-bold text-[#7C1D2E] mb-3">CLIENTE / ADQUIRIENTE</p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
                <p className="text-[#3D2B1F]"><span className="text-[#9C8A82]">Nombre:</span> {jpgData.client?.full_name}</p>
                <p className="text-[#3D2B1F]"><span className="text-[#9C8A82]">Tel\u00e9fono:</span> {jpgData.client?.phone || "\u2014"}</p>
                <p className="text-[#3D2B1F]"><span className="text-[#9C8A82]">Email:</span> {jpgData.client?.email || "N/D"}</p>
              </div>
            </div>
            <table className="w-full text-sm mb-5">
              <thead>
                <tr className="bg-[#FDF8F3]">
                  <th className="py-2.5 px-3 text-left text-xs text-[#3D2B1F] font-bold">Categor\u00eda</th>
                  <th className="py-2.5 px-3 text-left text-xs text-[#3D2B1F] font-bold">Descripci\u00f3n / Producto</th>
                  <th className="py-2.5 px-3 text-right text-xs text-[#3D2B1F] font-bold">Cant.</th>
                  <th className="py-2.5 px-3 text-right text-xs text-[#3D2B1F] font-bold">Precio Unit.</th>
                  <th className="py-2.5 px-3 text-right text-xs text-[#3D2B1F] font-bold">Total</th>
                </tr>
              </thead>
              <tbody>
                  {(jpgData.items || []).map((item: any, i: number) => (
                    <tr key={i} className="border-b border-[#E8E0D8]">
                      <td className="py-2.5 px-3 text-xs text-[#9C8A82]">{item.menu_item?.category?.name || "\u2014"}</td>
                      <td className="py-2.5 px-3 text-sm text-[#3D2B1F]">{item.menu_item?.name || item.custom_name || "Producto"}</td>
                      <td className="py-2.5 px-3 text-right text-sm text-[#3D2B1F]">{item.quantity}</td>
                      <td className="py-2.5 px-3 text-right text-sm text-[#3D2B1F]">{formatCurrency(Number(item.unit_price))}</td>
                      <td className="py-2.5 px-3 text-right text-sm font-medium text-[#3D2B1F]">{formatCurrency(Number(item.line_total))}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
            {jpgData.bank_accounts && (
              <div className="border border-[#E8E0D8] bg-[#FDF8F3] rounded-xl p-4 mb-5">
                <p className="text-xs font-bold text-[#7C1D2E] mb-3">DATOS DE TRANSFERENCIA</p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
                  <p className="text-[#3D2B1F]"><span className="text-[#9C8A82]">Beneficiario:</span> {jpgData.bank_accounts.holder_name}</p>
                  {jpgData.bank_accounts.id_number && <p className="text-[#3D2B1F]"><span className="text-[#9C8A82]">C\u00e9dula/RNC:</span> {jpgData.bank_accounts.id_number}</p>}
                  <p className="text-[#3D2B1F]"><span className="text-[#9C8A82]">Banco:</span> {jpgData.bank_accounts.bank_name}</p>
                  <p className="text-[#3D2B1F]"><span className="text-[#9C8A82]">Tipo de Cuenta:</span> {jpgData.bank_accounts.account_type}</p>
                  <p className="text-[#3D2B1F]"><span className="text-[#9C8A82]">No. de Cuenta:</span> {jpgData.bank_accounts.account_number}</p>
                  {jpgData.bank_accounts.email && <p className="text-[#3D2B1F]"><span className="text-[#9C8A82]">Correo:</span> {jpgData.bank_accounts.email}</p>}
                </div>
              </div>
            )}
            <div className="border-t border-[#E8E0D8] pt-3 mb-5">
              <div className="flex justify-between text-sm text-[#9C8A82] mb-1">
                <span>Subtotal</span>
                <span>{formatCurrency(Number(jpgData.subtotal))}</span>
              </div>
              {Number(jpgData.itbis_total) > 0 && (
                <div className="flex justify-between text-sm text-[#9C8A82] mb-1">
                  <span>ITBIS (18%)</span>
                  <span>{formatCurrency(Number(jpgData.itbis_total))}</span>
                </div>
              )}
              {Number(jpgData.discount_amount) > 0 && (
                <div className="flex justify-between text-sm text-[#E07A3A] mb-1">
                  <span>Descuento</span>
                  <span>-{formatCurrency(Number(jpgData.discount_amount))}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-bold text-[#3D2B1F] pt-1 border-t border-[#E8E0D8] mb-1">
                <span>Total General</span>
                <span>{formatCurrency(Number(jpgData.total))}</span>
              </div>
              {Number(jpgData.amount_paid) > 0 && (
                <div className="flex justify-between text-sm text-green-600 mb-1">
                  <span>Monto Cobrado</span>
                  <span>{formatCurrency(Number(jpgData.amount_paid))}</span>
                </div>
              )}
              {(Number(jpgData.total) - Number(jpgData.amount_paid || 0)) > 0 && (
                <div className="flex justify-between text-sm font-bold text-[#7C1D2E]">
                  <span>Saldo Pendiente</span>
                  <span>{formatCurrency(Number(jpgData.total) - Number(jpgData.amount_paid || 0))}</span>
                </div>
              )}
            </div>
            <div className="border-t border-[#E8E0D8] pt-4 flex justify-between items-end">
              <div>
                <p className="text-xs italic text-[#7C1D2E] whitespace-nowrap">¡Gracias por tu compra! Hecho con el amor de mamá.</p>
                <p className="text-[10px] text-[#9C8A82] mt-1.5 whitespace-nowrap">Donde Doña Nina · Hechas con el amor de mamá · Sabor Dominicano</p>
              </div>
              <div className="text-right">
                {settings?.signature_url ? (
                  <Image src={settings.signature_url} alt="Firma" width={96} height={96} className="h-24 w-auto ml-auto" unoptimized />
                ) : (
                  <Image src="/firma-yrahisa-mateo.png" alt="Firma" width={96} height={96} className="h-24 w-auto ml-auto" />
                )}
                <p className="text-[9px] text-[#9C8A82] mt-0.5">FIRMA AUTORIZADA</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </PageContainer>
  );
}
