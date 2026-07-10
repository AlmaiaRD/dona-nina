-- ============================================================================
-- DONDE DOÑA NINA — Supabase PostgreSQL Schema (idempotent)
-- Aplica en cualquier orden, cualquier número de veces.
-- ============================================================================

-- 0. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. SEQUENCES
CREATE SEQUENCE IF NOT EXISTS invoice_number_seq START 1;
CREATE SEQUENCE IF NOT EXISTS receipt_number_seq START 1;

-- ============================================================================
-- 2. TABLES (all CREATE IF NOT EXISTS)
-- ============================================================================

-- 2.1 users
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL DEFAULT 'seller' CHECK (role IN ('admin', 'seller', 'assistant')),
  password_hash TEXT,
  avatar_url TEXT,
  permissions JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2.2 clients
CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  credit_balance DECIMAL(10,2) NOT NULL DEFAULT 0,
  address TEXT,
  notes TEXT,
  stage TEXT NOT NULL DEFAULT 'Contacto Inicial'
    CHECK (stage IN ('Prospecto', 'Calificacion', 'Contacto Inicial', 'Propuesta', 'Negociacion', 'Cierre')),
  birthday DATE,
  first_contact_date DATE DEFAULT CURRENT_DATE,
  lead_source TEXT,
  interest TEXT,
  next_followup_date DATE,
  last_contact_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2.3 menu_categories
CREATE TABLE IF NOT EXISTS menu_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2.4 menu_items
CREATE TABLE IF NOT EXISTS menu_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  ingredients TEXT,
  category_id UUID NOT NULL REFERENCES menu_categories(id) ON DELETE RESTRICT,
  image_url TEXT,
  price DECIMAL(10,2) NOT NULL,
  cost DECIMAL(10,2) NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  available BOOLEAN NOT NULL DEFAULT TRUE,
  pv DECIMAL(10,2) NOT NULL DEFAULT 0,
  itbis_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  itbis_rate DECIMAL(5,2) NOT NULL DEFAULT 18.00,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2.5 inventory
CREATE TABLE IF NOT EXISTS inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID REFERENCES menu_items(id) ON DELETE SET NULL,
  ingredient_name TEXT NOT NULL,
  stock DECIMAL(10,2) NOT NULL DEFAULT 0,
  minimum_stock DECIMAL(10,2) NOT NULL DEFAULT 0,
  unit TEXT NOT NULL DEFAULT 'unidad',
  average_cost DECIMAL(10,2) NOT NULL DEFAULT 0,
  inventory_value DECIMAL(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2.6 inventory_movements
CREATE TABLE IF NOT EXISTS inventory_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID REFERENCES menu_items(id) ON DELETE SET NULL,
  ingredient_name TEXT NOT NULL,
  movement_type TEXT NOT NULL CHECK (movement_type IN ('PURCHASE', 'SALE', 'ADJUSTMENT', 'RETURN')),
  quantity DECIMAL(10,2) NOT NULL,
  reference_type TEXT,
  reference_id TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2.7 invoices
CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number TEXT NOT NULL UNIQUE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
  invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL DEFAULT 'PENDING'
    CHECK (status IN ('PENDING', 'PARTIAL', 'PAID', 'CANCELLED')),
  subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
  discount_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  itbis_total DECIMAL(10,2) NOT NULL DEFAULT 0,
  pv_total DECIMAL(10,2) NOT NULL DEFAULT 0,
  total DECIMAL(10,2) NOT NULL DEFAULT 0,
  amount_paid DECIMAL(10,2) NOT NULL DEFAULT 0,
  balance_due DECIMAL(10,2) NOT NULL DEFAULT 0,
  margin DECIMAL(5,2) NOT NULL DEFAULT 0,
  notes TEXT,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
  delivery_address TEXT,
  delivery_instructions TEXT,
  bank_account_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2.8 invoice_items
CREATE TABLE IF NOT EXISTS invoice_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  menu_item_id UUID REFERENCES menu_items(id) ON DELETE SET NULL,
  custom_name TEXT,
  quantity INT NOT NULL DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  unit_cost DECIMAL(10,2) NOT NULL DEFAULT 0,
  line_total DECIMAL(10,2) NOT NULL,
  pv DECIMAL(10,2) NOT NULL DEFAULT 0,
  itbis BOOLEAN NOT NULL DEFAULT FALSE,
  itbis_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2.9 receipts
CREATE TABLE IF NOT EXISTS receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  receipt_number TEXT NOT NULL UNIQUE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
  invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('CASH', 'TRANSFER', 'CARD')),
  amount DECIMAL(10,2) NOT NULL,
  amount_in_words TEXT,
  concept TEXT,
  receipt_date DATE NOT NULL DEFAULT CURRENT_DATE,
  bank_account_id UUID,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2.10 credit_balances
CREATE TABLE IF NOT EXISTS credit_balances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  receipt_id UUID REFERENCES receipts(id) ON DELETE SET NULL,
  amount DECIMAL(10,2) NOT NULL,
  balance DECIMAL(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'AVAILABLE' CHECK (status IN ('AVAILABLE', 'USED', 'EXPIRED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2.11 deliveries
CREATE TABLE IF NOT EXISTS deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL UNIQUE REFERENCES invoices(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  delivery_address TEXT NOT NULL,
  delivery_person TEXT,
  estimated_time TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'PENDING'
    CHECK (status IN ('PENDING', 'IN_PROGRESS', 'DELIVERED', 'CANCELLED')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2.12 followups
CREATE TABLE IF NOT EXISTS followups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  contact_date DATE NOT NULL DEFAULT CURRENT_DATE,
  next_followup DATE,
  comments TEXT,
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'COMPLETED', 'OVERDUE')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2.13 expenses
CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
  category TEXT NOT NULL,
  concept TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  payment_method TEXT NOT NULL DEFAULT 'CASH' CHECK (payment_method IN ('CASH', 'TRANSFER', 'CARD')),
  beneficiary TEXT,
  receipt_number TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2.14 learning_notes
CREATE TABLE IF NOT EXISTS learning_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2.15 settings
CREATE TABLE IF NOT EXISTS settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_name TEXT NOT NULL DEFAULT 'Donde Doña Nina',
  logo_url TEXT,
  signature_url TEXT,
  default_margin DECIMAL(5,2) NOT NULL DEFAULT 30.00,
  invoice_prefix TEXT NOT NULL DEFAULT 'DDN-FAC-',
  receipt_prefix TEXT NOT NULL DEFAULT 'DDN-REC-',
  purchase_prefix TEXT NOT NULL DEFAULT 'COM-',
  phone TEXT,
  email TEXT,
  address TEXT,
  sender_name TEXT,
  email_template TEXT,
  whatsapp_template TEXT,
  ai_client_prompt TEXT,
  ai_learning_prompt TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2.16 audit_logs
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity TEXT NOT NULL,
  entity_id TEXT,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2.17 communications
CREATE TABLE IF NOT EXISTS communications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('email', 'whatsapp')),
  direction TEXT NOT NULL DEFAULT 'outgoing' CHECK (direction IN ('outgoing', 'incoming')),
  subject TEXT,
  body TEXT,
  document_type TEXT CHECK (document_type IN ('invoice', 'receipt')),
  document_id TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'failed')),
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2.18 expense_categories
CREATE TABLE IF NOT EXISTS expense_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  parent_id UUID REFERENCES expense_categories(id) ON DELETE CASCADE,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2.19 bank_accounts
CREATE TABLE IF NOT EXISTS bank_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bank_name TEXT NOT NULL,
  account_type TEXT NOT NULL DEFAULT 'Ahorros' CHECK (account_type IN ('Ahorros', 'Corriente')),
  account_number TEXT NOT NULL,
  holder_name TEXT NOT NULL,
  id_number TEXT,
  email TEXT,
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2.20 suppliers
CREATE TABLE IF NOT EXISTS suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  address TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2.21 purchases
CREATE TABLE IF NOT EXISTS purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_number TEXT NOT NULL UNIQUE,
  supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
  supplier_name TEXT,
  purchase_date DATE NOT NULL DEFAULT CURRENT_DATE,
  subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
  itbis DECIMAL(10,2) NOT NULL DEFAULT 0,
  discount_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  total DECIMAL(10,2) NOT NULL DEFAULT 0,
  notes TEXT,
  payment_method TEXT DEFAULT 'CASH' CHECK (payment_method IN ('CASH', 'TRANSFER', 'CARD')),
  bank_account_id UUID,
  status TEXT NOT NULL DEFAULT 'COMPLETED' CHECK (status IN ('DRAFT', 'COMPLETED', 'CANCELLED')),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2.22 purchase_items
CREATE TABLE IF NOT EXISTS purchase_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_id UUID NOT NULL REFERENCES purchases(id) ON DELETE CASCADE,
  menu_item_id UUID REFERENCES menu_items(id) ON DELETE SET NULL,
  ingredient_name TEXT,
  quantity DECIMAL(10,2) NOT NULL DEFAULT 1,
  unit_cost DECIMAL(10,2) NOT NULL DEFAULT 0,
  line_total DECIMAL(10,2) NOT NULL DEFAULT 0,
  itbis BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 3. RLS ENABLE (must be done before policies)
-- ============================================================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE followups ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE communications ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_items ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 4. RLS POLICIES — full access via API routes (service_role key bypasses RLS)
-- ============================================================================
DROP POLICY IF EXISTS "users_all" ON users; CREATE POLICY "users_all" ON users FOR ALL USING (true);
DROP POLICY IF EXISTS "clients_all" ON clients; CREATE POLICY "clients_all" ON clients FOR ALL USING (true);
DROP POLICY IF EXISTS "menu_categories_all" ON menu_categories; CREATE POLICY "menu_categories_all" ON menu_categories FOR ALL USING (true);
DROP POLICY IF EXISTS "menu_items_all" ON menu_items; CREATE POLICY "menu_items_all" ON menu_items FOR ALL USING (true);
DROP POLICY IF EXISTS "inventory_all" ON inventory; CREATE POLICY "inventory_all" ON inventory FOR ALL USING (true);
DROP POLICY IF EXISTS "inventory_movements_all" ON inventory_movements; CREATE POLICY "inventory_movements_all" ON inventory_movements FOR ALL USING (true);
DROP POLICY IF EXISTS "invoices_all" ON invoices; CREATE POLICY "invoices_all" ON invoices FOR ALL USING (true);
DROP POLICY IF EXISTS "invoice_items_all" ON invoice_items; CREATE POLICY "invoice_items_all" ON invoice_items FOR ALL USING (true);
DROP POLICY IF EXISTS "receipts_all" ON receipts; CREATE POLICY "receipts_all" ON receipts FOR ALL USING (true);
DROP POLICY IF EXISTS "credit_balances_all" ON credit_balances; CREATE POLICY "credit_balances_all" ON credit_balances FOR ALL USING (true);
DROP POLICY IF EXISTS "deliveries_all" ON deliveries; CREATE POLICY "deliveries_all" ON deliveries FOR ALL USING (true);
DROP POLICY IF EXISTS "followups_all" ON followups; CREATE POLICY "followups_all" ON followups FOR ALL USING (true);
DROP POLICY IF EXISTS "expenses_all" ON expenses; CREATE POLICY "expenses_all" ON expenses FOR ALL USING (true);
DROP POLICY IF EXISTS "learning_notes_all" ON learning_notes; CREATE POLICY "learning_notes_all" ON learning_notes FOR ALL USING (true);
DROP POLICY IF EXISTS "settings_all" ON settings; CREATE POLICY "settings_all" ON settings FOR ALL USING (true);
DROP POLICY IF EXISTS "audit_logs_all" ON audit_logs; CREATE POLICY "audit_logs_all" ON audit_logs FOR ALL USING (true);
DROP POLICY IF EXISTS "communications_all" ON communications; CREATE POLICY "communications_all" ON communications FOR ALL USING (true);
DROP POLICY IF EXISTS "expense_categories_all" ON expense_categories; CREATE POLICY "expense_categories_all" ON expense_categories FOR ALL USING (true);
DROP POLICY IF EXISTS "bank_accounts_all" ON bank_accounts; CREATE POLICY "bank_accounts_all" ON bank_accounts FOR ALL USING (true);
DROP POLICY IF EXISTS "suppliers_all" ON suppliers; CREATE POLICY "suppliers_all" ON suppliers FOR ALL USING (true);
DROP POLICY IF EXISTS "purchases_all" ON purchases; CREATE POLICY "purchases_all" ON purchases FOR ALL USING (true);
DROP POLICY IF EXISTS "purchase_items_all" ON purchase_items; CREATE POLICY "purchase_items_all" ON purchase_items FOR ALL USING (true);

-- ============================================================================
-- 5. FUNCTIONS
-- ============================================================================
CREATE OR REPLACE FUNCTION fn_set_updated_at()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION fn_generate_invoice_number()
RETURNS TEXT AS $$
DECLARE v_prefix TEXT; v_seq BIGINT;
BEGIN
  SELECT invoice_prefix INTO v_prefix FROM settings LIMIT 1;
  IF v_prefix IS NULL THEN v_prefix := 'DDN-FAC-'; END IF;
  v_seq := nextval('invoice_number_seq');
  RETURN v_prefix || LPAD(v_seq::TEXT, 6, '0');
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION fn_generate_receipt_number()
RETURNS TEXT AS $$
DECLARE v_prefix TEXT; v_seq BIGINT;
BEGIN
  SELECT receipt_prefix INTO v_prefix FROM settings LIMIT 1;
  IF v_prefix IS NULL THEN v_prefix := 'DDN-REC-'; END IF;
  v_seq := nextval('receipt_number_seq');
  RETURN v_prefix || LPAD(v_seq::TEXT, 6, '0');
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION fn_refresh_invoice_balance(p_invoice_id UUID)
RETURNS VOID AS $$
DECLARE v_paid DECIMAL(10,2); v_total DECIMAL(10,2);
BEGIN
  SELECT COALESCE(SUM(amount), 0) INTO v_paid FROM receipts WHERE invoice_id = p_invoice_id;
  SELECT total INTO v_total FROM invoices WHERE id = p_invoice_id;
  UPDATE invoices SET amount_paid = v_paid, balance_due = v_total - v_paid,
    status = CASE WHEN v_paid <= 0 THEN 'PENDING' WHEN v_paid < v_total THEN 'PARTIAL' ELSE 'PAID' END,
    updated_at = NOW() WHERE id = p_invoice_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION fn_set_invoice_number()
RETURNS TRIGGER AS $$ BEGIN IF NEW.invoice_number IS NULL THEN NEW.invoice_number := fn_generate_invoice_number(); END IF; RETURN NEW; END; $$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION fn_set_receipt_number()
RETURNS TRIGGER AS $$ BEGIN IF NEW.receipt_number IS NULL THEN NEW.receipt_number := fn_generate_receipt_number(); END IF; RETURN NEW; END; $$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION fn_calc_line_total()
RETURNS TRIGGER AS $$ BEGIN NEW.line_total := NEW.quantity * NEW.unit_price; RETURN NEW; END; $$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION fn_receipt_after_change()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN PERFORM fn_refresh_invoice_balance(NEW.invoice_id);
  ELSIF TG_OP = 'DELETE' THEN PERFORM fn_refresh_invoice_balance(OLD.invoice_id);
  ELSIF TG_OP = 'UPDATE' THEN PERFORM fn_refresh_invoice_balance(NEW.invoice_id); END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION increment_inventory(p_item_id UUID, p_quantity INT)
RETURNS VOID AS $$
BEGIN
  UPDATE inventory SET stock = stock + p_quantity, updated_at = NOW() WHERE item_id = p_item_id;
  INSERT INTO inventory_movements (item_id, ingredient_name, movement_type, quantity, reference_type, notes)
  SELECT p_item_id, ingredient_name, 'RETURN', p_quantity, 'invoice_cancellation', 'Devolución por cancelación de factura'
  FROM inventory WHERE item_id = p_item_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION decrement_inventory(p_item_id UUID, p_quantity INT)
RETURNS VOID AS $$
BEGIN
  UPDATE inventory SET stock = GREATEST(0, stock - p_quantity), updated_at = NOW() WHERE item_id = p_item_id;
  INSERT INTO inventory_movements (item_id, ingredient_name, movement_type, quantity, reference_type, notes)
  SELECT p_item_id, ingredient_name, 'SALE', p_quantity, 'invoice', 'Venta registrada en factura'
  FROM inventory WHERE item_id = p_item_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION use_credit_balance(p_credit_id UUID, p_amount DECIMAL)
RETURNS JSONB AS $$
DECLARE
  v_current_balance DECIMAL; v_new_balance DECIMAL; v_client_id UUID;
BEGIN
  SELECT balance, client_id INTO v_current_balance, v_client_id
  FROM credit_balances WHERE id = p_credit_id AND status = 'AVAILABLE' FOR UPDATE;
  IF v_current_balance IS NULL THEN RAISE EXCEPTION 'Crédito no encontrado o no disponible'; END IF;
  IF p_amount > v_current_balance THEN RAISE EXCEPTION 'El monto excede el balance disponible'; END IF;
  v_new_balance := v_current_balance - p_amount;
  UPDATE credit_balances SET balance = v_new_balance,
    status = CASE WHEN v_new_balance <= 0 THEN 'USED' ELSE 'AVAILABLE' END, updated_at = NOW()
  WHERE id = p_credit_id;
  UPDATE clients SET credit_balance = credit_balance - p_amount, updated_at = NOW() WHERE id = v_client_id;
  RETURN jsonb_build_object('success', TRUE, 'new_balance', v_new_balance, 'client_id', v_client_id);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION add_inventory_stock(p_item_id UUID, p_quantity DECIMAL, p_unit_cost DECIMAL, p_line_total DECIMAL)
RETURNS VOID AS $$
DECLARE v_stock DECIMAL; v_cost DECIMAL; v_value DECIMAL;
BEGIN
  SELECT stock, average_cost, inventory_value INTO v_stock, v_cost, v_value FROM inventory WHERE item_id = p_item_id;
  IF NOT FOUND THEN
    INSERT INTO inventory (item_id, ingredient_name, stock, unit, average_cost, inventory_value)
    SELECT p_item_id, name, p_quantity, 'unidad', p_unit_cost, p_line_total FROM menu_items WHERE id = p_item_id;
  ELSE
    v_stock := COALESCE(v_stock, 0) + p_quantity;
    v_value := COALESCE(v_value, 0) + p_line_total;
    UPDATE inventory SET stock = v_stock, average_cost = CASE WHEN v_stock > 0 THEN v_value / v_stock ELSE 0 END,
      inventory_value = v_value, updated_at = NOW() WHERE item_id = p_item_id;
  END IF;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION subtract_inventory_stock(p_item_id UUID, p_quantity DECIMAL, p_unit_cost DECIMAL, p_line_total DECIMAL)
RETURNS VOID AS $$
DECLARE v_stock DECIMAL; v_value DECIMAL;
BEGIN
  SELECT stock, inventory_value INTO v_stock, v_value FROM inventory WHERE item_id = p_item_id;
  IF FOUND THEN
    v_stock := GREATEST(COALESCE(v_stock, 0) - p_quantity, 0);
    v_value := GREATEST(COALESCE(v_value, 0) - p_line_total, 0);
    UPDATE inventory SET stock = v_stock, inventory_value = v_value,
      average_cost = CASE WHEN v_stock > 0 THEN v_value / v_stock ELSE 0 END, updated_at = NOW()
    WHERE item_id = p_item_id;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 6. TRIGGERS
-- ============================================================================
DROP TRIGGER IF EXISTS trg_users_updated_at ON users; CREATE TRIGGER trg_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();
DROP TRIGGER IF EXISTS trg_clients_updated_at ON clients; CREATE TRIGGER trg_clients_updated_at BEFORE UPDATE ON clients FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();
DROP TRIGGER IF EXISTS trg_menu_categories_updated_at ON menu_categories; CREATE TRIGGER trg_menu_categories_updated_at BEFORE UPDATE ON menu_categories FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();
DROP TRIGGER IF EXISTS trg_menu_items_updated_at ON menu_items; CREATE TRIGGER trg_menu_items_updated_at BEFORE UPDATE ON menu_items FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();
DROP TRIGGER IF EXISTS trg_inventory_updated_at ON inventory; CREATE TRIGGER trg_inventory_updated_at BEFORE UPDATE ON inventory FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();
DROP TRIGGER IF EXISTS trg_inventory_movements_updated_at ON inventory_movements; CREATE TRIGGER trg_inventory_movements_updated_at BEFORE UPDATE ON inventory_movements FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();
DROP TRIGGER IF EXISTS trg_invoices_updated_at ON invoices; CREATE TRIGGER trg_invoices_updated_at BEFORE UPDATE ON invoices FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();
DROP TRIGGER IF EXISTS trg_invoice_items_updated_at ON invoice_items; CREATE TRIGGER trg_invoice_items_updated_at BEFORE UPDATE ON invoice_items FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();
DROP TRIGGER IF EXISTS trg_receipts_updated_at ON receipts; CREATE TRIGGER trg_receipts_updated_at BEFORE UPDATE ON receipts FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();
DROP TRIGGER IF EXISTS trg_credit_balances_updated_at ON credit_balances; CREATE TRIGGER trg_credit_balances_updated_at BEFORE UPDATE ON credit_balances FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();
DROP TRIGGER IF EXISTS trg_deliveries_updated_at ON deliveries; CREATE TRIGGER trg_deliveries_updated_at BEFORE UPDATE ON deliveries FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();
DROP TRIGGER IF EXISTS trg_followups_updated_at ON followups; CREATE TRIGGER trg_followups_updated_at BEFORE UPDATE ON followups FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();
DROP TRIGGER IF EXISTS trg_expenses_updated_at ON expenses; CREATE TRIGGER trg_expenses_updated_at BEFORE UPDATE ON expenses FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();
DROP TRIGGER IF EXISTS trg_learning_notes_updated_at ON learning_notes; CREATE TRIGGER trg_learning_notes_updated_at BEFORE UPDATE ON learning_notes FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();
DROP TRIGGER IF EXISTS trg_settings_updated_at ON settings; CREATE TRIGGER trg_settings_updated_at BEFORE UPDATE ON settings FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();
DROP TRIGGER IF EXISTS trg_audit_logs_updated_at ON audit_logs; CREATE TRIGGER trg_audit_logs_updated_at BEFORE UPDATE ON audit_logs FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();
DROP TRIGGER IF EXISTS trg_communications_updated_at ON communications; CREATE TRIGGER trg_communications_updated_at BEFORE UPDATE ON communications FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();
DROP TRIGGER IF EXISTS trg_expense_categories_updated_at ON expense_categories; CREATE TRIGGER trg_expense_categories_updated_at BEFORE UPDATE ON expense_categories FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();
DROP TRIGGER IF EXISTS trg_bank_accounts_updated_at ON bank_accounts; CREATE TRIGGER trg_bank_accounts_updated_at BEFORE UPDATE ON bank_accounts FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();
DROP TRIGGER IF EXISTS trg_suppliers_updated_at ON suppliers; CREATE TRIGGER trg_suppliers_updated_at BEFORE UPDATE ON suppliers FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();
DROP TRIGGER IF EXISTS trg_purchases_updated_at ON purchases; CREATE TRIGGER trg_purchases_updated_at BEFORE UPDATE ON purchases FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

DROP TRIGGER IF EXISTS trg_set_invoice_number ON invoices; CREATE TRIGGER trg_set_invoice_number BEFORE INSERT ON invoices FOR EACH ROW EXECUTE FUNCTION fn_set_invoice_number();
DROP TRIGGER IF EXISTS trg_set_receipt_number ON receipts; CREATE TRIGGER trg_set_receipt_number BEFORE INSERT ON receipts FOR EACH ROW EXECUTE FUNCTION fn_set_receipt_number();
DROP TRIGGER IF EXISTS trg_calc_line_total ON invoice_items; CREATE TRIGGER trg_calc_line_total BEFORE INSERT OR UPDATE ON invoice_items FOR EACH ROW EXECUTE FUNCTION fn_calc_line_total();
DROP TRIGGER IF EXISTS trg_receipt_after_insert ON receipts; CREATE TRIGGER trg_receipt_after_insert AFTER INSERT ON receipts FOR EACH ROW EXECUTE FUNCTION fn_receipt_after_change();
DROP TRIGGER IF EXISTS trg_receipt_after_update ON receipts; CREATE TRIGGER trg_receipt_after_update AFTER UPDATE ON receipts FOR EACH ROW EXECUTE FUNCTION fn_receipt_after_change();
DROP TRIGGER IF EXISTS trg_receipt_after_delete ON receipts; CREATE TRIGGER trg_receipt_after_delete AFTER DELETE ON receipts FOR EACH ROW EXECUTE FUNCTION fn_receipt_after_change();

-- ============================================================================
-- 7. VIEWS
-- ============================================================================
CREATE OR REPLACE VIEW vw_sales_summary AS
SELECT DATE(i.invoice_date) AS sale_date, COUNT(i.id) AS total_invoices, SUM(i.total) AS total_sales,
  SUM(i.discount_amount) AS total_discounts, SUM(i.amount_paid) AS total_collected,
  SUM(i.balance_due) AS total_pending, SUM(ii.quantity * ii.unit_cost) AS total_cost,
  SUM(ii.line_total - (ii.quantity * ii.unit_cost)) AS total_gross_margin
FROM invoices i LEFT JOIN invoice_items ii ON ii.invoice_id = i.id
WHERE i.status != 'CANCELLED' GROUP BY DATE(i.invoice_date) ORDER BY DATE(i.invoice_date) DESC;

CREATE OR REPLACE VIEW vw_accounts_receivable AS
SELECT c.id AS client_id, c.full_name AS client_name, c.phone AS client_phone,
  i.id AS invoice_id, i.invoice_number, i.invoice_date, i.total, i.amount_paid, i.balance_due, i.status,
  i.delivery_address, AGE(CURRENT_DATE, i.invoice_date) AS days_overdue
FROM invoices i JOIN clients c ON c.id = i.client_id
WHERE i.status IN ('PENDING', 'PARTIAL') ORDER BY i.invoice_date ASC;

CREATE OR REPLACE VIEW vw_top_menu_items AS
SELECT mi.id AS menu_item_id, mi.code, mi.name, mc.name AS category_name,
  COUNT(ii.id) AS times_ordered, SUM(ii.quantity) AS total_quantity, SUM(ii.line_total) AS total_revenue,
  SUM(ii.quantity * ii.unit_cost) AS total_cost,
  SUM(ii.line_total - (ii.quantity * ii.unit_cost)) AS total_margin,
  ROUND((SUM(ii.line_total - (ii.quantity * ii.unit_cost)) / NULLIF(SUM(ii.line_total), 0)) * 100, 2) AS margin_percentage
FROM menu_items mi LEFT JOIN menu_categories mc ON mc.id = mi.category_id
LEFT JOIN invoice_items ii ON ii.menu_item_id = mi.id
LEFT JOIN invoices i ON i.id = ii.invoice_id AND i.status != 'CANCELLED'
GROUP BY mi.id, mi.code, mi.name, mc.name ORDER BY SUM(ii.quantity) DESC NULLS LAST;

CREATE OR REPLACE VIEW vw_pending_deliveries AS
SELECT d.id AS delivery_id, d.status AS delivery_status, d.delivery_address, d.delivery_person,
  d.estimated_time, d.created_at AS ordered_at, c.full_name AS client_name, c.phone AS client_phone,
  i.invoice_number, i.total AS invoice_total, i.status AS invoice_status,
  CASE WHEN d.estimated_time IS NOT NULL AND d.estimated_time < NOW() THEN 'OVERDUE' ELSE 'ON_TIME' END AS time_status
FROM deliveries d JOIN clients c ON c.id = d.client_id JOIN invoices i ON i.id = d.invoice_id
WHERE d.status IN ('PENDING', 'IN_PROGRESS') ORDER BY d.estimated_time ASC NULLS LAST, d.created_at ASC;

-- ============================================================================
-- 8. INDEXES
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_invoices_client_id ON invoices(client_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_created_at ON invoices(created_at);
CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice_id ON invoice_items(invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoice_items_menu_item_id ON invoice_items(menu_item_id);
CREATE INDEX IF NOT EXISTS idx_receipts_client_id ON receipts(client_id);
CREATE INDEX IF NOT EXISTS idx_receipts_invoice_id ON receipts(invoice_id);
CREATE INDEX IF NOT EXISTS idx_clients_email ON clients(email);
CREATE INDEX IF NOT EXISTS idx_inventory_item_id ON inventory(item_id);
CREATE INDEX IF NOT EXISTS idx_deliveries_status ON deliveries(status);
CREATE INDEX IF NOT EXISTS idx_deliveries_client_id ON deliveries(client_id);
CREATE INDEX IF NOT EXISTS idx_credit_balances_client_id ON credit_balances(client_id);
CREATE INDEX IF NOT EXISTS idx_followups_client_id ON followups(client_id);
CREATE INDEX IF NOT EXISTS idx_purchases_supplier_id ON purchases(supplier_id);
CREATE INDEX IF NOT EXISTS idx_purchases_created_at ON purchases(created_at);
CREATE INDEX IF NOT EXISTS idx_purchase_items_purchase_id ON purchase_items(purchase_id);
CREATE INDEX IF NOT EXISTS idx_expenses_created_at ON expenses(created_at);
CREATE INDEX IF NOT EXISTS idx_communications_client_id ON communications(client_id);

-- ============================================================================
-- 9. ADD MISSING COLUMNS (idempotent — IF NOT EXISTS)
-- ============================================================================
-- These columns were added after the initial table creation.
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS itbis_total DECIMAL(10,2) NOT NULL DEFAULT 0;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS pv_total DECIMAL(10,2) NOT NULL DEFAULT 0;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS margin DECIMAL(5,2) NOT NULL DEFAULT 0;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS bank_account_id UUID;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS updated_by UUID;

ALTER TABLE invoice_items ADD COLUMN IF NOT EXISTS pv DECIMAL(10,2) NOT NULL DEFAULT 0;
ALTER TABLE invoice_items ADD COLUMN IF NOT EXISTS itbis BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE invoice_items ADD COLUMN IF NOT EXISTS itbis_amount DECIMAL(10,2) NOT NULL DEFAULT 0;

ALTER TABLE receipts ADD COLUMN IF NOT EXISTS bank_account_id UUID;
ALTER TABLE receipts ADD COLUMN IF NOT EXISTS created_by UUID;
ALTER TABLE receipts ADD COLUMN IF NOT EXISTS updated_by UUID;

ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS pv DECIMAL(10,2) NOT NULL DEFAULT 0;
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS itbis_enabled BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS itbis_rate DECIMAL(5,2) NOT NULL DEFAULT 18.00;

ALTER TABLE settings ADD COLUMN IF NOT EXISTS purchase_prefix TEXT NOT NULL DEFAULT 'COM-';
ALTER TABLE settings ADD COLUMN IF NOT EXISTS sender_name TEXT;
ALTER TABLE settings ADD COLUMN IF NOT EXISTS email_template TEXT;
ALTER TABLE settings ADD COLUMN IF NOT EXISTS whatsapp_template TEXT;
ALTER TABLE settings ADD COLUMN IF NOT EXISTS ai_client_prompt TEXT;
ALTER TABLE settings ADD COLUMN IF NOT EXISTS ai_learning_prompt TEXT;

ALTER TABLE communications ADD COLUMN IF NOT EXISTS document_type TEXT CHECK (document_type IN ('invoice', 'receipt'));
ALTER TABLE communications ADD COLUMN IF NOT EXISTS document_id TEXT;
ALTER TABLE communications ADD COLUMN IF NOT EXISTS sent_at TIMESTAMPTZ;
ALTER TABLE communications ADD COLUMN IF NOT EXISTS direction TEXT NOT NULL DEFAULT 'outgoing' CHECK (direction IN ('outgoing', 'incoming'));
ALTER TABLE communications ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE communications ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

ALTER TABLE inventory ADD COLUMN IF NOT EXISTS inventory_value DECIMAL(10,2) NOT NULL DEFAULT 0;

-- ============================================================================
-- 10. SEED DATA (idempotent — INSERT ... ON CONFLICT DO NOTHING / WHERE NOT EXISTS)
-- ============================================================================
INSERT INTO users (id, name, email, role, password_hash)
SELECT gen_random_uuid(), 'Admin Doña Nina', 'admin@donadenina.com', 'admin',
  '$2a$10$dummy' WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'admin@donadenina.com');

INSERT INTO users (id, name, email, role)
SELECT gen_random_uuid(), 'Maria Vendedora', 'maria@donadenina.com', 'seller'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'maria@donadenina.com');

INSERT INTO users (id, name, email, role)
SELECT gen_random_uuid(), 'Carlos Asistente', 'carlos@donadenina.com', 'assistant'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'carlos@donadenina.com');

-- Menu categories
INSERT INTO menu_categories (id, name, description, sort_order)
SELECT gen_random_uuid(), 'Arepas Tradicionales', 'Arepas clásicas de la casa', 1
WHERE NOT EXISTS (SELECT 1 FROM menu_categories WHERE name = 'Arepas Tradicionales');

INSERT INTO menu_categories (id, name, description, sort_order)
SELECT gen_random_uuid(), 'Arepas Especiales', 'Arepas gourmet con ingredientes especiales', 2
WHERE NOT EXISTS (SELECT 1 FROM menu_categories WHERE name = 'Arepas Especiales');

INSERT INTO menu_categories (id, name, description, sort_order)
SELECT gen_random_uuid(), 'Empanadas', 'Empanadas fritas y horneadas', 3
WHERE NOT EXISTS (SELECT 1 FROM menu_categories WHERE name = 'Empanadas');

INSERT INTO menu_categories (id, name, description, sort_order)
SELECT gen_random_uuid(), 'Bebidas', 'Jugos naturales, refrescos y café', 4
WHERE NOT EXISTS (SELECT 1 FROM menu_categories WHERE name = 'Bebidas');

INSERT INTO menu_categories (id, name, description, sort_order)
SELECT gen_random_uuid(), 'Postres', 'Dulces y postres artesanales', 5
WHERE NOT EXISTS (SELECT 1 FROM menu_categories WHERE name = 'Postres');

INSERT INTO menu_categories (id, name, description, sort_order)
SELECT gen_random_uuid(), 'Desayunos', 'Opciones de desayuno', 6
WHERE NOT EXISTS (SELECT 1 FROM menu_categories WHERE name = 'Desayunos');

-- Settings
INSERT INTO settings (id, business_name, default_margin, invoice_prefix, receipt_prefix, phone, email, address)
SELECT gen_random_uuid(), 'Donde Doña Nina', 30.00, 'DDN-FAC-', 'DDN-REC-', '(809) 555-9999', 'info@donadenina.com',
  'Calle El Conde #42, Zona Colonial, Santo Domingo, República Dominicana'
WHERE NOT EXISTS (SELECT 1 FROM settings LIMIT 1);

-- Default bank account
INSERT INTO bank_accounts (bank_name, account_type, account_number, holder_name, is_default)
SELECT 'Banco de Reservas', 'Corriente', '123-456-789-0', 'Donde Doña Nina', TRUE
WHERE NOT EXISTS (SELECT 1 FROM bank_accounts LIMIT 1);

-- Expense categories
INSERT INTO expense_categories (name, parent_id, sort_order)
SELECT 'Alimentos', NULL, 1 WHERE NOT EXISTS (SELECT 1 FROM expense_categories WHERE name = 'Alimentos' AND parent_id IS NULL);
INSERT INTO expense_categories (name, parent_id, sort_order)
SELECT 'Empaques', NULL, 2 WHERE NOT EXISTS (SELECT 1 FROM expense_categories WHERE name = 'Empaques' AND parent_id IS NULL);
INSERT INTO expense_categories (name, parent_id, sort_order)
SELECT 'Transporte', NULL, 3 WHERE NOT EXISTS (SELECT 1 FROM expense_categories WHERE name = 'Transporte' AND parent_id IS NULL);
INSERT INTO expense_categories (name, parent_id, sort_order)
SELECT 'Servicios', NULL, 4 WHERE NOT EXISTS (SELECT 1 FROM expense_categories WHERE name = 'Servicios' AND parent_id IS NULL);
INSERT INTO expense_categories (name, parent_id, sort_order)
SELECT 'Publicidad', NULL, 5 WHERE NOT EXISTS (SELECT 1 FROM expense_categories WHERE name = 'Publicidad' AND parent_id IS NULL);
INSERT INTO expense_categories (name, parent_id, sort_order)
SELECT 'Mantenimiento', NULL, 6 WHERE NOT EXISTS (SELECT 1 FROM expense_categories WHERE name = 'Mantenimiento' AND parent_id IS NULL);
INSERT INTO expense_categories (name, parent_id, sort_order)
SELECT 'Otros', NULL, 7 WHERE NOT EXISTS (SELECT 1 FROM expense_categories WHERE name = 'Otros' AND parent_id IS NULL);

-- Sample clients
INSERT INTO clients (id, full_name, phone, email, address, stage, first_contact_date)
SELECT gen_random_uuid(), 'Juan Pérez', '809-555-0101', 'juan.perez@email.com', 'Calle Principal #123, Santo Domingo', 'Cierre', '2026-05-10'
WHERE NOT EXISTS (SELECT 1 FROM clients WHERE full_name = 'Juan Pérez');

INSERT INTO clients (id, full_name, phone, email, address, credit_balance, stage, first_contact_date)
SELECT gen_random_uuid(), 'María Rodríguez', '809-555-0102', 'maria.rodriguez@email.com', 'Av. Independencia #456, Santo Domingo', 500.00, 'Negociacion', '2026-05-15'
WHERE NOT EXISTS (SELECT 1 FROM clients WHERE full_name = 'María Rodríguez');

INSERT INTO clients (id, full_name, phone, email, address, stage, first_contact_date)
SELECT gen_random_uuid(), 'Carlos Martínez', '829-555-0103', 'carlos.martinez@email.com', 'Calle Secundaria #789, Santiago', 'Contacto Inicial', '2026-06-01'
WHERE NOT EXISTS (SELECT 1 FROM clients WHERE full_name = 'Carlos Martínez');

INSERT INTO clients (id, full_name, phone, email, address, stage, first_contact_date)
SELECT gen_random_uuid(), 'Ana Jiménez', '849-555-0104', 'ana.jimenez@email.com', 'Calle Las Flores #234, La Romana', 'Calificacion', '2026-06-10'
WHERE NOT EXISTS (SELECT 1 FROM clients WHERE full_name = 'Ana Jiménez');

INSERT INTO clients (id, full_name, phone, email, address, credit_balance, stage, first_contact_date)
SELECT gen_random_uuid(), 'Luis Castillo', '809-555-0105', 'luis.castillo@email.com', 'Av. 27 de Febrero #567, Santo Domingo', 150.00, 'Prospecto', '2026-06-18'
WHERE NOT EXISTS (SELECT 1 FROM clients WHERE full_name = 'Luis Castillo');

-- Sample suppliers
INSERT INTO suppliers (name, phone)
SELECT 'Distribuidora Alimenticia', '809-555-2000'
WHERE NOT EXISTS (SELECT 1 FROM suppliers WHERE name = 'Distribuidora Alimenticia');

INSERT INTO suppliers (name, phone)
SELECT 'Quesería La Pradera', '809-555-2001'
WHERE NOT EXISTS (SELECT 1 FROM suppliers WHERE name = 'Quesería La Pradera');

INSERT INTO suppliers (name, phone)
SELECT 'Harina PAN', '809-555-2002'
WHERE NOT EXISTS (SELECT 1 FROM suppliers WHERE name = 'Harina PAN');
