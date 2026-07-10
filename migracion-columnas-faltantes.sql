-- ============================================================================
-- MIGRACIÓN: Columnas faltantes y tablas para Donde Doña Nina
-- ============================================================================

-- 1. Crear tabla bank_accounts (faltante)
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

ALTER TABLE bank_accounts ENABLE ROW LEVEL SECURITY;

-- RLS policies for bank_accounts
DO $$ BEGIN
  CREATE POLICY "bank_accounts_select_all" ON bank_accounts FOR SELECT USING (auth.role() = 'authenticated');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE POLICY "bank_accounts_insert_all" ON bank_accounts FOR INSERT WITH CHECK (auth.role() = 'authenticated');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE POLICY "bank_accounts_update_all" ON bank_accounts FOR UPDATE USING (auth.role() = 'authenticated');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE POLICY "bank_accounts_delete_all" ON bank_accounts FOR DELETE USING (auth.role() = 'authenticated');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 2. Agregar columnas faltantes a invoices
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS itbis_total DECIMAL(10,2) NOT NULL DEFAULT 0;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS pv_total DECIMAL(10,2) NOT NULL DEFAULT 0;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS bank_account_id UUID REFERENCES bank_accounts(id) ON DELETE SET NULL;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES users(id) ON DELETE SET NULL;

-- 3. Agregar columnas faltantes a invoice_items
ALTER TABLE invoice_items ADD COLUMN IF NOT EXISTS pv DECIMAL(10,2) NOT NULL DEFAULT 0;
ALTER TABLE invoice_items ADD COLUMN IF NOT EXISTS itbis BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE invoice_items ADD COLUMN IF NOT EXISTS itbis_amount DECIMAL(10,2) NOT NULL DEFAULT 0;

-- 4. Agregar columnas faltantes a receipts
ALTER TABLE receipts ADD COLUMN IF NOT EXISTS bank_account_id UUID REFERENCES bank_accounts(id) ON DELETE SET NULL;
ALTER TABLE receipts ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE receipts ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES users(id) ON DELETE SET NULL;

-- 5. RPC: increment_inventory
CREATE OR REPLACE FUNCTION increment_inventory(p_item_id UUID, p_quantity INT)
RETURNS VOID AS $$
BEGIN
  UPDATE inventory
  SET stock = stock + p_quantity,
      updated_at = NOW()
  WHERE item_id = p_item_id;

  INSERT INTO inventory_movements (item_id, ingredient_name, movement_type, quantity, reference_type, notes)
  SELECT p_item_id, ingredient_name, 'RETURN', p_quantity, 'invoice_cancellation', 'Devolución por cancelación de factura'
  FROM inventory
  WHERE item_id = p_item_id;
END;
$$ LANGUAGE plpgsql;

-- 6. RPC: decrement_inventory
CREATE OR REPLACE FUNCTION decrement_inventory(p_item_id UUID, p_quantity INT)
RETURNS VOID AS $$
BEGIN
  UPDATE inventory
  SET stock = GREATEST(0, stock - p_quantity),
      updated_at = NOW()
  WHERE item_id = p_item_id;

  INSERT INTO inventory_movements (item_id, ingredient_name, movement_type, quantity, reference_type, notes)
  SELECT p_item_id, ingredient_name, 'SALE', p_quantity, 'invoice', 'Venta registrada en factura'
  FROM inventory
  WHERE item_id = p_item_id;
END;
$$ LANGUAGE plpgsql;

-- 7. RPC: use_credit_balance
CREATE OR REPLACE FUNCTION use_credit_balance(p_credit_id UUID, p_amount DECIMAL)
RETURNS JSONB AS $$
DECLARE
  v_current_balance DECIMAL;
  v_new_balance DECIMAL;
  v_client_id UUID;
  v_result JSONB;
BEGIN
  SELECT balance, client_id INTO v_current_balance, v_client_id
  FROM credit_balances
  WHERE id = p_credit_id AND status = 'AVAILABLE'
  FOR UPDATE;

  IF v_current_balance IS NULL THEN
    RAISE EXCEPTION 'Crédito no encontrado o no disponible';
  END IF;

  IF p_amount > v_current_balance THEN
    RAISE EXCEPTION 'El monto excede el balance disponible';
  END IF;

  v_new_balance := v_current_balance - p_amount;

  UPDATE credit_balances
  SET balance = v_new_balance,
      status = CASE WHEN v_new_balance <= 0 THEN 'USED' ELSE 'AVAILABLE' END,
      updated_at = NOW()
  WHERE id = p_credit_id;

  UPDATE clients
  SET credit_balance = credit_balance - p_amount,
      updated_at = NOW()
  WHERE id = v_client_id;

  v_result := jsonb_build_object(
    'success', TRUE,
    'new_balance', v_new_balance,
    'client_id', v_client_id
  );

  RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- 8. Seed bank account default
INSERT INTO bank_accounts (bank_name, account_type, account_number, holder_name, id_number, email, is_default)
SELECT 'Banco de Reservas', 'Corriente', '123-456-789-0', 'Donde Doña Nina', '000-0000000-0', 'info@donadenina.com', TRUE
WHERE NOT EXISTS (SELECT 1 FROM bank_accounts LIMIT 1);

-- 9. Agregar columna permissions a users (necesaria para control de acceso)
ALTER TABLE users ADD COLUMN IF NOT EXISTS permissions JSONB NOT NULL DEFAULT '[]'::jsonb;

-- 10. Índices para optimizar consultas frecuentes
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
