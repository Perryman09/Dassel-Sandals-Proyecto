-- =============================================================================
-- DASSEL SANDALS - SUPABASE SECURITY & ROW LEVEL SECURITY (RLS) HARDENING
-- =============================================================================
-- Resuelve las alertas del linter de seguridad de Supabase:
--   1. rls_disabled_in_public (0013) en todas las tablas del esquema public.
--   2. sensitive_columns_exposed (0023) en public.User (columna password).
--   3. Previene rls_enabled_no_policy (0008) definiendo politicas exclusivas
--      para el rol interno service_role, bloqueando el acceso directo desde
--      PostgREST (roles anon y authenticated).
-- =============================================================================

BEGIN;

-- 1. Habilitar Row Level Security (RLS) en todas las tablas del esquema public
ALTER TABLE IF EXISTS "public"."Product" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "public"."SaleItem" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "public"."Sale" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "public"."PurchaseItem" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "public"."Movement" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "public"."Supplier" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "public"."CashMovement" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "public"."Role" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "public"."Purchase" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "public"."User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "public"."Category" ENABLE ROW LEVEL SECURITY;

-- 2. Revocar permisos expuestos a la API publica (anon, authenticated, PUBLIC)
--    Especialmente sobre la tabla User y su columna sensible password.
REVOKE ALL ON TABLE "public"."User" FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE "public"."Role" FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE "public"."Product" FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE "public"."SaleItem" FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE "public"."Sale" FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE "public"."PurchaseItem" FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE "public"."Movement" FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE "public"."Supplier" FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE "public"."CashMovement" FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE "public"."Purchase" FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE "public"."Category" FROM PUBLIC, anon, authenticated;

-- Garantizar acceso completo al rol administrativo de Supabase (service_role)
GRANT ALL ON TABLE "public"."User" TO service_role;
GRANT ALL ON TABLE "public"."Role" TO service_role;
GRANT ALL ON TABLE "public"."Product" TO service_role;
GRANT ALL ON TABLE "public"."SaleItem" TO service_role;
GRANT ALL ON TABLE "public"."Sale" TO service_role;
GRANT ALL ON TABLE "public"."PurchaseItem" TO service_role;
GRANT ALL ON TABLE "public"."Movement" TO service_role;
GRANT ALL ON TABLE "public"."Supplier" TO service_role;
GRANT ALL ON TABLE "public"."CashMovement" TO service_role;
GRANT ALL ON TABLE "public"."Purchase" TO service_role;
GRANT ALL ON TABLE "public"."Category" TO service_role;

-- 3. Crear politicas RLS estrictas exclusivas para service_role
DROP POLICY IF EXISTS "service_role_full_access_Product" ON "public"."Product";
CREATE POLICY "service_role_full_access_Product"
  ON "public"."Product"
  AS PERMISSIVE
  FOR ALL
  TO service_role
  USING (current_setting('role', true) = 'service_role')
  WITH CHECK (current_setting('role', true) = 'service_role');

DROP POLICY IF EXISTS "service_role_full_access_SaleItem" ON "public"."SaleItem";
CREATE POLICY "service_role_full_access_SaleItem"
  ON "public"."SaleItem"
  AS PERMISSIVE
  FOR ALL
  TO service_role
  USING (current_setting('role', true) = 'service_role')
  WITH CHECK (current_setting('role', true) = 'service_role');

DROP POLICY IF EXISTS "service_role_full_access_Sale" ON "public"."Sale";
CREATE POLICY "service_role_full_access_Sale"
  ON "public"."Sale"
  AS PERMISSIVE
  FOR ALL
  TO service_role
  USING (current_setting('role', true) = 'service_role')
  WITH CHECK (current_setting('role', true) = 'service_role');

DROP POLICY IF EXISTS "service_role_full_access_PurchaseItem" ON "public"."PurchaseItem";
CREATE POLICY "service_role_full_access_PurchaseItem"
  ON "public"."PurchaseItem"
  AS PERMISSIVE
  FOR ALL
  TO service_role
  USING (current_setting('role', true) = 'service_role')
  WITH CHECK (current_setting('role', true) = 'service_role');

DROP POLICY IF EXISTS "service_role_full_access_Movement" ON "public"."Movement";
CREATE POLICY "service_role_full_access_Movement"
  ON "public"."Movement"
  AS PERMISSIVE
  FOR ALL
  TO service_role
  USING (current_setting('role', true) = 'service_role')
  WITH CHECK (current_setting('role', true) = 'service_role');

DROP POLICY IF EXISTS "service_role_full_access_Supplier" ON "public"."Supplier";
CREATE POLICY "service_role_full_access_Supplier"
  ON "public"."Supplier"
  AS PERMISSIVE
  FOR ALL
  TO service_role
  USING (current_setting('role', true) = 'service_role')
  WITH CHECK (current_setting('role', true) = 'service_role');

DROP POLICY IF EXISTS "service_role_full_access_CashMovement" ON "public"."CashMovement";
CREATE POLICY "service_role_full_access_CashMovement"
  ON "public"."CashMovement"
  AS PERMISSIVE
  FOR ALL
  TO service_role
  USING (current_setting('role', true) = 'service_role')
  WITH CHECK (current_setting('role', true) = 'service_role');

DROP POLICY IF EXISTS "service_role_full_access_Role" ON "public"."Role";
CREATE POLICY "service_role_full_access_Role"
  ON "public"."Role"
  AS PERMISSIVE
  FOR ALL
  TO service_role
  USING (current_setting('role', true) = 'service_role')
  WITH CHECK (current_setting('role', true) = 'service_role');

DROP POLICY IF EXISTS "service_role_full_access_Purchase" ON "public"."Purchase";
CREATE POLICY "service_role_full_access_Purchase"
  ON "public"."Purchase"
  AS PERMISSIVE
  FOR ALL
  TO service_role
  USING (current_setting('role', true) = 'service_role')
  WITH CHECK (current_setting('role', true) = 'service_role');

DROP POLICY IF EXISTS "service_role_full_access_User" ON "public"."User";
CREATE POLICY "service_role_full_access_User"
  ON "public"."User"
  AS PERMISSIVE
  FOR ALL
  TO service_role
  USING (current_setting('role', true) = 'service_role')
  WITH CHECK (current_setting('role', true) = 'service_role');

DROP POLICY IF EXISTS "service_role_full_access_Category" ON "public"."Category";
CREATE POLICY "service_role_full_access_Category"
  ON "public"."Category"
  AS PERMISSIVE
  FOR ALL
  TO service_role
  USING (current_setting('role', true) = 'service_role')
  WITH CHECK (current_setting('role', true) = 'service_role');

COMMIT;
