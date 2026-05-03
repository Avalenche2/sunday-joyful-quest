
-- Table des invitations moniteur générées par le super admin
CREATE TABLE public.admin_invitations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(24), 'hex'),
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '14 days'),
  used_at TIMESTAMPTZ,
  used_by UUID,
  note TEXT
);

ALTER TABLE public.admin_invitations ENABLE ROW LEVEL SECURITY;

-- Seul le super admin lit / crée / supprime les invitations
CREATE POLICY "Super admin can view invitations"
ON public.admin_invitations FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Super admin can create invitations"
ON public.admin_invitations FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'super_admin'::app_role) AND created_by = auth.uid());

CREATE POLICY "Super admin can delete invitations"
ON public.admin_invitations FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'::app_role));

-- RPC : créer une invitation (renvoie le token)
CREATE OR REPLACE FUNCTION public.create_admin_invitation(_note TEXT DEFAULT NULL)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_token TEXT;
BEGIN
  IF NOT public.has_role(auth.uid(), 'super_admin'::app_role) THEN
    RAISE EXCEPTION 'Seul le super admin peut créer des invitations.';
  END IF;

  INSERT INTO public.admin_invitations (created_by, note)
  VALUES (auth.uid(), _note)
  RETURNING token INTO v_token;

  RETURN v_token;
END;
$$;

-- RPC : utiliser une invitation pour devenir moniteur immédiatement
CREATE OR REPLACE FUNCTION public.redeem_admin_invitation(_token TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invite RECORD;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentification requise.';
  END IF;

  SELECT * INTO v_invite
  FROM public.admin_invitations
  WHERE token = _token
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invitation invalide.';
  END IF;

  IF v_invite.used_at IS NOT NULL THEN
    RAISE EXCEPTION 'Cette invitation a déjà été utilisée.';
  END IF;

  IF v_invite.expires_at < now() THEN
    RAISE EXCEPTION 'Cette invitation a expiré.';
  END IF;

  -- Marque l'invitation comme utilisée
  UPDATE public.admin_invitations
  SET used_at = now(), used_by = auth.uid()
  WHERE id = v_invite.id;

  -- Donne le rôle admin (idempotent)
  INSERT INTO public.user_roles (user_id, role)
  VALUES (auth.uid(), 'admin'::app_role)
  ON CONFLICT (user_id, role) DO NOTHING;

  -- Marque la demande admin (s'il y en a une) comme approuvée
  UPDATE public.admin_requests
  SET status = 'approved', reviewed_at = now(), reviewed_by = v_invite.created_by
  WHERE user_id = auth.uid() AND status = 'pending';

  RETURN TRUE;
END;
$$;
