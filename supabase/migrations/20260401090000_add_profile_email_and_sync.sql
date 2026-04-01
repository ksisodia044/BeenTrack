ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS email TEXT NOT NULL DEFAULT '';

UPDATE public.profiles AS profiles
SET email = COALESCE(auth_users.email, '')
FROM auth.users AS auth_users
WHERE auth_users.id = profiles.id
  AND profiles.email = '';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT lower(email)
    FROM public.profiles
    WHERE email <> ''
    GROUP BY lower(email)
    HAVING COUNT(*) > 1
  ) THEN
    EXECUTE 'CREATE UNIQUE INDEX IF NOT EXISTS profiles_email_unique_idx ON public.profiles (lower(email)) WHERE email <> ''''''';
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.email, '')
  );

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'STAFF');

  RETURN NEW;
END;
$$;
