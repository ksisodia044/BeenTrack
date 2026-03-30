-- Promote one existing auth user to ADMIN.
-- Run this in the Supabase SQL Editor after replacing the email below.
--
-- IMPORTANT:
-- 1. Replace 'admin@example.com' with the real user's email.
-- 2. This script removes any existing role rows for that user first.
--    The app currently expects a single role row per user.

DO $$
DECLARE
  target_email TEXT := 'admin@example.com';
  target_user_id UUID;
BEGIN
  SELECT id
  INTO target_user_id
  FROM auth.users
  WHERE email = target_email;

  IF target_user_id IS NULL THEN
    RAISE EXCEPTION 'No auth user found for email %', target_email;
  END IF;

  DELETE FROM public.user_roles
  WHERE user_id = target_user_id;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (target_user_id, 'ADMIN');
END $$;
