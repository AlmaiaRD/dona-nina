export interface UserProfile {
  id: string
  name: string
  email: string
  role: 'admin' | 'seller' | 'assistant'
  permissions?: string[]
  avatar_url?: string
  created_at: string
  updated_at: string
}

export const MODULES = [
  { key: '/dashboard', label: 'Dashboard' },
  { key: '/menu', label: 'Menú' },
  { key: '/clientes', label: 'Clientes' },
  { key: '/facturacion', label: 'Facturación' },
  { key: '/recibos', label: 'Recibos' },
  { key: '/entregas', label: 'Entregas' },
  { key: '/inventario', label: 'Inventario' },
  { key: '/gastos', label: 'Gastos' },
  { key: '/creditos', label: 'Créditos' },
  { key: '/cuentas-por-cobrar', label: 'CxC' },
  { key: '/crm', label: 'CRM' },
  { key: '/comunicaciones', label: 'Comunicaciones' },
  { key: '/reportes', label: 'Reportes' },
  { key: '/documentos', label: 'Documentos' },
  { key: '/aprendizaje', label: 'Aprendizaje' },
  { key: '/configuracion', label: 'Configuración' },
  { key: '/seguimiento', label: 'Seguimiento' },
] as const

export const MODULE_KEYS = MODULES.map(m => m.key)

export interface Client {
  id: string
  full_name: string
  phone?: string
  email?: string
  credit_balance: number
  address?: string
  notes?: string
  stage: string
  birthday?: string
  first_contact_date?: string
  lead_source?: string
  interest?: string
  next_followup_date?: string
  last_contact_date?: string
  created_at: string
  updated_at: string
}

export interface MenuCategory {
  id: string
  name: string
  description?: string
  sort_order: number
  active: boolean
  created_at: string
  updated_at: string
}

export interface MenuItem {
  id: string
  code: string
  name: string
  description?: string
  ingredients?: string
  category_id: string
  category?: MenuCategory
  image_url?: string
  price: number
  cost: number
  active: boolean
  available: boolean
  itbis_enabled: boolean
  itbis_rate: number
  created_at: string
  updated_at: string
}

export interface Inventory {
  id: string
  item_id?: string
  ingredient_name?: string
  stock: number
  minimum_stock: number
  unit: string
  average_cost: number
  created_at: string
  updated_at: string
}

export interface InventoryMovement {
  id: string
  item_id?: string
  ingredient_name?: string
  movement_type: 'PURCHASE' | 'SALE' | 'ADJUSTMENT' | 'RETURN'
  quantity: number
  reference_type?: string
  reference_id?: string
  notes?: string
  created_at: string
}

export interface Invoice {
  id: string
  invoice_number: string
  client_id: string
  client?: Client
  invoice_date: string
  status: 'PENDING' | 'PARTIAL' | 'PAID' | 'CANCELLED'
  subtotal: number
  discount_amount: number
  itbis_total: number
  total: number
  amount_paid: number
  balance_due: number
  pv_total: number
  notes?: string
  delivery_address?: string
  delivery_instructions?: string
  bank_account_id?: string
  bank_accounts?: BankAccount
  margin?: number
  created_by?: string
  updated_by?: string
  items?: InvoiceItem[]
  created_at: string
  updated_at: string
}

export interface InvoiceItem {
  id: string
  invoice_id: string
  menu_item_id?: string
  menu_item?: MenuItem
  custom_name?: string
  quantity: number
  unit_price: number
  unit_cost: number
  line_total: number
  pv: number
  itbis: boolean
  itbis_amount: number
  created_at: string
}

export interface Receipt {
  id: string
  receipt_number: string
  client_id: string
  client?: Client
  invoice_id: string
  invoice?: Invoice
  payment_method: 'CASH' | 'TRANSFER' | 'CARD'
  amount: number
  amount_in_words?: string
  concept?: string
  receipt_date: string
  bank_account_id?: string
  bank_accounts?: BankAccount
  created_by?: string
  updated_by?: string
  created_at: string
}

export interface CreditBalance {
  id: string
  client_id: string
  client?: Client
  receipt_id: string
  amount: number
  balance: number
  status: 'AVAILABLE' | 'USED' | 'EXPIRED'
  created_at: string
  updated_at: string
}

export interface Delivery {
  id: string
  invoice_id: string
  invoice?: Invoice
  client_id: string
  client?: Client
  delivery_address: string
  delivery_person?: string
  estimated_time?: string
  delivered_at?: string
  status: 'PENDING' | 'IN_PROGRESS' | 'DELIVERED' | 'CANCELLED'
  notes?: string
  created_at: string
  updated_at: string
}

export interface Followup {
  id: string
  client_id: string
  contact_date: string
  next_followup?: string
  comments?: string
  status: 'PENDING' | 'COMPLETED' | 'OVERDUE'
  created_at: string
}

export interface ExpenseCategory {
  id: string
  name: string
  parent_id?: string
  parent?: ExpenseCategory
  children?: ExpenseCategory[]
  sort_order: number
  created_at: string
  updated_at: string
}

export interface Expense {
  id: string
  expense_date: string
  category: string
  concept: string
  amount: number
  payment_method: string
  beneficiary?: string
  receipt_number?: string
  notes?: string
  created_at: string
}

export interface Setting {
  id: string
  business_name?: string
  logo_url?: string
  signature_url?: string
  default_margin?: number
  invoice_prefix: string
  receipt_prefix: string
  phone?: string
  email?: string
  address?: string
  sender_name?: string
  email_template?: string
  whatsapp_template?: string
  ai_client_prompt?: string
  ai_learning_prompt?: string
  created_at: string
  updated_at: string
}

export interface AuditLog {
  id: string
  user_id: string
  action: string
  entity: string
  entity_id?: string
  description?: string
  created_at: string
}

export interface BankAccount {
  id: string
  bank_name: string
  account_type: string
  account_number: string
  holder_name: string
  id_number: string
  email: string
  is_default: boolean
  created_at: string
}

export interface Supplier {
  id: string
  name: string
  phone?: string
  email?: string
  address?: string
  notes?: string
  created_at: string
  updated_at: string
}

export interface Purchase {
  id: string
  purchase_number: string
  supplier_id?: string
  supplier_name?: string
  purchase_date: string
  subtotal: number
  itbis: number
  discount_amount: number
  total: number
  notes?: string
  payment_method?: string
  bank_account_id?: string
  status: 'DRAFT' | 'COMPLETED' | 'CANCELLED'
  created_by?: string
  created_at: string
  updated_at: string
}

export interface PurchaseItem {
  id: string
  purchase_id: string
  menu_item_id?: string
  ingredient_name?: string
  quantity: number
  unit_cost: number
  line_total: number
  itbis: boolean
  created_at: string
}

export interface Communication {
  id: string
  client_id: string
  type: 'email' | 'whatsapp'
  direction: 'outgoing' | 'incoming'
  subject?: string
  body?: string
  document_type?: 'invoice' | 'receipt'
  document_id?: string
  status: 'draft' | 'sent' | 'failed'
  sent_at?: string
  created_at: string
}
