-- Update handle_new_user function to be completely resilient and exception-safe
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  desired_username TEXT;
  final_username TEXT;
  desired_full_name TEXT;
  desired_role user_role;
  counter INT := 0;
BEGIN
  -- Ambil username dari metadata atau email
  desired_username := COALESCE(
    NEW.raw_user_meta_data->>'username',
    split_part(NEW.email, '@', 1)
  );
  IF desired_username IS NULL OR desired_username = '' THEN
    desired_username := 'user_' || substr(NEW.id::text, 1, 6);
  END IF;

  -- Bersihkan username: hanya huruf kecil, angka, dan underscore
  desired_username := lower(regexp_replace(desired_username, '[^a-zA-Z0-9_]', '', 'g'));
  IF desired_username = '' THEN
    desired_username := 'user_' || substr(NEW.id::text, 1, 6);
  END IF;

  final_username := desired_username;

  -- Jika username sudah dipakai user lain, tambahkan nomor otomatis agar tidak error unique constraint
  WHILE EXISTS (SELECT 1 FROM public.profiles WHERE username = final_username AND id <> NEW.id) LOOP
    counter := counter + 1;
    final_username := desired_username || counter::text;
    IF counter > 50 THEN
      final_username := desired_username || '_' || substr(NEW.id::text, 1, 4);
      EXIT;
    END IF;
  END LOOP;

  desired_full_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    final_username
  );

  BEGIN
    desired_role := (NEW.raw_user_meta_data->>'role')::user_role;
  EXCEPTION WHEN OTHERS THEN
    desired_role := 'clipper'::user_role;
  END;

  IF desired_role IS NULL THEN
    desired_role := 'clipper'::user_role;
  END IF;

  INSERT INTO public.profiles (
    id,
    username,
    full_name,
    avatar_url,
    role,
    balance,
    total_earned
  )
  VALUES (
    NEW.id,
    final_username,
    desired_full_name,
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200'),
    desired_role,
    0,
    0
  )
  ON CONFLICT (id) DO UPDATE SET
    username = EXCLUDED.username,
    full_name = EXCLUDED.full_name,
    avatar_url = EXCLUDED.avatar_url,
    role = EXCLUDED.role;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Exception guard: jangan pernah menggagalkan pendaftaran akun di auth.users jika terjadi kendala pada trigger profile
  RETURN NEW;
END;
$$;
