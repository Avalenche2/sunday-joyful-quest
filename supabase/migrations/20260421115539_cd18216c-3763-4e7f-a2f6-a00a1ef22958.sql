-- Add parent contact fields to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS parent_first_name text,
  ADD COLUMN IF NOT EXISTS parent_last_name text,
  ADD COLUMN IF NOT EXISTS parent_phone text;

-- Update handle_new_user to also store parent info from signup metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, first_name, last_name, age, parent_first_name, parent_last_name, parent_phone)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    NULLIF(NEW.raw_user_meta_data->>'age', '')::INTEGER,
    NULLIF(NEW.raw_user_meta_data->>'parent_first_name', ''),
    NULLIF(NEW.raw_user_meta_data->>'parent_last_name', ''),
    NULLIF(NEW.raw_user_meta_data->>'parent_phone', '')
  );
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'enfant');
  RETURN NEW;
END;
$function$;