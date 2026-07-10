-- ============================================================================
-- Migration: Fix RLS policies for custom JWT auth
-- The app uses custom JWT auth (not Supabase Auth). The supabase client
-- uses the anon key from env. For security:
--   - SELECT policies allow 'anon' (read-only for non-sensitive data)
--   - INSERT/UPDATE/DELETE policies require 'authenticated'
--   - Write operations should go through API routes (which use SERVICE_ROLE_KEY)
-- ============================================================================

-- Drop and recreate policies for each table

DO $$ BEGIN
  DROP POLICY IF EXISTS "clients_select_all" ON clients;
  DROP POLICY IF EXISTS "clients_insert_all" ON clients;
  DROP POLICY IF EXISTS "clients_update_all" ON clients;
  DROP POLICY IF EXISTS "clients_delete_all" ON clients;
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS "invoices_select_all" ON invoices;
  DROP POLICY IF EXISTS "invoices_insert_all" ON invoices;
  DROP POLICY IF EXISTS "invoices_update_all" ON invoices;
  DROP POLICY IF EXISTS "invoices_delete_admin" ON invoices;
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS "invoice_items_select_all" ON invoice_items;
  DROP POLICY IF EXISTS "invoice_items_insert_all" ON invoice_items;
  DROP POLICY IF EXISTS "invoice_items_update_all" ON invoice_items;
  DROP POLICY IF EXISTS "invoice_items_delete_admin" ON invoice_items;
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS "receipts_select_all" ON receipts;
  DROP POLICY IF EXISTS "receipts_insert_all" ON receipts;
  DROP POLICY IF EXISTS "receipts_update_all" ON receipts;
  DROP POLICY IF EXISTS "receipts_delete_admin" ON receipts;
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS "menu_categories_select_all" ON menu_categories;
  DROP POLICY IF EXISTS "menu_categories_insert_admin" ON menu_categories;
  DROP POLICY IF EXISTS "menu_categories_update_admin" ON menu_categories;
  DROP POLICY IF EXISTS "menu_categories_delete_admin" ON menu_categories;
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS "menu_items_select_all" ON menu_items;
  DROP POLICY IF EXISTS "menu_items_insert_admin" ON menu_items;
  DROP POLICY IF EXISTS "menu_items_update_admin" ON menu_items;
  DROP POLICY IF EXISTS "menu_items_delete_admin" ON menu_items;
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS "inventory_select_all" ON inventory;
  DROP POLICY IF EXISTS "inventory_insert_admin" ON inventory;
  DROP POLICY IF EXISTS "inventory_update_admin" ON inventory;
  DROP POLICY IF EXISTS "inventory_delete_admin" ON inventory;
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS "inventory_movements_select_all" ON inventory_movements;
  DROP POLICY IF EXISTS "inventory_movements_insert_admin" ON inventory_movements;
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS "credit_balances_select_all" ON credit_balances;
  DROP POLICY IF EXISTS "credit_balances_insert_admin" ON credit_balances;
  DROP POLICY IF EXISTS "credit_balances_update_admin" ON credit_balances;
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS "deliveries_select_all" ON deliveries;
  DROP POLICY IF EXISTS "deliveries_insert_all" ON deliveries;
  DROP POLICY IF EXISTS "deliveries_update_all" ON deliveries;
  DROP POLICY IF EXISTS "deliveries_delete_admin" ON deliveries;
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS "followups_select_all" ON followups;
  DROP POLICY IF EXISTS "followups_insert_all" ON followups;
  DROP POLICY IF EXISTS "followups_update_all" ON followups;
  DROP POLICY IF EXISTS "followups_delete_admin" ON followups;
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS "expenses_select_all" ON expenses;
  DROP POLICY IF EXISTS "expenses_insert_admin" ON expenses;
  DROP POLICY IF EXISTS "expenses_update_admin" ON expenses;
  DROP POLICY IF EXISTS "expenses_delete_admin" ON expenses;
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS "settings_select_all" ON settings;
  DROP POLICY IF EXISTS "settings_insert_admin" ON settings;
  DROP POLICY IF EXISTS "settings_update_admin" ON settings;
  DROP POLICY IF EXISTS "settings_delete_admin" ON settings;
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS "users_select_own_or_admin" ON users;
  DROP POLICY IF EXISTS "users_insert_admin" ON users;
  DROP POLICY IF EXISTS "users_update_own_or_admin" ON users;
  DROP POLICY IF EXISTS "users_delete_admin" ON users;
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS "audit_logs_select_all" ON audit_logs;
  DROP POLICY IF EXISTS "audit_logs_insert_all" ON audit_logs;
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS "learning_notes_select" ON learning_notes;
  DROP POLICY IF EXISTS "learning_notes_insert" ON learning_notes;
  DROP POLICY IF EXISTS "learning_notes_update" ON learning_notes;
  DROP POLICY IF EXISTS "learning_notes_delete" ON learning_notes;
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS "communications_select" ON communications;
  DROP POLICY IF EXISTS "communications_insert" ON communications;
  DROP POLICY IF EXISTS "communications_update" ON communications;
  DROP POLICY IF EXISTS "communications_delete" ON communications;
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS "expense_categories_select_all" ON expense_categories;
  DROP POLICY IF EXISTS "expense_categories_insert_admin" ON expense_categories;
  DROP POLICY IF EXISTS "expense_categories_update_admin" ON expense_categories;
  DROP POLICY IF EXISTS "expense_categories_delete_admin" ON expense_categories;
EXCEPTION WHEN undefined_object THEN NULL;
END $$;


-- Recreate policies: anon for SELECT, authenticated for write operations

CREATE POLICY "clients_select_all" ON clients FOR SELECT USING (auth.role() IN ('anon', 'authenticated'));
CREATE POLICY "clients_insert_all" ON clients FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "clients_update_all" ON clients FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "clients_delete_all" ON clients FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "invoices_select_all" ON invoices FOR SELECT USING (auth.role() IN ('anon', 'authenticated'));
CREATE POLICY "invoices_insert_all" ON invoices FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "invoices_update_all" ON invoices FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "invoices_delete_admin" ON invoices FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "invoice_items_select_all" ON invoice_items FOR SELECT USING (auth.role() IN ('anon', 'authenticated'));
CREATE POLICY "invoice_items_insert_all" ON invoice_items FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "invoice_items_update_all" ON invoice_items FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "invoice_items_delete_admin" ON invoice_items FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "receipts_select_all" ON receipts FOR SELECT USING (auth.role() IN ('anon', 'authenticated'));
CREATE POLICY "receipts_insert_all" ON receipts FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "receipts_update_all" ON receipts FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "receipts_delete_admin" ON receipts FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "menu_categories_select_all" ON menu_categories FOR SELECT USING (auth.role() IN ('anon', 'authenticated'));
CREATE POLICY "menu_categories_insert_admin" ON menu_categories FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "menu_categories_update_admin" ON menu_categories FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "menu_categories_delete_admin" ON menu_categories FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "menu_items_select_all" ON menu_items FOR SELECT USING (auth.role() IN ('anon', 'authenticated'));
CREATE POLICY "menu_items_insert_admin" ON menu_items FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "menu_items_update_admin" ON menu_items FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "menu_items_delete_admin" ON menu_items FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "inventory_select_all" ON inventory FOR SELECT USING (auth.role() IN ('anon', 'authenticated'));
CREATE POLICY "inventory_insert_admin" ON inventory FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "inventory_update_admin" ON inventory FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "inventory_delete_admin" ON inventory FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "inventory_movements_select_all" ON inventory_movements FOR SELECT USING (auth.role() IN ('anon', 'authenticated'));
CREATE POLICY "inventory_movements_insert_admin" ON inventory_movements FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "credit_balances_select_all" ON credit_balances FOR SELECT USING (auth.role() IN ('anon', 'authenticated'));
CREATE POLICY "credit_balances_insert_admin" ON credit_balances FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "credit_balances_update_admin" ON credit_balances FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "deliveries_select_all" ON deliveries FOR SELECT USING (auth.role() IN ('anon', 'authenticated'));
CREATE POLICY "deliveries_insert_all" ON deliveries FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "deliveries_update_all" ON deliveries FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "deliveries_delete_admin" ON deliveries FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "followups_select_all" ON followups FOR SELECT USING (auth.role() IN ('anon', 'authenticated'));
CREATE POLICY "followups_insert_all" ON followups FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "followups_update_all" ON followups FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "followups_delete_admin" ON followups FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "expenses_select_all" ON expenses FOR SELECT USING (auth.role() IN ('anon', 'authenticated'));
CREATE POLICY "expenses_insert_admin" ON expenses FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "expenses_update_admin" ON expenses FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "expenses_delete_admin" ON expenses FOR DELETE USING (auth.role() = 'authenticated');

-- Nota: SELECT policies mantienen 'anon' porque el front-end usa el client anon key
-- para consultas directas a Supabase. Las operaciones de escritura requieren
-- 'authenticated' para prevenir modificaciones no autorizadas desde el navegador.

CREATE POLICY "settings_select_all" ON settings FOR SELECT USING (auth.role() IN ('anon', 'authenticated'));
CREATE POLICY "settings_insert_admin" ON settings FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "settings_update_admin" ON settings FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "settings_delete_admin" ON settings FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "users_select_own_or_admin" ON users
  FOR SELECT USING (
    auth.role() IN ('anon', 'authenticated')
    AND (id = auth.uid() OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'))
  );
CREATE POLICY "users_insert_admin" ON users FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "users_update_own_or_admin" ON users
  FOR UPDATE USING (
    auth.role() IN ('anon', 'authenticated')
    AND (id = auth.uid() OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'))
  );
CREATE POLICY "users_delete_admin" ON users FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "audit_logs_select_all" ON audit_logs FOR SELECT USING (auth.role() IN ('anon', 'authenticated'));
CREATE POLICY "audit_logs_insert_all" ON audit_logs FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "learning_notes_select" ON learning_notes FOR SELECT USING (auth.role() IN ('anon', 'authenticated'));
CREATE POLICY "learning_notes_insert" ON learning_notes FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "learning_notes_update" ON learning_notes FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "learning_notes_delete" ON learning_notes FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "communications_select" ON communications FOR SELECT USING (auth.role() IN ('anon', 'authenticated'));
CREATE POLICY "communications_insert" ON communications FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "communications_update" ON communications FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "communications_delete" ON communications FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "expense_categories_select_all" ON expense_categories FOR SELECT USING (auth.role() IN ('anon', 'authenticated'));
CREATE POLICY "expense_categories_insert_admin" ON expense_categories FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "expense_categories_update_admin" ON expense_categories FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "expense_categories_delete_admin" ON expense_categories FOR DELETE USING (auth.role() = 'authenticated');
