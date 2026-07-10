-- Crear usuario admin directamente en Supabase Auth
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'admin@donanina.com') THEN
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, confirmation_sent_at, raw_app_meta_data,
      raw_user_meta_data, created_at, updated_at, confirmation_token,
      email_change, email_change_token_new, recovery_token
    )
    VALUES (
      '00000000-0000-0000-0000-000000000000',
      gen_random_uuid(),
      'authenticated',
      'authenticated',
      'admin@donanina.com',
      crypt('admin123', gen_salt('bf')),
      now(), now(),
      '{"provider":"email","providers":["email"]}',
      '{"name":"Admin"}',
      now(), now(),
      '', '', '', ''
    );
  END IF;
END $$;

-- Crear perfil en la tabla public.users con el password_hash
INSERT INTO public.users (id, name, email, role, password_hash)
SELECT id, 'Admin', email, 'admin', encrypted_password
FROM auth.users
WHERE email = 'admin@donanina.com'
  AND NOT EXISTS (SELECT 1 FROM public.users WHERE email = 'admin@donanina.com');
