ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS account_status text NOT NULL DEFAULT 'active';

ALTER TABLE public.profiles
ADD CONSTRAINT profiles_account_status_check
CHECK (account_status IN ('active', 'paused'));

CREATE POLICY "Admins can update child profile status"
ON public.profiles
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE INDEX IF NOT EXISTS idx_profiles_account_status
ON public.profiles (account_status);