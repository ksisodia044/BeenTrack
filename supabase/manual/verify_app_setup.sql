-- Verify that the application schema, triggers, functions, and policies
-- expected by the frontend exist in the target Supabase project.
--
-- Run this in the Supabase SQL Editor.

-- Expected tables
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
    'profiles',
    'user_roles',
    'products',
    'suppliers',
    'sales',
    'sale_items',
    'business_settings'
  )
ORDER BY table_name;

-- Expected public functions
SELECT routine_name
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN (
    'handle_new_user',
    'has_role',
    'update_updated_at_column',
    'next_receipt_no',
    'deduct_stock_on_sale'
  )
ORDER BY routine_name;

-- Expected auth signup trigger
SELECT trigger_name, event_object_schema, event_object_table
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';

-- Expected updated_at trigger(s)
SELECT trigger_name, event_object_schema, event_object_table
FROM information_schema.triggers
WHERE trigger_name IN ('update_profiles_updated_at', 'update_products_updated_at')
ORDER BY trigger_name;

-- Policies relevant to auth, roles, products, suppliers, sales, and settings
SELECT schemaname, tablename, policyname
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN (
    'profiles',
    'user_roles',
    'products',
    'suppliers',
    'sales',
    'sale_items',
    'business_settings'
  )
ORDER BY tablename, policyname;
