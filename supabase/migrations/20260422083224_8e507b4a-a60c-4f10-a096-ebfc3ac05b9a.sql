ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'super_admin';

CREATE OR REPLACE FUNCTION public.request_admin_access(
  _first_name text,
  _last_name text,
  _email text
)
RETURNS admin_request_status
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _uid uuid := auth.uid();
  _normalized_email text := lower(trim(_email));
  _has_admin boolean;
  _status admin_request_status;
BEGIN
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF length(trim(_first_name)) < 2 OR length(trim(_last_name)) < 2 OR _normalized_email = '' THEN
    RAISE EXCEPTION 'Invalid admin request data';
  END IF;

  PERFORM pg_advisory_xact_lock(hashtext('first_admin_bootstrap'));

  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE role IN ('admin', 'super_admin')
  ) INTO _has_admin;

  IF NOT _has_admin THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (_uid, 'admin')
    ON CONFLICT DO NOTHING;

    INSERT INTO public.user_roles (user_id, role)
    VALUES (_uid, 'super_admin')
    ON CONFLICT DO NOTHING;

    _status := 'approved';
  ELSE
    _status := 'pending';
  END IF;

  INSERT INTO public.admin_requests (
    user_id,
    first_name,
    last_name,
    email,
    status,
    reviewed_at,
    reviewed_by
  )
  VALUES (
    _uid,
    trim(_first_name),
    trim(_last_name),
    _normalized_email,
    _status,
    CASE WHEN _status = 'approved' THEN now() ELSE NULL END,
    CASE WHEN _status = 'approved' THEN _uid ELSE NULL END
  );

  RETURN _status;
END;
$function$;