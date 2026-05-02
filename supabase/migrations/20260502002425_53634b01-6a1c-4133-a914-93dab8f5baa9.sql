-- 1. Restreindre la suppression / mise à jour des rôles au seul super_admin
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;

CREATE POLICY "Admins can insert new roles"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only super admin can delete roles"
ON public.user_roles
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Only super admin can update roles"
ON public.user_roles
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'super_admin'::app_role));

-- 2. Restreindre l'écriture dans l'historique des révocations au super admin
DROP POLICY IF EXISTS "Admins can insert revocations" ON public.admin_role_revocations;
DROP POLICY IF EXISTS "Admins can delete revocations" ON public.admin_role_revocations;

CREATE POLICY "Only super admin can insert revocations"
ON public.admin_role_revocations
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Only super admin can delete revocations"
ON public.admin_role_revocations
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'::app_role));