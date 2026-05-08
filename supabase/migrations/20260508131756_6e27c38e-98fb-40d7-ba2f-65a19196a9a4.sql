DROP VIEW IF EXISTS public.questions_public;
CREATE VIEW public.questions_public
WITH (security_invoker = true) AS
SELECT id, quiz_id, "position", prompt, options, bible_reference, created_at
FROM public.questions;

DROP VIEW IF EXISTS public.daily_challenges_public;
CREATE VIEW public.daily_challenges_public
WITH (security_invoker = true) AS
SELECT id, challenge_date, prompt, options, bible_reference, created_at
FROM public.daily_challenges;

DROP POLICY IF EXISTS "Users can insert own attempts" ON public.quiz_attempts;
DROP POLICY IF EXISTS "Users can insert own answers" ON public.attempt_answers;

REVOKE EXECUTE ON FUNCTION public.submit_quiz(uuid, jsonb) FROM anon, public;
GRANT  EXECUTE ON FUNCTION public.submit_quiz(uuid, jsonb) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.submit_daily_challenge(uuid, integer) FROM anon, public;
GRANT  EXECUTE ON FUNCTION public.submit_daily_challenge(uuid, integer) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.request_admin_access(text, text, text) FROM anon, public;
GRANT  EXECUTE ON FUNCTION public.request_admin_access(text, text, text) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.redeem_admin_invitation(text) FROM anon, public;
GRANT  EXECUTE ON FUNCTION public.redeem_admin_invitation(text) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.create_admin_invitation(text) FROM anon, public;
GRANT  EXECUTE ON FUNCTION public.create_admin_invitation(text) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.get_admin_user_ids() FROM anon, public;
GRANT  EXECUTE ON FUNCTION public.get_admin_user_ids() TO authenticated;

REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM anon, public;
GRANT  EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;