-- Recreate views without security_invoker so RLS of base tables doesn't block public access.
-- These views deliberately exclude `correct_index` so it is safe to expose them.

DROP VIEW IF EXISTS public.questions_public;
CREATE VIEW public.questions_public AS
SELECT id, quiz_id, position, prompt, options, bible_reference, created_at
FROM public.questions;

DROP VIEW IF EXISTS public.daily_challenges_public;
CREATE VIEW public.daily_challenges_public AS
SELECT id, challenge_date, prompt, options, bible_reference, created_at
FROM public.daily_challenges;

GRANT SELECT ON public.questions_public TO anon, authenticated;
GRANT SELECT ON public.daily_challenges_public TO anon, authenticated;