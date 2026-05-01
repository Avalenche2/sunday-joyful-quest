-- Ensure public views for questions and daily challenges are accessible to all authenticated and anon users
-- The base tables keep correct_index hidden via these views (which omit it)

DROP VIEW IF EXISTS public.questions_public CASCADE;
CREATE VIEW public.questions_public
WITH (security_invoker = off) AS
SELECT id, quiz_id, position, prompt, options, bible_reference, created_at
FROM public.questions;

DROP VIEW IF EXISTS public.daily_challenges_public CASCADE;
CREATE VIEW public.daily_challenges_public
WITH (security_invoker = off) AS
SELECT id, challenge_date, prompt, options, bible_reference, created_at
FROM public.daily_challenges;

-- Grant read access to both anon and authenticated (the views deliberately omit correct_index)
GRANT SELECT ON public.questions_public TO anon, authenticated;
GRANT SELECT ON public.daily_challenges_public TO anon, authenticated;