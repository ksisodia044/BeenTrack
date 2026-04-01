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

-- Expected profile columns
SELECT column_name
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'profiles'
  AND column_name IN ('id', 'name', 'email', 'phone', 'is_active', 'created_at', 'updated_at')
ORDER BY column_name;

-- Expected RLS state
SELECT tablename, rowsecurity
FROM pg_tables
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
ORDER BY tablename;

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
WHERE trigger_name IN ('on_auth_user_created', 'update_profiles_updated_at', 'update_products_updated_at', 'deduct_stock_after_sale_item')
ORDER BY trigger_name;

-- Expected receipt sequence and business settings row
SELECT sequencename
FROM pg_sequences
WHERE schemaname = 'public'
  AND sequencename = 'receipt_no_seq';

SELECT COUNT(*) AS business_settings_rows
FROM public.business_settings;

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

-- Any missing expected policies should appear below.
WITH expected_policies(tablename, policyname) AS (
  VALUES
    ('profiles', 'Users can view their own profile'),
    ('profiles', 'Users can update their own profile'),
    ('profiles', 'Admins can view all profiles'),
    ('profiles', 'Admins can update all profiles'),
    ('user_roles', 'Users can view their own role'),
    ('user_roles', 'Admins can view all roles'),
    ('user_roles', 'Admins can insert roles'),
    ('user_roles', 'Admins can update roles'),
    ('user_roles', 'Admins can delete roles'),
    ('products', 'Authenticated users can view products'),
    ('products', 'Admins can insert products'),
    ('products', 'Admins can update products'),
    ('products', 'Admins can delete products'),
    ('suppliers', 'Authenticated users can view suppliers'),
    ('suppliers', 'Admins can insert suppliers'),
    ('suppliers', 'Admins can update suppliers'),
    ('suppliers', 'Admins can delete suppliers'),
    ('sales', 'Authenticated users can view sales'),
    ('sales', 'Authenticated users can create sales'),
    ('sale_items', 'Authenticated users can view sale items'),
    ('sale_items', 'Users can insert items for their own sales'),
    ('business_settings', 'Authenticated users can view settings'),
    ('business_settings', 'Admins can update settings')
)
SELECT expected_policies.tablename, expected_policies.policyname
FROM expected_policies
LEFT JOIN pg_policies
  ON pg_policies.schemaname = 'public'
 AND pg_policies.tablename = expected_policies.tablename
 AND pg_policies.policyname = expected_policies.policyname
WHERE pg_policies.policyname IS NULL
ORDER BY expected_policies.tablename, expected_policies.policyname;
