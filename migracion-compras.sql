-- ============================================================================
-- Migration: Purchases and Suppliers tables
-- ============================================================================

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

ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "suppliers_select_all" ON suppliers FOR SELECT USING (auth.role() IN ('anon', 'authenticated'));
CREATE POLICY "suppliers_insert_all" ON suppliers FOR INSERT WITH CHECK (auth.role() IN ('anon', 'authenticated'));
CREATE POLICY "suppliers_update_all" ON suppliers FOR UPDATE USING (auth.role() IN ('anon', 'authenticated'));
CREATE POLICY "suppliers_delete_all" ON suppliers FOR DELETE USING (auth.role() IN ('anon', 'authenticated'));

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
  bank_account_id UUID REFERENCES bank_accounts(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'COMPLETED' CHECK (status IN ('DRAFT', 'COMPLETED', 'CANCELLED')),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "purchases_select_all" ON purchases FOR SELECT USING (auth.role() IN ('anon', 'authenticated'));
CREATE POLICY "purchases_insert_all" ON purchases FOR INSERT WITH CHECK (auth.role() IN ('anon', 'authenticated'));
CREATE POLICY "purchases_update_all" ON purchases FOR UPDATE USING (auth.role() IN ('anon', 'authenticated'));
CREATE POLICY "purchases_delete_admin" ON purchases FOR DELETE USING (auth.role() IN ('anon', 'authenticated'));

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

ALTER TABLE purchase_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "purchase_items_select_all" ON purchase_items FOR SELECT USING (auth.role() IN ('anon', 'authenticated'));
CREATE POLICY "purchase_items_insert_all" ON purchase_items FOR INSERT WITH CHECK (auth.role() IN ('anon', 'authenticated'));
CREATE POLICY "purchase_items_update_all" ON purchase_items FOR UPDATE USING (auth.role() IN ('anon', 'authenticated'));
CREATE POLICY "purchase_items_delete_admin" ON purchase_items FOR DELETE USING (auth.role() IN ('anon', 'authenticated'));

-- Add purchase_prefix to settings
ALTER TABLE settings ADD COLUMN IF NOT EXISTS purchase_prefix TEXT NOT NULL DEFAULT 'COM-';

-- Add inventory_value column to inventory if not exists
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS inventory_value DECIMAL(10,2) NOT NULL DEFAULT 0;

-- Function: add inventory stock from purchase
CREATE OR REPLACE FUNCTION add_inventory_stock(
  p_item_id UUID,
  p_quantity DECIMAL,
  p_unit_cost DECIMAL,
  p_line_total DECIMAL
) RETURNS VOID AS $$
DECLARE
  v_current_stock DECIMAL;
  v_current_cost DECIMAL;
  v_current_value DECIMAL;
  v_new_stock DECIMAL;
  v_new_cost DECIMAL;
  v_new_value DECIMAL;
BEGIN
  SELECT stock, average_cost, inventory_value INTO v_current_stock, v_current_cost, v_current_value
  FROM inventory WHERE item_id = p_item_id;
  
  IF NOT FOUND THEN
    INSERT INTO inventory (item_id, ingredient_name, stock, minimum_stock, unit, average_cost, inventory_value)
    SELECT p_item_id, name, p_quantity, 0, 'unidad', p_unit_cost, p_line_total
    FROM menu_items WHERE id = p_item_id;
  ELSE
    v_new_stock := COALESCE(v_current_stock, 0) + p_quantity;
    IF v_new_stock > 0 THEN
      v_new_value := COALESCE(v_current_value, 0) + p_line_total;
      v_new_cost := v_new_value / v_new_stock;
    ELSE
      v_new_value := 0;
      v_new_cost := 0;
    END IF;
    UPDATE inventory
    SET stock = v_new_stock,
        average_cost = v_new_cost,
        inventory_value = v_new_value,
        updated_at = NOW()
    WHERE item_id = p_item_id;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Function: subtract inventory stock (for cancellations/deletes)
CREATE OR REPLACE FUNCTION subtract_inventory_stock(
  p_item_id UUID,
  p_quantity DECIMAL,
  p_unit_cost DECIMAL,
  p_line_total DECIMAL
) RETURNS VOID AS $$
DECLARE
  v_current_stock DECIMAL;
  v_current_cost DECIMAL;
  v_current_value DECIMAL;
  v_new_stock DECIMAL;
  v_new_value DECIMAL;
BEGIN
  SELECT stock, average_cost, inventory_value INTO v_current_stock, v_current_cost, v_current_value
  FROM inventory WHERE item_id = p_item_id;
  
  IF FOUND THEN
    v_new_stock := GREATEST(COALESCE(v_current_stock, 0) - p_quantity, 0);
    v_new_value := GREATEST(COALESCE(v_current_value, 0) - p_line_total, 0);
    UPDATE inventory
    SET stock = v_new_stock,
        inventory_value = v_new_value,
        average_cost = CASE WHEN v_new_stock > 0 THEN v_new_value / v_new_stock ELSE 0 END,
        updated_at = NOW()
    WHERE item_id = p_item_id;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Insert sample supplier
INSERT INTO suppliers (name, phone) VALUES
  ('Distribuidora Alimenticia', '809-555-2000'),
  ('Quesería La Pradera', '809-555-2001'),
  ('Harina PAN', '809-555-2002');

-- Insert purchase_prefix into settings if not exists
UPDATE settings SET purchase_prefix = 'COM-' WHERE purchase_prefix IS NULL;
