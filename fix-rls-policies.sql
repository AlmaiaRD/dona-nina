-- ============================================================================
-- FIX RLS POLICIES — Donde Doña Nina
-- 
-- Contexto: La app usa autenticación JWT custom (NO Supabase Auth).
-- El servicio frontend usa la anon key, pero no hay sesión de Supabase Auth,
-- por lo que auth.role() retorna 'anon' (no 'authenticated').
-- 
-- Solución: Permisos amplios en todas las tablas (USING true) ya que:
--   1. El control de acceso real está en el middleware de Next.js (JWT cookie check)
--   2. Las API routes verifican el JWT explícitamente
--   3. Las API routes usan service_role key (bypass RLS)
-- ============================================================================

-- ============================================================================
-- 1. USERS — Eliminar políticas recursivas
-- ============================================================================
DROP POLICY IF EXISTS "users_select_own_or_admin" ON users;
DROP POLICY IF EXISTS "users_insert_admin" ON users;
DROP POLICY IF EXISTS "users_update_own_or_admin" ON users;
DROP POLICY IF EXISTS "users_delete_admin" ON users;
DROP POLICY IF EXISTS "users_select_all" ON users;
DROP POLICY IF EXISTS "users_insert_own" ON users;
DROP POLICY IF EXISTS "users_update_own" ON users;

CREATE POLICY "users_all" ON users FOR ALL USING (true);

-- ============================================================================
-- 2. CLIENTS — Reemplazar delete restrictivo
-- ============================================================================
DROP POLICY IF EXISTS "clients_select_all" ON clients;
DROP POLICY IF EXISTS "clients_insert_all" ON clients;
DROP POLICY IF EXISTS "clients_update_all" ON clients;
DROP POLICY IF EXISTS "clients_delete_all" ON clients;

CREATE POLICY "clients_all" ON clients FOR ALL USING (true);

-- ============================================================================
-- 3. MENU CATEGORIES
-- ============================================================================
DROP POLICY IF EXISTS "menu_categories_select_all" ON menu_categories;
DROP POLICY IF EXISTS "menu_categories_insert_admin" ON menu_categories;
DROP POLICY IF EXISTS "menu_categories_update_admin" ON menu_categories;
DROP POLICY IF EXISTS "menu_categories_delete_admin" ON menu_categories;

CREATE POLICY "menu_categories_all" ON menu_categories FOR ALL USING (true);

-- ============================================================================
-- 4. MENU ITEMS
-- ============================================================================
DROP POLICY IF EXISTS "menu_items_select_all" ON menu_items;
DROP POLICY IF EXISTS "menu_items_insert_admin" ON menu_items;
DROP POLICY IF EXISTS "menu_items_update_admin" ON menu_items;
DROP POLICY IF EXISTS "menu_items_delete_admin" ON menu_items;

CREATE POLICY "menu_items_all" ON menu_items FOR ALL USING (true);

-- ============================================================================
-- 5. INVENTORY
-- ============================================================================
DROP POLICY IF EXISTS "inventory_select_all" ON inventory;
DROP POLICY IF EXISTS "inventory_insert_admin" ON inventory;
DROP POLICY IF EXISTS "inventory_update_admin" ON inventory;
DROP POLICY IF EXISTS "inventory_delete_admin" ON inventory;

CREATE POLICY "inventory_all" ON inventory FOR ALL USING (true);

-- ============================================================================
-- 6. INVENTORY MOVEMENTS
-- ============================================================================
DROP POLICY IF EXISTS "inventory_movements_select_all" ON inventory_movements;
DROP POLICY IF EXISTS "inventory_movements_insert_admin" ON inventory_movements;

CREATE POLICY "inventory_movements_all" ON inventory_movements FOR ALL USING (true);

-- ============================================================================
-- 7. INVOICES
-- ============================================================================
DROP POLICY IF EXISTS "invoices_select_all" ON invoices;
DROP POLICY IF EXISTS "invoices_insert_all" ON invoices;
DROP POLICY IF EXISTS "invoices_update_all" ON invoices;
DROP POLICY IF EXISTS "invoices_delete_admin" ON invoices;

CREATE POLICY "invoices_all" ON invoices FOR ALL USING (true);

-- ============================================================================
-- 8. INVOICE ITEMS
-- ============================================================================
DROP POLICY IF EXISTS "invoice_items_select_all" ON invoice_items;
DROP POLICY IF EXISTS "invoice_items_insert_all" ON invoice_items;
DROP POLICY IF EXISTS "invoice_items_update_all" ON invoice_items;
DROP POLICY IF EXISTS "invoice_items_delete_admin" ON invoice_items;

CREATE POLICY "invoice_items_all" ON invoice_items FOR ALL USING (true);

-- ============================================================================
-- 9. RECEIPTS
-- ============================================================================
DROP POLICY IF EXISTS "receipts_select_all" ON receipts;
DROP POLICY IF EXISTS "receipts_insert_all" ON receipts;
DROP POLICY IF EXISTS "receipts_update_all" ON receipts;
DROP POLICY IF EXISTS "receipts_delete_admin" ON receipts;

CREATE POLICY "receipts_all" ON receipts FOR ALL USING (true);

-- ============================================================================
-- 10. CREDIT BALANCES
-- ============================================================================
DROP POLICY IF EXISTS "credit_balances_select_all" ON credit_balances;
DROP POLICY IF EXISTS "credit_balances_insert_admin" ON credit_balances;
DROP POLICY IF EXISTS "credit_balances_update_admin" ON credit_balances;

CREATE POLICY "credit_balances_all" ON credit_balances FOR ALL USING (true);

-- ============================================================================
-- 11. DELIVERIES
-- ============================================================================
DROP POLICY IF EXISTS "deliveries_select_all" ON deliveries;
DROP POLICY IF EXISTS "deliveries_insert_all" ON deliveries;
DROP POLICY IF EXISTS "deliveries_update_all" ON deliveries;
DROP POLICY IF EXISTS "deliveries_delete_admin" ON deliveries;

CREATE POLICY "deliveries_all" ON deliveries FOR ALL USING (true);

-- ============================================================================
-- 12. FOLLOWUPS
-- ============================================================================
DROP POLICY IF EXISTS "followups_select_all" ON followups;
DROP POLICY IF EXISTS "followups_insert_all" ON followups;
DROP POLICY IF EXISTS "followups_update_all" ON followups;
DROP POLICY IF EXISTS "followups_delete_admin" ON followups;

CREATE POLICY "followups_all" ON followups FOR ALL USING (true);

-- ============================================================================
-- 13. EXPENSES
-- ============================================================================
DROP POLICY IF EXISTS "expenses_select_all" ON expenses;
DROP POLICY IF EXISTS "expenses_insert_admin" ON expenses;
DROP POLICY IF EXISTS "expenses_update_admin" ON expenses;
DROP POLICY IF EXISTS "expenses_delete_admin" ON expenses;

CREATE POLICY "expenses_all" ON expenses FOR ALL USING (true);

-- ============================================================================
-- 14. SETTINGS
-- ============================================================================
DROP POLICY IF EXISTS "settings_select_all" ON settings;
DROP POLICY IF EXISTS "settings_insert_admin" ON settings;
DROP POLICY IF EXISTS "settings_update_admin" ON settings;
DROP POLICY IF EXISTS "settings_delete_admin" ON settings;

CREATE POLICY "settings_all" ON settings FOR ALL USING (true);

-- ============================================================================
-- 15. AUDIT LOGS
-- ============================================================================
DROP POLICY IF EXISTS "audit_logs_select_all" ON audit_logs;
DROP POLICY IF EXISTS "audit_logs_insert_all" ON audit_logs;

CREATE POLICY "audit_logs_all" ON audit_logs FOR ALL USING (true);

-- ============================================================================
-- 16. COMMUNICATIONS
-- ============================================================================
DROP POLICY IF EXISTS "communications_select" ON communications;
DROP POLICY IF EXISTS "communications_insert" ON communications;
DROP POLICY IF EXISTS "communications_update" ON communications;
DROP POLICY IF EXISTS "communications_delete" ON communications;

CREATE POLICY "communications_all" ON communications FOR ALL USING (true);

-- ============================================================================
-- 17. LEARNING NOTES
-- ============================================================================
DROP POLICY IF EXISTS "learning_notes_select" ON learning_notes;
DROP POLICY IF EXISTS "learning_notes_insert" ON learning_notes;
DROP POLICY IF EXISTS "learning_notes_update" ON learning_notes;
DROP POLICY IF EXISTS "learning_notes_delete" ON learning_notes;

CREATE POLICY "learning_notes_all" ON learning_notes FOR ALL USING (true);
