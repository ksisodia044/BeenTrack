-- Seed predictable users, suppliers, and products for browser smoke tests.
-- Run this in the Supabase SQL Editor after the two auth users already exist.
--
-- Required preparation:
-- 1. Sign up one future admin user and one future staff user through the app or Supabase Auth.
-- 2. Replace the emails below with those real accounts.
-- 3. Run this script.
--
-- Suggested matching local env vars for Playwright:
-- E2E_ADMIN_EMAIL
-- E2E_ADMIN_PASSWORD
-- E2E_STAFF_EMAIL
-- E2E_STAFF_PASSWORD
-- E2E_SAMPLE_PRODUCT_NAME=E2E Dark Roast Beans

DO $$
DECLARE
  admin_email TEXT := 'admin@example.com';
  staff_email TEXT := 'staff@example.com';
  admin_user_id UUID;
  staff_user_id UUID;
  supplier_beans_id UUID;
  supplier_packaging_id UUID;
BEGIN
  SELECT id INTO admin_user_id
  FROM auth.users
  WHERE email = admin_email;

  SELECT id INTO staff_user_id
  FROM auth.users
  WHERE email = staff_email;

  IF admin_user_id IS NULL THEN
    RAISE EXCEPTION 'No auth user found for admin email %', admin_email;
  END IF;

  IF staff_user_id IS NULL THEN
    RAISE EXCEPTION 'No auth user found for staff email %', staff_email;
  END IF;

  DELETE FROM public.user_roles
  WHERE user_id IN (admin_user_id, staff_user_id);

  INSERT INTO public.user_roles (user_id, role)
  VALUES
    (admin_user_id, 'ADMIN'),
    (staff_user_id, 'STAFF');

  UPDATE public.profiles
  SET is_active = true
  WHERE id IN (admin_user_id, staff_user_id);

  SELECT id INTO supplier_beans_id
  FROM public.suppliers
  WHERE email = 'e2e.beans@example.com'
  LIMIT 1;

  IF supplier_beans_id IS NULL THEN
    INSERT INTO public.suppliers (name, contact_person, phone, email, location, notes)
    VALUES (
      'E2E Bean Wholesale',
      'Amina',
      '+254700000001',
      'e2e.beans@example.com',
      'Nairobi',
      'Seeded supplier for browser smoke tests.'
    )
    RETURNING id INTO supplier_beans_id;
  END IF;

  SELECT id INTO supplier_packaging_id
  FROM public.suppliers
  WHERE email = 'e2e.packaging@example.com'
  LIMIT 1;

  IF supplier_packaging_id IS NULL THEN
    INSERT INTO public.suppliers (name, contact_person, phone, email, location, notes)
    VALUES (
      'E2E Packaging Supply',
      'Brian',
      '+254700000002',
      'e2e.packaging@example.com',
      'Kisumu',
      'Seeded packaging supplier for browser smoke tests.'
    )
    RETURNING id INTO supplier_packaging_id;
  END IF;

  INSERT INTO public.products (
    sku,
    name,
    category,
    unit,
    cost_price,
    selling_price,
    stock_qty,
    reorder_level,
    supplier_id,
    status
  )
  VALUES
    (
      'E2E-BEAN-001',
      'E2E Dark Roast Beans',
      'Beverages',
      'bags',
      8.50,
      15.00,
      30,
      5,
      supplier_beans_id,
      'active'
    ),
    (
      'E2E-MILK-001',
      'E2E Oat Milk',
      'Supplies',
      'boxes',
      4.00,
      7.50,
      12,
      6,
      supplier_beans_id,
      'active'
    ),
    (
      'E2E-CUP-001',
      'E2E Paper Cups',
      'Supplies',
      'boxes',
      2.20,
      4.80,
      3,
      10,
      supplier_packaging_id,
      'active'
    )
  ON CONFLICT (sku) DO UPDATE
  SET
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    unit = EXCLUDED.unit,
    cost_price = EXCLUDED.cost_price,
    selling_price = EXCLUDED.selling_price,
    stock_qty = EXCLUDED.stock_qty,
    reorder_level = EXCLUDED.reorder_level,
    supplier_id = EXCLUDED.supplier_id,
    status = EXCLUDED.status;
END $$;
